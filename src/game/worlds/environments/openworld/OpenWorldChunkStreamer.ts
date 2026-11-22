import * as THREE from 'three';
import { EnvironmentGraphicsPreset } from '../types';
import { OpenWorldRealmConfig } from './OpenWorldRealmTypes';
import {
  getChasmCenterZ,
  getMatchingBridge,
  getOpenWorldSurfaceKind,
  getPilgrimageRoadCenterX,
  sampleOpenWorldHeight,
} from './OpenWorldTerrain';

interface StreamedOpenChunk {
  key: string;
  cx: number;
  cz: number;
  group: THREE.Group;
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
}

function hash2D(a: number, b: number, seed: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

export class OpenWorldChunkStreamer {
  public readonly group: THREE.Group;
  private readonly config: OpenWorldRealmConfig;
  private chunks = new Map<string, StreamedOpenChunk>();
  private terrainMat: THREE.MeshStandardMaterial;
  private horizonMesh: THREE.Mesh;
  private primaryPropMat: THREE.MeshStandardMaterial;
  private secondaryPropMat: THREE.MeshStandardMaterial;

  private sharedPrimaryGeom: THREE.BufferGeometry;
  private sharedSecondaryGeom: THREE.BufferGeometry;

  private lastPlayerChunkX = -999;
  private lastPlayerChunkZ = -999;
  private currentPreset: EnvironmentGraphicsPreset = 'ultra';

  constructor(config: OpenWorldRealmConfig) {
    this.config = config;
    this.group = new THREE.Group();
    const pal = config.palette;

    this.terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: pal.propStyle === 'astral_crystals' ? 0.62 : 0.86,
      metalness: pal.propStyle === 'gold_obelisks' ? 0.24 : pal.propStyle === 'war_pikes' ? 0.26 : 0.12,
    });

    this.primaryPropMat = new THREE.MeshStandardMaterial({
      color: pal.propPrimaryHex,
      roughness: pal.propStyle === 'gold_obelisks' ? 0.25 : 0.72,
      metalness: pal.propStyle === 'gold_obelisks' ? 0.85 : pal.propStyle === 'war_pikes' ? 0.78 : 0.2,
    });

    this.secondaryPropMat = new THREE.MeshStandardMaterial({
      color: pal.propSecondaryHex,
      roughness: 0.45,
      metalness: 0.35,
      emissive: pal.accentHex,
      emissiveIntensity: pal.propStyle === 'magma_spires' || pal.propStyle === 'astral_crystals' ? 0.28 : 0.12,
    });

    const geoms = this.createPropGeometries(pal.propStyle);
    this.sharedPrimaryGeom = geoms.primary;
    this.sharedSecondaryGeom = geoms.secondary;

    this.horizonMesh = this.buildHorizonBaseMesh();
    this.group.add(this.horizonMesh);
  }

  private createPropGeometries(style: OpenWorldRealmConfig['palette']['propStyle']): {
    primary: THREE.BufferGeometry;
    secondary: THREE.BufferGeometry;
  } {
    switch (style) {
      case 'flesh_bones': {
        const p = new THREE.CylinderGeometry(0.16, 0.38, 4.6, 6);
        p.translate(0, 2.3, 0);
        const s = new THREE.IcosahedronGeometry(1.1, 0);
        s.translate(0, 0.75, 0);
        return { primary: p, secondary: s };
      }
      case 'gold_obelisks': {
        const p = new THREE.CylinderGeometry(0.32, 0.65, 5.2, 4);
        p.translate(0, 2.6, 0);
        const s = new THREE.OctahedronGeometry(0.85, 0);
        s.translate(0, 0.9, 0);
        return { primary: p, secondary: s };
      }
      case 'magma_spires': {
        const p = new THREE.ConeGeometry(0.85, 5.4, 5);
        p.translate(0, 2.7, 0);
        const s = new THREE.DodecahedronGeometry(1.05, 0);
        s.translate(0, 0.65, 0);
        return { primary: p, secondary: s };
      }
      case 'gothic_ruins': {
        const p = new THREE.BoxGeometry(0.8, 4.8, 0.8);
        p.translate(0, 2.4, 0);
        const s = new THREE.CylinderGeometry(0.24, 0.32, 1.8, 6);
        s.translate(0, 0.9, 0);
        return { primary: p, secondary: s };
      }
      case 'war_pikes': {
        const p = new THREE.CylinderGeometry(0.08, 0.14, 5.0, 5);
        p.translate(0, 2.5, 0);
        const s = new THREE.ConeGeometry(0.55, 1.8, 4);
        s.translate(0, 0.9, 0);
        return { primary: p, secondary: s };
      }
      case 'astral_crystals':
      default: {
        const p = new THREE.OctahedronGeometry(1.3, 0);
        p.scale(0.65, 2.2, 0.65);
        p.translate(0, 2.6, 0);
        const s = new THREE.BoxGeometry(1.4, 0.85, 1.4);
        s.translate(0, 0.42, 0);
        return { primary: p, secondary: s };
      }
    }
  }

  private pickSurfaceColor(wx: number, wz: number, wy: number, out: THREE.Color): void {
    const pal = this.config.palette;
    const surface = getOpenWorldSurfaceKind(this.config, wx, wz);
    const n = (Math.sin(wx * 0.21 + this.config.realmId) * Math.cos(wz * 0.19) + 1) * 0.5;

    switch (surface) {
      case 'arena':
        out.setHex(pal.arenaHex).offsetHSL(0, 0, (n - 0.5) * 0.04);
        break;
      case 'bridge':
        out.setHex(pal.trimHex);
        break;
      case 'road':
        out.setHex(pal.roadHex).offsetHSL(0, 0, (n - 0.5) * 0.04);
        break;
      case 'chasm':
        out.setHex(pal.chasmHex);
        break;
      case 'ridge':
      case 'ground':
      default: {
        const ridgeBlend = Math.max(0, Math.min(1, (wy - 2.2) / 7.5));
        out.setHex(pal.groundBaseHex).lerp(new THREE.Color(pal.groundRidgeHex), ridgeBlend * 0.7 + n * 0.2);
        break;
      }
    }
  }

  private buildHorizonBaseMesh(): THREE.Mesh {
    const size = this.config.worldHalfSize * 2 + 24;
    const geom = new THREE.PlaneGeometry(size, size, 44, 44);
    geom.rotateX(-Math.PI / 2);
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wz = pos.getZ(i);
      const wy = sampleOpenWorldHeight(this.config, wx, wz) - 0.16;
      pos.setY(i, wy);
      this.pickSurfaceColor(wx, wz, wy, c);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const mesh = new THREE.Mesh(geom, this.terrainMat);
    mesh.receiveShadow = true;
    return mesh;
  }

  private isPropBlocked(wx: number, wz: number): boolean {
    if (getMatchingBridge(this.config, wx, wz)) return true;
    if (Math.abs(wz - getChasmCenterZ(this.config, wx)) < this.config.chasmHalfWidth + 2.5) return true;
    if (Math.hypot(wx - this.config.arenaCenter.x, wz - this.config.arenaCenter.z) < this.config.arenaRadius + 7.5) {
      return true;
    }
    const roadX = getPilgrimageRoadCenterX(this.config, wz);
    if (wz >= -56 && wz <= 104 && Math.abs(wx - roadX) < 7.5) return true;

    for (let i = 0; i < this.config.zones.length; i++) {
      const z = this.config.zones[i];
      if (Math.hypot(wx - z.center.x, wz - z.center.z) < Math.min(15, z.radius * 0.72)) {
        return true;
      }
    }
    return false;
  }

  private buildChunk(cx: number, cz: number, preset: EnvironmentGraphicsPreset): StreamedOpenChunk {
    const key = `${cx}_${cz}`;
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const chunkGroup = new THREE.Group();

    const cs = this.config.chunkSize;
    const minX = -this.config.worldHalfSize + cx * cs;
    const minZ = -this.config.worldHalfSize + cz * cs;
    const centerX = minX + cs * 0.5;
    const centerZ = minZ + cs * 0.5;

    const segs = preset === 'ultra' ? 18 : preset === 'balanced' ? 12 : 8;
    const geom = new THREE.PlaneGeometry(cs, cs, segs, segs);
    geom.rotateX(-Math.PI / 2);
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const lz = pos.getZ(i);
      const wx = centerX + lx;
      const wz = centerZ + lz;
      const wy = sampleOpenWorldHeight(this.config, wx, wz);
      pos.setY(i, wy);
      this.pickSurfaceColor(wx, wz, wy, c);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    geometries.push(geom);

    const terrainMesh = new THREE.Mesh(geom, this.terrainMat);
    terrainMesh.position.set(centerX, 0, centerZ);
    terrainMesh.receiveShadow = true;
    chunkGroup.add(terrainMesh);

    const maxPrimary = preset === 'low' ? 3 : preset === 'balanced' ? 5 : 8;
    const maxSecondary = preset === 'low' ? 3 : 6;
    const dummy = new THREE.Object3D();
    const tintColor = new THREE.Color();
    const primaryMatrices: THREE.Matrix4[] = [];
    const primaryTints: THREE.Color[] = [];
    const secondaryMatrices: THREE.Matrix4[] = [];

    for (let i = 0; i < maxPrimary; i++) {
      const rx = minX + 3 + hash2D(cx + this.config.realmId, cz, i * 3 + 1) * (cs - 6);
      const rz = minZ + 3 + hash2D(cx, cz + this.config.realmId, i * 3 + 2) * (cs - 6);
      if (this.isPropBlocked(rx, rz)) continue;
      const ry = sampleOpenWorldHeight(this.config, rx, rz);
      const sc = 0.72 + hash2D(cx, cz, i * 3 + 3) * 0.85;
      const rotY = hash2D(cx, cz, i * 5 + 4) * Math.PI * 2;
      const tilt = (hash2D(cx, cz, i * 5 + 5) - 0.5) * 0.24;

      dummy.position.set(rx, ry - 0.12, rz);
      dummy.rotation.set(tilt * 0.6, rotY, tilt);
      dummy.scale.set(sc, sc * (0.9 + (i % 3) * 0.14), sc);
      dummy.updateMatrix();
      primaryMatrices.push(dummy.matrix.clone());

      tintColor.setHex(this.config.palette.propPrimaryHex).offsetHSL(0, 0, (hash2D(cx, cz, 200 + i) - 0.5) * 0.08);
      primaryTints.push(tintColor.clone());
    }

    for (let i = 0; i < maxSecondary; i++) {
      const rx = minX + 2 + hash2D(cx, cz, 40 + i * 3) * (cs - 4);
      const rz = minZ + 2 + hash2D(cx, cz, 41 + i * 3) * (cs - 4);
      if (this.isPropBlocked(rx, rz)) continue;
      const ry = sampleOpenWorldHeight(this.config, rx, rz);
      const sc = 0.65 + hash2D(cx, cz, 70 + i) * 0.9;

      dummy.position.set(rx, ry - 0.08, rz);
      dummy.rotation.set(
        (hash2D(cx, cz, 80 + i) - 0.5) * 0.25,
        hash2D(cx, cz, 90 + i) * Math.PI * 2,
        (hash2D(cx, cz, 100 + i) - 0.5) * 0.25
      );
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      secondaryMatrices.push(dummy.matrix.clone());
    }

    if (primaryMatrices.length > 0) {
      const pInst = new THREE.InstancedMesh(this.sharedPrimaryGeom, this.primaryPropMat, primaryMatrices.length);
      primaryMatrices.forEach((m, idx) => {
        pInst.setMatrixAt(idx, m);
        pInst.setColorAt(idx, primaryTints[idx]);
      });
      pInst.castShadow = preset !== 'low';
      pInst.receiveShadow = true;
      pInst.instanceMatrix.needsUpdate = true;
      if (pInst.instanceColor) pInst.instanceColor.needsUpdate = true;
      pInst.computeBoundingSphere();
      chunkGroup.add(pInst);
    }

    if (secondaryMatrices.length > 0) {
      const sInst = new THREE.InstancedMesh(this.sharedSecondaryGeom, this.secondaryPropMat, secondaryMatrices.length);
      secondaryMatrices.forEach((m, idx) => sInst.setMatrixAt(idx, m));
      sInst.receiveShadow = true;
      sInst.instanceMatrix.needsUpdate = true;
      sInst.computeBoundingSphere();
      chunkGroup.add(sInst);
    }

    this.group.add(chunkGroup);
    return {
      key,
      cx,
      cz,
      group: chunkGroup,
      geometries,
      materials,
    };
  }

  private disposeChunk(chunk: StreamedOpenChunk): void {
    this.group.remove(chunk.group);
    chunk.geometries.forEach((g) => g.dispose());
    chunk.materials.forEach((m) => m.dispose());
    chunk.group.traverse((child) => {
      if (child instanceof THREE.InstancedMesh) {
        child.dispose();
      }
    });
  }

  public setPreset(preset: EnvironmentGraphicsPreset): void {
    if (this.currentPreset === preset) return;
    this.currentPreset = preset;
    this.chunks.forEach((c) => this.disposeChunk(c));
    this.chunks.clear();
    this.lastPlayerChunkX = -999;
    this.lastPlayerChunkZ = -999;
  }

  public update(playerPos: THREE.Vector3, preset: EnvironmentGraphicsPreset): void {
    if (preset !== this.currentPreset) {
      this.setPreset(preset);
    }

    const cs = this.config.chunkSize;
    const perSide = this.config.chunksPerSide;
    const half = this.config.worldHalfSize;

    const pcx = Math.max(0, Math.min(perSide - 1, Math.floor((playerPos.x + half) / cs)));
    const pcz = Math.max(0, Math.min(perSide - 1, Math.floor((playerPos.z + half) / cs)));

    if (pcx === this.lastPlayerChunkX && pcz === this.lastPlayerChunkZ) {
      return;
    }

    this.lastPlayerChunkX = pcx;
    this.lastPlayerChunkZ = pcz;

    const activeRadius = preset === 'low' ? 1 : 2;
    const keepRadius = activeRadius + 1;

    for (let dz = -activeRadius; dz <= activeRadius; dz++) {
      for (let dx = -activeRadius; dx <= activeRadius; dx++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        if (cx < 0 || cx >= perSide || cz < 0 || cz >= perSide) continue;
        const key = `${cx}_${cz}`;
        let chunk = this.chunks.get(key);
        if (!chunk) {
          chunk = this.buildChunk(cx, cz, preset);
          this.chunks.set(key, chunk);
        }
        chunk.group.visible = true;
      }
    }

    this.chunks.forEach((chunk, key) => {
      const distX = Math.abs(chunk.cx - pcx);
      const distZ = Math.abs(chunk.cz - pcz);
      const maxCheb = Math.max(distX, distZ);
      if (maxCheb > keepRadius) {
        this.disposeChunk(chunk);
        this.chunks.delete(key);
      } else if (maxCheb > activeRadius) {
        chunk.group.visible = false;
      }
    });
  }

  public getActiveChunkCount(): number {
    let count = 0;
    this.chunks.forEach((c) => {
      if (c.group.visible) count++;
    });
    return count;
  }

  public dispose(): void {
    this.chunks.forEach((c) => this.disposeChunk(c));
    this.chunks.clear();
    this.horizonMesh.geometry.dispose();
    this.terrainMat.dispose();
    this.primaryPropMat.dispose();
    this.secondaryPropMat.dispose();
    this.sharedPrimaryGeom.dispose();
    this.sharedSecondaryGeom.dispose();
  }
}
