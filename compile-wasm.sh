#!/bin/bash
# WebAssembly compilation script for high-performance entropy calculations

echo "🔨 Compiling C++ entropy engine to WebAssembly..."

# Create output directory
mkdir -p src/entropy-wasm/build

# Compile with Emscripten for maximum performance
emcc src/entropy-wasm/entropy.cpp \
  -o src/entropy-wasm/build/entropy.js \
  -s WASM=1 \
  -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME='EntropyModule' \
  -s ENVIRONMENT='web,worker' \
  -s USE_ES6_IMPORT_META=0 \
  -s SINGLE_FILE=0 \
  -O3 \
  -s ASSERTIONS=0 \
  --bind \
  -s TOTAL_MEMORY=128MB \
  -s MAXIMUM_MEMORY=512MB \
  -s FAST_UNROLLED_LOOPS=1 \
  -s AGGRESSIVE_VARIABLE_ELIMINATION=1

if [ $? -eq 0 ]; then
    echo "✅ WebAssembly compilation successful!"
    echo "📁 Generated files:"
    echo "   - src/entropy-wasm/build/entropy.js"
    echo "   - src/entropy-wasm/build/entropy.wasm"
    
    # Copy files to public directory for web access
    cp src/entropy-wasm/build/entropy.wasm public/
    echo "   - public/entropy.wasm (copied for web access)"
    
    echo "🚀 Ready for ultra-fast entropy calculations!"
else
    echo "❌ WebAssembly compilation failed!"
    exit 1
fi