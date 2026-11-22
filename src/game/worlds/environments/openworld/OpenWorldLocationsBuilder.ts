import * as THREE from 'three';
import { OpenWorldRealmConfig } from './OpenWorldRealmTypes';
import { getBridgeSurfaceY, sampleOpenWorldHeight } from './OpenWorldTerrain';
import {
  InteractiveLoreNode,
  InteractiveRelicNode,
  InteractiveShrineNode,
} from '../limbo/LimboLocationsBuilder';

export interface OpenWorldLocationsResult {
  group: THREE.Group;
  shrines: InteractiveShrineNode[];
  relics: InteractiveRelicNode[];
  loreNodes: InteractiveLoreNode[];
  flickerLights: Array<{ light: THREE.PointLight; baseIntensity: number; phase: number }>;
  spinners: THREE.Object3D[];
}

export function buildOpenWorldLocations(
  config: OpenWorldRealmConfig,
  trackGeom: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  registerDetail: (obj: THREE.Object3D, tier: 'high' | 'medium') => void
): OpenWorldLocationsResult {
  const group = new THREE.Group();
  const shrines: InteractiveShrineNode[] = [];
  const relics: InteractiveRelicNode[] = [];
  const loreNodes: InteractiveLoreNode[] = [];
  const flickerLights: Array<{ light: THREE.PointLight; baseIntensity: number; phase: number }> = [];
  const spinners: THREE.Object3D[] = [];

  const pal = config.palette;

  const stoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: pal.stoneHex,
      roughness: 0.78,
      metalness: pal.bridgeStyle === 'gold' || pal.bridgeStyle === 'iron' ? 0.55 : 0.18,
    })
  );
  const trimMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: pal.trimHex,
      roughness: pal.bridgeStyle === 'gold' ? 0.25 : 0.62,
      metalness: pal.bridgeStyle === 'gold' ? 0.88 : pal.bridgeStyle === 'iron' ? 0.76 : 0.24,
    })
  );
  const accentGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: pal.accentHex,
      emissive: pal.accentHex,
      emissiveIntensity: 1.55,
      roughness: 0.22,
    })
  );
  const shrineGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: pal.shrineHex,
      emissive: pal.shrineHex,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    })
  );
  const relicGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: pal.relicHex,
      emissive: pal.relicHex,
      emissiveIntensity: 1.55,
      roughness: 0.22,
    })
  );
  const ringMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: pal.accentHex,
      transparent: true,
      opacity: 0.52,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  // Helper: Torch / Brazier Beacon along Pilgrimage Road & Sanctum Approach
  const addRealmBrazier = (x: number, z: number, withLight: boolean = false) => {
    const y = sampleOpenWorldHeight(config, x, z);
    const brazier = new THREE.Group();
    brazier.position.set(x, y, z);

    const post = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(0.14, 0.22, 2.5, 6)), stoneMat);
    post.position.y = 1.25;
    post.castShadow = true;
    brazier.add(post);

    const bowl = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(0.45, 0.2, 0.35, 6)), trimMat);
    bowl.position.y = 2.55;
    brazier.add(bowl);

    const flame = new THREE.Mesh(trackGeom(new THREE.OctahedronGeometry(0.28, 0)), accentGlowMat);
    flame.position.y = 2.95;
    brazier.add(flame);

    if (withLight) {
      const l = new THREE.PointLight(pal.accentHex, 1.65, 16);
      l.position.set(0, 3.1, 0);
      brazier.add(l);
      flickerLights.push({ light: l, baseIntensity: 1.65, phase: x * 0.27 + z * 0.19 });
      registerDetail(l, 'high');
    }

    group.add(brazier);
  };

  // 1. THREE WALKABLE BRIDGES SPANNING THE CENTRAL CHASM
  for (let bi = 0; bi < config.bridges.length; bi++) {
    const b = config.bridges[bi];
    const bGroup = new THREE.Group();
    const len = b.zMax - b.zMin;
    const segs = 14;
    const dz = len / segs;

    for (let i = 0; i < segs; i++) {
      const z0 = b.zMin + i * dz;
      const z1 = z0 + dz;
      const zm = (z0 + z1) * 0.5;
      const y0 = getBridgeSurfaceY(b, z0);
      const y1 = getBridgeSurfaceY(b, z1);
      const ym = (y0 + y1) * 0.5;

      const slab = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(b.halfWidth * 2, 0.72, dz + 0.12)), stoneMat);
      slab.position.set(b.x, ym - 0.35, zm);
      slab.rotation.x = Math.atan2(y0 - y1, dz);
      slab.receiveShadow = true;
      slab.castShadow = true;
      bGroup.add(slab);

      for (const side of [-1, 1] as const) {
        if (i % 3 === 1 && bi !== 0) continue;
        const para = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(0.55, 0.95, dz * 0.85)), trimMat);
        para.position.set(b.x + side * (b.halfWidth + 0.25), ym + 0.42, zm);
        para.castShadow = true;
        bGroup.add(para);

        if (pal.bridgeStyle === 'bone' && i % 2 === 0) {
          const rib = new THREE.Mesh(
            trackGeom(new THREE.TorusGeometry(b.halfWidth + 0.6, 0.24, 6, 12, Math.PI * 0.45)),
            trimMat
          );
          rib.position.set(b.x + side * (b.halfWidth - 0.2), ym + 0.6, zm);
          rib.rotation.y = side * Math.PI * 0.5;
          rib.rotation.z = 0.28;
          bGroup.add(rib);
        }
      }
    }

    // Bridge Support Piers into Chasm
    for (const pz of [b.zMin + 5, b.zMax - 5]) {
      const pier = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(b.halfWidth * 1.5, 14, 2.2)), stoneMat);
      pier.position.set(b.x, -5.5, pz);
      bGroup.add(pier);
    }

    // Gateway Lanterns on Bridge Ends
    addRealmBrazier(b.x - b.halfWidth, b.zMin + 1.2, bi === 0);
    addRealmBrazier(b.x + b.halfWidth, b.zMax - 1.2, bi === 0);

    group.add(bGroup);
  }

  // 2. SOUTHERN ARRIVAL GATEWAY & PILGRIMAGE BEACONS
  const buildCeremonialGate = (gx: number, gz: number, width: number, height: number) => {
    const gy = sampleOpenWorldHeight(config, gx, gz);
    const gate = new THREE.Group();
    gate.position.set(gx, gy, gz);

    for (const side of [-1, 1] as const) {
      const col = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(1.9, height, 2.2)), stoneMat);
      col.position.set(side * width * 0.5, height * 0.5, 0);
      col.castShadow = true;
      col.receiveShadow = true;
      gate.add(col);

      const cap = new THREE.Mesh(trackGeom(new THREE.ConeGeometry(1.4, 3.2, 4)), trimMat);
      cap.position.set(side * width * 0.5, height + 1.6, 0);
      cap.rotation.y = Math.PI * 0.25;
      gate.add(cap);
    }

    const lintel = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(width + 3.4, 1.8, 2.6)), trimMat);
    lintel.position.set(0, height - 0.4, 0);
    lintel.castShadow = true;
    gate.add(lintel);

    const sigil = new THREE.Mesh(trackGeom(new THREE.OctahedronGeometry(0.95, 0)), accentGlowMat);
    sigil.position.set(0, height - 2.3, 0);
    gate.add(sigil);
    spinners.push(sigil);

    group.add(gate);
  };

  buildCeremonialGate(0, config.spawnPos.z + 6, 11, 10);
  buildCeremonialGate(0, config.arenaCenter.z + config.arenaRadius + 3.5, 14, 14);

  for (const bz of [80, 62, 2, -24, -44]) {
    addRealmBrazier(-6.2, bz, bz === 62 || bz === -44);
    addRealmBrazier(6.2, bz, bz === 2);
  }

  // 3. NAMED LANDMARK RUINS / OUTPOST COLONNADES (East & West POIs)
  for (let zi = 1; zi < config.zones.length - 1; zi++) {
    const zInfo = config.zones[zi];
    if (Math.abs(zInfo.center.x) < 25) continue;
    const ly = sampleOpenWorldHeight(config, zInfo.center.x, zInfo.center.z);
    const outpost = new THREE.Group();
    outpost.position.set(zInfo.center.x, ly, zInfo.center.z);

    const plinth = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(7.2, 7.8, 0.45, 10)), stoneMat);
    plinth.position.y = 0.2;
    plinth.receiveShadow = true;
    outpost.add(plinth);

    for (let k = 0; k < 6; k++) {
      const ang = (k / 6) * Math.PI * 2 + 0.3;
      const colH = k % 2 === 0 ? 5.6 : 3.4;
      const col = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(0.45, 0.58, colH, 7)), trimMat);
      col.position.set(Math.cos(ang) * 6.4, colH * 0.5, Math.sin(ang) * 6.4);
      col.castShadow = true;
      outpost.add(col);
    }

    group.add(outpost);
  }

  // 4. INTERACTIVE REALM SHRINES (Restore Health/Stamina + Grant Passive Realm Seal Buff)
  for (const s of config.shrines) {
    const sy = sampleOpenWorldHeight(config, s.x, s.z);
    const pos = new THREE.Vector3(s.x, sy, s.z);
    const shrineGroup = new THREE.Group();
    shrineGroup.position.copy(pos);

    const base = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(2.1, 2.5, 0.55, 8)), stoneMat);
    base.position.y = 0.27;
    base.receiveShadow = true;
    shrineGroup.add(base);

    const pillar = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(0.42, 0.62, 2.4, 8)), trimMat);
    pillar.position.y = 1.45;
    pillar.castShadow = true;
    shrineGroup.add(pillar);

    const orbMesh = new THREE.Mesh(
      trackGeom(new THREE.OctahedronGeometry(0.55, 0)),
      trackMat(shrineGlowMat.clone())
    );
    orbMesh.position.y = 3.25;
    shrineGroup.add(orbMesh);
    spinners.push(orbMesh);

    const ringMesh = new THREE.Mesh(
      trackGeom(new THREE.RingGeometry(1.7, 2.05, 32)),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: pal.shrineHex,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
    );
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.62;
    shrineGroup.add(ringMesh);

    const light = new THREE.PointLight(pal.shrineHex, 2.8, 15);
    light.position.set(0, 3.3, 0);
    shrineGroup.add(light);

    group.add(shrineGroup);
    shrines.push({
      id: s.id,
      name: s.name,
      buffName: s.buffName,
      buffDescription: s.buffDescription,
      position: pos,
      cooldownTimer: 0,
      orbMesh,
      ringMesh,
      light,
    });
  }

  // 5. HIDDEN REALM RELICS (Guarded or Hidden Collectibles)
  for (const r of config.relics) {
    const ry = sampleOpenWorldHeight(config, r.x, r.z);
    const pos = new THREE.Vector3(r.x, ry, r.z);
    const relicGroup = new THREE.Group();
    relicGroup.position.copy(pos);

    const pedestal = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(1.3, 1.1, 1.3)), stoneMat);
    pedestal.position.y = 0.55;
    pedestal.castShadow = true;
    relicGroup.add(pedestal);

    const gem = new THREE.Mesh(trackGeom(new THREE.OctahedronGeometry(0.45, 0)), relicGlowMat);
    gem.position.y = 1.75;
    relicGroup.add(gem);
    spinners.push(gem);

    const halo = new THREE.Mesh(trackGeom(new THREE.TorusGeometry(0.75, 0.05, 8, 24)), ringMat);
    halo.position.y = 1.75;
    relicGroup.add(halo);
    spinners.push(halo);

    group.add(relicGroup);
    relics.push({
      id: r.id,
      name: r.name,
      buffName: r.buffName,
      buffDescription: r.buffDescription,
      loreTitle: r.loreTitle,
      loreText: r.loreText,
      emberReward: r.emberReward,
      position: pos,
      collected: false,
      requiresMiniBossId: r.requiresMiniBossId,
      group: relicGroup,
    });
  }

  // 6. LORE TABLETS
  for (const l of config.loreNodes) {
    const ly = sampleOpenWorldHeight(config, l.x, l.z);
    const pos = new THREE.Vector3(l.x, ly, l.z);
    const loreGroup = new THREE.Group();
    loreGroup.position.copy(pos);

    const slab = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(1.15, 2.0, 0.35)), stoneMat);
    slab.position.y = 1.0;
    slab.castShadow = true;
    loreGroup.add(slab);

    const crystal = new THREE.Mesh(trackGeom(new THREE.OctahedronGeometry(0.32, 0)), accentGlowMat);
    crystal.position.y = 2.45;
    loreGroup.add(crystal);
    spinners.push(crystal);

    group.add(loreGroup);
    loreNodes.push({
      id: l.id,
      title: l.title,
      text: l.text,
      emberReward: l.emberReward,
      position: pos,
      collected: false,
      group: loreGroup,
    });
  }

  return {
    group,
    shrines,
    relics,
    loreNodes,
    flickerLights,
    spinners,
  };
}
