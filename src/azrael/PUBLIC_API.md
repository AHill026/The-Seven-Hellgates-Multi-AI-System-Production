# Azrael Character Runtime — Public API Specification

This document defines the encapsulated public runtime surface exported from `src/azrael/index.ts`. Future gameplay, combat, or cutscene adapters should interact exclusively through `IAzraelCharacter` / `AzraelCharacter` and `AzraelAssetLoader`, without reaching into internal sub-controllers (`animation`, `ik`, `weapon`, `effects`, `transformation`, `perfMonitor`).

---

## 1. Asset Loading & Lifecycle (`AzraelAssetLoader`)

| Method | Signature | Description |
| :--- | :--- | :--- |
| `constructor` | `(renderer?: THREE.WebGLRenderer)` | Configures `GLTFLoader` with self-hosted `DRACOLoader` (`/decoders/draco/`) and optional `KTX2Loader` (`/decoders/basis/`) if a renderer is provided. Zero external CDNs. |
| `getDecoderPaths` | `() => { draco: string; ktx2: string }` | Returns resolved local decoder base paths respecting Vite `BASE_URL`. |
| `loadProceduralPlaceholder` | `() => LoadedAzraelAsset` | Builds the 72-bone skinned mannequin rig with 13 clips, 5 sockets, and 3 LOD tiers (`LOD0`/`LOD1`/`LOD2`). |
| `loadFromUrl` | `(url: string, label?: string) => Promise<LoadedAzraelAsset>` | Loads and caches a GLB/glTF asset, cloning via `SkeletonUtils.clone` per instance. |
| `loadFromFile` | `(file: File) => Promise<LoadedAzraelAsset>` | Parses a user-supplied `.glb`/`.gltf` `File` for artist inspection in `/dev/azrael-viewer`. |
| `evictCache` | `(url?: string) => void` | Evicts a specific cached URL or clears the entire GLTF cache. |
| `dispose` | `() => void` | Disposes `DRACOLoader`, `KTX2Loader`, and clears cached entries. |

---

## 2. Character Facade (`IAzraelCharacter` / `AzraelCharacter`)

`AzraelCharacter` implements `IAzraelCharacter` (which extends `AzraelActionAdapter`).

### Core Properties
- `readonly root: THREE.Group` — Top-level scene-graph node to add into a `THREE.Scene`.
- `readonly isDisposed: boolean` — Guard flag flipped on `dispose()`. Calling `dispose()` multiple times is idempotent and safe; mutating methods become no-ops once disposed.

### Animation Playback & Blending
- `playAction(action: AzraelActionId, options?: { timeScale?: number; crossfade?: number; forceRestart?: boolean }): void`
  Crossfades or snaps (`crossfade: 0`) to a catalog action and updates the target auto-IK weight for that action (`snapIK` enabled on `crossfade === 0`).
- `performAction(action, options?)` — Compatibility alias of `playAction` defined on `AzraelActionAdapter`.
- `playClipByName(clipName: string): void` — Direct clip lookup by exact or case-insensitive name.
- `setAnimationSpeed(scale: number): void` — Adjusts `AnimationMixer` time scale (`0.1..2.5`).
- `setAnimationPaused(paused: boolean): void` — Pauses/resumes the active clip without discarding mixer state.
- `setAnimationLoopMode(loop: boolean | null): void` — Overrides catalog looping (`true` = `THREE.LoopRepeat`, `null` = restore catalog default).
- `scrubAnimation(normalizedTime: number): void` — Seeks normalized `[0..1]` time across the current clip (evaluated immediately via `mixer.update(0)`).
- `getPlaybackInfo(): AzraelPlaybackInfo` — Returns active action ID, clip name, current time, duration, normalized time, pause state, speed, loop state, and available clips.

### Animation Event Notifications (Placeholder Gameplay/VFX Hooks)
- `onAnimationEvent(listener: AzraelAnimationEventListener): () => void`
  Registers a listener for chronological normalized-time markers and returns an unsubscribe closure.
  Supported `AzraelAnimationEventType` values:
  - `ATTACK_IMPACT_WINDOW_START`
  - `ATTACK_IMPACT_WINDOW_END`
  - `WEAPON_SWING_VFX`
  - `FOOTSTEP`
  - `SWORD_IMPACT_SFX`
  - `FINISHER_TRANSITION`
  - `TRANSFORMATION_MILESTONE`

  **Zero-Allocation Contract**: `AzraelAnimationEventDispatcher` reuses a single pre-allocated scratch event object synchronously during listener dispatch. Listeners **must read required fields synchronously** inside the callback and **must not store the `event` reference** across frames.

### Weapon Sockets & Off-Hand Two-Bone IK
- `attachWeapon(): void` — Convenience helper attaching the greatsword to `Weapon_R`.
- `sheatheWeapon(): void` — Convenience helper attaching the greatsword to `Weapon_Back`.
- `setWeaponAttachment(attachment: 'Weapon_R' | 'Weapon_Back'): void` — Re-parents the weapon cleanly into the requested socket.
- `getWeaponAttachment(): AzraelWeaponAttachment` — Returns active socket attachment.
- `setOffhandIKWeight(weight: number | null): void` — Sets manual IK override (`0..1`) or `null` to follow action-catalog auto-weighting (`defaultOffhandIK`).
- `getEffectiveOffhandIKWeight(): number` — Returns the current smoothly blended IK weight (`0..1`).
- `getOffhandGripErrorMeters(): number` — Distance between `Hand_L` wrist and `Weapon_OffhandGrip` in meters.
- `getOffhandIKReachUtilization(): number` — Ratio of shoulder-to-grip distance over `l1 + l2` total arm length (`1.0` = full extension).

### Transformation, Hood, Cloak, LOD & Material Inspection
- `setTransformationState(state: 'DORMANT' | 'AWAKENED' | 'MAJOR_TRANSFORMATION'): void`
- `getTransformationState(): AzraelTransformState`
- `setHoodState(state: 'raised' | 'lowered'): void`
- `getHoodState(): AzraelHoodState`
- `setCloakMotionEnabled(enabled: boolean): void`
- `isCloakMotionEnabled(): boolean`
- `setLOD(lod: 'LOD0' | 'LOD1' | 'LOD2'): void`
- `getLOD(): AzraelLODLevel`
- `setMaterialInspectionMode(mode: 'standard' | 'emissive_only' | 'clay_roughness'): void`
- `getMaterialInspectionMode(): AzraelMaterialInspectionMode`

### Sandbox Diagnostics & Per-Frame Update
- `getAssetSourceLabel(): string`
- `getBoneNames(): string[]`
- `getSocketWorldPosition(socket: AzraelSocketName, out: THREE.Vector3): THREE.Vector3 | null`
- `attachSkeletonHelper(scene: THREE.Scene, visible: boolean): void`
- `setSocketMarkersVisible(visible: boolean): void`
- `getLastAnimationMs(): number`
- `getPerformanceStats(renderer: THREE.WebGLRenderer, scene: THREE.Scene, isSoftwareGl: boolean, postFxMs?: number): AzraelPerformanceStats`
- `update(delta: number, elapsed: number, postFxMs?: number): void`
  Advances animation mixer & animation event thresholds (`delta` clamped to `[0.0001, 0.05]`), updates transformation/hood/cloak secondary motion, solves analytical two-bone off-hand IK with clavicle assist and soft reach falloff, and records frame performance telemetry.

### Complete Disposal
- `dispose(scene?: THREE.Scene): void`
  Idempotent full teardown: detaches and disposes `SkeletonHelper` and socket `AxesHelper`s, detaches `root` from parent `Scene`, stops and uncaches all `AnimationAction`s / `AnimationClip`s / `root` from `AnimationMixer`, clears event listeners, detaches dynamic VFX socket meshes/particles, restores modified materials before disposing per-instance geometries, materials, textures, and skeleton bindings, and resets internal controller references. Does **not** touch shared scene environments, lights, grids, or post-processing pipelines owned by the caller.
