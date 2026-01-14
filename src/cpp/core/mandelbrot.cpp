#include "mandelbrot.h"
#include <cmath>

namespace fractal {

bool Mandelbrot::inMainCardioid(double c_real, double c_imag) {
    // Check if point is in the main cardioid
    double q = (c_real - 0.25) * (c_real - 0.25) + c_imag * c_imag;
    return q * (q + (c_real - 0.25)) <= 0.25 * c_imag * c_imag;
}

bool Mandelbrot::inPeriod2Bulb(double c_real, double c_imag) {
    // Check if point is in the period-2 bulb
    double dx = c_real + 1.0;
    return dx * dx + c_imag * c_imag <= 0.0625;
}

FractalPoint Mandelbrot::compute(double c_real, double c_imag,
                                 int max_iterations, double bailout_radius,
                                 bool smooth_coloring) {
    FractalPoint result;

    // Early bailout optimizations
    if (inMainCardioid(c_real, c_imag)) {
        result.iterations = max_iterations;
        result.inside_set = true;
        result.smooth_value = max_iterations;
        return result;
    }

    if (inPeriod2Bulb(c_real, c_imag)) {
        result.iterations = max_iterations;
        result.inside_set = true;
        result.smooth_value = max_iterations;
        return result;
    }

    // Mandelbrot iteration
    double z_real = 0.0;
    double z_imag = 0.0;
    double z_real2 = 0.0;
    double z_imag2 = 0.0;

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
