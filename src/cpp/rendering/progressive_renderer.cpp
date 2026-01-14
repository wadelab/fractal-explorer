#include "progressive_renderer.h"
#include <algorithm>

namespace fractal {

ProgressiveRenderParams ProgressiveRenderer::getPassParams(RenderPass pass,
                                                          int base_max_iterations) {
    ProgressiveRenderParams params;
    params.pass = pass;

    switch (pass) {
        case PASS_PREVIEW:
            params.resolution_scale = 0.25;
            params.max_iterations = std::max(100, base_max_iterations / 10);
            break;
        case PASS_LOW:
            params.resolution_scale = 0.5;
            params.max_iterations = std::max(200, base_max_iterations / 5);
            break;
        case PASS_MEDIUM:
            params.resolution_scale = 0.75;
            params.max_iterations = std::max(500, base_max_iterations / 2);
            break;
        case PASS_HIGH:
            params.resolution_scale = 1.0;
            params.max_iterations = base_max_iterations;
            break;
    }

    return params;
}

int ProgressiveRenderer::getAdaptiveIterations(RenderPass pass, int base_max_iterations) {
    return getPassParams(pass, base_max_iterations).max_iterations;
}

} // namespace fractal
