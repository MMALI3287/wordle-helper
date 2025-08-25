#!/bin/bash
# Compile to WebAssembly using Docker/online tools

echo "Compiling C++ to WebAssembly..."

# Try to use clang if available
if command -v clang &> /dev/null; then
    echo "Using local clang..."
    clang++ --target=wasm32 -nostdlib -O3 -Wl,--no-entry -Wl,--export-all-functions \
        -o entropy-wasm-simple.wasm entropy-wasm-simple.cpp
    if [ $? -eq 0 ]; then
        echo "Compilation successful! Generated entropy-wasm-simple.wasm"
        exit 0
    fi
fi

# Try emcc if available
if command -v emcc &> /dev/null; then
    echo "Using emscripten..."
    emcc entropy-wasm-simple.cpp -O3 -s WASM=1 -s EXPORTED_FUNCTIONS='["_calculate_entropy","_get_pattern","_test_add"]' \
        -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' -o entropy-wasm-simple.js
    if [ $? -eq 0 ]; then
        echo "Compilation successful! Generated entropy-wasm-simple.js and entropy-wasm-simple.wasm"
        exit 0
    fi
fi

echo "Neither clang nor emcc found. Please install emscripten or clang with WebAssembly support."
echo "Alternatively, you can compile this online at:"
echo "- https://mbebenita.github.io/WasmExplorer/"
echo "- https://anonyco.github.io/WasmFiddlePlusPlus/"
echo ""
echo "Copy the contents of entropy-wasm-simple.cpp to one of these online compilers."