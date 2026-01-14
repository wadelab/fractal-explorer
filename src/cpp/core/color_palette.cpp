#include "color_palette.h"
#include <algorithm>

namespace fractal {

ColorPalette::ColorPalette() {
    generateClassicPalette();
}

void ColorPalette::initPalette(int palette_id) {
    switch (palette_id) {
        case 0:
            generateClassicPalette();
            break;
        case 1:
            generateRainbowPalette();
            break;
        case 2:
            generateFirePalette();
            break;
        case 3:
            generateIcePalette();
            break;
        case 4:
            generateGrayscalePalette();
            break;
        default:
            generateClassicPalette();
            break;
    }
}

Color ColorPalette::getColor(double smooth_value, int max_iterations) const {
    // Inside the set -> black
    if (smooth_value >= max_iterations) {
        return Color(0, 0, 0, 255);
    }

    // Map smooth value to palette
    double normalized = smooth_value / static_cast<double>(max_iterations);
    double palette_index = normalized * palette_.size();

    // Get palette position
    int index1 = static_cast<int>(palette_index) % palette_.size();
    int index2 = (index1 + 1) % palette_.size();
    double t = palette_index - std::floor(palette_index);

    // Interpolate between colors
    return interpolateColors(palette_[index1], palette_[index2], t);
}

void ColorPalette::setCustomColors(const std::vector<Color>& colors) {
    if (!colors.empty()) {
        palette_ = colors;
    }
}

void ColorPalette::generateClassicPalette() {
    // Classic blue to yellow gradient
    palette_.clear();
    int size = 256;
    palette_.reserve(size);

    for (int i = 0; i < size; i++) {
        double t = i / static_cast<double>(size - 1);

        if (t < 0.5) {
            // Blue to cyan
            double local_t = t * 2.0;
            uint8_t r = static_cast<uint8_t>(0);
            uint8_t g = static_cast<uint8_t>(local_t * 255);
            uint8_t b = static_cast<uint8_t>(255);
            palette_.emplace_back(r, g, b);
        } else {
            // Cyan to yellow
            double local_t = (t - 0.5) * 2.0;
            uint8_t r = static_cast<uint8_t>(local_t * 255);
            uint8_t g = static_cast<uint8_t>(255);
            uint8_t b = static_cast<uint8_t>((1.0 - local_t) * 255);
            palette_.emplace_back(r, g, b);
        }
    }
}

void ColorPalette::generateRainbowPalette() {
    // HSV rainbow
    palette_.clear();
    int size = 256;
    palette_.reserve(size);

    for (int i = 0; i < size; i++) {
        double hue = i / static_cast<double>(size) * 360.0;

        // Simple HSV to RGB conversion
        double c = 1.0;  // Full saturation and value
        double x = c * (1.0 - std::abs(std::fmod(hue / 60.0, 2.0) - 1.0));
        double m = 0.0;

        double r, g, b;
        if (hue < 60) {
            r = c; g = x; b = 0;
        } else if (hue < 120) {
            r = x; g = c; b = 0;
        } else if (hue < 180) {
            r = 0; g = c; b = x;
        } else if (hue < 240) {
            r = 0; g = x; b = c;
        } else if (hue < 300) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }

        palette_.emplace_back(
            static_cast<uint8_t>((r + m) * 255),
            static_cast<uint8_t>((g + m) * 255),
            static_cast<uint8_t>((b + m) * 255)
        );
    }
}

void ColorPalette::generateFirePalette() {
    // Black -> Red -> Orange -> Yellow -> White
    palette_.clear();
    int size = 256;
    palette_.reserve(size);

    for (int i = 0; i < size; i++) {
        double t = i / static_cast<double>(size - 1);

        uint8_t r, g, b;
        if (t < 0.25) {
            // Black to red
            double local_t = t * 4.0;
            r = static_cast<uint8_t>(local_t * 255);
            g = 0;
            b = 0;
        } else if (t < 0.5) {
            // Red to orange
            double local_t = (t - 0.25) * 4.0;
            r = 255;
            g = static_cast<uint8_t>(local_t * 165);
            b = 0;
        } else if (t < 0.75) {
            // Orange to yellow
            double local_t = (t - 0.5) * 4.0;
            r = 255;
            g = static_cast<uint8_t>(165 + local_t * 90);
            b = 0;
        } else {
            // Yellow to white
            double local_t = (t - 0.75) * 4.0;
            r = 255;
            g = 255;
            b = static_cast<uint8_t>(local_t * 255);
        }

        palette_.emplace_back(r, g, b);
    }
}

void ColorPalette::generateIcePalette() {
    // Black -> Blue -> Cyan -> White
    palette_.clear();
    int size = 256;
    palette_.reserve(size);

    for (int i = 0; i < size; i++) {
        double t = i / static_cast<double>(size - 1);

        uint8_t r, g, b;
        if (t < 0.33) {
            // Black to blue
            double local_t = t * 3.0;
            r = 0;
            g = 0;
            b = static_cast<uint8_t>(local_t * 255);
        } else if (t < 0.66) {
            // Blue to cyan
            double local_t = (t - 0.33) * 3.0;
            r = 0;
            g = static_cast<uint8_t>(local_t * 255);
            b = 255;
        } else {
            // Cyan to white
            double local_t = (t - 0.66) * 3.0;
            r = static_cast<uint8_t>(local_t * 255);
            g = 255;
            b = 255;
        }

        palette_.emplace_back(r, g, b);
    }
}

void ColorPalette::generateGrayscalePalette() {
    // Black to white
    palette_.clear();
    int size = 256;
    palette_.reserve(size);

    for (int i = 0; i < size; i++) {
        uint8_t value = static_cast<uint8_t>(i);
        palette_.emplace_back(value, value, value);
    }
}

Color ColorPalette::interpolateColors(const Color& c1, const Color& c2, double t) const {
    t = std::max(0.0, std::min(1.0, t));  // Clamp t to [0, 1]

    uint8_t r = static_cast<uint8_t>(c1.r + t * (c2.r - c1.r));
    uint8_t g = static_cast<uint8_t>(c1.g + t * (c2.g - c1.g));
    uint8_t b = static_cast<uint8_t>(c1.b + t * (c2.b - c1.b));
    uint8_t a = static_cast<uint8_t>(c1.a + t * (c2.a - c1.a));

    return Color(r, g, b, a);
}

} // namespace fractal
