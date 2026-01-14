/**
 * Fractal Explorer - Main Application
 */

import { initWASM } from './wasm-loader.js';
import { StateManager } from './state-manager.js';
import { CanvasManager } from './canvas-manager.js';
import { RendererManager } from './renderer-manager.js';
import { InteractionHandler } from './interaction-handler.js';
import { Animator } from './animation.js';
import { UIController } from './ui-controller.js';
import { Minimap } from './minimap.js';
import { PresetGallery } from './preset-gallery.js';

class FractalExplorer {
    constructor() {
        this.wasmModule = null;
        this.stateManager = null;
        this.canvasManager = null;
        this.rendererManager = null;
        this.interactionHandler = null;
        this.animator = null;
        this.uiController = null;
        this.minimap = null;
        this.presetGallery = null;
    }

    async initialize() {
        try {
            console.log('🌀 Initializing Fractal Explorer...');

            // Show loading indicator
            this.showLoading();

            // Initialize WASM module
            console.log('Loading WASM module...');
            this.wasmModule = await initWASM();
            console.log('✓ WASM module loaded');

            // Initialize state manager
            this.stateManager = new StateManager();
            console.log('✓ State manager initialized');

            // Get canvas and resize
            const canvas = document.getElementById('main-canvas');
            this.canvasManager = new CanvasManager(canvas);

            // Set initial size
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            console.log('✓ Canvas manager initialized');

            // Initialize renderer manager with auto-detected worker count
            this.rendererManager = new RendererManager(this.wasmModule, this.canvasManager);

            // Use hardware concurrency (number of CPU cores), capped at reasonable maximum
            const workerCount = Math.min(navigator.hardwareConcurrency || 4, 32);
            await this.rendererManager.initialize(workerCount);
            console.log(`✓ Renderer manager initialized with ${workerCount} workers`);

            // Initialize animator
            this.animator = new Animator(this.stateManager, this.rendererManager);
            console.log('✓ Animator initialized');

            // Initialize interaction handler
            this.interactionHandler = new InteractionHandler(
                canvas,
                this.stateManager,
                this.rendererManager,
                this.animator
            );
            console.log('✓ Interaction handler initialized');

            // Initialize UI controller
            this.uiController = new UIController(
                this.stateManager,
                this.rendererManager,
                this.animator
            );
            console.log('✓ UI controller initialized');

            // Update worker count display
            this.uiController.updateWorkerCount(workerCount);

            // Initialize minimap
            const minimapCanvas = document.getElementById('minimap-canvas');
            this.minimap = new Minimap(minimapCanvas, this.stateManager);
            console.log('✓ Minimap initialized');

            // Initialize preset gallery
            this.presetGallery = new PresetGallery(this.stateManager, this.animator);
            console.log('✓ Preset gallery initialized');

            // Hide loading indicator
            this.hideLoading();

            // Render initial view
            console.log('Rendering initial view...');
            this.renderInitialView();

            console.log('✅ Fractal Explorer initialized successfully!');

        } catch (error) {
            console.error('❌ Failed to initialize Fractal Explorer:', error);
            this.showError(error.message);
        }
    }

    resizeCanvas() {
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.canvasManager.resize(width, height);

        const viewport = this.stateManager.getViewport();
        this.stateManager.setViewport({ ...viewport, width, height });
    }

    renderInitialView() {
        const viewport = this.stateManager.getViewport();
        const params = this.stateManager.getRenderParams();
        const mode = this.stateManager.getMode();
        const juliaParams = this.stateManager.getJuliaParams();

        this.rendererManager.startRender(viewport, params, mode, juliaParams);
    }

    showLoading() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.classList.remove('hidden');
        }
    }

    hideLoading() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }

    showError(message) {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.innerHTML = `
                <div style="color: #ff4444;">
                    <div style="font-size: 32px;">❌</div>
                    <div>Error: ${message}</div>
                    <div style="font-size: 12px; margin-top: 8px;">
                        Check console for details
                    </div>
                </div>
            `;
        }
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
    const app = new FractalExplorer();
    await app.initialize();

    // Expose for debugging
    window.fractalApp = app;
});
