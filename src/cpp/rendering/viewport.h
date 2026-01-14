#ifndef VIEWPORT_H
#define VIEWPORT_H

#include "../core/fractal_engine.h"

namespace fractal {

// Viewport utilities
class ViewportManager {
public:
    // Create default viewport
    static Viewport createDefault(int width, int height);

    // Create viewport for Mandelbrot set
    static Viewport createMandelbrotView(int width, int height);

    // Create viewport for Julia set
    static Viewport createJuliaView(int width, int height);

    // Zoom viewport
    static Viewport zoom(const Viewport& current, double factor,
                        int focus_x, int focus_y);

    // Pan viewport
    static Viewport pan(const Viewport& current, int dx, int dy);
};

} // namespace fractal

#endif // VIEWPORT_H
