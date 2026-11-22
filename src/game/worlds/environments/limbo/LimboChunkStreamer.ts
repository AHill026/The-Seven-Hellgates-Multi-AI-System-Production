import * as THREE from 'three';
import { EnvironmentGraphicsPreset } from '../types';
import {
  LIMBO_CHUNKS_PER_SIDE,
  LIMBO_CHUNK_SIZE,
  LIMBO_WORLD_HALF_SIZE,
  getKingsRoadCenterX,
  getLimboGroundHeightAt,
  getLimboSurfaceKind,
  getRavineCenterZ,
  isOnAnyRavineBridge,
} from './LimboTerrain';

interface StreamedChunk {
  key: string;
  cx: number;
  cz: number;
  group: THREE.Group;
  terrainMesh: THREE.Mesh;
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
}

function hash2D(a: number, b: number, seed: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

export class LimboChunkStreamer {
  public readonly group: THREE.Group;
  private chunks = new Map<string, StreamedChunk>();
  private terrainMat: THREE.MeshStandardMaterial;
  private horizonMesh: THREE.Mesh;
  private treeMat: THREE.MeshStandardMaterial;
  private rockMat: THREE.MeshStandardMaterial;
  private graveMat: THREE.MeshStandardMaterial;

  private sharedTrunkGeom: THREE.CylinderGeometry;
  private sharedBranchGeom: THREE.CylinderGeometry;
  private sharedRockGeom: THREE.DodecahedronGeometry;
  private sharedGraveGeom: THREE.BoxGeometry;

  private lastPlayerChunkX: number = -999;
  private lastPlayerChunkZ: number = -999;
  private currentPreset: EnvironmentGraphicsPreset = 'ultra';

  constructor() {
    this.group = new THREE.Group();

    this.terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.08,
    });

    this.treeMat = new THREE.MeshStandardMaterial({
      color: 0x161922,
      roughness: 0.94,
      metalness: 0.05,
    });
    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0x1f2533,
      roughness: 0.88,
      metalness: 0.14,
    });
    this.graveMat = new THREE.MeshStandardMaterial({
      color: 0x3a4354,
      roughness: 0.82,
      metalness: 0.1,
    });

    this.sharedTrunkGeom = new THREE.CylinderGeometry(0.14, 0.42, 5.2, 6);
    this.sharedTrunkGeom.translate(0, 2.6, 0);
    this.sharedBranchGeom = new THREE.CylinderGeometry(0.05, 0.14, 2.4, 5);
    this.sharedRockGeom = new THREE.DodecahedronGeometry(1.15, 0);
    this.sharedGraveGeom = new THREE.BoxGeometry(0.65, 1.45, 0.24);
    this.sharedGraveGeom.translate(0, 0.72, 0);

    // Lightweight continuous Horizon Skirt Mesh so distant terrain stays visible out to 320m
    this.horizonMesh = this.buildHorizonBaseMesh();
    this.group.add(this.horizonMesh);
  }

  private buildHorizonBaseMesh(): THREE.Mesh {
    const geom = new THREE.PlaneGeometry(340, 340, 44, 44);
    geom.rotateX(-Math.PI / 2);
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i);
      const wz = pos.getZ(i);
      const wy = getLimboGroundHeightAt(wx, wz) - 0.16;
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

  private pickSurfaceColor(wx: number, wz: number, wy: number, out: THREE.Color): void {
    const surface = getLimboSurfaceKind(wx, wz);
    const noise = (Math.sin(wx * 0.23) * Math.cos(wz * 0.21) + 1) * 0.5;

    switch (surface) {
      case 'stone_citadel':
        out.setHex(0x202735).offsetHSL(0, 0, (noise - 0.5) * 0.04);
        break;
      case 'bridge':
        out.setHex(0x2b3342);
        break;
      case 'road':
        out.setHex(0x222836).offsetHSL(0, 0, (noise - 0.5) * 0.04);
        break;
      case 'crypt':
        out.setHex(0x1b2130);
        break;
      case 'cave':
        out.setHex(0x132030);
        break;
      case 'battlefield':
        out.setHex(0x252128).offsetHSL(0, 0.03, (noise - 0.5) * 0.04);
        break;
      case 'ravine':
        out.setHex(0x09101c);
        break;
      case 'ash':
      default: {
        // Blend frost highlights on upper ridges
        const ridgeFrost = Math.max(0, Math.min(1, (wy - 3.0) / 8.0));
        out.setHex(0x151a24).lerp(new THREE.Color(0x232b3a), ridgeFrost * 0.65 + noise * 0.25);
        break;
      }
    }
  }

  private buildChunk(cx: number, cz: number, preset: EnvironmentGraphicsPreset): StreamedChunk {
    const key = `${cx}_${cz}`;
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const chunkGroup = new THREE.Group();

    const minX = -LIMBO_WORLD_HALF_SIZE + cx * LIMBO_CHUNK_SIZE;
    const minZ = -LIMBO_WORLD_HALF_SIZE + cz * LIMBO_CHUNK_SIZE;
    const centerX = minX + LIMBO_CHUNK_SIZE * 0.5;
    const centerZ = minZ + LIMBO_CHUNK_SIZE * 0.5;

    const segs = preset === 'ultra' ? 20 : preset === 'balanced' ? 14 : 10;
    const geom = new THREE.PlaneGeometry(LIMBO_CHUNK_SIZE, LIMBO_CHUNK_SIZE, segs, segs);
    geom.rotateX(-Math.PI / 2);
    const pos = geom.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const lz = pos.getZ(i);
      const wx = centerX + lx;
      const wz = centerZ + lz;
      const wy = getLimboGroundHeightAt(wx, wz);
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

    // Populate instanced dead twisted trees, basalt rocks, and gravestones cleanly outside roads/structures
    const isPropBlocked = (wx: number, wz: number): boolean => {
      if (isOnAnyRavineBridge(wx, wz)) return true;
      if (Math.abs(wz - getRavineCenterZ(wx)) < 9.5) return true;
      if (wx >= -45 && wx <= 45 && wz >= -142 && wz <= -44) return true; // Citadel & Grand Stairs
      if (wx >= 69 && wx <= 99 && wz >= -76 && wz <= -35) return true; // Crypt
      if (Math.abs(wx - getKingsRoadCenterX(wz)) < 7.0 && wz >= -48 && wz <= 122) return true; // King's Road
      if (Math.hypot(wx, wz - 114) < 15) return true; // Outer Ruins spawn
      if (Math.hypot(wx + 64, wz - 72) < 16) return true; // Settlement
      if (Math.hypot(wx - 68, wz - 66) < 16) return true; // Battlefield
      if (Math.hypot(wx + 88, wz - 18) < 10) return true; // West Shrine
      if (Math.hypot(wx - 94, wz + 18) < 10) return true; // East Shrine
      if (Math.hypot(wx + 114, wz + 4) < 15) return true; // Hidden Cave
      if (Math.hypot(wx - 116, wz - 12) < 12) return true; // Secret Relic Chamber
      if (Math.hypot(wx + 90, wz + 56) < 13) return true; // Watchtower
      return false;
    };

    const dummy = new THREE.Object3D();

    // Dead Twisted Trees
    const maxTrees = preset === 'low' ? 3 : preset === 'balanced' ? 6 : 9;
    const treeTransforms: THREE.Matrix4[] = [];
    const branchTransforms: THREE.Matrix4[] = [];
    for (let i = 0; i < maxTrees; i++) {
      const rx = minX + 3 + hash2D(cx, cz, i * 3 + 1) * (LIMBO_CHUNK_SIZE - 6);
      const rz = minZ + 3 + hash2D(cx, cz, i * 3 + 2) * (LIMBO_CHUNK_SIZE - 6);
      if (isPropBlocked(rx, rz)) continue;
      const ry = getLimboGroundHeightAt(rx, rz);
      const sc = 0.75 + hash2D(cx, cz, i * 3 + 3) * 0.85;
      const rotY = hash2D(cx, cz, i * 5 + 4) * Math.PI * 2;
      const tilt = (hash2D(cx, cz, i * 5 + 5) - 0.5) * 0.25;

      dummy.position.set(rx, ry - 0.15, rz);
      dummy.rotation.set(tilt * 0.6, rotY, tilt);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      treeTransforms.push(dummy.matrix.clone());

      // Upper gnarled branch
      dummy.position.set(rx, ry + 3.6 * sc, rz);
      dummy.rotation.set(0.65, rotY + 0.9, 0.85);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      branchTransforms.push(dummy.matrix.clone());
    }

    if (treeTransforms.length > 0) {
      const trunks = new THREE.InstancedMesh(this.sharedTrunkGeom, this.treeMat, treeTransforms.length);
      const branches = new THREE.InstancedMesh(this.sharedBranchGeom, this.treeMat, branchTransforms.length);
      treeTransforms.forEach((m, idx) => trunks.setMatrixAt(idx, m));
      branchTransforms.forEach((m, idx) => branches.setMatrixAt(idx, m));
      trunks.castShadow = preset !== 'low';
      trunks.receiveShadow = true;
      trunks.computeBoundingSphere();
      branches.computeBoundingSphere();
      chunkGroup.add(trunks, branches);
    }

    // Basalt Rock Outcrops & Weathered Gravestones
    const maxRocks = preset === 'low' ? 4 : 8;
    const rockTransforms: THREE.Matrix4[] = [];
    const graveTransforms: THREE.Matrix4[] = [];

    for (let i = 0; i < maxRocks; i++) {
      const rx = minX + 2 + hash2D(cx, cz, 50 + i * 3) * (LIMBO_CHUNK_SIZE - 4);
      const rz = minZ + 2 + hash2D(cx, cz, 51 + i * 3) * (LIMBO_CHUNK_SIZE - 4);
      if (isPropBlocked(rx, rz)) continue;
      const ry = getLimboGroundHeightAt(rx, rz);

      if (i % 2 === 0) {
        const sc = 0.6 + hash2D(cx, cz, 90 + i) * 1.4;
        dummy.position.set(rx, ry - 0.2, rz);
        dummy.rotation.set(
          hash2D(cx, cz, 100 + i) * 0.5,
          hash2D(cx, cz, 110 + i) * Math.PI * 2,
          hash2D(cx, cz, 120 + i) * 0.5
        );
        dummy.scale.set(sc * 1.3, sc * 0.85, sc);
        dummy.updateMatrix();
        rockTransforms.push(dummy.matrix.clone());
      } else {
        dummy.position.set(rx, ry - 0.08, rz);
        dummy.rotation.set(
          (hash2D(cx, cz, 130 + i) - 0.5) * 0.25,
          hash2D(cx, cz, 140 + i) * Math.PI * 2,
          (hash2D(cx, cz, 150 + i) - 0.5) * 0.3
        );
        const gs = 0.85 + hash2D(cx, cz, 160 + i) * 0.5;
        dummy.scale.set(gs, gs, gs);
        dummy.updateMatrix();
        graveTransforms.push(dummy.matrix.clone());
      }
    }

    if (rockTransforms.length > 0) {
      const rocks = new THREE.InstancedMesh(this.sharedRockGeom, this.rockMat, rockTransforms.length);
      rockTransforms.forEach((m, idx) => rocks.setMatrixAt(idx, m));
      rocks.receiveShadow = true;
      rocks.computeBoundingSphere();
      chunkGroup.add(rocks);
    }
    if (graveTransforms.length > 0) {
      const graves = new THREE.InstancedMesh(this.sharedGraveGeom, this.graveMat, graveTransforms.length);
      graveTransforms.forEach((m, idx) => graves.setMatrixAt(idx, m));
      graves.castShadow = preset !== 'low';
      graves.receiveShadow = true;
      graves.computeBoundingSphere();
      chunkGroup.add(graves);
    }

    this.group.add(chunkGroup);
    return {
      key,
      cx,
      cz,
      group: chunkGroup,
      terrainMesh,
      geometries,
      materials,
    };
  }

  private disposeChunk(chunk: StreamedChunk) {
    this.group.remove(chunk.group);
    chunk.geometries.forEach((g) => g.dispose());
    chunk.materials.forEach((m) => m.dispose());
    chunk.group.traverse((child) => {
      if (child instanceof THREE.InstancedMesh) {
        child.dispose();
      }
    });
  }

  public setPreset(preset: EnvironmentGraphicsPreset) {
    if (this.currentPreset === preset) return;
    this.currentPreset = preset;
    // Rebuild chunks smoothly to match preset resolution & prop density
    this.chunks.forEach((chunk) => this.disposeChunk(chunk));
    this.chunks.clear();
    this.lastPlayerChunkX = -999;
    this.lastPlayerChunkZ = -999;
  }

  public update(playerPos: THREE.Vector3, preset: EnvironmentGraphicsPreset) {
    if (preset !== this.currentPreset) {
      this.setPreset(preset);
    }

    const pcx = Math.max(
      0,
      Math.min(LIMBO_CHUNKS_PER_SIDE - 1, Math.floor((playerPos.x + LIMBO_WORLD_HALF_SIZE) / LIMBO_CHUNK_SIZE))
    );
    const pcz = Math.max(
      0,
      Math.min(LIMBO_CHUNKS_PER_SIDE - 1, Math.floor((playerPos.z + LIMBO_WORLD_HALF_SIZE) / LIMBO_CHUNK_SIZE))
    );

    if (pcx === this.lastPlayerChunkX && pcz === this.lastPlayerChunkZ) {
      return;
    }

    this.lastPlayerChunkX = pcx;
    this.lastPlayerChunkZ = pcz;

    const activeRadius = preset === 'low' ? 1 : 2;
    const keepRadius = activeRadius + 1;

    // 1. Activate / build chunks inside active radius
    for (let dz = -activeRadius; dz <= activeRadius; dz++) {
      for (let dx = -activeRadius; dx <= activeRadius; dx++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        if (cx < 0 || cx >= LIMBO_CHUNKS_PER_SIDE || cz < 0 || cz >= LIMBO_CHUNKS_PER_SIDE) continue;
        const key = `${cx}_${cz}`;
        let chunk = this.chunks.get(key);
        if (!chunk) {
          chunk = this.buildChunk(cx, cz, preset);
          this.chunks.set(key, chunk);
        }
        chunk.group.visible = true;
      }
    }

    // 2. Hide outer ring & dispose far chunks to bound memory
    this.chunks.forEach((chunk, key) => {
      const distX = Math.abs(chunk.cx - pcx);
      const distZ = Math.abs(chunk.cz - pcz);
      const maxChebyshev = Math.max(distX, distZ);
      if (maxChebyshev > keepRadius) {
        this.disposeChunk(chunk);
        this.chunks.delete(key);
      } else if (maxChebyshev > activeRadius) {
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

  public getTotalCachedChunkCount(): number {
    return this.chunks.size;
  }

  public dispose() {
    this.chunks.forEach((chunk) => this.disposeChunk(chunk));
    this.chunks.clear();
    this.horizonMesh.geometry.dispose();
    this.terrainMat.dispose();
    this.treeMat.dispose();
    this.rockMat.dispose();
    this.graveMat.dispose();
    this.sharedTrunkGeom.dispose();
    this.sharedBranchGeom.dispose();
    this.sharedRockGeom.dispose();
    this.sharedGraveGeom.dispose();
  }
}
