/**
 * Animation System - Smooth viewport transitions
 */

export class Animator {
    constructor(stateManager, rendererManager) {
        this.state = stateManager;
        this.renderer = rendererManager;
        this.activeAnimation = null;
        this.lastRenderTime = 0;
        this.renderThrottle = 100; // Only render every 100ms during animation
    }

    animateViewport(from, to, duration = 500) {
        this.cancelAnimation();

        const startTime = performance.now();
        this.lastRenderTime = 0;

        this.activeAnimation = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1.0);

            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);

            // Interpolate viewport parameters
            const viewport = {
                centerX: this.lerp(from.centerX, to.centerX, eased),
                centerY: this.lerp(from.centerY, to.centerY, eased),
                scale: this.lerpLog(from.scale, to.scale, eased),
                width: to.width,
                height: to.height
            };

            this.state.setViewport(viewport);

            // Continue animation
            if (progress < 1.0) {
                // Throttle rendering during animation - only render every 100ms
                const timeSinceLastRender = currentTime - this.lastRenderTime;
                if (timeSinceLastRender >= this.renderThrottle) {
                    const params = this.state.getRenderParams();
                    const mode = this.state.getMode();
                    const juliaParams = this.state.getJuliaParams();

                    // Lower quality during animation
                    this.renderer.startRender(viewport, {
                        ...params,
                        maxIterations: Math.min(200, params.maxIterations)
                    }, mode, juliaParams);

                    this.lastRenderTime = currentTime;
                }

                requestAnimationFrame(this.activeAnimation);
            } else {
                // Final high-quality render
                const params = this.state.getRenderParams();
                const mode = this.state.getMode();
                const juliaParams = this.state.getJuliaParams();

                this.renderer.startRender(viewport, params, mode, juliaParams);
                this.activeAnimation = null;
            }
        };

        requestAnimationFrame(this.activeAnimation);
    }

    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    lerpLog(a, b, t) {
        // Logarithmic interpolation for smooth zoom feel
        return Math.exp(this.lerp(Math.log(a), Math.log(b), t));
    }

    cancelAnimation() {
        if (this.activeAnimation) {
            this.activeAnimation = null;
        }
    }
}
