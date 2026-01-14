#ifndef JULIA_H
#define JULIA_H

#include "fractal_engine.h"

namespace fractal {

class Julia {
public:
    // Compute Julia set iteration count
    static FractalPoint compute(double z_real, double z_imag,
                               double c_real, double c_imag,
                               int max_iterations, double bailout_radius,
                               bool smooth_coloring);
};

} // namespace fractal

#endif // JULIA_H
