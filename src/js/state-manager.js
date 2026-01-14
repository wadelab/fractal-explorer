/**
 * State Manager - Centralized application state
 */

export class StateManager {
    constructor() {
        this.state = {
            mode: 'mandelbrot', // 'mandelbrot' or 'julia'
            viewport: {
                centerX: -0.5,
                centerY: 0.0,
                scale: 0.004,
                width: 800,
                height: 600
            },
            renderParams: {
                maxIterations: 1000,
                bailoutRadius: 4.0,
                smoothColoring: true,
                paletteID: 0
            },
            juliaParams: {
                cReal: -0.7,
                cImag: 0.27015
            }
        };

        this.listeners = [];
    }

    // Subscribe to state changes
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // Notify all listeners
    notify() {
        this.listeners.forEach(cb => cb(this.state));
    }

    // Getters
    getState() {
        return { ...this.state };
    }

    getMode() {
        return this.state.mode;
    }

    getViewport() {
        return { ...this.state.viewport };
    }

    getRenderParams() {
        return { ...this.state.renderParams };
    }

    getJuliaParams() {
        return { ...this.state.juliaParams };
    }

    // Setters
    setMode(mode) {
        if (mode !== this.state.mode) {
            this.state.mode = mode;
            this.notify();
        }
    }

    setViewport(viewport) {
        this.state.viewport = { ...this.state.viewport, ...viewport };
        this.notify();
    }

    setRenderParams(params) {
        this.state.renderParams = { ...this.state.renderParams, ...params };
        this.notify();
    }

    setJuliaParams(cReal, cImag) {
        this.state.juliaParams = { cReal, cImag };
        this.notify();
    }

    setPaletteID(paletteID) {
        this.state.renderParams.paletteID = paletteID;
        this.notify();
    }

    setMaxIterations(maxIterations) {
        this.state.renderParams.maxIterations = maxIterations;
        this.notify();
    }
}
