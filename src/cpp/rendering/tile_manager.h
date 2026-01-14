#ifndef TILE_MANAGER_H
#define TILE_MANAGER_H

#include <vector>

namespace fractal {

struct Tile {
    int x;
    int y;
    int width;
    int height;

    Tile() : x(0), y(0), width(0), height(0) {}
    Tile(int x_, int y_, int w, int h) : x(x_), y(y_), width(w), height(h) {}
};

class TileManager {
public:
    // Generate tiles for a viewport
    static std::vector<Tile> generateTiles(int viewport_width, int viewport_height,
                                          int tile_size = 64);

    // Sort tiles by distance from center (for priority rendering)
    static void sortByDistanceFromCenter(std::vector<Tile>& tiles,
                                        int viewport_width, int viewport_height);
};

} // namespace fractal

#endif // TILE_MANAGER_H
