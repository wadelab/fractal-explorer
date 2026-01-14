/**
 * WASM Loader - Initialize and load the WebAssembly module
 */

export async function initWASM() {
    try {
        console.log('Loading WASM module...');

        // Load the Emscripten-generated module
        const module = await FractalModule({
            locateFile: (path) => {
                // Handle both development and production paths
                if (path.endsWith('.wasm') || path.endsWith('.js')) {
                    return `/${path}`;
                }
                return path;
            },
            print: (text) => {
                console.log('[WASM]', text);
            },
            printErr: (text) => {
                console.error('[WASM Error]', text);
            }
        });

        console.log('WASM module loaded successfully');

        return {
            renderTile: module.renderTile,
            screenToComplex: module.screenToComplex,
            getAdaptiveIterations: module.getAdaptiveIterations,
            generateTiles: module.generateTiles,
            FractalType: {
                MANDELBROT: 0,
                JULIA: 1
            },
            RenderPass: {
                PASS_PREVIEW: 0,
                PASS_LOW: 1,
                PASS_MEDIUM: 2,
                PASS_HIGH: 3
            }
        };
    } catch (error) {
        console.error('Failed to load WASM module:', error);
        throw error;
    }
}
