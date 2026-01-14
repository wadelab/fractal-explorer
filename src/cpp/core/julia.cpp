#include "julia.h"
#include <cmath>

namespace fractal {

FractalPoint Julia::compute(double z_real, double z_imag,
                            double c_real, double c_imag,
                            int max_iterations, double bailout_radius,
                            bool smooth_coloring) {
    FractalPoint result;

    double z_real2 = z_real * z_real;
    double z_imag2 = z_imag * z_imag;

    int iter = 0;
    while (z_real2 + z_imag2 <= bailout_radius && iter < max_iterations) {
        z_imag = 2.0 * z_real * z_imag + c_imag;
        z_real = z_real2 - z_imag2 + c_real;
        z_real2 = z_real * z_real;
        z_imag2 = z_imag * z_imag;
        iter++;
    }

    result.iterations = iter;
    result.inside_set = (iter >= max_iterations);

    // Smooth coloring
    if (smooth_coloring && iter < max_iterations) {
        double log_zn = std::log(z_real2 + z_imag2) / 2.0;
        double nu = std::log(log_zn / std::log(2.0)) / std::log(2.0);
        result.smooth_value = iter + 1.0 - nu;
    } else {
        result.smooth_value = iter;
    }

    return result;
}

} // namespace fractal
