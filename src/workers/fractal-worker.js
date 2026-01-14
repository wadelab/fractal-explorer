/**
 * Fractal Worker - Web Worker for parallel tile rendering
 */

// Import the WASM module
importScripts('/fractal.js');

let wasmModule = null;
let isInitialized = false;

// Initialize WASM module in worker context
async function initializeWASM() {
    if (isInitialized) return;

    try {
        wasmModule = await FractalModule({
            locateFile: (path) => {
                if (path.endsWith('.wasm') || path.endsWith('.js')) {
                    return `/${path}`;
                }
                return path;
            }
        });

        isInitialized = true;
        self.postMessage({ type: 'READY' });
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            error: 'Failed to initialize WASM: ' + error.message
        });
    }
}

// Handle messages from main thread
self.addEventListener('message', async (e) => {
    const { type, data } = e.data;

    if (type === 'INIT') {
        await initializeWASM();
        return;
    }

    if (type === 'RENDER_TILE') {
        if (!isInitialized) {
            self.postMessage({
                type: 'ERROR',
                error: 'WASM not initialized'
            });
            return;
        }

        try {
            const { tile, viewport, params, renderID } = data;

            // Call WASM render function
            const pixelData = wasmModule.renderTile(
                tile.x,
                tile.y,
                tile.width,
                tile.height,
                viewport.centerX,
                viewport.centerY,
                viewport.scale,
                viewport.width,
                viewport.height,
                params.maxIter,
                params.fractalType,
                params.juliaCReal || 0,
                params.juliaCImag || 0,
                params.paletteID || 0
            );

            // Copy pixel data to transferable buffer
            const buffer = new Uint8Array(pixelData).buffer;

            // Send result back (transfer ownership for zero-copy)
            self.postMessage({
                type: 'TILE_COMPLETE',
                data: { tile, pixelData: buffer, renderID }
            }, [buffer]);

        } catch (error) {
            self.postMessage({
                type: 'ERROR',
                error: 'Render error: ' + error.message,
                data: data
            });
        }
    }
});

// Auto-initialize on load
initializeWASM();
