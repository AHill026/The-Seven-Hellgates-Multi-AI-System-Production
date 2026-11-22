import * as THREE from 'three';
import {
  AzraelLODLevel,
  AzraelPerformanceStats,
  LoadedAzraelAsset,
} from './types';

export class AzraelPerformanceMonitor {
  private frames = 0;
  private accumTime = 0;
  private fps = 60;
  private frameTimeMs = 16.6;
  private animationMs = 0;
  private postFxMs = 0;

  public recordFrame(
    deltaSec: number,
    animationMs: number,
    postFxMs: number
  ): void {
    this.frames += 1;
    this.accumTime += deltaSec;
    this.animationMs = this.animationMs * 0.85 + animationMs * 0.15;
    this.postFxMs = this.postFxMs * 0.85 + postFxMs * 0.15;

    if (this.accumTime >= 0.4) {
      this.fps = Math.round(this.frames / this.accumTime);
      this.frameTimeMs = Number(((this.accumTime / this.frames) * 1000).toFixed(2));
      this.frames = 0;
      this.accumTime = 0;
    }
  }

  public getStats(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    asset: LoadedAzraelAsset | null,
    lodLevel: AzraelLODLevel,
    isSoftwareGl: boolean,
    postFxMsOverride?: number
  ): AzraelPerformanceStats {
    const textureSet = new Set<THREE.Texture>();
    let textureBytes = 0;

    scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (!m.material) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        for (const val of Object.values(mat)) {
          if (val && (val as THREE.Texture).isTexture) {
            const tex = val as THREE.Texture;
            if (textureSet.has(tex)) continue;
            textureSet.add(tex);
            const img = tex.image as { width?: number; height?: number } | undefined;
            const w = img?.width ?? 256;
            const h = img?.height ?? 256;
            // Estimate RGBA + ~33% mipmap overhead
            textureBytes += w * h * 4 * 1.33;
          }
        }
      });
    });

    const activeBones = asset
      ? asset.skeletons.reduce((acc, s) => acc + s.bones.length, 0)
      : 0;

    return {
      fps: this.fps,
      frameTimeMs: this.frameTimeMs,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      textureMemoryMB: Number((textureBytes / (1024 * 1024)).toFixed(2)),
      activeBones,
      animationMs: Number(this.animationMs.toFixed(3)),
      postFxMs: Number((postFxMsOverride ?? this.postFxMs).toFixed(3)),
      lodLevel,
      pixelRatio: Number(renderer.getPixelRatio().toFixed(2)),
      isSoftwareGl,
      assetSource: asset?.sourceLabel ?? 'None',
    };
  }
}
