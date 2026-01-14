/**
 * Minimap - Overview navigation component
 */

export class Minimap {
    constructor(canvasElement, stateManager) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.state = stateManager;

        this.width = 200;
        this.height = 150;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.zoomFactor = 10; // Show 10x zoomed out view

        this.state.subscribe(() => {
            this.render();
        });
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw placeholder gradient (actual rendering would be too expensive)
        const mainViewport = this.state.getViewport();

        // Draw a simple representation
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw viewport indicator rectangle
        this.drawViewportIndicator(mainViewport);
    }

    drawViewportIndicator(mainViewport) {
        // Calculate rectangle representing main viewport in minimap space
        const rectWidth = Math.min(this.width * 0.1, this.width - 4);
        const rectHeight = Math.min(this.height * 0.1, this.height - 4);

        const rectX = (this.width - rectWidth) / 2;
        const rectY = (this.height - rectHeight) / 2;

        // Draw semi-transparent rectangle
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

        // Add label
        this.ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
        this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
    }
}
