# PowerShell script to compile C++ to WebAssembly
Write-Host "Compiling C++ to WebAssembly..."

# Try to use clang if available
$clangPath = Get-Command clang -ErrorAction SilentlyContinue
if ($clangPath) {
    Write-Host "Using local clang..."
    & clang++ --target=wasm32 -nostdlib -O3 "-Wl,--no-entry" "-Wl,--export-all-functions" -o entropy-wasm-simple.wasm entropy-wasm-simple.cpp
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Compilation successful! Generated entropy-wasm-simple.wasm" -ForegroundColor Green
        exit 0
    }
}

# Try emcc if available  
$emccPath = Get-Command emcc -ErrorAction SilentlyContinue
if ($emccPath) {
    Write-Host "Using emscripten..."
    & emcc entropy-wasm-simple.cpp -O3 -s WASM=1 -s "EXPORTED_FUNCTIONS=['_calculate_entropy','_get_pattern','_test_add']" -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall','cwrap']" -o entropy-wasm-simple.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Compilation successful! Generated entropy-wasm-simple.js and entropy-wasm-simple.wasm" -ForegroundColor Green
        exit 0
    }
}

Write-Host "Neither clang nor emcc found. Please install emscripten or clang with WebAssembly support." -ForegroundColor Red
Write-Host "Alternatively, you can compile this online at:" -ForegroundColor Yellow
Write-Host "- https://mbebenita.github.io/WasmExplorer/" -ForegroundColor Cyan
Write-Host "- https://anonyco.github.io/WasmFiddlePlusPlus/" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy the contents of entropy-wasm-simple.cpp to one of these online compilers." -ForegroundColor Yellow