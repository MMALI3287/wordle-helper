# PowerShell WebAssembly compilation script for Windows
# High-performance entropy calculations

Write-Host "🔨 Compiling C++ entropy engine to WebAssembly..." -ForegroundColor Cyan

# Create output directory
New-Item -ItemType Directory -Force -Path "src\entropy-wasm\build" | Out-Null

# Check if emcc is available
if (-not (Get-Command emcc -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Emscripten not found! Installing via emsdk..." -ForegroundColor Red
    
    # Download and install emsdk
    if (-not (Test-Path "emsdk")) {
        Write-Host "📥 Downloading Emscripten SDK..." -ForegroundColor Yellow
        git clone https://github.com/emscripten-core/emsdk.git
    }
    
    cd emsdk
    .\emsdk.bat install latest
    .\emsdk.bat activate latest
    .\emsdk_env.bat
    cd ..
}

# Compile with Emscripten for maximum performance
$compileCommand = @"
emcc src/entropy-wasm/entropy.cpp `
  -o src/entropy-wasm/build/entropy.js `
  -s WASM=1 `
  -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall"]' `
  -s ALLOW_MEMORY_GROWTH=1 `
  -s MODULARIZE=1 `
  -s EXPORT_NAME='EntropyModule' `
  -s ENVIRONMENT='web,worker' `
  -s USE_ES6_IMPORT_META=0 `
  -s SINGLE_FILE=0 `
  -O3 `
  -s ASSERTIONS=0 `
  --bind `
  -s TOTAL_MEMORY=134217728 `
  -s MAXIMUM_MEMORY=536870912 `
  -s FAST_UNROLLED_LOOPS=1 `
  -s AGGRESSIVE_VARIABLE_ELIMINATION=1
"@

Write-Host "🚀 Starting compilation..." -ForegroundColor Yellow
Invoke-Expression $compileCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ WebAssembly compilation successful!" -ForegroundColor Green
    Write-Host "📁 Generated files:" -ForegroundColor Cyan
    Write-Host "   - src/entropy-wasm/build/entropy.js" -ForegroundColor White
    Write-Host "   - src/entropy-wasm/build/entropy.wasm" -ForegroundColor White
    
    # Copy files to public directory for web access
    Copy-Item "src\entropy-wasm\build\entropy.wasm" "public\" -Force
    Write-Host "   - public/entropy.wasm (copied for web access)" -ForegroundColor White
    
    Write-Host "🚀 Ready for ultra-fast entropy calculations!" -ForegroundColor Green
} else {
    Write-Host "❌ WebAssembly compilation failed!" -ForegroundColor Red
    Write-Host "💡 You may need to install Emscripten manually:" -ForegroundColor Yellow
    Write-Host "   https://emscripten.org/docs/getting_started/downloads.html" -ForegroundColor Yellow
    exit 1
}