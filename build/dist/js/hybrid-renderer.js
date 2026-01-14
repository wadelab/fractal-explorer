/**
 * Hybrid Renderer - Uses WebGPU when available, falls back to WASM workers
 */

import { WebGPURenderer, OrbitTrapType } from './webgpu-renderer.js';

export class HybridRenderer {
    constructor(wasmModule, canvasManager) {
        this.wasmModule = wasmModule;
        this.canvasManager = canvasManager;
        this.webgpuRenderer = null;
        this.workerPool = null;
        this.useWebGPU = false;
        this.isRendering = false;
        this.currentRenderID = 0;

        // Orbit trap state
        this.orbitTrapParams = {
            enabled: false,
            type: OrbitTrapType.CIRCLE,
            x: 0,
            y: 0,
            size: 0.5,
            rotation: 0
        };

        // Color cycling
        this.colorCycleOffset = 0;
        this.colorCycleAnimating = false;
        this.colorCycleSpeed = 0.001;
    }

    async initialize(workerCount = 4) {
        const canvas = this.canvasManager.canvas;

        // Try WebGPU first
        this.webgpuRenderer = new WebGPURenderer();
        const webgpuSuccess = await this.webgpuRenderer.initialize(canvas);

        if (webgpuSuccess) {
            this.useWebGPU = true;
            console.log('Using WebGPU renderer (GPU accelerated)');
        } else {
            // Fall back to WASM worker pool
            console.log('Falling back to WASM worker pool');
            this.useWebGPU = false;
            this.workerPool = new WorkerPool(workerCount);
            await this.workerPool.initialize();
        }

        return this.useWebGPU ? 'webgpu' : 'wasm';
    }

    getRendererType() {
        return this.useWebGPU ? 'WebGPU' : 'WASM';
    }

    setOrbitTrap(params) {
        this.orbitTrapParams = { ...this.orbitTrapParams, ...params };
    }

    getOrbitTrapParams() {
        return { ...this.orbitTrapParams };
    }

    startColorCycle(speed = 0.001) {
        this.colorCycleSpeed = speed;
        this.colorCycleAnimating = true;
    }

    stopColorCycle() {
        this.colorCycleAnimating = false;
    }

    setColorCycleOffset(offset) {
        this.colorCycleOffset = offset % 1.0;
    }

    async startRender(viewport, params, mode, juliaParams) {
        this.currentRenderID++;
        const renderID = this.currentRenderID;
        this.isRendering = true;

        // Clear canvas
        this.canvasManager.clear();

        try {
            if (this.useWebGPU) {
                await this.renderWithWebGPU(viewport, params, mode, juliaParams, renderID);
            } else {
                await this.renderWithWASM(viewport, params, mode, juliaParams, renderID);
            }
        } catch (error) {
            console.error('Render error:', error);
        }

        if (renderID === this.currentRenderID) {
            this.isRendering = false;
        }
    }

    async renderWithWebGPU(viewport, params, mode, juliaParams, renderID) {
        const startTime = performance.now();

        // Add color cycle offset to params
        const renderParams = {
            ...params,
            colorCycleOffset: this.colorCycleOffset
        };

        const pixelData = await this.webgpuRenderer.render(
            viewport,
            renderParams,
            mode,
            juliaParams,
            this.orbitTrapParams
        );

        if (renderID !== this.currentRenderID) return;

        // Draw to canvas
        const imageData = new ImageData(pixelData, viewport.width, viewport.height);
        this.canvasManager.drawImageData(imageData, 0, 0);

        const elapsed = performance.now() - startTime;
        console.log(`WebGPU render: ${elapsed.toFixed(1)}ms`);
    }

    async renderWithWASM(viewport, params, mode, juliaParams, renderID) {
        // Progressive rendering with WASM (same as before)
        const passes = [
            { scale: 0.25, maxIter: 100, name: 'preview' },
            { scale: 0.5, maxIter: 200, name: 'low' },
            { scale: 0.75, maxIter: 500, name: 'medium' },
            { scale: 1.0, maxIter: params.maxIter || 1000, name: 'high' }
        ];

        for (const pass of passes) {
            if (renderID !== this.currentRenderID) return;

            const passWidth = Math.ceil(viewport.width * pass.scale);
            const passHeight = Math.ceil(viewport.height * pass.scale);

            const tiles = this.generateTiles(passWidth, passHeight, 64);

            const results = await this.workerPool.renderTiles(tiles, {
                viewport: {
                    ...viewport,
                    width: passWidth,
                    height: passHeight,
                    scale: viewport.scale / pass.scale
                },
                params: {
                    maxIter: pass.maxIter,
                    fractalType: mode === 'julia' ? 1 : 0,
                    juliaCReal: juliaParams?.cReal || 0,
                    juliaCImag: juliaParams?.cImag || 0,
                    paletteID: params.paletteID || 0
                },
                renderID
            });

            if (renderID !== this.currentRenderID) return;

            // Composite tiles
            for (const result of results) {
                if (result && result.pixelData) {
                    const imageData = new ImageData(
                        new Uint8ClampedArray(result.pixelData),
                        result.tile.width,
                        result.tile.height
                    );

                    // Scale up for lower resolution passes
                    const scaleX = viewport.width / passWidth;
                    const scaleY = viewport.height / passHeight;

                    this.canvasManager.drawImageData(
                        imageData,
                        result.tile.x * scaleX,
                        result.tile.y * scaleY,
                        result.tile.width * scaleX,
                        result.tile.height * scaleY,
                        pass.scale < 1.0  // Use nearest neighbor for low-res
                    );
                }
            }
        }
    }

    generateTiles(width, height, tileSize) {
        const tiles = [];
        const cols = Math.ceil(width / tileSize);
        const rows = Math.ceil(height / tileSize);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * tileSize;
                const y = row * tileSize;
                const w = Math.min(tileSize, width - x);
                const h = Math.min(tileSize, height - y);

                tiles.push({ x, y, width: w, height: h });
            }
        }

        // Sort by distance from center (render center first)
        const centerX = width / 2;
        const centerY = height / 2;

        tiles.sort((a, b) => {
            const distA = Math.hypot(a.x + a.width/2 - centerX, a.y + a.height/2 - centerY);
            const distB = Math.hypot(b.x + b.width/2 - centerX, b.y + b.height/2 - centerY);
            return distA - distB;
        });

        return tiles;
    }

    cancelRender() {
        this.currentRenderID++;
    }

    destroy() {
        if (this.webgpuRenderer) {
            this.webgpuRenderer.destroy();
        }
        if (this.workerPool) {
            this.workerPool.terminate();
        }
    }
}

/**
 * Worker Pool for WASM fallback
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
            const worker = new Worker('workers/fractal-worker.js');
            const workerInfo = {
                worker,
                busy: false,
                id: i
            };

            const initPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Worker ${i} initialization timeout`));
                }, 10000);

                worker.onmessage = (e) => {
                    if (e.data.type === 'READY') {
                        clearTimeout(timeout);
                        resolve();
                    }
                };

                worker.onerror = (error) => {
                    clearTimeout(timeout);
                    reject(error);
                };
            });

            this.workers.push(workerInfo);
            initPromises.push(initPromise);
        }

        await Promise.all(initPromises);
        console.log(`Worker pool initialized with ${this.size} workers`);
    }

    async renderTiles(tiles, config) {
        const results = [];
        const pending = [];

        for (const tile of tiles) {
            const promise = this.renderTile(tile, config);
            pending.push(promise.then(result => {
                results.push(result);
                return result;
            }));
        }

        await Promise.all(pending);
        return results;
    }

    renderTile(tile, config) {
        return new Promise((resolve) => {
            const job = { tile, config, resolve };
            this.queue.push(job);
            this.processQueue();
        });
    }

    processQueue() {
        if (this.queue.length === 0) return;

        const availableWorker = this.workers.find(w => !w.busy);
        if (!availableWorker) return;

        const job = this.queue.shift();
        availableWorker.busy = true;

        const messageHandler = (e) => {
            if (e.data.type === 'TILE_COMPLETE') {
                availableWorker.worker.removeEventListener('message', messageHandler);
                availableWorker.busy = false;
                job.resolve(e.data.data);
                this.processQueue();
            } else if (e.data.type === 'ERROR') {
                availableWorker.worker.removeEventListener('message', messageHandler);
                availableWorker.busy = false;
                job.resolve(null);
                this.processQueue();
            }
        };

        availableWorker.worker.addEventListener('message', messageHandler);
        availableWorker.worker.postMessage({
            type: 'RENDER_TILE',
            data: {
                tile: job.tile,
                viewport: job.config.viewport,
                params: job.config.params,
                renderID: job.config.renderID
            }
        });
    }

    terminate() {
        for (const workerInfo of this.workers) {
            workerInfo.worker.terminate();
        }
        this.workers = [];
    }
}

export { OrbitTrapType };
