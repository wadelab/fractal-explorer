.PHONY: all build debug clean serve install-deps

all: build

build:
	@echo "Building Fractal Explorer..."
	@bash scripts/build.sh release

debug:
	@echo "Building debug version..."
	@bash scripts/build.sh debug

clean:
	@echo "Cleaning build artifacts..."
	@rm -rf build/

serve: build
	@echo "Starting development server..."
	@python3 scripts/dev-server.py

install-deps:
	@echo "=== Fractal Explorer Dependencies ==="
	@echo ""
	@echo "Required:"
	@echo "  1. Emscripten SDK"
	@echo "     git clone https://github.com/emscripten-core/emsdk.git"
	@echo "     cd emsdk && ./emsdk install latest && ./emsdk activate latest"
	@echo "     source ./emsdk_env.sh"
	@echo ""
	@echo "  2. CMake (version 3.10+)"
	@echo "  3. Python 3 (for dev server)"
	@echo ""
	@echo "To verify installation:"
	@echo "  emcc --version"
	@echo "  cmake --version"
	@echo "  python3 --version"
