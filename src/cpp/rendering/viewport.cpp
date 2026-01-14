#include "viewport.h"

namespace fractal {

Viewport ViewportManager::createDefault(int width, int height) {
    return createMandelbrotView(width, height);
}

Viewport ViewportManager::createMandelbrotView(int width, int height) {
    // Default Mandelbrot view: centered at (-0.5, 0) with scale to show full set
    return Viewport(-0.5, 0.0, 0.004, width, height);
}

Viewport ViewportManager::createJuliaView(int width, int height) {
    // Default Julia view: centered at origin with typical scale
    return Viewport(0.0, 0.0, 0.004, width, height);
}

Viewport ViewportManager::zoom(const Viewport& current, double factor,
                              int focus_x, int focus_y) {
    Viewport result = current;

    // Convert focus point to complex coordinates (before zoom)
    double focus_real = (focus_x - current.width / 2.0) * current.scale + current.center_x;
    double focus_imag = (focus_y - current.height / 2.0) * current.scale + current.center_y;

    // Apply zoom to scale
    result.scale = current.scale * factor;

    // Recalculate focus point with new scale
    double new_focus_real = (focus_x - current.width / 2.0) * result.scale + current.center_x;
    double new_focus_imag = (focus_y - current.height / 2.0) * result.scale + current.center_y;

    // Adjust center to keep focus point fixed
    result.center_x = current.center_x - (new_focus_real - focus_real);
    result.center_y = current.center_y - (new_focus_imag - focus_imag);

    return result;
}

Viewport ViewportManager::pan(const Viewport& current, int dx, int dy) {
    Viewport result = current;

    // Convert pixel delta to complex delta
    result.center_x = current.center_x - dx * current.scale;
    result.center_y = current.center_y - dy * current.scale;

    return result;
}

} // namespace fractal
