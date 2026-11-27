# Native WASM runtime

These browser assets were built with Emscripten 7.0.0 from Zeal-NativeEmulator
revision `ee3c78c49c46300a57e4e169b32fed4a4d8516f4` on `feature/web-emulator`.
[Zeal-NativeEmulator source](https://github.com/Zeal8bit/Zeal-NativeEmulator/tree/ee3c78c49c46300a57e4e169b32fed4a4d8516f4)

Build from the matching Native source with:

```sh
meson setup build-wasm --cross-file frontend/wasm/wasm-cross.build -Dwasm_template=minimal -Denable_debugger=true
meson compile -C build-wasm
```

Copy `zeal.elf.js`, `zeal.elf.wasm`, and the JavaScript files under `libnative/` from the same build. Playground supplies its own HTML. For Zeal OS programs, zealos.img is the v0.8.0 emulator ROM distributed by the Web Emulator (zos-662687742.img, SHA-256 360c3e4ad5b152d75e1e9ea512c4f3e68bdb301cf9d9de8db87bdbc88a53f6a7). Standalone programs supply their own ROM.

SDL 3.4.2 is linked into the WASM binary. Its license is included alongside the runtime.
