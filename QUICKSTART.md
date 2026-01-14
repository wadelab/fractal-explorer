# Quick Start Guide - Fractal Explorer

## Prerequisites

Before building, you need to install the Emscripten SDK.

### Install Emscripten SDK

```bash
# Clone the emsdk repository
cd ~
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install and activate the latest SDK
./emsdk install latest
./emsdk activate latest

# Activate PATH and other environment variables in the current terminal
source ./emsdk_env.sh
```

**Note**: You'll need to run `source ~/emsdk/emsdk_env.sh` in each new terminal session, or add it to your `~/.bashrc` or `~/.zshrc`.

## Building the Project

Once Emscripten is installed:

```bash
cd /home/wade/fractal-explorer

# Build the project
make build
```

This will:
1. Compile C++ code to WebAssembly using Emscripten
2. Copy all web assets to `build/dist/`
3. Prepare the application for serving

## Running the Development Server

```bash
make serve
```

This starts a Python HTTP server on http://localhost:8000

Open your browser to http://localhost:8000 to see the Fractal Explorer!

## Quick Build Commands

```bash
make build          # Production build (optimized)
make debug          # Debug build (with source maps)
make clean          # Clean build artifacts
make serve          # Build and run dev server
make install-deps   # Show dependency info
```

## Troubleshooting

### "emcc: command not found"

You need to activate Emscripten in your terminal:
```bash
source ~/emsdk/emsdk_env.sh
```

### Build fails with CMake errors

Make sure you have CMake 3.10 or later:
```bash
cmake --version
```

If not installed:
```bash
# Ubuntu/Debian
sudo apt install cmake

# macOS
brew install cmake
```

### Port 8000 already in use

Edit `scripts/dev-server.py` and change the PORT variable to another port (e.g., 8080).

## File Structure

After building, your directory structure will look like:

```
fractal-explorer/
├── build/
│   ├── wasm/
│   │   ├── fractal.wasm      # WebAssembly binary
│   │   └── fractal.js        # WASM loader
│   └── dist/                 # Serve this directory
│       ├── index.html
│       ├── css/
│       ├── js/
│       ├── workers/
│       ├── public/
│       ├── fractal.wasm
│       └── fractal.js
```

## Next Steps

1. Open http://localhost:8000 in your browser
2. Try zooming with scroll wheel
3. Click and drag to pan
4. Click the "Presets" button to explore interesting locations
5. Click on the Mandelbrot set to see the corresponding Julia set!

## Performance Tips

- Use Chrome/Edge for best WebAssembly performance
- Increase iterations (slider) for more detail at deep zooms
- Lower iterations during exploration for faster rendering
- Use the preset gallery to jump to interesting locations

## Have Fun Exploring!

The Mandelbrot set contains infinite detail. Happy exploring! 🌀✨
