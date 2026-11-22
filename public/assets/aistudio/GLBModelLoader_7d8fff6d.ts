/**
 * The Seven Hellgates - GLB / GLTF Model & Animation Loader
 * Supports loading external GLB models with embedded PBR materials, textures,
 * skeletal rigs, and THREE.AnimationMixer animation clips.
 */

import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface LoadedCharacterModel {
  group: THREE.Group;
  animations: THREE.AnimationClip[];
  mixer: THREE.AnimationMixer | null;
  actions: Map<string, THREE.AnimationAction>;
}

class GLBModelLoaderService {
  private loader: GLTFLoader;
  private cache: Map<string, GLTF> = new Map();

  constructor() {
    this.loader = new GLTFLoader();
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
   * Instantiate and configure a character rig with shadow casting and animation mixer
   */
  public createCharacterInstance(gltf: GLTF): LoadedCharacterModel {
    const root = gltf.scene.clone(true);

    // Enable shadows and physical materials on all imported meshes
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => {
              m.needsUpdate = true;
            });
          } else {
            child.material.needsUpdate = true;
          }
        }
      }
    });

    let mixer: THREE.AnimationMixer | null = null;
    const actions = new Map<string, THREE.AnimationAction>();

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(root);
      gltf.animations.forEach((clip) => {
        const action = mixer!.clipAction(clip);
        actions.set(clip.name.toLowerCase(), action);
      });
    }

    return {
      group: root,
      animations: gltf.animations || [],
      mixer,
      actions,
    };
  }
}

export const glbLoaderService = new GLBModelLoaderService();
