@echo off
echo Compiling C++ entropy calculator to WebAssembly...

cd emsdk
call emsdk_env.bat
cd ..

echo Environment set up, now compiling...

emcc src/entropy-wasm/entropy.cpp ^
  -o public/entropy.js ^
  -s WASM=1 ^
  -s EXPORTED_RUNTIME_METHODS="[""cwrap"", ""ccall""]" ^
  -s ALLOW_MEMORY_GROWTH=1 ^
  -s MODULARIZE=1 ^
  -s EXPORT_NAME="EntropyModule" ^
  -s ENVIRONMENT="web,worker" ^
  -s USE_ES6_IMPORT_META=0 ^
  -s SINGLE_FILE=0 ^
  -O3 ^
  --bind

if %ERRORLEVEL% == 0 (
    echo ✅ WebAssembly compilation successful!
    echo Generated files:
    echo   - public/entropy.js
    echo   - public/entropy.wasm
    echo 🚀 Ready for ultra-fast C++ entropy calculations!
) else (
    echo ❌ WebAssembly compilation failed!
    exit /b 1
)