#ifndef COLOR_PALETTE_H
#define COLOR_PALETTE_H

#include "fractal_engine.h"
#include <vector>
#include <cmath>

namespace fractal {

class ColorPalette {
public:
    ColorPalette();
    ~ColorPalette() = default;

    // Initialize a palette by ID
    void initPalette(int palette_id);

    // Get color for a given smooth iteration value
    Color getColor(double smooth_value, int max_iterations) const;

    // Set custom palette colors
    void setCustomColors(const std::vector<Color>& colors);

private:
    std::vector<Color> palette_;

    // Built-in palette generators
    void generateClassicPalette();
    void generateRainbowPalette();
    void generateFirePalette();
    void generateIcePalette();
    void generateGrayscalePalette();

    // Helper: interpolate between two colors
    Color interpolateColors(const Color& c1, const Color& c2, double t) const;
};

} // namespace fractal

#endif // COLOR_PALETTE_H
