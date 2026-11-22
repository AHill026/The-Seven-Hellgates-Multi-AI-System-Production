/**
 * The Seven Hellgates - Blender 3D Studio & Model Inspector
 * Real-time 3D model viewer with Blender viewport shading modes (Rendered/PBR, Clay MatCap,
 * Wireframe topology, Solid), live polygon statistics, and one-click glTF/GLB asset export for Blender.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AzraelModel } from '../game/entities/AzraelModel';
import { EnemyInstance } from '../game/entities/EnemyModels';
import { BossInstance } from '../game/entities/BossModels';
import { MemoryFragment } from '../game/entities/MemoryFragment';
import {
  Box,
  Download,
  Grid,
  Sun,
  Eye,
  Layers,
  RotateCw,
  X,
  Sparkles,
  CheckCircle2,
  Info,
  Sliders,
  ChevronDown,
} from 'lucide-react';

export type ShadingMode = 'rendered' | 'clay' | 'wireframe' | 'solid';

export type ModelTarget =
  | 'azrael'
  | 'hollow_king'
  | 'maw_of_endless_hunger'
  | 'gilded_tyrant'
  | 'red_calamity'
  | 'saint_of_ash'
  | 'butcher_of_ruin'
  | 'sovereign_of_desire'
  | 'hellspawn'
  | 'hellbrute'
  | 'shade'
  | 'memory_fragment';

interface ModelMeta {
  id: ModelTarget;
  name: string;
  category: string;
  description: string;
  defaultScale: number;
  cameraDistance: number;
}

const AVAILABLE_MODELS: ModelMeta[] = [
  {
    id: 'azrael',
    name: 'Azrael (The Protagonist)',
    category: 'Player Character',
    description: 'Blackened Damascus steel armor, layered cowl, spiked pauldrons, and runic Executioner Greatsword.',
    defaultScale: 1.0,
    cameraDistance: 4.8,
  },
  {
    id: 'hollow_king',
    name: 'Gate 1: The Hollow King',
    category: 'Limbo Sovereign',
    description: 'Skeletal monarch with fractured blackened armor, cyan soulfire, thorn crown, and Prison Seal Greatsword.',
    defaultScale: 0.85,
    cameraDistance: 6.2,
  },
  {
    id: 'maw_of_endless_hunger',
    name: 'Gate 2: The Maw of Endless Hunger',
    category: 'Gluttony Sovereign',
    description: 'Grotesque abomination with exposed vertical rib-maw, pulsing gullet, secondary shoulder jaw, and Bone Harvester Scythe.',
    defaultScale: 0.85,
    cameraDistance: 6.5,
  },
  {
    id: 'gilded_tyrant',
    name: 'Gate 3: The Gilded Tyrant',
    category: 'Greed Sovereign',
    description: 'Towering colossus in baroque gold plate armor, molten gold veins, imperial horned crown, and Sovereign War Hammer.',
    defaultScale: 0.82,
    cameraDistance: 6.5,
  },
  {
    id: 'red_calamity',
    name: 'Gate 4: The Red Calamity',
    category: 'Wrath Sovereign',
    description: 'Volcanic demonic warlord with glowing magma fissures, obsidian bull horns, and Colossal Hellfire Executioner Blade.',
    defaultScale: 0.82,
    cameraDistance: 6.5,
  },
  {
    id: 'saint_of_ash',
    name: 'Gate 5: The Saint of Ash',
    category: 'Heresy Sovereign',
    description: 'Fallen inquisitor in antique silver cuirass, downward thorn halo, four spectral ash wings, and Inverted Spire Staff.',
    defaultScale: 0.85,
    cameraDistance: 6.5,
  },
  {
    id: 'butcher_of_ruin',
    name: 'Gate 6: The Butcher of Ruin',
    category: 'Violence Sovereign',
    description: 'Heavy executioner in rusted spiked harness, barbed chains with dangling meat hooks, and Colossal Ruin Cleaver.',
    defaultScale: 0.85,
    cameraDistance: 6.5,
  },
  {
    id: 'sovereign_of_desire',
    name: 'Gate 7: The Sovereign of Desire',
    category: 'Desire Sovereign',
    description: 'Transcendent celestial monarch in segmented porcelain carapace, orbiting mantle plates, astrolabe halo, and Needle Blade.',
    defaultScale: 0.85,
    cameraDistance: 6.5,
  },
  {
    id: 'hellspawn',
    name: 'Hellspawn Demonic Scout',
    category: 'Enemy Minion',
    description: 'Feral bipedal demon with obsidian scythe claws, jagged bone horns, and burning crimson underbelly.',
    defaultScale: 1.1,
    cameraDistance: 4.2,
  },
  {
    id: 'hellbrute',
    name: 'Hellbrute Juggernaut',
    category: 'Heavy Demon',
    description: 'Heavy armored infernal tank demon wielding a spiked basalt club and lava-veined carapace.',
    defaultScale: 0.95,
    cameraDistance: 5.5,
  },
  {
    id: 'shade',
    name: 'Void Shade',
    category: 'Spectral Wraith',
    description: 'Floating hooded phantom woven from astral smoke and spectral soul-reaping scythe.',
    defaultScale: 1.0,
    cameraDistance: 4.5,
  },
  {
    id: 'memory_fragment',
    name: 'Memory Fragment Crystal',
    category: 'Celestial Soul Relic',
    description: 'Octahedral soul crystal with illuminated energy core and orbiting arcane rune ring.',
    defaultScale: 1.5,
    cameraDistance: 3.5,
  },
];

interface BlenderStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BlenderStudioModal: React.FC<BlenderStudioModalProps> = ({ isOpen, onClose }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState<ModelTarget>('azrael');
  const [shadingMode, setShadingMode] = useState<ShadingMode>('rendered');
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  const [showGrid, setShowGrid] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(2.2);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Mesh stats for Blender Viewport Statistics readout
  const [stats, setStats] = useState({
    vertices: 0,
    triangles: 0,
    meshes: 0,
    materials: 0,
  });

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const currentGroupRef = useRef<THREE.Group | null>(null);
  const previewCleanupRef = useRef<(() => void) | null>(null);
  const debugMaterialsRef = useRef<{
    clay: THREE.MeshStandardMaterial;
    wireframe: THREE.MeshBasicMaterial;
    solid: THREE.MeshLambertMaterial;
  } | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const animFrameRef = useRef<number>(0);
  const exportNoticeTimerRef = useRef<number | null>(null);

  // Orbit control state
  const isDraggingRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const orbitAngleRef = useRef({ theta: 0.4, phi: 1.25 });
  const orbitDistanceRef = useRef(4.8);

  // Selected metadata
  const currentMeta = useMemo(
    () => AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0],
    [selectedModel]
  );

  // Initialize Three.js viewport
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x18181b); // Blender dark workspace charcoal

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    orbitDistanceRef.current = currentMeta.cameraDistance;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Physical Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envRenderTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    const envTexture = envRenderTarget.texture;
    scene.environment = envTexture;
    roomEnv.dispose();

    // Blender 3D Floor Grid with XYZ axes
    const gridHelper = new THREE.GridHelper(10, 20, 0xef4444, 0x52525b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Blender 3-point Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, lightIntensity);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 1.2);
    rimLight.position.set(-6, 5, -6);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    const fillLight = new THREE.DirectionalLight(0xa78bfa, 0.6);
    fillLight.position.set(0, -4, 4);
    scene.add(fillLight);

    // Render loop
    let lastTime = performance.now();
    const animate = (now: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (autoRotate && !isDraggingRef.current) {
        orbitAngleRef.current.theta += delta * 0.45 * rotationSpeed;
      }

      // Compute camera position from spherical coords
      const theta = orbitAngleRef.current.theta;
      const phi = orbitAngleRef.current.phi;
      const dist = orbitDistanceRef.current;

      const cx = dist * Math.sin(phi) * Math.sin(theta);
      const cy = dist * Math.cos(phi) + 1.2;
      const cz = dist * Math.sin(phi) * Math.cos(theta);

      camera.position.set(cx, cy, cz);
      camera.lookAt(0, 1.1, 0);

      renderer.render(scene, camera);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      if (exportNoticeTimerRef.current !== null) {
        window.clearTimeout(exportNoticeTimerRef.current);
        exportNoticeTimerRef.current = null;
      }

      previewCleanupRef.current?.();
      previewCleanupRef.current = null;
      currentGroupRef.current = null;

      if (debugMaterialsRef.current) {
        debugMaterialsRef.current.clay.dispose();
        debugMaterialsRef.current.wireframe.dispose();
        debugMaterialsRef.current.solid.dispose();
        debugMaterialsRef.current = null;
      }

      scene.remove(gridHelper);
      gridHelper.geometry.dispose();
      (gridHelper.material as THREE.Material).dispose();
      gridHelperRef.current = null;

      scene.environment = null;
      envTexture.dispose();
      envRenderTarget.dispose();
      pmremGenerator.dispose();

      sceneRef.current = null;
      cameraRef.current = null;
      keyLightRef.current = null;
      rimLightRef.current = null;
      rendererRef.current = null;

      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen]);

  const getOrCreateDebugMaterials = () => {
    if (!debugMaterialsRef.current) {
      debugMaterialsRef.current = {
        clay: new THREE.MeshStandardMaterial({
          color: 0x9ca3af,
          roughness: 0.38,
          metalness: 0.05,
        }),
        wireframe: new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
        }),
        solid: new THREE.MeshLambertMaterial({
          color: 0x64748b,
        }),
      };
    }
    return debugMaterialsRef.current;
  };

  const disposeDetachedPreviewGroup = (group: THREE.Group, ownedDispose?: () => void) => {
    // Restore original materials first so debug shading materials are never disposed mid-session
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.userData.originalMaterial) {
          mesh.material = mesh.userData.originalMaterial;
          delete mesh.userData.originalMaterial;
        }
      }
    });

    if (ownedDispose) {
      ownedDispose();
      return;
    }

    const debugMats = new Set<THREE.Material>(
      debugMaterialsRef.current
        ? [
            debugMaterialsRef.current.clay,
            debugMaterialsRef.current.wireframe,
            debugMaterialsRef.current.solid,
          ]
        : []
    );
    const geoms = new Set<THREE.BufferGeometry>();
    const mats = new Set<THREE.Material>();
    const lights = new Set<THREE.Light>();

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) geoms.add(mesh.geometry);
        if (mesh.material) {
          const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          list.forEach((m) => {
            if (!debugMats.has(m)) mats.add(m);
          });
        }
      }
      if ((child as THREE.Light).isLight) {
        lights.add(child as THREE.Light);
      }
    });

    geoms.forEach((g) => g.dispose());
    // Dispose per-instance preview materials only; shared MaterialFactory textures are preserved.
    mats.forEach((m) => m.dispose());
    lights.forEach((l) => {
      l.parent?.remove(l);
      l.dispose();
    });
  };

  // Handle Model Loading & Geometry Analysis
  useEffect(() => {
    if (!isOpen || !sceneRef.current) return;
    const scene = sceneRef.current;

    // Dispose any previously mounted preview model cleanly
    previewCleanupRef.current?.();
    previewCleanupRef.current = null;
    if (currentGroupRef.current) {
      scene.remove(currentGroupRef.current);
      currentGroupRef.current = null;
    }

    let modelGroup: THREE.Group = new THREE.Group();
    let ownedDispose: (() => void) | undefined;

    if (selectedModel === 'azrael') {
      const azrael = new AzraelModel();
      modelGroup = azrael.group;
      ownedDispose = () => azrael.dispose();
    } else if (selectedModel === 'hollow_king') {
      const boss = new BossInstance(1);
      modelGroup = boss.group;
    } else if (selectedModel === 'maw_of_endless_hunger') {
      const boss = new BossInstance(2);
      modelGroup = boss.group;
    } else if (selectedModel === 'gilded_tyrant') {
      const boss = new BossInstance(3);
      modelGroup = boss.group;
    } else if (selectedModel === 'red_calamity') {
      const boss = new BossInstance(4);
      modelGroup = boss.group;
    } else if (selectedModel === 'saint_of_ash') {
      const boss = new BossInstance(5);
      modelGroup = boss.group;
    } else if (selectedModel === 'butcher_of_ruin') {
      const boss = new BossInstance(6);
      modelGroup = boss.group;
    } else if (selectedModel === 'sovereign_of_desire') {
      const boss = new BossInstance(7);
      modelGroup = boss.group;
    } else if (selectedModel === 'hellspawn') {
      const enemy = new EnemyInstance('hellspawn', new THREE.Vector3(0, 0, 0));
      modelGroup = enemy.group;
    } else if (selectedModel === 'hellbrute') {
      const enemy = new EnemyInstance('hellbrute', new THREE.Vector3(0, 0, 0));
      modelGroup = enemy.group;
    } else if (selectedModel === 'shade') {
      const enemy = new EnemyInstance('shade', new THREE.Vector3(0, 0, 0));
      modelGroup = enemy.group;
    } else if (selectedModel === 'memory_fragment') {
      const fragment = new MemoryFragment({
        id: 'inspect_crystal',
        title: 'Memory Fragment Crystal',
        text: 'Celestial soul relic.',
        position: new THREE.Vector3(0, 1.2, 0),
      });
      modelGroup = fragment.group;
      ownedDispose = () => fragment.dispose();
    }

    modelGroup.position.set(0, 0, 0);
    const s = currentMeta.defaultScale;
    modelGroup.scale.set(s, s, s);

    // Compute polygon & vertex statistics
    let totalVerts = 0;
    let totalTris = 0;
    let totalMeshes = 0;
    const materialSet = new Set<string>();

    modelGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        totalMeshes++;
        const geom = child.geometry;
        if (geom.attributes.position) {
          totalVerts += geom.attributes.position.count;
          if (geom.index) {
            totalTris += geom.index.count / 3;
          } else {
            totalTris += geom.attributes.position.count / 3;
          }
        }

        // Cache original material for shading mode switches
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }

        if (Array.isArray(child.material)) {
          child.material.forEach((m) => materialSet.add(m.uuid));
        } else if (child.material) {
          materialSet.add(child.material.uuid);
        }
      }
    });

    setStats({
      vertices: totalVerts,
      triangles: Math.round(totalTris),
      meshes: totalMeshes,
      materials: materialSet.size,
    });

    scene.add(modelGroup);
    currentGroupRef.current = modelGroup;
    orbitDistanceRef.current = currentMeta.cameraDistance;

    let previewDisposed = false;
    const cleanupPreview = () => {
      if (previewDisposed) return;
      previewDisposed = true;
      scene.remove(modelGroup);
      disposeDetachedPreviewGroup(modelGroup, ownedDispose);
      if (currentGroupRef.current === modelGroup) {
        currentGroupRef.current = null;
      }
    };
    previewCleanupRef.current = cleanupPreview;

    // Apply currently active shading mode
    applyShadingMode(shadingMode, modelGroup);

    return () => {
      cleanupPreview();
      if (previewCleanupRef.current === cleanupPreview) {
        previewCleanupRef.current = null;
      }
    };
  }, [isOpen, selectedModel, currentMeta]);

  // Apply Shading Mode (Rendered, Clay MatCap, Wireframe, Solid)
  const applyShadingMode = (mode: ShadingMode, group?: THREE.Group) => {
    const target = group || currentGroupRef.current;
    if (!target) return;
    const debugMats = mode === 'rendered' ? null : getOrCreateDebugMaterials();

    target.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }

        if (mode === 'rendered') {
          child.material = child.userData.originalMaterial;
        } else if (mode === 'clay' && debugMats) {
          child.material = debugMats.clay;
        } else if (mode === 'wireframe' && debugMats) {
          child.material = debugMats.wireframe;
        } else if (mode === 'solid' && debugMats) {
          child.material = debugMats.solid;
        }
      }
    });
  };

  const handleSelectShadingMode = (mode: ShadingMode) => {
    setShadingMode(mode);
    applyShadingMode(mode);
  };

  // Light & Grid helpers
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  useEffect(() => {
    if (keyLightRef.current) {
      keyLightRef.current.intensity = lightIntensity;
    }
  }, [lightIntensity]);

  // Turntable Drag Interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - mousePosRef.current.x;
    const dy = e.clientY - mousePosRef.current.y;
    mousePosRef.current = { x: e.clientX, y: e.clientY };

    orbitAngleRef.current.theta += dx * 0.01;
    orbitAngleRef.current.phi = Math.max(0.15, Math.min(Math.PI - 0.15, orbitAngleRef.current.phi - dy * 0.01));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    orbitDistanceRef.current = Math.max(1.8, Math.min(14.0, orbitDistanceRef.current + e.deltaY * 0.005));
  };

  // Touch Interactions
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - mousePosRef.current.x;
    const dy = e.touches[0].clientY - mousePosRef.current.y;
    mousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    orbitAngleRef.current.theta += dx * 0.01;
    orbitAngleRef.current.phi = Math.max(0.15, Math.min(Math.PI - 0.15, orbitAngleRef.current.phi - dy * 0.01));
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // One-Click Blender glTF/GLB Asset Exporter
  const handleExportGLTF = () => {
    if (!currentGroupRef.current) return;
    setIsExporting(true);

    // Ensure model has original materials before export so textures & normals export intact
    applyShadingMode('rendered');

    const exporter = new GLTFExporter();
    exporter.parse(
      currentGroupRef.current,
      (gltf) => {
        setIsExporting(false);
        const blob = new Blob([gltf as ArrayBuffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `${selectedModel}_blender_asset.glb`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setExportNotice(`✓ Exported ${currentMeta.name} as "${fileName}". Import directly in Blender via File > Import > glTF 2.0 (.glb/.gltf)`);
        if (exportNoticeTimerRef.current !== null) window.clearTimeout(exportNoticeTimerRef.current);
        exportNoticeTimerRef.current = window.setTimeout(() => {
          setExportNotice(null);
          exportNoticeTimerRef.current = null;
        }, 7000);

        // Reapply previous shading mode
        applyShadingMode(shadingMode);
      },
      (error) => {
        setIsExporting(false);
        console.error('GLTF Export Error:', error);
        setExportNotice('Failed to export glTF asset.');
        if (exportNoticeTimerRef.current !== null) window.clearTimeout(exportNoticeTimerRef.current);
        exportNoticeTimerRef.current = window.setTimeout(() => {
          setExportNotice(null);
          exportNoticeTimerRef.current = null;
        }, 4000);
        applyShadingMode(shadingMode);
      },
      { binary: true }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[92vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* --- HEADER: BLENDER STUDIO TOOLBAR --- */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 font-mono text-xs font-bold">
              <Box className="w-4 h-4 text-amber-400" />
              <span>BLENDER 3D STUDIO</span>
            </div>
            <span className="text-xs text-zinc-400 hidden sm:inline font-mono">
              Viewport Inspector & glTF Exporter
            </span>
          </div>

          {/* Shading Mode Segmented Buttons (Blender 4.x Style) */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => handleSelectShadingMode('rendered')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                shadingMode === 'rendered'
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Rendered (PBR Materials, Emission & Environment)"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Rendered</span>
            </button>

            <button
              onClick={() => handleSelectShadingMode('clay')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                shadingMode === 'clay'
                  ? 'bg-zinc-200 text-black font-bold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Material Preview (Studio Clay MatCap)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Clay MatCap</span>
            </button>

            <button
              onClick={() => handleSelectShadingMode('wireframe')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                shadingMode === 'wireframe'
                  ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Wireframe (Edge Topology & Polygons)"
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Wireframe</span>
            </button>

            <button
              onClick={() => handleSelectShadingMode('solid')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                shadingMode === 'solid'
                  ? 'bg-slate-300 text-black font-bold shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Solid (Flat Shading)"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Solid</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors"
            title="Close Inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- MAIN WORKSPACE: 3D VIEWPORT & SIDE PANEL --- */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* 3D Canvas Mount */}
          <div
            ref={mountRef}
            className="flex-1 h-full cursor-grab active:cursor-grabbing relative bg-zinc-950 touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Viewport Overlay Controls (Top-Left) */}
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 z-10 pointer-events-auto">
              {/* Model Dropdown */}
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ModelTarget)}
                  className="appearance-none bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 shadow-lg backdrop-blur-sm cursor-pointer outline-none focus:border-amber-500"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 shadow-md transition-all ${
                  showGrid
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
                title="Toggle Blender XYZ Grid"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>

              {/* Auto Rotate Toggle */}
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 shadow-md transition-all ${
                  autoRotate
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
                title="Toggle Turntable Rotation"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Spin</span>
              </button>
            </div>

            {/* Notification / Toast Banner */}
            {exportNotice && (
              <div className="absolute top-3 right-3 left-3 md:left-auto md:max-w-md bg-zinc-900/95 border border-emerald-500/50 rounded-xl p-3 shadow-2xl z-20 backdrop-blur-md animate-fadeIn flex items-start gap-2.5 text-emerald-400 text-xs leading-relaxed">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{exportNotice}</span>
              </div>
            )}

            {/* Viewport Instructions Overlay (Bottom-Center) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none px-3 py-1 rounded-full bg-zinc-900/75 border border-zinc-800 backdrop-blur-sm text-[10px] font-mono text-zinc-400 hidden sm:flex items-center gap-3">
              <span>Drag: Rotate 360°</span>
              <span>•</span>
              <span>Scroll / Pinch: Zoom</span>
            </div>
          </div>

          {/* Right Inspector Sidebar: Model Metadata, Statistics, & Export */}
          <div className="w-full md:w-80 bg-zinc-900/95 border-t md:border-t-0 md:border-l border-zinc-800 p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              {/* Active Model Description */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                  {currentMeta.category}
                </span>
                <h3 className="text-base font-bold text-zinc-100 font-gothic">{currentMeta.name}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                  {currentMeta.description}
                </p>
              </div>

              {/* Blender Viewport Statistics Readout */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Geometry Vertices:</span>
                  <span className="text-zinc-200 font-bold">{stats.vertices.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Triangles:</span>
                  <span className="text-amber-400 font-bold">{stats.triangles.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Mesh Sub-objects:</span>
                  <span className="text-zinc-200 font-bold">{stats.meshes}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">Material Slots:</span>
                  <span className="text-cyan-400 font-bold">{stats.materials}</span>
                </div>
              </div>

              {/* Viewport Tuners */}
              <div className="space-y-3 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/80">
                <div className="flex items-center justify-between text-xs text-zinc-300 font-mono">
                  <span>Light Rig Intensity:</span>
                  <span className="text-amber-400">{lightIntensity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={lightIntensity}
                  onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />

                <div className="flex items-center justify-between text-xs text-zinc-300 font-mono mt-2">
                  <span>Turntable Speed:</span>
                  <span className="text-cyan-400">{rotationSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={rotationSpeed}
                  onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                />
              </div>

              {/* Blender Workflow Tip */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-[11px] text-zinc-400">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Models export with complete vertex normals, PBR material parameters, and scene hierarchy preserved for direct rigging or sculpting in Blender.
                </span>
              </div>
            </div>

            {/* Export Button */}
            <div className="pt-4 border-t border-zinc-800">
              <button
                onClick={handleExportGLTF}
                disabled={isExporting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Packaging glTF...' : 'Export to Blender (.glb)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
