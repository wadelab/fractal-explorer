#!/bin/bash

set -e

# Configuration
BUILD_TYPE=${1:-release}
BUILD_DIR="build"
WASM_DIR="$BUILD_DIR/wasm"
DIST_DIR="$BUILD_DIR/dist"

echo "🚀 Building Fractal Explorer ($BUILD_TYPE)..."

# Create build directories
mkdir -p "$WASM_DIR"
mkdir -p "$DIST_DIR"

# Check for Emscripten
if ! command -v emcc &> /dev/null; then
    echo "❌ Error: Emscripten not found. Please install Emscripten SDK."
    echo "   Run 'make install-deps' for instructions."
    exit 1
fi

echo "✓ Emscripten found: $(emcc --version | head -n1)"

# Build with Emscripten
echo "🔨 Compiling C++ to WebAssembly..."

if [ "$BUILD_TYPE" = "debug" ]; then
    echo "   Debug mode: enabling assertions and source maps"
    EXTRA_CMAKE_FLAGS="-DCMAKE_BUILD_TYPE=Debug"
else
    echo "   Release mode: optimizations enabled"
    EXTRA_CMAKE_FLAGS="-DCMAKE_BUILD_TYPE=Release"
fi

# Run CMake
echo "   Configuring with CMake..."
emcmake cmake -B "$BUILD_DIR" $EXTRA_CMAKE_FLAGS

# Build
echo "   Building with make..."
cmake --build "$BUILD_DIR" -- -j4

if [ ! -f "$WASM_DIR/fractal.wasm" ]; then
    echo "❌ Build failed: fractal.wasm not found"
    exit 1
fi

echo "✓ WASM build complete: $WASM_DIR/fractal.wasm ($(du -h "$WASM_DIR/fractal.wasm" | cut -f1))"

# Copy web assets to dist directory
echo "📦 Copying web assets to $DIST_DIR..."

# Copy JavaScript modules
cp -r src/js "$DIST_DIR/"
echo "   ✓ JavaScript modules"

# Copy workers
cp -r src/workers "$DIST_DIR/"
echo "   ✓ Web Workers"

# Copy CSS
cp -r src/css "$DIST_DIR/"
echo "   ✓ CSS stylesheets"

# Copy HTML
cp src/html/index.html "$DIST_DIR/"
echo "   ✓ HTML"

# Copy public assets
cp -r public "$DIST_DIR/"
echo "   ✓ Public assets"

# Copy WASM files
cp "$WASM_DIR/fractal.wasm" "$DIST_DIR/"
cp "$WASM_DIR/fractal.js" "$DIST_DIR/"
echo "   ✓ WASM files"

echo ""
echo "✅ Build complete!"
echo "   Output directory: $DIST_DIR"
echo "   Run 'make serve' to start development server"
