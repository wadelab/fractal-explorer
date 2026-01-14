/**
 * Interaction Handler - Mouse and touch interactions
 */

export class InteractionHandler {
    constructor(canvas, stateManager, rendererManager, animator) {
        this.canvas = canvas;
        this.state = stateManager;
        this.renderer = rendererManager;
        this.animator = animator;

        this.isPanning = false;
        this.lastMousePos = null;
        this.pinchDistance = null;
        this.panThreshold = 5; // Minimum pixels to consider it a pan (not a click)
        this.panDistance = 0;

        // Zoom box state
        this.isDrawingZoomBox = false;
        this.zoomBoxStart = null;
        this.zoomBoxOverlay = null;

        this.setupEventListeners();
        this.createZoomBoxOverlay();
    }

    createZoomBoxOverlay() {
        // Create overlay div for zoom box
        this.zoomBoxOverlay = document.createElement('div');
        this.zoomBoxOverlay.id = 'zoom-box-overlay';
        this.zoomBoxOverlay.style.position = 'absolute';
        this.zoomBoxOverlay.style.border = '2px dashed #00d4ff';
        this.zoomBoxOverlay.style.backgroundColor = 'rgba(0, 212, 255, 0.1)';
        this.zoomBoxOverlay.style.pointerEvents = 'none';
        this.zoomBoxOverlay.style.display = 'none';
        this.zoomBoxOverlay.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.5)';
        this.canvas.parentElement.appendChild(this.zoomBoxOverlay);
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onMouseDown(e) {
        // Shift+click starts zoom box
        if (e.shiftKey) {
            this.isDrawingZoomBox = true;
            this.zoomBoxStart = { x: e.offsetX, y: e.offsetY };
            this.canvas.style.cursor = 'crosshair';
            return;
        }

        this.isPanning = true;
        this.lastMousePos = { x: e.offsetX, y: e.offsetY };
        this.panDistance = 0;
        this.canvas.style.cursor = 'grabbing';
    }

    onMouseMove(e) {
        // Update zoom box
        if (this.isDrawingZoomBox && this.zoomBoxStart) {
            this.updateZoomBox(e.offsetX, e.offsetY);
            return;
        }

        // Show crosshair when shift is held
        if (e.shiftKey && !this.isPanning) {
            this.canvas.style.cursor = 'crosshair';
        } else if (!this.isPanning) {
            this.canvas.style.cursor = 'grab';
        }

        if (this.isPanning && this.lastMousePos) {
            const dx = e.offsetX - this.lastMousePos.x;
            const dy = e.offsetY - this.lastMousePos.y;

            this.panDistance += Math.hypot(dx, dy);

            this.pan(dx, dy);

            this.lastMousePos = { x: e.offsetX, y: e.offsetY };
        }
    }

    onMouseUp(e) {
        // Complete zoom box
        if (this.isDrawingZoomBox && this.zoomBoxStart) {
            this.completeZoomBox(e.offsetX, e.offsetY);
            this.isDrawingZoomBox = false;
            this.zoomBoxStart = null;
            this.hideZoomBox();
            this.canvas.style.cursor = e.shiftKey ? 'crosshair' : 'grab';
            return;
        }

        if (this.isPanning) {
            // If pan distance is small, treat as click
            if (this.panDistance < this.panThreshold && this.state.getMode() === 'mandelbrot') {
                this.handleClick(e.offsetX, e.offsetY);
            }
        }

        this.isPanning = false;
        this.lastMousePos = null;
        this.panDistance = 0;
        this.canvas.style.cursor = 'grab';
    }

    onWheel(e) {
        e.preventDefault();

        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        this.zoomAt(mouseX, mouseY, zoomFactor, true);
    }

    onTouchStart(e) {
        e.preventDefault();

        if (e.touches.length === 1) {
            // Single touch - pan
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.lastMousePos = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
            this.isPanning = true;
            this.panDistance = 0;
        } else if (e.touches.length === 2) {
            // Two touches - pinch zoom
            this.isPanning = false;
            this.pinchDistance = this.getPinchDistance(e.touches);
        }
    }

    onTouchMove(e) {
        e.preventDefault();

        if (e.touches.length === 1 && this.isPanning && this.lastMousePos) {
            // Pan
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            const dx = x - this.lastMousePos.x;
            const dy = y - this.lastMousePos.y;

            this.panDistance += Math.hypot(dx, dy);

            this.pan(dx, dy);

            this.lastMousePos = { x, y };
        } else if (e.touches.length === 2) {
            // Pinch zoom
            const distance = this.getPinchDistance(e.touches);

            if (this.pinchDistance !== null) {
                const zoomFactor = this.pinchDistance / distance;
                const center = this.getPinchCenter(e.touches);
                const rect = this.canvas.getBoundingClientRect();

                this.zoomAt(
                    center.x - rect.left,
                    center.y - rect.top,
                    zoomFactor,
                    false
                );
            }

            this.pinchDistance = distance;
        }
    }

    onTouchEnd(e) {
        if (e.touches.length === 0) {
            // All touches ended - check for tap (click)
            if (this.isPanning && this.panDistance < this.panThreshold &&
                this.state.getMode() === 'mandelbrot' && this.lastMousePos) {
                this.handleClick(this.lastMousePos.x, this.lastMousePos.y);
            }

            this.isPanning = false;
            this.lastMousePos = null;
            this.pinchDistance = null;
            this.panDistance = 0;
        }
    }

    handleClick(x, y) {
        // In Mandelbrot mode, click switches to Julia set with clicked parameter
        const viewport = this.state.getViewport();

        // Convert to complex coordinates
        const cReal = (x - viewport.width / 2) * viewport.scale + viewport.centerX;
        const cImag = (y - viewport.height / 2) * viewport.scale + viewport.centerY;

        // Switch to Julia mode
        this.state.setMode('julia');
        this.state.setJuliaParams(cReal, cImag);

        // Reset viewport for Julia set
        const juliaViewport = {
            centerX: 0,
            centerY: 0,
            scale: 0.004,
            width: viewport.width,
            height: viewport.height
        };

        this.animator.animateViewport(viewport, juliaViewport, 800);
    }

    zoomAt(x, y, factor, animated = true) {
        const viewport = this.state.getViewport();

        // Convert mouse position to complex coordinates (before zoom)
        const complexBefore = {
            real: (x - viewport.width / 2) * viewport.scale + viewport.centerX,
            imag: (y - viewport.height / 2) * viewport.scale + viewport.centerY
        };

        // Apply zoom
        const newScale = viewport.scale * factor;

        // Recalculate mouse position with new scale
        const complexAfter = {
            real: (x - viewport.width / 2) * newScale + viewport.centerX,
            imag: (y - viewport.height / 2) * newScale + viewport.centerY
        };

        // Adjust center to keep mouse position fixed
        const newCenterX = viewport.centerX - (complexAfter.real - complexBefore.real);
        const newCenterY = viewport.centerY - (complexAfter.imag - complexBefore.imag);

        const newViewport = {
            ...viewport,
            centerX: newCenterX,
            centerY: newCenterY,
            scale: newScale
        };

        if (animated) {
            this.animator.animateViewport(viewport, newViewport, 500);
        } else {
            this.state.setViewport(newViewport);
            this.triggerRender();
        }
    }

    pan(dx, dy) {
        const viewport = this.state.getViewport();

        // Convert pixel delta to complex delta
        const newCenterX = viewport.centerX - dx * viewport.scale;
        const newCenterY = viewport.centerY - dy * viewport.scale;

        this.state.setViewport({
            ...viewport,
            centerX: newCenterX,
            centerY: newCenterY
        });

        this.triggerRender();
    }

    triggerRender() {
        const viewport = this.state.getViewport();
        const params = this.state.getRenderParams();
        const mode = this.state.getMode();
        const juliaParams = this.state.getJuliaParams();

        this.renderer.startRender(viewport, params, mode, juliaParams);
    }

    getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    }

    getPinchCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }

    updateZoomBox(endX, endY) {
        if (!this.zoomBoxStart) return;

        const rect = this.canvas.getBoundingClientRect();
        const startX = this.zoomBoxStart.x;
        const startY = this.zoomBoxStart.y;

        // Calculate box dimensions
        const left = Math.min(startX, endX);
        const top = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        // Update overlay position and size
        this.zoomBoxOverlay.style.display = 'block';
        this.zoomBoxOverlay.style.left = `${left}px`;
        this.zoomBoxOverlay.style.top = `${top}px`;
        this.zoomBoxOverlay.style.width = `${width}px`;
        this.zoomBoxOverlay.style.height = `${height}px`;
    }

    hideZoomBox() {
        this.zoomBoxOverlay.style.display = 'none';
    }

    completeZoomBox(endX, endY) {
        if (!this.zoomBoxStart) return;

        const startX = this.zoomBoxStart.x;
        const startY = this.zoomBoxStart.y;

        // Minimum box size to prevent accidental tiny zooms
        const minBoxSize = 20;
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        if (width < minBoxSize || height < minBoxSize) {
            // Too small, treat as regular click
            return;
        }

        // Get box bounds
        const left = Math.min(startX, endX);
        const top = Math.min(startY, endY);
        const right = Math.max(startX, endX);
        const bottom = Math.max(startY, endY);

        // Calculate center of box
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;

        // Convert box corners to complex coordinates
        const viewport = this.state.getViewport();

        const topLeftComplex = {
            real: (left - viewport.width / 2) * viewport.scale + viewport.centerX,
            imag: (top - viewport.height / 2) * viewport.scale + viewport.centerY
        };

        const bottomRightComplex = {
            real: (right - viewport.width / 2) * viewport.scale + viewport.centerX,
            imag: (bottom - viewport.height / 2) * viewport.scale + viewport.centerY
        };

        // Calculate new center in complex plane
        const newCenterReal = (topLeftComplex.real + bottomRightComplex.real) / 2;
        const newCenterImag = (topLeftComplex.imag + bottomRightComplex.imag) / 2;

        // Calculate new scale based on box size
        const complexWidth = Math.abs(bottomRightComplex.real - topLeftComplex.real);
        const complexHeight = Math.abs(bottomRightComplex.imag - topLeftComplex.imag);

        // Use the larger dimension to ensure the entire box fits in the viewport
        const scaleX = complexWidth / viewport.width;
        const scaleY = complexHeight / viewport.height;
        const newScale = Math.max(scaleX, scaleY);

        // Create new viewport
        const newViewport = {
            centerX: newCenterReal,
            centerY: newCenterImag,
            scale: newScale,
            width: viewport.width,
            height: viewport.height
        };

        // For zoom box, use instant transition with immediate render
        // Animation was causing render storms, so we skip it
        this.state.setViewport(newViewport);

        // Trigger immediate render
        const params = this.state.getRenderParams();
        const mode = this.state.getMode();
        const juliaParams = this.state.getJuliaParams();

        this.renderer.startRender(newViewport, params, mode, juliaParams);
    }
}
