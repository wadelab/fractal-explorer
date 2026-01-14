/**
 * Canvas Manager - Handle canvas rendering and double buffering
 */

export class CanvasManager {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d', { alpha: false });

        // Double buffering for smooth updates
        this.backBuffer = document.createElement('canvas');
        this.backCtx = this.backBuffer.getContext('2d', { alpha: false });

        this.width = 0;
        this.height = 0;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        this.canvas.width = width;
        this.canvas.height = height;
        this.backBuffer.width = width;
        this.backBuffer.height = height;

        // Fill with black initially
        this.backCtx.fillStyle = '#000';
        this.backCtx.fillRect(0, 0, width, height);
    }

    drawTile(tile, pixelData, resolution = 1.0) {
        try {
            // Create ImageData from WASM pixel buffer
            const uint8Array = new Uint8ClampedArray(pixelData);
            const imageData = new ImageData(uint8Array, tile.width, tile.height);

            if (resolution < 1.0) {
                // Low-resolution pass - scale up with nearest-neighbor
                const scaledWidth = Math.ceil(tile.width / resolution);
                const scaledHeight = Math.ceil(tile.height / resolution);

                // Create temporary canvas for the tile
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = tile.width;
                tempCanvas.height = tile.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.putImageData(imageData, 0, 0);

                // Disable smoothing for pixelated look
                this.backCtx.imageSmoothingEnabled = false;

                // Draw scaled
                this.backCtx.drawImage(
                    tempCanvas,
                    0, 0, tile.width, tile.height,
                    tile.x, tile.y, scaledWidth, scaledHeight
                );
            } else {
                // Full resolution - direct blit
                this.backCtx.imageSmoothingEnabled = true;
                this.backCtx.putImageData(imageData, tile.x, tile.y);
            }
        } catch (error) {
            console.error('Error drawing tile:', error);
        }
    }

    flip() {
        // Swap buffers - blit back buffer to visible canvas
        this.ctx.drawImage(this.backBuffer, 0, 0);
    }

    requestFlip() {
        // Use requestAnimationFrame for smooth updates
        requestAnimationFrame(() => this.flip());
    }

    clear() {
        this.backCtx.fillStyle = '#000';
        this.backCtx.fillRect(0, 0, this.width, this.height);
    }

    drawImageData(imageData, x, y, width = null, height = null, useNearestNeighbor = false) {
        if (width === null || height === null) {
            // Direct draw at 1:1 scale
            this.ctx.putImageData(imageData, x, y);
        } else {
            // Scaled draw
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imageData.width;
            tempCanvas.height = imageData.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(imageData, 0, 0);

            // Set smoothing mode
            this.ctx.imageSmoothingEnabled = !useNearestNeighbor;

            // Draw scaled
            this.ctx.drawImage(
                tempCanvas,
                0, 0, imageData.width, imageData.height,
                x, y, width, height
            );
        }
    }

    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.ctx;
    }

    getDataURL() {
        return this.canvas.toDataURL('image/png');
    }
}
