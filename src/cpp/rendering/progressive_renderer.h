#ifndef PROGRESSIVE_RENDERER_H
#define PROGRESSIVE_RENDERER_H

#include "../core/fractal_engine.h"

namespace fractal {

enum RenderPass {
    PASS_PREVIEW = 0,  // 25% resolution
    PASS_LOW = 1,      // 50% resolution
    PASS_MEDIUM = 2,   // 75% resolution
    PASS_HIGH = 3      // 100% resolution
};

struct ProgressiveRenderParams {
    RenderPass pass;
    double resolution_scale;
    int max_iterations;

    ProgressiveRenderParams() : pass(PASS_HIGH), resolution_scale(1.0), max_iterations(1000) {}
};

class ProgressiveRenderer {
public:
    // Get parameters for a given render pass
    static ProgressiveRenderParams getPassParams(RenderPass pass, int base_max_iterations);

    // Get adaptive iteration count for a pass
    static int getAdaptiveIterations(RenderPass pass, int base_max_iterations);
};

} // namespace fractal

#endif // PROGRESSIVE_RENDERER_H
