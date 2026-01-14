/**
 * Fractal Explorer - Main Application
 * Now with WebGPU acceleration and orbit trap coloring!
 */

import { initWASM } from './wasm-loader.js';
import { StateManager } from './state-manager.js';
import { CanvasManager } from './canvas-manager.js';
import { HybridRenderer, OrbitTrapType } from './hybrid-renderer.js';
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
        this.renderer = null;
        this.interactionHandler = null;
        this.animator = null;
        this.uiController = null;
        this.minimap = null;
        this.presetGallery = null;
        this.colorCycleInterval = null;
    }

    async initialize() {
        try {
            console.log('🌀 Initializing Fractal Explorer...');

            // Show loading indicator
            this.showLoading();

            // Initialize WASM module (needed for fallback)
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

            // Initialize hybrid renderer (WebGPU with WASM fallback)
            this.renderer = new HybridRenderer(this.wasmModule, this.canvasManager);

            const workerCount = Math.min(navigator.hardwareConcurrency || 4, 32);
            const rendererType = await this.renderer.initialize(workerCount);
            console.log(`✓ Renderer initialized: ${rendererType.toUpperCase()} mode`);

            // Create animator wrapper for hybrid renderer
            this.animator = new AnimatorWrapper(this.stateManager, this.renderer);
            console.log('✓ Animator initialized');

            // Initialize interaction handler
            this.interactionHandler = new InteractionHandler(
                canvas,
                this.stateManager,
                this.renderer,
                this.animator
            );
            console.log('✓ Interaction handler initialized');

            // Initialize UI controller
            this.uiController = new UIController(
                this.stateManager,
                this.renderer,
                this.animator
            );
            console.log('✓ UI controller initialized');

            // Update renderer info display
            this.updateRendererDisplay(rendererType, workerCount);

            // Setup orbit trap controls
            this.setupOrbitTrapControls();

            // Setup color cycling controls
            this.setupColorCycleControls();

            // Setup collapsible sections
            this.setupCollapsibleSections();

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

    updateRendererDisplay(type, workerCount) {
        const workerCountElement = document.getElementById('worker-count');
        if (workerCountElement) {
            if (type === 'webgpu') {
                workerCountElement.textContent = 'GPU';
                workerCountElement.style.color = '#00ff88';
            } else {
                workerCountElement.textContent = workerCount.toString();
            }
        }

        // Update renderer type display if it exists
        const rendererTypeElement = document.getElementById('renderer-type');
        if (rendererTypeElement) {
            rendererTypeElement.textContent = type.toUpperCase();
        }
    }

    setupOrbitTrapControls() {
        // Orbit trap enable toggle
        const trapToggle = document.getElementById('orbit-trap-toggle');
        if (trapToggle) {
            trapToggle.addEventListener('change', (e) => {
                this.renderer.setOrbitTrap({ enabled: e.target.checked });
                this.triggerRender();
            });
        }

        // Orbit trap type selector
        const trapType = document.getElementById('orbit-trap-type');
        if (trapType) {
            trapType.addEventListener('change', (e) => {
                this.renderer.setOrbitTrap({ type: parseInt(e.target.value) });
                this.triggerRender();
            });
        }

        // Orbit trap position X
        const trapX = document.getElementById('orbit-trap-x');
        if (trapX) {
            trapX.addEventListener('input', (e) => {
                this.renderer.setOrbitTrap({ x: parseFloat(e.target.value) });
                document.getElementById('orbit-trap-x-value').textContent = e.target.value;
                this.triggerRender();
            });
        }

        // Orbit trap position Y
        const trapY = document.getElementById('orbit-trap-y');
        if (trapY) {
            trapY.addEventListener('input', (e) => {
                this.renderer.setOrbitTrap({ y: parseFloat(e.target.value) });
                document.getElementById('orbit-trap-y-value').textContent = e.target.value;
                this.triggerRender();
            });
        }

        // Orbit trap size
        const trapSize = document.getElementById('orbit-trap-size');
        if (trapSize) {
            trapSize.addEventListener('input', (e) => {
                this.renderer.setOrbitTrap({ size: parseFloat(e.target.value) });
                document.getElementById('orbit-trap-size-value').textContent = e.target.value;
                this.triggerRender();
            });
        }

        // Orbit trap rotation
        const trapRotation = document.getElementById('orbit-trap-rotation');
        if (trapRotation) {
            trapRotation.addEventListener('input', (e) => {
                this.renderer.setOrbitTrap({ rotation: parseFloat(e.target.value) });
                document.getElementById('orbit-trap-rotation-value').textContent =
                    (parseFloat(e.target.value) * 180 / Math.PI).toFixed(0) + '°';
                this.triggerRender();
            });
        }
    }

    setupColorCycleControls() {
        const cycleToggle = document.getElementById('color-cycle-toggle');
        if (cycleToggle) {
            cycleToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.startColorCycle();
                } else {
                    this.stopColorCycle();
                }
            });
        }

        const cycleSpeed = document.getElementById('color-cycle-speed');
        if (cycleSpeed) {
            cycleSpeed.addEventListener('input', (e) => {
                const speed = parseFloat(e.target.value);
                if (this.colorCycleInterval) {
                    this.stopColorCycle();
                    this.startColorCycle(speed);
                }
            });
        }
    }

    setupCollapsibleSections() {
        const collapsibles = document.querySelectorAll('.collapsible');
        collapsibles.forEach(section => {
            const header = section.querySelector('.collapsible-header');
            const content = section.querySelector('.collapsible-content');
            const icon = section.querySelector('.toggle-icon');

            if (header && content) {
                header.addEventListener('click', () => {
                    const isOpen = section.classList.contains('open');
                    if (isOpen) {
                        section.classList.remove('open');
                        content.style.display = 'none';
                        if (icon) icon.textContent = '+';
                    } else {
                        section.classList.add('open');
                        content.style.display = 'block';
                        if (icon) icon.textContent = '+';
                    }
                });
            }
        });
    }

    startColorCycle(speed = 0.005) {
        if (this.colorCycleInterval) {
            clearInterval(this.colorCycleInterval);
        }

        let offset = 0;
        this.colorCycleInterval = setInterval(() => {
            offset = (offset + speed) % 1.0;
            this.renderer.setColorCycleOffset(offset);
            this.triggerRender();
        }, 50);  // 20 FPS for color cycling
    }

    stopColorCycle() {
        if (this.colorCycleInterval) {
            clearInterval(this.colorCycleInterval);
            this.colorCycleInterval = null;
        }
    }

    triggerRender() {
        const viewport = this.stateManager.getViewport();
        const params = this.stateManager.getRenderParams();
        const mode = this.stateManager.getMode();
        const juliaParams = this.stateManager.getJuliaParams();
        this.renderer.startRender(viewport, params, mode, juliaParams);
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

        this.renderer.startRender(viewport, params, mode, juliaParams);
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

/**
 * Animator wrapper that works with the HybridRenderer
 */
class AnimatorWrapper {
    constructor(stateManager, renderer) {
        this.state = stateManager;
        this.renderer = renderer;
        this.activeAnimation = null;
        this.lastRenderTime = 0;
        this.renderThrottle = 100;
    }

    animateViewport(from, to, duration = 500) {
        if (this.activeAnimation) {
            cancelAnimationFrame(this.activeAnimation);
        }

        const startTime = performance.now();
        this.lastRenderTime = 0;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1.0);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);

            // Interpolate viewport
            const viewport = {
                centerX: from.centerX + (to.centerX - from.centerX) * eased,
                centerY: from.centerY + (to.centerY - from.centerY) * eased,
                scale: from.scale * Math.pow(to.scale / from.scale, eased),
                width: to.width,
                height: to.height
            };

            this.state.setViewport(viewport);

            if (progress < 1.0) {
                const timeSinceLastRender = currentTime - this.lastRenderTime;
                if (timeSinceLastRender >= this.renderThrottle) {
                    const params = this.state.getRenderParams();
                    const mode = this.state.getMode();
                    const juliaParams = this.state.getJuliaParams();
                    this.renderer.startRender(viewport, { ...params, maxIter: 200 }, mode, juliaParams);
                    this.lastRenderTime = currentTime;
                }
                this.activeAnimation = requestAnimationFrame(animate);
            } else {
                this.activeAnimation = null;
                // Final high-quality render
                const params = this.state.getRenderParams();
                const mode = this.state.getMode();
                const juliaParams = this.state.getJuliaParams();
                this.renderer.startRender(viewport, params, mode, juliaParams);
            }
        };

        this.activeAnimation = requestAnimationFrame(animate);
    }

    cancel() {
        if (this.activeAnimation) {
            cancelAnimationFrame(this.activeAnimation);
            this.activeAnimation = null;
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
