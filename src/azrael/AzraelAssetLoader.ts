import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  AzraelLODLevel,
  AzraelSocketName,
  LoadedAzraelAsset,
} from './types';
import { createProceduralAzraelAsset } from './ProceduralAzraelRig';

const SOCKET_NAMES: AzraelSocketName[] = [
  'Weapon_R',
  'Weapon_Back',
  'Weapon_OffhandGrip',
  'VFX_Chest',
  'VFX_Aura',
];

export class AzraelAssetLoader {
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader | null = null;
  private ktx2Loader: KTX2Loader | null = null;
  private gltfCache = new Map<string, GLTF>();

  constructor(renderer?: THREE.WebGLRenderer) {
    this.gltfLoader = new GLTFLoader();

    const baseUrl =
      (typeof import.meta !== 'undefined' &&
        (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL) ||
      '/';
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(`${normalizedBase}decoders/draco/`);
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    if (renderer) {
      this.ktx2Loader = new KTX2Loader();
      this.ktx2Loader.setTranscoderPath(`${normalizedBase}decoders/basis/`);
      this.ktx2Loader.detectSupport(renderer);
      this.gltfLoader.setKTX2Loader(this.ktx2Loader);
    }
  }

  public getDecoderPaths(): { draco: string; ktx2: string } {
    const baseUrl =
      (typeof import.meta !== 'undefined' &&
        (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL) ||
      '/';
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return {
      draco: `${normalizedBase}decoders/draco/`,
      ktx2: `${normalizedBase}decoders/basis/`,
    };
  }

  public loadProceduralPlaceholder(): LoadedAzraelAsset {
    return createProceduralAzraelAsset();
  }

  public async loadFromUrl(url: string, label?: string): Promise<LoadedAzraelAsset> {
    let gltf = this.gltfCache.get(url);
    if (!gltf) {
      gltf = await new Promise<GLTF>((resolve, reject) => {
        this.gltfLoader.load(url, resolve, undefined, reject);
      });
      this.gltfCache.set(url, gltf);
    }

    return this.buildAssetFromGLTF(gltf, label ?? url);
  }

  public async loadFromFile(file: File): Promise<LoadedAzraelAsset> {
    const buffer = await file.arrayBuffer();
    const gltf = await new Promise<GLTF>((resolve, reject) => {
      this.gltfLoader.parse(buffer, '', resolve, reject);
    });
    return this.buildAssetFromGLTF(gltf, file.name);
  }

  private buildAssetFromGLTF(gltf: GLTF, sourceLabel: string): LoadedAzraelAsset {
    // Use SkeletonUtils.clone so SkinnedMesh skeletons rebind cleanly to cloned bones
    const cloned = SkeletonUtils.clone(gltf.scene) as THREE.Group;
    const root = new THREE.Group();
    root.name = 'Azrael_GLB_Root';
    root.add(cloned);

    const skeletons: THREE.Skeleton[] = [];
    const boneSet = new Set<THREE.Bone>();
    const meshes: THREE.Mesh[] = [];
    const sockets: Partial<Record<AzraelSocketName, THREE.Object3D>> = {};
    const lodGroups: Record<AzraelLODLevel, THREE.Object3D[]> = {
      LOD0: [],
      LOD1: [],
      LOD2: [],
    };
    const chestRuneMaterials: THREE.MeshStandardMaterial[] = [];
    const eyeMaterials: THREE.MeshStandardMaterial[] = [];
    const bladeEmissiveMaterials: THREE.MeshStandardMaterial[] = [];
    const armorAccentMaterials: THREE.MeshStandardMaterial[] = [];

    let hoodGroup: THREE.Object3D | null = null;
    const cloakBones: THREE.Bone[] = [];

    cloned.traverse((obj) => {
      for (const sName of SOCKET_NAMES) {
        if (obj.name === sName || obj.name.endsWith(sName)) {
          sockets[sName] = obj;
        }
      }

      if (/hood/i.test(obj.name) && !hoodGroup) {
        hoodGroup = obj;
      }

      if ((obj as THREE.Bone).isBone) {
        const bone = obj as THREE.Bone;
        boneSet.add(bone);
        if (/cloak/i.test(bone.name)) {
          cloakBones.push(bone);
        }
      }

      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        meshes.push(mesh);

        if (/lod0/i.test(mesh.name)) lodGroups.LOD0.push(mesh);
        else if (/lod1/i.test(mesh.name)) lodGroups.LOD1.push(mesh);
        else if (/lod2/i.test(mesh.name)) lodGroups.LOD2.push(mesh);

        if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) {
          const skel = (mesh as THREE.SkinnedMesh).skeleton;
          if (skel && !skeletons.includes(skel)) {
            skeletons.push(skel);
            skel.bones.forEach((b) => boneSet.add(b));
          }
        }

        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          if (!(mat instanceof THREE.MeshStandardMaterial)) return;
          if (/rune|chest/i.test(mat.name)) chestRuneMaterials.push(mat);
          else if (/eye/i.test(mat.name)) eyeMaterials.push(mat);
          else if (/blade|sword/i.test(mat.name)) bladeEmissiveMaterials.push(mat);
          else if (/armor|plate|steel/i.test(mat.name)) armorAccentMaterials.push(mat);
        });
      }
    });

    // Fallback LOD assignment when GLB contains single-tier geometry
    if (lodGroups.LOD0.length === 0) {
      lodGroups.LOD0.push(...meshes);
    }
    if (lodGroups.LOD1.length === 0) {
      lodGroups.LOD1.push(...lodGroups.LOD0);
    }
    if (lodGroups.LOD2.length === 0) {
      lodGroups.LOD2.push(...lodGroups.LOD1);
    }

    const bones = Array.from(boneSet);
    const findBone = (pattern: RegExp) => bones.find((b) => pattern.test(b.name));

    // Ensure required sockets exist even if GLB omits custom empties
    if (!sockets.Weapon_R) {
      const handR = findBone(/hand[_.]?r|righthand/i) ?? root;
      const s = new THREE.Object3D();
      s.name = 'Weapon_R';
      handR.add(s);
      sockets.Weapon_R = s;
    }
    if (!sockets.Weapon_Back) {
      const spine = findBone(/spine2|chest|spine1/i) ?? root;
      const s = new THREE.Object3D();
      s.name = 'Weapon_Back';
      s.position.set(0, 0, -0.15);
      spine.add(s);
      sockets.Weapon_Back = s;
    }
    if (!sockets.VFX_Chest) {
      const spine = findBone(/spine2|chest/i) ?? root;
      const s = new THREE.Object3D();
      s.name = 'VFX_Chest';
      s.position.set(0, 0, 0.14);
      spine.add(s);
      sockets.VFX_Chest = s;
    }
    if (!sockets.VFX_Aura) {
      const hips = findBone(/hips|pelvis|root/i) ?? root;
      const s = new THREE.Object3D();
      s.name = 'VFX_Aura';
      hips.add(s);
      sockets.VFX_Aura = s;
    }

    // Weapon fallback discovery or placeholder greatsword node
    let weaponRoot =
      cloned.getObjectByName('Weapon_Root') ??
      cloned.getObjectByName('Azrael_CeremonialGreatsword') ??
      cloned.getObjectByName('Greatsword');

    if (!weaponRoot) {
      weaponRoot = new THREE.Group();
      weaponRoot.name = 'Weapon_Placeholder';
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.2, 0.018),
        new THREE.MeshStandardMaterial({ color: 0x2c323f, metalness: 0.9, roughness: 0.25 })
      );
      blade.position.set(0, 0.65, 0);
      weaponRoot.add(blade);
      sockets.Weapon_R.add(weaponRoot);
      meshes.push(blade);
    }

    let weaponOffhandGrip = sockets.Weapon_OffhandGrip;
    if (!weaponOffhandGrip) {
      weaponOffhandGrip = new THREE.Object3D();
      weaponOffhandGrip.name = 'Weapon_OffhandGrip';
      weaponOffhandGrip.position.set(0, -0.2, 0);
      weaponRoot.add(weaponOffhandGrip);
      sockets.Weapon_OffhandGrip = weaponOffhandGrip;
    }

    const clips = (gltf.animations ?? []).map((c) => c.clone());

    const dispose = () => {
      const disposedGeoms = new Set<THREE.BufferGeometry>();
      const disposedMats = new Set<THREE.Material>();
      const disposedTex = new Set<THREE.Texture>();

      root.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry && !disposedGeoms.has(m.geometry)) {
          disposedGeoms.add(m.geometry);
          m.geometry.dispose();
        }
        if (m.material) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => {
            if (disposedMats.has(mat)) return;
            disposedMats.add(mat);
            for (const val of Object.values(mat)) {
              if (val && (val as THREE.Texture).isTexture && !disposedTex.has(val as THREE.Texture)) {
                disposedTex.add(val as THREE.Texture);
                (val as THREE.Texture).dispose();
              }
            }
            mat.dispose();
          });
        }
      });
      skeletons.forEach((s) => s.dispose());
    };

    return {
      root,
      clips,
      sockets,
      weaponRoot,
      weaponOffhandGrip,
      skeletons,
      bones,
      lodGroups,
      meshes,
      chestRuneMaterials,
      eyeMaterials,
      bladeEmissiveMaterials,
      armorAccentMaterials,
      hoodGroup,
      hoodBones: {
        crown: findBone(/hood[_.]?crown/i),
        back: findBone(/hood[_.]?back/i),
        sideL: findBone(/hood[_.]?side[_.]?l/i),
        sideR: findBone(/hood[_.]?side[_.]?r/i),
      },
      cloakBones,
      sourceLabel,
      sourceType: 'glb',
      dispose,
    };
  }

  public evictCache(url?: string): void {
    if (url !== undefined) {
      this.gltfCache.delete(url);
      return;
    }
    this.gltfCache.clear();
  }

  public dispose(): void {
    this.dracoLoader?.dispose();
    this.dracoLoader = null;
    this.ktx2Loader?.dispose();
    this.ktx2Loader = null;
    this.gltfCache.clear();
  }
}
