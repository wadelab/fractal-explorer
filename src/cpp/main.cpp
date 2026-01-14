/**
 * Fractal Explorer - Main entry point
 *
 * This file is primarily for native builds and testing.
 * The Emscripten bindings in bindings/emscripten_bindings.cpp
 * provide the actual interface for WebAssembly.
 */

#include "core/fractal_engine.h"
#include "rendering/viewport.h"
#include <iostream>

#ifndef __EMSCRIPTEN__
// Native build main (for testing)
int main() {
    std::cout << "Fractal Explorer - Native Build" << std::endl;
    std::cout << "This is a test build. Use Emscripten build for web deployment." << std::endl;

    // Simple test
    fractal::FractalEngine engine;
    fractal::Viewport viewport = fractal::ViewportManager::createMandelbrotView(800, 600);
    fractal::RenderParams params;

    std::cout << "Viewport: center=(" << viewport.center_x << ", " << viewport.center_y << "), "
              << "scale=" << viewport.scale << std::endl;

    // Test a single point
    auto result = engine.computeMandelbrot(0.0, 0.0, params);
    std::cout << "Point (0,0): iterations=" << result.iterations << std::endl;

    return 0;
}
#else
// Emscripten build - no main needed (bindings provide interface)
#endif
