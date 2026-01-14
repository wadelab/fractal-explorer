#ifndef FRACTAL_ENGINE_H
#define FRACTAL_ENGINE_H

#include <cstdint>
#include <vector>

namespace fractal {

// Viewport represents the visible region in the complex plane
struct Viewport {
    double center_x;
    double center_y;
    double scale;  // Units per pixel
    int width;
    int height;

    Viewport() : center_x(-0.5), center_y(0.0), scale(0.004), width(800), height(600) {}
    Viewport(double cx, double cy, double s, int w, int h)
        : center_x(cx), center_y(cy), scale(s), width(w), height(h) {}
};

// Render parameters
struct RenderParams {
    int max_iterations;
    double bailout_radius;
    bool smooth_coloring;
    int palette_id;

    RenderParams() : max_iterations(1000), bailout_radius(4.0),
                     smooth_coloring(true), palette_id(0) {}
};

// Fractal type
enum FractalType {
    MANDELBROT = 0,
    JULIA = 1
};

// Fractal point result
struct FractalPoint {
    int iterations;
    double smooth_value;  // For smooth coloring
    bool inside_set;

    FractalPoint() : iterations(0), smooth_value(0.0), inside_set(false) {}
};

// Color structure
struct Color {
    uint8_t r, g, b, a;

    Color() : r(0), g(0), b(0), a(255) {}
    Color(uint8_t red, uint8_t green, uint8_t blue, uint8_t alpha = 255)
        : r(red), g(green), b(blue), a(alpha) {}
};

// Fractal Engine class
class FractalEngine {
public:
    FractalEngine();
    ~FractalEngine() = default;

    // Coordinate conversion
    void screenToComplex(int screen_x, int screen_y, const Viewport& viewport,
                        double& complex_real, double& complex_imag) const;

    // Compute fractal at a point
    FractalPoint computeMandelbrot(double c_real, double c_imag,
                                   const RenderParams& params) const;
    FractalPoint computeJulia(double z_real, double z_imag,
                             double c_real, double c_imag,
                             const RenderParams& params) const;

    // Render a tile
    void renderTile(int x_start, int y_start, int tile_width, int tile_height,
                   const Viewport& viewport, const RenderParams& params,
                   FractalType type, double julia_c_real, double julia_c_imag,
                   std::vector<uint8_t>& pixel_buffer) const;

private:
    // Helper methods
    double computeSmoothValue(double z_real, double z_imag, int iterations,
                            int max_iterations, double bailout) const;
};

} // namespace fractal

#endif // FRACTAL_ENGINE_H
