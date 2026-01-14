/**
 * Renderer Manager - Orchestrates progressive rendering with worker pool
 */

export class RendererManager {
    constructor(wasmModule, canvasManager) {
        this.wasmModule = wasmModule;
        this.canvasManager = canvasManager;
        this.workerPool = null;
        this.currentRenderID = 0;
        this.isRendering = false;
    }

    async initialize(workerCount = 4) {
        this.workerPool = new WorkerPool(workerCount);
        await this.workerPool.initialize();
    }

    async startRender(viewport, params, mode, juliaParams) {
        // Cancel previous render
        this.currentRenderID++;
        const renderID = this.currentRenderID;

        this.isRendering = true;

        // Clear canvas at start of new render
        this.canvasManager.clear();

        // Determine fractal type
        const fractalType = mode === 'julia' ?
            this.wasmModule.FractalType.JULIA :
            this.wasmModule.FractalType.MANDELBROT;

        // Progressive render passes
        const passes = [
            { pass: this.wasmModule.RenderPass.PASS_PREVIEW, resolution: 0.25 },
            { pass: this.wasmModule.RenderPass.PASS_LOW, resolution: 0.5 },
            { pass: this.wasmModule.RenderPass.PASS_MEDIUM, resolution: 0.75 },
            { pass: this.wasmModule.RenderPass.PASS_HIGH, resolution: 1.0 }
        ];

        for (const passInfo of passes) {
            if (this.currentRenderID !== renderID) {
                break; // Cancelled
            }

            // Get adaptive iteration count for this pass
            const maxIter = this.wasmModule.getAdaptiveIterations(
                passInfo.pass,
                params.maxIterations
            );

            await this.renderPass(viewport, {
                ...params,
                maxIter,
                fractalType,
                juliaCReal: juliaParams.cReal,
                juliaCImag: juliaParams.cImag
            }, passInfo.resolution, renderID);
        }

        if (this.currentRenderID === renderID) {
            this.isRendering = false;
        }
    }

    async renderPass(viewport, params, resolution, renderID) {
        const tileSize = 64;

        // Generate tiles
        const tiles = this.generateTiles(viewport, tileSize, resolution);

        // Prioritize center tiles
        this.prioritizeTiles(tiles, viewport);

        // Render tiles in parallel using worker pool
        const renderPromises = tiles.map(tile =>
            this.workerPool.execute({
                tile,
                viewport,
                params,
                renderID
            })
        );

        // Process tiles as they complete
        for (let i = 0; i < renderPromises.length; i++) {
            if (this.currentRenderID !== renderID) {
                break; // Cancelled
            }

            const result = await renderPromises[i];

            if (result && result.renderID === renderID) {
                // Draw tile to canvas
                this.canvasManager.drawTile(
                    result.tile,
                    result.pixelData,
                    resolution
                );

                // Update display periodically (every 4 tiles)
                if (i % 4 === 0 || i === renderPromises.length - 1) {
                    this.canvasManager.requestFlip();
                }
            }
        }

        // Final flip after pass complete
        this.canvasManager.flip();
    }

    generateTiles(viewport, tileSize, resolution) {
        const tiles = [];
        const scaledTileSize = Math.ceil(tileSize * resolution);

        for (let y = 0; y < viewport.height; y += scaledTileSize) {
            for (let x = 0; x < viewport.width; x += scaledTileSize) {
                const tileWidth = Math.min(scaledTileSize, viewport.width - x);
                const tileHeight = Math.min(scaledTileSize, viewport.height - y);
                tiles.push({ x, y, width: tileWidth, height: tileHeight });
            }
        }

        return tiles;
    }

    prioritizeTiles(tiles, viewport) {
        const centerX = viewport.width / 2;
        const centerY = viewport.height / 2;

        tiles.sort((a, b) => {
            const aCenterX = a.x + a.width / 2;
            const aCenterY = a.y + a.height / 2;
            const bCenterX = b.x + b.width / 2;
            const bCenterY = b.y + b.height / 2;

            const distA = Math.hypot(aCenterX - centerX, aCenterY - centerY);
            const distB = Math.hypot(bCenterX - centerX, bCenterY - centerY);

            return distA - distB;
        });
    }

    cancelRender() {
        this.currentRenderID++;
        this.isRendering = false;
    }
}

/**
 * Worker Pool - Manages a pool of Web Workers
 */
class WorkerPool {
    constructor(size) {
        this.size = size;
        this.workers = [];
        this.queue = [];
        this.activeJobs = 0;
    }

    async initialize() {
        console.log(`Initializing worker pool with ${this.size} workers...`);

        const initPromises = [];

        for (let i = 0; i < this.size; i++) {
            const worker = new Worker('/workers/fractal-worker.js');
            const workerInfo = {
                worker,
                busy: false,
                id: i
            };

            this.workers.push(workerInfo);

            // Wait for worker to be ready
            initPromises.push(new Promise((resolve) => {
                worker.addEventListener('message', function handler(e) {
                    if (e.data.type === 'READY') {
                        worker.removeEventListener('message', handler);
                        console.log(`Worker ${i} ready`);
                        resolve();
                    }
                });
            }));

            // Send init message
            worker.postMessage({ type: 'INIT' });
        }

        await Promise.all(initPromises);
        console.log('Worker pool initialized');
    }

    execute(task) {
        return new Promise((resolve, reject) => {
            const job = { task, resolve, reject };
            this.queue.push(job);
            this.processQueue();
        });
    }

    processQueue() {
        while (this.queue.length > 0) {
            const availableWorker = this.workers.find(w => !w.busy);
            if (!availableWorker) break;

            const job = this.queue.shift();
            availableWorker.busy = true;
            this.activeJobs++;

            availableWorker.worker.postMessage({
                type: 'RENDER_TILE',
                data: job.task
            });

            const messageHandler = (e) => {
                if (e.data.type === 'TILE_COMPLETE') {
                    availableWorker.worker.removeEventListener('message', messageHandler);
                    availableWorker.busy = false;
                    this.activeJobs--;
                    job.resolve(e.data.data);
                    this.processQueue(); // Process next job
                } else if (e.data.type === 'ERROR') {
                    availableWorker.worker.removeEventListener('message', messageHandler);
                    availableWorker.busy = false;
                    this.activeJobs--;
                    console.error('Worker error:', e.data.error);
                    job.resolve(null); // Resolve with null to continue
                    this.processQueue();
                }
            };

            availableWorker.worker.addEventListener('message', messageHandler);
        }
    }

    terminate() {
        this.workers.forEach(workerInfo => {
            workerInfo.worker.terminate();
        });
        this.workers = [];
        this.queue = [];
    }
}
