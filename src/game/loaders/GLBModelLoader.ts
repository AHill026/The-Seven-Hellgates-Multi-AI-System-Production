/**
 * The Seven Hellgates - GLB / GLTF Model & Animation Loader
 * Supports loading external GLB models with embedded PBR materials, textures,
 * skeletal rigs, and THREE.AnimationMixer animation clips.
 */

import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export interface LoadedCharacterModel {
  group: THREE.Group;
  animations: THREE.AnimationClip[];
  mixer: THREE.AnimationMixer | null;
  actions: Map<string, THREE.AnimationAction>;
}

function resolveDracoDecoderPath(): string {
  const baseUrl =
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL) ||
    '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}decoders/draco/`;
}

class GLBModelLoaderService {
  private loader: GLTFLoader;
  private dracoLoader: DRACOLoader | null;
  private decoderPath: string;
  private cache: Map<string, GLTF> = new Map();

  constructor() {
    this.loader = new GLTFLoader();
    this.decoderPath = resolveDracoDecoderPath();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(this.decoderPath);
    this.loader.setDRACOLoader(this.dracoLoader);
    // KTX2Loader is intentionally deferred: glbLoaderService is instantiated at module scope
    // without a WebGLRenderer, and KTX2Loader.detectSupport(renderer) requires an active context.
  }

  public getDecoderPath(): string {
    return this.decoderPath;
  }

  /**
   * Asynchronously load a GLTF / GLB model file with caching
   */
  public async loadModel(url: string): Promise<GLTF> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          this.cache.set(url, gltf);
          resolve(gltf);
        },
        undefined,
        (error) => {
          console.warn(`[GLBModelLoader] Failed to load model at ${url}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Instantiate and configure a character rig with shadow casting, independent skeleton
   * bindings via SkeletonUtils.clone, and an isolated AnimationMixer.
   */
  public createCharacterInstance(gltf: GLTF): LoadedCharacterModel {
    const cloned = SkeletonUtils.clone(gltf.scene);
    let root: THREE.Group;
    if ((cloned as THREE.Group).isGroup) {
      root = cloned as THREE.Group;
    } else {
      root = new THREE.Group();
      root.add(cloned);
    }

    // Enable shadows and physical materials on all imported meshes
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.needsUpdate = true;
            });
          } else {
            mesh.material.needsUpdate = true;
          }
        }
      }
    });

    const animations = (gltf.animations || []).map((clip) => clip.clone());
    let mixer: THREE.AnimationMixer | null = null;
    const actions = new Map<string, THREE.AnimationAction>();

    if (animations.length > 0) {
      mixer = new THREE.AnimationMixer(root);
      animations.forEach((clip) => {
        const action = mixer!.clipAction(clip);
        actions.set(clip.name.toLowerCase(), action);
      });
    }

    return {
      group: root,
      animations,
      mixer,
      actions,
    };
  }

  public dispose(): void {
    this.dracoLoader?.dispose();
    this.dracoLoader = null;
    this.cache.clear();
  }
}

export const glbLoaderService = new GLBModelLoaderService();
