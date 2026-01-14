#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "../core/fractal_engine.h"
#include "../rendering/viewport.h"
#include "../rendering/tile_manager.h"
#include "../rendering/progressive_renderer.h"

using namespace emscripten;
using namespace fractal;

// Global engine instance
static FractalEngine engine;

// Render a tile and return pixel data
val renderTile(int x_start, int y_start, int tile_width, int tile_height,
              double center_x, double center_y, double scale, int width, int height,
              int max_iter, int fractal_type, double julia_c_re, double julia_c_im,
              int palette_id) {

    // Create viewport
    Viewport viewport(center_x, center_y, scale, width, height);

    // Create render params
    RenderParams params;
    params.max_iterations = max_iter;
    params.bailout_radius = 4.0;
    params.smooth_coloring = true;
    params.palette_id = palette_id;

    // Render tile
    std::vector<uint8_t> pixel_buffer;
    engine.renderTile(x_start, y_start, tile_width, tile_height,
                     viewport, params,
                     static_cast<FractalType>(fractal_type),
                     julia_c_re, julia_c_im,
                     pixel_buffer);

    // Return as Uint8Array
    return val(typed_memory_view(pixel_buffer.size(), pixel_buffer.data()));
}

// Convert screen coordinates to complex coordinates
val screenToComplex(int screen_x, int screen_y,
                   double center_x, double center_y, double scale,
                   int width, int height) {
    Viewport viewport(center_x, center_y, scale, width, height);

    double complex_real, complex_imag;
    engine.screenToComplex(screen_x, screen_y, viewport, complex_real, complex_imag);

    auto result = val::object();
    result.set("real", complex_real);
    result.set("imag", complex_imag);
    return result;
}

// Get adaptive iteration count for a render pass
int getAdaptiveIterations(int pass, int base_iterations) {
    return ProgressiveRenderer::getAdaptiveIterations(
        static_cast<RenderPass>(pass), base_iterations);
}

// Generate tiles for a viewport
val generateTiles(int width, int height, int tile_size) {
    auto tiles = TileManager::generateTiles(width, height, tile_size);

    // Convert to JavaScript array
    auto js_tiles = val::array();
    for (size_t i = 0; i < tiles.size(); i++) {
        auto tile_obj = val::object();
        tile_obj.set("x", tiles[i].x);
        tile_obj.set("y", tiles[i].y);
        tile_obj.set("width", tiles[i].width);
        tile_obj.set("height", tiles[i].height);
        js_tiles.set(i, tile_obj);
    }

    return js_tiles;
}

EMSCRIPTEN_BINDINGS(fractal_module) {
    function("renderTile", &renderTile);
    function("screenToComplex", &screenToComplex);
    function("getAdaptiveIterations", &getAdaptiveIterations);
    function("generateTiles", &generateTiles);

    // Export enums
    enum_<FractalType>("FractalType")
        .value("MANDELBROT", MANDELBROT)
        .value("JULIA", JULIA);

    enum_<RenderPass>("RenderPass")
        .value("PASS_PREVIEW", PASS_PREVIEW)
        .value("PASS_LOW", PASS_LOW)
        .value("PASS_MEDIUM", PASS_MEDIUM)
        .value("PASS_HIGH", PASS_HIGH);
}
