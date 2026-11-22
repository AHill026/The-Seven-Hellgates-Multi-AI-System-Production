import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Bone,
  Camera,
  ChevronDown,
  ChevronUp,
  Eye,
  Flame,
  Grid3x3,
  Layers,
  Pause,
  Play,
  RotateCw,
  Shield,
  Sparkles,
  Sun,
  Swords,
  Upload,
} from 'lucide-react';
import {
  AZRAEL_ACTION_CATALOG,
  AzraelActionId,
  AzraelAnimationEvent,
  AzraelAssetLoader,
  AzraelCameraPreset,
  AzraelCharacter,
  AzraelHoodState,
  AzraelLODLevel,
  AzraelLightingMode,
  AzraelMaterialInspectionMode,
  AzraelPerformanceStats,
  AzraelPlaybackInfo,
  AzraelTransformState,
  AzraelWeaponAttachment,
} from '../azrael';
import {
  UE5PostProcessingPipeline,
  detectSoftwareWebGL,
  getUE5RealmProfile,
} from '../game/vfx/UE5PostProcessing';

type DockTab = 'animation' | 'weapon_ik' | 'transform_look' | 'lod_sockets';

const CAMERA_PRESETS: Record<
  AzraelCameraPreset,
  { label: string; pos: [number, number, number]; target: [number, number, number] }
> = {
  three_quarter: {
    label: '3/4',
    pos: [2.15, 1.52, 2.75],
    target: [0, 1.15, 0],
  },
  front: {
    label: 'Front',
    pos: [0, 1.58, 2.05],
    target: [0, 1.48, 0],
  },
  side: {
    label: 'Side',
    pos: [2.95, 1.32, 0.1],
    target: [0, 1.15, 0],
  },
  rear: {
    label: 'Rear',
    pos: [-0.28, 1.44, -2.65],
    target: [0, 1.18, 0],
  },
};

const ACTION_IDS = Object.keys(AZRAEL_ACTION_CATALOG) as AzraelActionId[];

const INITIAL_STATS: AzraelPerformanceStats = {
  fps: 60,
  frameTimeMs: 16.6,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  textureMemoryMB: 0,
  activeBones: 72,
  animationMs: 0,
  postFxMs: 0,
  lodLevel: 'LOD0',
  pixelRatio: 1,
  isSoftwareGl: false,
  assetSource: 'Procedural Skinned Rig (72 Bones)',
};

const INITIAL_PLAYBACK: AzraelPlaybackInfo = {
  currentAction: 'IDLE',
  clipName: 'IDLE',
  currentTime: 0,
  duration: 2.6,
  normalizedTime: 0,
  paused: false,
  timeScale: 1.0,
  loop: true,
  availableClips: ACTION_IDS,
};

export const AzraelViewerSandbox: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Runtime refs
  const characterRef = useRef<AzraelCharacter | null>(null);
  const assetLoaderRef = useRef<AzraelAssetLoader | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const ue5PipelineRef = useRef<UE5PostProcessingPipeline | null>(null);
  const lightsRef = useRef<{
    hemi: THREE.HemisphereLight;
    key: THREE.DirectionalLight;
    fill: THREE.DirectionalLight;
    rim: THREE.DirectionalLight;
    grid: THREE.GridHelper;
    plinth: THREE.Mesh;
  } | null>(null);
  const cameraTweenRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(),
    target: new THREE.Vector3(),
  });

  // Interactive UI states
  const [dockOpen, setDockOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<DockTab>('animation');
  const [contextLost, setContextLost] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cameraPreset, setCameraPreset] = useState<AzraelCameraPreset>('three_quarter');
  const [lightingMode, setLightingMode] = useState<AzraelLightingMode>('studio_pbr');
  const [showGrid, setShowGrid] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showSockets, setShowSockets] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);

  const [activeAction, setActiveAction] = useState<AzraelActionId>('IDLE');
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1.0);
  const [loopMode, setLoopMode] = useState<'auto' | 'loop'>('auto');

  const [weaponAttach, setWeaponAttach] = useState<AzraelWeaponAttachment>('Weapon_R');
  const [ikManualMode, setIkManualMode] = useState(false);
  const [ikManualWeight, setIkManualWeight] = useState(1.0);
  const [ikEffectiveWeight, setIkEffectiveWeight] = useState(1.0);
  const [ikGripErrorMm, setIkGripErrorMm] = useState(0);

  const [transformState, setTransformState] = useState<AzraelTransformState>('DORMANT');
  const [hoodState, setHoodState] = useState<AzraelHoodState>('raised');
  const [cloakMotion, setCloakMotion] = useState(true);
  const [materialMode, setMaterialMode] = useState<AzraelMaterialInspectionMode>('standard');
  const [lodLevel, setLodLevel] = useState<AzraelLODLevel>('LOD0');

  const [stats, setStats] = useState<AzraelPerformanceStats>(INITIAL_STATS);
  const [playback, setPlayback] = useState<AzraelPlaybackInfo>(INITIAL_PLAYBACK);
  const [recentEvents, setRecentEvents] = useState<
    Array<{ seq: number; type: AzraelAnimationEvent['type']; action: AzraelActionId; norm: number }>
  >([]);
  const eventSeqRef = useRef(0);
  const eventUnsubRef = useRef<(() => void) | null>(null);

  const lightingModeRef = useRef<AzraelLightingMode>('studio_pbr');
  const autoRotateRef = useRef(false);

  useEffect(() => {
    lightingModeRef.current = lightingMode;
  }, [lightingMode]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const applyLightingSetup = useCallback((mode: AzraelLightingMode) => {
    const scene = sceneRef.current;
    const lights = lightsRef.current;
    if (!scene || !lights) return;

    if (mode === 'studio_pbr') {
      scene.background = new THREE.Color(0x0b0d14);
      scene.environmentIntensity = 0.78;
      lights.hemi.color.setHex(0xdce4f0);
      lights.hemi.groundColor.setHex(0x1a1d26);
      lights.hemi.intensity = 0.52;

      lights.key.color.setHex(0xfff5e8);
      lights.key.intensity = 2.15;
      lights.key.position.set(2.8, 4.4, 3.2);

      lights.fill.color.setHex(0xb8d4ff);
      lights.fill.intensity = 0.95;

      lights.rim.color.setHex(0x93c5fd);
      lights.rim.intensity = 1.45;
    } else {
      const profile = getUE5RealmProfile(1);
      scene.background = new THREE.Color(0x05070e);
      scene.environmentIntensity = profile.envIntensity;
      lights.hemi.color.setHex(profile.hemiSky);
      lights.hemi.groundColor.setHex(profile.hemiGround);
      lights.hemi.intensity = profile.hemiIntensity;

      lights.key.color.setHex(profile.keyColor);
      lights.key.intensity = profile.keyIntensity;
      lights.key.position.set(3.2, 4.8, 2.4);

      lights.fill.color.setHex(profile.shadowTint);
      lights.fill.intensity = 0.55;

      lights.rim.color.setHex(profile.rimColor);
      lights.rim.intensity = profile.rimIntensity;

      ue5PipelineRef.current?.applyRealmProfile(1);
      ue5PipelineRef.current?.applyPreset('ultra');
    }
  }, []);

  // Initialize isolated Three.js stage
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch (err) {
      setWebglError(err instanceof Error ? err.message : 'Unable to initialize WebGL2 context.');
      return;
    }

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const pixelRatio = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0d14);
    sceneRef.current = scene;

    // PMREM Studio IBL via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.78;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    camera.position.set(...CAMERA_PRESETS.three_quarter.pos);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = 1.0;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(...CAMERA_PRESETS.three_quarter.target);
    controls.update();
    controlsRef.current = controls;

    // Three-point Studio Lighting + Ground Plinth
    const hemi = new THREE.HemisphereLight(0xdce4f0, 0x1a1d26, 0.52);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff5e8, 2.15);
    key.position.set(2.8, 4.4, 3.2);
    key.castShadow = !isSoftwareGl;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 14;
    key.shadow.camera.left = -2.4;
    key.shadow.camera.right = 2.4;
    key.shadow.camera.top = 2.8;
    key.shadow.camera.bottom = -1.2;
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.02;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xb8d4ff, 0.95);
    fill.position.set(-3.2, 2.2, 2.4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x93c5fd, 1.45);
    rim.position.set(-1.5, 3.4, -3.5);
    scene.add(rim);

    const grid = new THREE.GridHelper(10, 20, 0x334155, 0x181c26);
    grid.position.y = 0.002;
    scene.add(grid);

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.25, 0.05, 48),
      new THREE.MeshStandardMaterial({
        color: 0x11141d,
        metalness: 0.45,
        roughness: 0.65,
      })
    );
    plinth.position.y = -0.025;
    plinth.receiveShadow = true;
    scene.add(plinth);

    lightsRef.current = { hemi, key, fill, rim, grid, plinth };

    // Optional Game-Matched UE5 pipeline
    const ue5Pipeline = new UE5PostProcessingPipeline(
      renderer,
      scene,
      camera,
      width,
      height,
      isSoftwareGl
    );
    ue5PipelineRef.current = ue5Pipeline;

    const attachEventSubscription = (char: AzraelCharacter) => {
      eventUnsubRef.current?.();
      eventUnsubRef.current = char.onAnimationEvent((evt) => {
        eventSeqRef.current += 1;
        const entry = {
          seq: eventSeqRef.current,
          type: evt.type,
          action: evt.action,
          norm: evt.normalizedTime,
        };
        setRecentEvents((prev) => [entry, ...prev].slice(0, 5));
      });
    };

    // Load initial procedural skinned mannequin
    const assetLoader = new AzraelAssetLoader(renderer);
    assetLoaderRef.current = assetLoader;
    const initialAsset = assetLoader.loadProceduralPlaceholder();
    const character = new AzraelCharacter(initialAsset);
    scene.add(character.root);
    character.attachSkeletonHelper(scene, false);
    attachEventSubscription(character);
    characterRef.current = character;

    applyLightingSetup('studio_pbr');

    const clock = new THREE.Clock();
    let disposed = false;
    let rafId = 0;
    let timerId = 0;
    let hudAccum = 0;
    let lastPostFxMs = 0;

    const afterDraw = (cb: () => void) => {
      timerId = window.setTimeout(() => {
        if (!disposed) rafId = window.requestAnimationFrame(cb);
      }, 32);
    };

    const tick = () => {
      if (disposed) return;

      const delta = Math.min(0.05, clock.getDelta());
      const elapsed = clock.elapsedTime;

      // Camera preset tween
      if (cameraTweenRef.current.active) {
        const lerpAlpha = Math.min(1, delta * 7.5);
        camera.position.lerp(cameraTweenRef.current.pos, lerpAlpha);
        controls.target.lerp(cameraTweenRef.current.target, lerpAlpha);
        if (
          camera.position.distanceTo(cameraTweenRef.current.pos) < 0.015 &&
          controls.target.distanceTo(cameraTweenRef.current.target) < 0.015
        ) {
          camera.position.copy(cameraTweenRef.current.pos);
          controls.target.copy(cameraTweenRef.current.target);
          cameraTweenRef.current.active = false;
        }
      }

      controls.update();

      const activeChar = characterRef.current;
      if (activeChar) {
        if (autoRotateRef.current) {
          activeChar.root.rotation.y += delta * 0.55;
        }
        activeChar.update(delta, elapsed, lastPostFxMs);
      }

      // Render via Studio PBR or Game-Matched UE5
      let postFxMs = 0;
      const useUE5 =
        lightingModeRef.current === 'game_ue5' && ue5Pipeline.shouldUseComposer();

      if (useUE5) {
        const postStart = performance.now();
        const isMajor =
          activeChar?.getTransformationState() === 'MAJOR_TRANSFORMATION';
        ue5Pipeline.update(delta, elapsed, isMajor);
        ue5Pipeline.composer.render();
        postFxMs = performance.now() - postStart;
      } else {
        renderer.render(scene, camera);
      }
      lastPostFxMs = postFxMs;

      hudAccum += delta;
      if (hudAccum >= 0.12) {
        hudAccum = 0;
        if (activeChar) {
          setStats(
            activeChar.getPerformanceStats(renderer, scene, isSoftwareGl, postFxMs)
          );
          setPlayback(activeChar.getPlaybackInfo());
          setIkEffectiveWeight(
            Number(activeChar.getEffectiveOffhandIKWeight().toFixed(2))
          );
          setIkGripErrorMm(
            Math.round(activeChar.getOffhandGripErrorMeters() * 1000)
          );
        }
      }

      if (isSoftwareGl) afterDraw(tick);
      else rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      ue5Pipeline.resize(w, h, renderer.getPixelRatio());
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);

      eventUnsubRef.current?.();
      eventUnsubRef.current = null;
      characterRef.current?.dispose(scene);
      characterRef.current = null;
      assetLoader.dispose();
      ue5Pipeline.bloomPass.dispose();
      ue5Pipeline.filmicPass.dispose();
      ue5Pipeline.outputPass.dispose();
      ue5Pipeline.fxaaPass.dispose();
      ue5Pipeline.renderPass.dispose();
      ue5Pipeline.dispose();
      controls.dispose();
      scene.environment = null;
      envTarget.dispose();
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      plinth.geometry.dispose();
      (plinth.material as THREE.Material).dispose();
      renderer.dispose();
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
  }, [applyLightingSetup]);

  // Camera cancel tween on manual drag
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cancelTween = () => {
      cameraTweenRef.current.active = false;
    };
    controls.addEventListener('start', cancelTween);
    return () => {
      controls.removeEventListener('start', cancelTween);
    };
  }, []);

  // Sync handlers
  const handleSelectCameraPreset = (preset: AzraelCameraPreset) => {
    setCameraPreset(preset);
    const cfg = CAMERA_PRESETS[preset];
    cameraTweenRef.current.pos.set(...cfg.pos);
    cameraTweenRef.current.target.set(...cfg.target);
    cameraTweenRef.current.active = true;
  };

  const handleToggleLighting = (mode: AzraelLightingMode) => {
    setLightingMode(mode);
    applyLightingSetup(mode);
  };

  const handleToggleGrid = () => {
    const next = !showGrid;
    setShowGrid(next);
    if (lightsRef.current) lightsRef.current.grid.visible = next;
  };

  const handleToggleSkeleton = () => {
    const next = !showSkeleton;
    setShowSkeleton(next);
    if (characterRef.current && sceneRef.current) {
      characterRef.current.attachSkeletonHelper(sceneRef.current, next);
    }
  };

  const handleToggleSockets = () => {
    const next = !showSockets;
    setShowSockets(next);
    characterRef.current?.setSocketMarkersVisible(next);
  };

  const handleSelectAction = (action: AzraelActionId) => {
    setActiveAction(action);
    characterRef.current?.playAction(action, { forceRestart: true });
    if (paused) {
      setPaused(false);
      characterRef.current?.setAnimationPaused(false);
    }
  };

  const handleTogglePause = () => {
    const next = !paused;
    setPaused(next);
    characterRef.current?.setAnimationPaused(next);
  };

  const handleTimeScaleChange = (val: number) => {
    setTimeScale(val);
    characterRef.current?.setAnimationSpeed(val);
  };

  const handleLoopModeChange = (mode: 'auto' | 'loop') => {
    setLoopMode(mode);
    characterRef.current?.setAnimationLoopMode(mode === 'loop' ? true : null);
  };

  const handleScrub = (normalized: number) => {
    if (!paused) {
      setPaused(true);
      characterRef.current?.setAnimationPaused(true);
    }
    characterRef.current?.scrubAnimation(normalized);
  };

  const handleWeaponAttach = (target: AzraelWeaponAttachment) => {
    setWeaponAttach(target);
    characterRef.current?.setWeaponAttachment(target);
  };

  const handleIkModeChange = (manual: boolean) => {
    setIkManualMode(manual);
    characterRef.current?.setOffhandIKWeight(manual ? ikManualWeight : null);
  };

  const handleIkWeightChange = (w: number) => {
    setIkManualWeight(w);
    if (ikManualMode) {
      characterRef.current?.setOffhandIKWeight(w);
    }
  };

  const handleTransformChange = (state: AzraelTransformState) => {
    setTransformState(state);
    characterRef.current?.setTransformationState(state);
  };

  const handleHoodChange = (state: AzraelHoodState) => {
    setHoodState(state);
    characterRef.current?.setHoodState(state);
  };

  const handleCloakMotionChange = (enabled: boolean) => {
    setCloakMotion(enabled);
    characterRef.current?.setCloakMotionEnabled(enabled);
  };

  const handleMaterialModeChange = (mode: AzraelMaterialInspectionMode) => {
    setMaterialMode(mode);
    characterRef.current?.setMaterialInspectionMode(mode);
  };

  const handleLODChange = (lod: AzraelLODLevel) => {
    setLodLevel(lod);
    characterRef.current?.setLOD(lod);
  };

  const swapCharacterAsset = useCallback(
    (newAssetLoader: () => Promise<ReturnType<AzraelAssetLoader['loadProceduralPlaceholder']>>) => {
      const scene = sceneRef.current;
      if (!scene) return;
      setLoadError(null);

      newAssetLoader()
        .then((newAsset) => {
          if (characterRef.current) {
            eventUnsubRef.current?.();
            scene.remove(characterRef.current.root);
            characterRef.current.dispose(scene);
          }

          const nextChar = new AzraelCharacter(newAsset);
          scene.add(nextChar.root);
          nextChar.attachSkeletonHelper(scene, showSkeleton);
          nextChar.setSocketMarkersVisible(showSockets);
          nextChar.setWeaponAttachment(weaponAttach);
          nextChar.setTransformationState(transformState);
          nextChar.setHoodState(hoodState);
          nextChar.setCloakMotionEnabled(cloakMotion);
          nextChar.setMaterialInspectionMode(materialMode);
          nextChar.setLOD(lodLevel);
          nextChar.setOffhandIKWeight(ikManualMode ? ikManualWeight : null);
          nextChar.playAction(activeAction);
          eventUnsubRef.current = nextChar.onAnimationEvent((evt) => {
            eventSeqRef.current += 1;
            const entry = {
              seq: eventSeqRef.current,
              type: evt.type,
              action: evt.action,
              norm: evt.normalizedTime,
            };
            setRecentEvents((prev) => [entry, ...prev].slice(0, 5));
          });
          characterRef.current = nextChar;
        })
        .catch((err) => {
          setLoadError(err instanceof Error ? err.message : 'Failed to parse GLB asset.');
        });
    },
    [
      activeAction,
      cloakMotion,
      hoodState,
      ikManualMode,
      ikManualWeight,
      lodLevel,
      materialMode,
      showSkeleton,
      showSockets,
      transformState,
      weaponAttach,
    ]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !assetLoaderRef.current) return;
    const loader = assetLoaderRef.current;
    swapCharacterAsset(() => loader.loadFromFile(file));
    e.target.value = '';
  };

  const handleResetProcedural = () => {
    if (!assetLoaderRef.current) return;
    const loader = assetLoaderRef.current;
    swapCharacterAsset(async () => loader.loadProceduralPlaceholder());
  };

  return (
    <div className="relative w-screen h-screen bg-[#050508] text-slate-100 overflow-hidden select-none">
      {/* 100% Fullscreen Isolated 3D Viewport */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Graceful WebGL / Context Fallback */}
      {(webglError || contextLost) && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#050508]/95 p-6">
          <div className="max-w-md border border-white/15 bg-[#0B0D14] p-6 rounded-lg text-center space-y-2">
            <h2 className="font-gothic text-lg text-amber-400 tracking-wide">
              {contextLost ? 'WebGL Context Interrupted' : 'WebGL Unavailable'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {webglError ??
                'The graphics context was temporarily lost. Waiting for automatic browser restoration.'}
            </p>
          </div>
        </div>
      )}

      {/* Hidden File Input for Artist GLB Inspection */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top-Left Identity & Live Performance Telemetry */}
      <div className="absolute top-3 left-3 z-10 w-[290px] sm:w-[325px] bg-[#0B0D14]/90 border border-white/12 rounded-md p-3 pointer-events-auto">
        <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/10">
          <div>
            <h1 className="font-gothic text-xs sm:text-sm font-bold tracking-[0.14em] text-amber-400">
              AZRAEL // SANDBOX
            </h1>
            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
              {stats.assetSource}
            </p>
          </div>
          <span className="font-mono text-[10px] text-sky-300 border border-sky-400/25 bg-sky-950/40 px-1.5 py-0.5 rounded">
            {stats.lodLevel}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 pt-2 font-mono text-[11px] tabular-nums">
          <div>
            <div className="text-[9px] uppercase text-slate-500">FPS / ms</div>
            <div className="text-slate-100">
              {stats.fps} <span className="text-slate-400">/ {stats.frameTimeMs}</span>
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-slate-500">Draws</div>
            <div className="text-slate-100">{stats.drawCalls}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-slate-500">Triangles</div>
            <div className="text-slate-100">{stats.triangles.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-slate-500">Bones</div>
            <div className="text-slate-100">{stats.activeBones}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-slate-500">Tex MB</div>
            <div className="text-slate-100">{stats.textureMemoryMB.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-slate-500">Anim / FX ms</div>
            <div className="text-slate-100">
              {stats.animationMs.toFixed(2)} <span className="text-slate-400">/ {stats.postFxMs.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="mt-2 text-[11px] text-rose-300 bg-rose-950/50 border border-rose-500/30 rounded px-2 py-1">
            {loadError}
          </div>
        )}
      </div>

      {/* Top-Right Camera, Lighting & Debug Quick Bar */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex flex-wrap items-center justify-end gap-1.5 bg-[#0B0D14]/90 border border-white/12 rounded-md p-1.5">
          <span className="flex items-center gap-1 px-1.5 text-[10px] uppercase tracking-wider text-slate-400">
            <Camera className="w-3 h-3" /> Cam
          </span>
          {(Object.keys(CAMERA_PRESETS) as AzraelCameraPreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleSelectCameraPreset(preset)}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                cameraPreset === preset
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  : 'text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              {CAMERA_PRESETS[preset].label}
            </button>
          ))}

          <div className="w-px h-4 bg-white/10 mx-0.5" />

          <button
            type="button"
            onClick={() =>
              handleToggleLighting(
                lightingMode === 'studio_pbr' ? 'game_ue5' : 'studio_pbr'
              )
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
              lightingMode === 'game_ue5'
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                : 'bg-white/5 text-slate-200 border-white/15 hover:bg-white/10'
            }`}
            title="Switch between Neutral Studio PBR and Game-Matched UE5 Lighting"
          >
            <Sun className="w-3 h-3" />
            {lightingMode === 'studio_pbr' ? 'Studio PBR' : 'UE5 Game'}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 bg-[#0B0D14]/90 border border-white/12 rounded-md p-1.5">
          <button
            type="button"
            onClick={handleToggleGrid}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded border ${
              showGrid
                ? 'bg-white/10 text-white border-white/25'
                : 'text-slate-400 border-transparent hover:bg-white/5'
            }`}
          >
            <Grid3x3 className="w-3 h-3" /> Grid
          </button>
          <button
            type="button"
            onClick={handleToggleSkeleton}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded border ${
              showSkeleton
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                : 'text-slate-400 border-transparent hover:bg-white/5'
            }`}
          >
            <Bone className="w-3 h-3" /> Bones
          </button>
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded border ${
              autoRotate
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                : 'text-slate-400 border-transparent hover:bg-white/5'
            }`}
          >
            <RotateCw className="w-3 h-3" /> Rotate
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            <Upload className="w-3 h-3" /> Load GLB
          </button>
        </div>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
        <div className="w-full max-w-5xl bg-[#0B0D14]/92 border-t border-x border-white/12 rounded-t-lg pointer-events-auto">
          {/* Dock Header & Tabs */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 gap-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('animation');
                  setDockOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  activeTab === 'animation'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/35'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Play className="w-3.5 h-3.5" /> Animation
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('weapon_ik');
                  setDockOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  activeTab === 'weapon_ik'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/35'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Swords className="w-3.5 h-3.5" /> Weapon & IK
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('transform_look');
                  setDockOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  activeTab === 'transform_look'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/35'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Flame className="w-3.5 h-3.5" /> Transform & Look
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('lod_sockets');
                  setDockOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${
                  activeTab === 'lod_sockets'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/35'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> LOD & Sockets
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDockOpen((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white border border-white/10 rounded"
            >
              {dockOpen ? (
                <>
                  Hide <ChevronDown className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Controls <ChevronUp className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Dock Body */}
          {dockOpen && (
            <div className="p-3 space-y-3 max-h-[34vh] overflow-y-auto">
              {activeTab === 'animation' && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {ACTION_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSelectAction(id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                          activeAction === id
                            ? 'bg-amber-500/20 text-amber-200 border-amber-400/50'
                            : 'bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/[0.07]'
                        }`}
                      >
                        {AZRAEL_ACTION_CATALOG[id].label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleTogglePause}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-xs font-medium text-white"
                    >
                      {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      {paused ? 'Resume' : 'Pause'}
                    </button>

                    <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums w-24">
                        {playback.currentTime.toFixed(2)}s / {playback.duration.toFixed(2)}s
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.005}
                        value={playback.normalizedTime}
                        onChange={(e) => handleScrub(parseFloat(e.target.value))}
                        className="flex-1 accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                        {timeScale.toFixed(2)}x
                      </span>
                      <input
                        type="range"
                        min={0.25}
                        max={2.0}
                        step={0.05}
                        value={timeScale}
                        onChange={(e) => handleTimeScaleChange(parseFloat(e.target.value))}
                        className="w-24 accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-1 border border-white/10 rounded p-0.5">
                      <button
                        type="button"
                        onClick={() => handleLoopModeChange('auto')}
                        className={`px-2 py-0.5 text-[11px] rounded ${
                          loopMode === 'auto'
                            ? 'bg-white/15 text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        Auto Loop
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoopModeChange('loop')}
                        className={`px-2 py-0.5 text-[11px] rounded ${
                          loopMode === 'loop'
                            ? 'bg-white/15 text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        Force Loop
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-[10px] font-mono overflow-x-auto">
                    <span className="uppercase tracking-wider text-slate-500 shrink-0">
                      Anim Events:
                    </span>
                    {recentEvents.length === 0 ? (
                      <span className="text-slate-500">Listening for clip markers...</span>
                    ) : (
                      recentEvents.map((e) => (
                        <span
                          key={e.seq}
                          className="shrink-0 px-1.5 py-0.5 rounded bg-sky-950/50 border border-sky-500/25 text-sky-200"
                        >
                          {e.type} @ {(e.norm * 100).toFixed(0)}%
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'weapon_ik' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400">
                      Greatsword Socket Attachment
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleWeaponAttach('Weapon_R')}
                        className={`flex-1 py-1.5 px-3 rounded text-xs font-medium border ${
                          weaponAttach === 'Weapon_R'
                            ? 'bg-amber-500/20 text-amber-200 border-amber-400/50'
                            : 'bg-white/[0.03] text-slate-300 border-white/10'
                        }`}
                      >
                        Weapon_R (In Hand)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWeaponAttach('Weapon_Back')}
                        className={`flex-1 py-1.5 px-3 rounded text-xs font-medium border ${
                          weaponAttach === 'Weapon_Back'
                            ? 'bg-amber-500/20 text-amber-200 border-amber-400/50'
                            : 'bg-white/[0.03] text-slate-300 border-white/10'
                        }`}
                      >
                        Weapon_Back (Sheathed)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400">
                        Two-Bone Off-Hand IK (Weapon_OffhandGrip)
                      </span>
                      <span className="font-mono text-[11px] text-sky-300 tabular-nums">
                        Weight {Math.round(ikEffectiveWeight * 100)}% · Err {ikGripErrorMm}mm
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleIkModeChange(false)}
                        className={`px-2.5 py-1 rounded text-xs border ${
                          !ikManualMode
                            ? 'bg-sky-500/20 text-sky-200 border-sky-400/45'
                            : 'bg-white/[0.03] text-slate-300 border-white/10'
                        }`}
                      >
                        Auto
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIkModeChange(true)}
                        className={`px-2.5 py-1 rounded text-xs border ${
                          ikManualMode
                            ? 'bg-amber-500/20 text-amber-200 border-amber-400/45'
                            : 'bg-white/[0.03] text-slate-300 border-white/10'
                        }`}
                      >
                        Manual
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.02}
                        disabled={!ikManualMode}
                        value={ikManualMode ? ikManualWeight : ikEffectiveWeight}
                        onChange={(e) => handleIkWeightChange(parseFloat(e.target.value))}
                        className="flex-1 accent-amber-500 disabled:opacity-40 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'transform_look' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                      <Sparkles className="w-3 h-3" /> Transformation State
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {(
                        [
                          { id: 'DORMANT', label: 'Dormant' },
                          { id: 'AWAKENED', label: 'Awakened' },
                          { id: 'MAJOR_TRANSFORMATION', label: 'Major Transformation' },
                        ] as const
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleTransformChange(t.id)}
                          className={`py-1.5 px-3 rounded text-xs font-medium text-left border ${
                            transformState === t.id
                              ? 'bg-amber-500/20 text-amber-200 border-amber-400/50'
                              : 'bg-white/[0.03] text-slate-300 border-white/10'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                      <Shield className="w-3 h-3" /> Hood & Cloak Silhouette
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleHoodChange('raised')}
                        className={`flex-1 py-1.5 px-2.5 rounded text-xs border ${
                          hoodState === 'raised'
                            ? 'bg-sky-500/20 text-sky-200 border-sky-400/45'
                            : 'bg-white/[0.03] text-slate-300 border-white/10'
                        }`}
                      >
                        Hood Raised
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHoodChange('lowered')}
                        className={`flex-1 py-1.5 px-2.5 rounded text-xs border ${
                          hoodState === 'lowered'
                            ? 'bg-sky-500/20 text-sky-200 border-sky-400/45'
                            : 'bg-white/[0.03] text-slate-300 border-white/10'
                        }`}
                      >
                        Hood Lowered
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCloakMotionChange(!cloakMotion)}
                      className={`w-full py-1.5 px-3 rounded text-xs border ${
                        cloakMotion
                          ? 'bg-white/10 text-white border-white/25'
                          : 'bg-white/[0.03] text-slate-400 border-white/10'
                      }`}
                    >
                      Cloak Secondary Motion: {cloakMotion ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
                      <Eye className="w-3 h-3" /> Material & Emissive Inspection
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {(
                        [
                          { id: 'standard', label: 'Standard PBR' },
                          { id: 'emissive_only', label: 'Emissive Isolation' },
                          { id: 'clay_roughness', label: 'Clay / Topology' },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleMaterialModeChange(m.id)}
                          className={`py-1.5 px-3 rounded text-xs font-medium text-left border ${
                            materialMode === m.id
                              ? 'bg-sky-500/20 text-sky-200 border-sky-400/45'
                              : 'bg-white/[0.03] text-slate-300 border-white/10'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'lod_sockets' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400">
                      Active LOD Tier (Mobile / Safari Budget Check)
                    </div>
                    <div className="flex gap-2">
                      {(['LOD0', 'LOD1', 'LOD2'] as AzraelLODLevel[]).map((lod) => (
                        <button
                          key={lod}
                          type="button"
                          onClick={() => handleLODChange(lod)}
                          className={`flex-1 py-1.5 px-3 rounded text-xs font-mono border ${
                            lodLevel === lod
                              ? 'bg-amber-500/20 text-amber-200 border-amber-400/50'
                              : 'bg-white/[0.03] text-slate-300 border-white/10'
                          }`}
                        >
                          {lod}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400">
                      Sockets & Rig Source
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleToggleSockets}
                        className={`flex-1 py-1.5 px-3 rounded text-xs border ${
                          showSockets
                            ? 'bg-sky-500/20 text-sky-200 border-sky-400/45'
                            : 'bg-white/[0.03] text-slate-300 border-white/10'
                        }`}
                      >
                        Socket Axes: {showSockets ? 'Visible' : 'Hidden'}
                      </button>
                      <button
                        type="button"
                        onClick={handleResetProcedural}
                        className="py-1.5 px-3 rounded text-xs border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                      >
                        Reset Placeholder Rig
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      Sockets: Weapon_R · Weapon_Back · Weapon_OffhandGrip · VFX_Chest · VFX_Aura
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AzraelViewerSandbox;
