#ifndef MANDELBROT_H
#define MANDELBROT_H

#include "fractal_engine.h"

namespace fractal {

class Mandelbrot {
public:
    // Compute Mandelbrot set iteration count with optimizations
    static FractalPoint compute(double c_real, double c_imag,
                               int max_iterations, double bailout_radius,
                               bool smooth_coloring);

private:
    // Optimization: check if point is in main cardioid
    static bool inMainCardioid(double c_real, double c_imag);

    // Optimization: check if point is in period-2 bulb
    static bool inPeriod2Bulb(double c_real, double c_imag);
};

} // namespace fractal

#endif // MANDELBROT_H
