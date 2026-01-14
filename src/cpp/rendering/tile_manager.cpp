#include "tile_manager.h"
#include <algorithm>
#include <cmath>

namespace fractal {

std::vector<Tile> TileManager::generateTiles(int viewport_width, int viewport_height,
                                             int tile_size) {
    std::vector<Tile> tiles;

    for (int y = 0; y < viewport_height; y += tile_size) {
        for (int x = 0; x < viewport_width; x += tile_size) {
            int tile_width = std::min(tile_size, viewport_width - x);
            int tile_height = std::min(tile_size, viewport_height - y);
            tiles.emplace_back(x, y, tile_width, tile_height);
        }
    }

    return tiles;
}

void TileManager::sortByDistanceFromCenter(std::vector<Tile>& tiles,
                                          int viewport_width, int viewport_height) {
    double center_x = viewport_width / 2.0;
    double center_y = viewport_height / 2.0;

    std::sort(tiles.begin(), tiles.end(), [center_x, center_y](const Tile& a, const Tile& b) {
        // Calculate tile centers
        double a_center_x = a.x + a.width / 2.0;
        double a_center_y = a.y + a.height / 2.0;
        double b_center_x = b.x + b.width / 2.0;
        double b_center_y = b.y + b.height / 2.0;

        // Calculate distances from viewport center
        double dist_a = std::hypot(a_center_x - center_x, a_center_y - center_y);
        double dist_b = std::hypot(b_center_x - center_x, b_center_y - center_y);

        return dist_a < dist_b;
    });
}

} // namespace fractal
