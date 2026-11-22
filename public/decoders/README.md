# Self-Hosted 3D Asset Decoders (`three@0.187.0`)

These decoder binaries are copied directly from `node_modules/three/examples/jsm/libs/` so compressed `.glb` assets (Draco mesh compression and KTX2/Basis Universal GPU textures) load offline and without external CDN requests.

## Directory Layout

- `/decoders/draco/`
  - `draco_decoder.js`
  - `draco_decoder.wasm`
  - `draco_wasm_wrapper.js`
  - Source: `node_modules/three/examples/jsm/libs/draco/gltf/` (Google Draco, Apache-2.0)
- `/decoders/basis/`
  - `basis_transcoder.js`
  - `basis_transcoder.wasm`
  - `README.md`
  - Source: `node_modules/three/examples/jsm/libs/basis/` (Binomial Basis Universal, Apache-2.0)

## Runtime Resolution

`AzraelAssetLoader` resolves paths relative to `import.meta.env.BASE_URL` (default `/`):
- `dracoLoader.setDecoderPath('${base}decoders/draco/')`
- `ktx2Loader.setTranscoderPath('${base}decoders/basis/')`
