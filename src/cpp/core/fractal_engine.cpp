#include "fractal_engine.h"
#include "mandelbrot.h"
#include "julia.h"
#include "color_palette.h"
#include <cmath>

namespace fractal {

FractalEngine::FractalEngine() {
}

void FractalEngine::screenToComplex(int screen_x, int screen_y,
                                   const Viewport& viewport,
                                   double& complex_real, double& complex_imag) const {
    complex_real = (screen_x - viewport.width / 2.0) * viewport.scale + viewport.center_x;
    complex_imag = (screen_y - viewport.height / 2.0) * viewport.scale + viewport.center_y;
}

FractalPoint FractalEngine::computeMandelbrot(double c_real, double c_imag,
                                             const RenderParams& params) const {
    return Mandelbrot::compute(c_real, c_imag, params.max_iterations,
                              params.bailout_radius, params.smooth_coloring);
}

FractalPoint FractalEngine::computeJulia(double z_real, double z_imag,
                                        double c_real, double c_imag,
                                        const RenderParams& params) const {
    return Julia::compute(z_real, z_imag, c_real, c_imag, params.max_iterations,
                         params.bailout_radius, params.smooth_coloring);
}

void FractalEngine::renderTile(int x_start, int y_start, int tile_width, int tile_height,
                              const Viewport& viewport, const RenderParams& params,
                              FractalType type, double julia_c_real, double julia_c_imag,
                              std::vector<uint8_t>& pixel_buffer) const {
    // Initialize color palette
    ColorPalette palette;
    palette.initPalette(params.palette_id);

    // Ensure buffer is large enough
    pixel_buffer.resize(tile_width * tile_height * 4);  // RGBA

    // Render each pixel
    for (int y = 0; y < tile_height; y++) {
        for (int x = 0; x < tile_width; x++) {
            // Convert screen coordinates to complex plane
            double complex_real, complex_imag;
            screenToComplex(x_start + x, y_start + y, viewport,
                          complex_real, complex_imag);

            // Compute fractal
            FractalPoint point;
            if (type == MANDELBROT) {
                point = computeMandelbrot(complex_real, complex_imag, params);
            } else {
                point = computeJulia(complex_real, complex_imag,
                                    julia_c_real, julia_c_imag, params);
            }

            // Get color
            Color color = palette.getColor(point.smooth_value, params.max_iterations);

            // Write to buffer
            int offset = (y * tile_width + x) * 4;
            pixel_buffer[offset + 0] = color.r;
            pixel_buffer[offset + 1] = color.g;
            pixel_buffer[offset + 2] = color.b;
            pixel_buffer[offset + 3] = color.a;
        }
    }
}

} // namespace fractal
