/**
 * UI Controller - Manage UI controls and updates
 */

export class UIController {
    constructor(stateManager, rendererManager, animator) {
        this.state = stateManager;
        this.renderer = rendererManager;
        this.animator = animator;

        this.setupControls();
        this.setupStateListener();
    }

    setupControls() {
        // Mode toggle
        const btnMandelbrot = document.getElementById('btn-mandelbrot');
        const btnJulia = document.getElementById('btn-julia');

        btnMandelbrot?.addEventListener('click', () => {
            this.state.setMode('mandelbrot');
            const viewport = this.state.getViewport();
            const newViewport = {
                ...viewport,
                centerX: -0.5,
                centerY: 0.0,
                scale: 0.004
            };
            this.animator.animateViewport(viewport, newViewport, 800);
        });

        btnJulia?.addEventListener('click', () => {
            this.state.setMode('julia');
            const viewport = this.state.getViewport();
            const newViewport = {
                ...viewport,
                centerX: 0.0,
                centerY: 0.0,
                scale: 0.004
            };
            this.animator.animateViewport(viewport, newViewport, 800);
        });

        // Julia parameter sliders
        const juliaCReal = document.getElementById('julia-c-real');
        const juliaCImag = document.getElementById('julia-c-imag');

        juliaCReal?.addEventListener('input', (e) => {
            const juliaParams = this.state.getJuliaParams();
            this.state.setJuliaParams(parseFloat(e.target.value), juliaParams.cImag);
            this.triggerRender();
        });

        juliaCImag?.addEventListener('input', (e) => {
            const juliaParams = this.state.getJuliaParams();
            this.state.setJuliaParams(juliaParams.cReal, parseFloat(e.target.value));
            this.triggerRender();
        });

        // Max iterations slider
        const maxIterations = document.getElementById('max-iterations');
        maxIterations?.addEventListener('input', (e) => {
            this.state.setMaxIterations(parseInt(e.target.value));
            document.getElementById('iterations-value').textContent = e.target.value;
            this.triggerRender();
        });

        // Color palette selector
        const paletteSelector = document.getElementById('palette-selector');
        paletteSelector?.addEventListener('change', (e) => {
            this.state.setPaletteID(parseInt(e.target.value));
            this.triggerRender();
        });

        // Reset button
        const btnReset = document.getElementById('btn-reset');
        btnReset?.addEventListener('click', () => {
            const mode = this.state.getMode();
            const viewport = this.state.getViewport();

            const newViewport = mode === 'julia' ?
                { ...viewport, centerX: 0, centerY: 0, scale: 0.004 } :
                { ...viewport, centerX: -0.5, centerY: 0, scale: 0.004 };

            this.animator.animateViewport(viewport, newViewport, 800);
        });

        // Save button
        const btnSave = document.getElementById('btn-save');
        btnSave?.addEventListener('click', () => {
            this.saveImage();
        });
    }

    setupStateListener() {
        this.state.subscribe((state) => {
            // Update mode buttons
            const btnMandelbrot = document.getElementById('btn-mandelbrot');
            const btnJulia = document.getElementById('btn-julia');

            if (state.mode === 'mandelbrot') {
                btnMandelbrot?.classList.add('active');
                btnJulia?.classList.remove('active');
                document.getElementById('julia-controls')?.style.setProperty('display', 'none');
            } else {
                btnMandelbrot?.classList.remove('active');
                btnJulia?.classList.add('active');
                document.getElementById('julia-controls')?.style.setProperty('display', 'block');
            }

            // Update coordinate display
            const coordCenter = document.getElementById('coord-center');
            if (coordCenter) {
                coordCenter.textContent =
                    `(${state.viewport.centerX.toExponential(4)}, ${state.viewport.centerY.toExponential(4)})`;
            }

            const coordZoom = document.getElementById('coord-zoom');
            if (coordZoom) {
                coordZoom.textContent = `${(1 / state.viewport.scale).toExponential(2)}x`;
            }
        });
    }

    triggerRender() {
        const viewport = this.state.getViewport();
        const params = this.state.getRenderParams();
        const mode = this.state.getMode();
        const juliaParams = this.state.getJuliaParams();

        this.renderer.startRender(viewport, params, mode, juliaParams);
    }

    saveImage() {
        const canvas = document.getElementById('main-canvas');
        const dataURL = canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.download = `fractal-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
    }

    updateWorkerCount(count) {
        const workerCountElement = document.getElementById('worker-count');
        if (workerCountElement) {
            workerCountElement.textContent = count.toString();
        }
    }
}
