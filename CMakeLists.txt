cmake_minimum_required(VERSION 3.10)
project(FractalExplorer)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Source files
set(SOURCES
    src/cpp/main.cpp
    src/cpp/core/fractal_engine.cpp
    src/cpp/core/mandelbrot.cpp
    src/cpp/core/julia.cpp
    src/cpp/core/color_palette.cpp
    src/cpp/rendering/progressive_renderer.cpp
    src/cpp/rendering/tile_manager.cpp
    src/cpp/rendering/viewport.cpp
    src/cpp/bindings/emscripten_bindings.cpp
)

# Emscripten-specific settings
if(EMSCRIPTEN)
    add_executable(fractal ${SOURCES})

    # Emscripten compile flags
    set(EMSCRIPTEN_COMPILE_FLAGS
        -O3
    )

    # Emscripten link flags
    set(EMSCRIPTEN_LINK_FLAGS
        -O3
        -sWASM=1
        -sMODULARIZE=1
        -sEXPORT_NAME=FractalModule
        -sALLOW_MEMORY_GROWTH=1
        -sINITIAL_MEMORY=268435456
        -sMAXIMUM_MEMORY=1073741824
        --bind
        -sNO_EXIT_RUNTIME=1
        -sASSERTIONS=0
        -sEXPORTED_RUNTIME_METHODS=ccall,cwrap
    )

    # Add flags to target
    target_compile_options(fractal PRIVATE ${EMSCRIPTEN_COMPILE_FLAGS})
    target_link_options(fractal PRIVATE ${EMSCRIPTEN_LINK_FLAGS})

    # Output location
    set_target_properties(fractal PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/build/wasm"
        OUTPUT_NAME "fractal"
    )
else()
    # Native build for testing
    add_executable(fractal_native ${SOURCES})
    target_compile_options(fractal_native PRIVATE -Wall -Wextra -O3)
endif()
