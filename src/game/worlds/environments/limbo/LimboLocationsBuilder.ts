import * as THREE from 'three';
import { getBridgeSurfaceHeight, getLimboGroundHeightAt } from './LimboTerrain';

export interface InteractiveShrineNode {
  id: string;
  name: string;
  buffName: string;
  buffDescription: string;
  position: THREE.Vector3;
  cooldownTimer: number;
  orbMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  light: THREE.PointLight;
}

export interface InteractiveRelicNode {
  id: string;
  name: string;
  buffName: string;
  buffDescription: string;
  loreTitle: string;
  loreText: string;
  emberReward: number;
  position: THREE.Vector3;
  collected: boolean;
  requiresMiniBossId?: string;
  group: THREE.Group;
}

export interface InteractiveLoreNode {
  id: string;
  title: string;
  text: string;
  emberReward: number;
  position: THREE.Vector3;
  collected: boolean;
  group: THREE.Group;
}

export interface LocationsBuildResult {
  group: THREE.Group;
  shrines: InteractiveShrineNode[];
  relics: InteractiveRelicNode[];
  loreNodes: InteractiveLoreNode[];
  flickerLights: Array<{ light: THREE.PointLight; baseIntensity: number; phase: number }>;
  spinners: THREE.Object3D[];
}

export function buildLimboLocationsAndBridges(
  trackGeom: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  registerDetail: (obj: THREE.Object3D, tier: 'high' | 'medium') => void,
  collectedRelicIds: string[] = [],
  awakenedShrineIds: string[] = [],
  discoveredLoreTitles: string[] = []
): LocationsBuildResult {
  const group = new THREE.Group();
  const shrines: InteractiveShrineNode[] = [];
  const relics: InteractiveRelicNode[] = [];
  const loreNodes: InteractiveLoreNode[] = [];
  const flickerLights: Array<{ light: THREE.PointLight; baseIntensity: number; phase: number }> = [];
  const spinners: THREE.Object3D[] = [];

  const stoneMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x262e3d, roughness: 0.86, metalness: 0.14 }));
  const darkSlateMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x161a24, roughness: 0.88, metalness: 0.2 }));
  const paleStoneMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x4b5568, roughness: 0.78, metalness: 0.1 }));
  const rustedIronMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x3b3533, roughness: 0.65, metalness: 0.7 }));
  const woodMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x231d19, roughness: 0.92, metalness: 0.05 }));
  const clothMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.88, side: THREE.DoubleSide })
  );
  const cyanGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.65,
      roughness: 0.2,
    })
  );
  const goldGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.55,
      roughness: 0.25,
    })
  );
  const runeRingMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  // Helper to spawn a flickering blue lantern post
  const addBlueLantern = (x: number, z: number, withLight: boolean = false, yOffset: number = 0) => {
    const y = getLimboGroundHeightAt(x, z) + yOffset;
    const post = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(0.1, 0.14, 2.8, 6)), darkSlateMat);
    post.position.set(x, y + 1.4, z);
    post.castShadow = true;
    group.add(post);

    const flame = new THREE.Mesh(trackGeom(new THREE.OctahedronGeometry(0.24, 0)), cyanGlowMat);
    flame.position.set(x, y + 2.95, z);
    group.add(flame);

    if (withLight) {
      const l = new THREE.PointLight(0x38bdf8, 1.75, 15);
      l.position.set(x, y + 3.0, z);
      group.add(l);
      flickerLights.push({ light: l, baseIntensity: 1.75, phase: x * 0.3 + z * 0.17 });
      registerDetail(l, 'high');
    }
  };

  // =========================================================================
  // 1. THREE RAVINE BRIDGES SPANNING MOONSTONE GORGE
  // =========================================================================
  const buildBridgeStructure = (cx: number, halfWidth: number, zMin: number, zMax: number, withArch: boolean) => {
    const bridgeGroup = new THREE.Group();
    const len = zMax - zMin;
    const segs = 16;
    const dz = len / segs;

    for (let i = 0; i < segs; i++) {
      const z0 = zMin + i * dz;
      const z1 = z0 + dz;
      const zm = (z0 + z1) * 0.5;
      const y0 = getBridgeSurfaceHeight(cx, z0) ?? 2.0;
      const y1 = getBridgeSurfaceHeight(cx, z1) ?? 2.0;
      const ym = (y0 + y1) * 0.5;

      const slab = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(halfWidth * 2, 0.75, dz + 0.12)), stoneMat);
      slab.position.set(cx, ym - 0.36, zm);
      slab.rotation.x = Math.atan2(y0 - y1, dz);
      slab.receiveShadow = true;
      slab.castShadow = true;
      bridgeGroup.add(slab);

      // Parapet stones (alternating intact/broken)
      for (const side of [-1, 1] as const) {
        if (i % 4 === 2) continue; // Weathered gaps visually, collision remains solid
        const para = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(0.65, 1.05, dz * 0.88)), paleStoneMat);
        para.position.set(cx + side * (halfWidth + 0.3), ym + 0.45, zm);
        para.castShadow = true;
        bridgeGroup.add(para);
      }
    }

    if (withArch) {
      // Deep support piers plunging into the misty ravine floor
      for (const zPier of [zMin + 6, zMax - 6]) {
        const pier = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(halfWidth * 1.6, 16, 2.4)), darkSlateMat);
        pier.position.set(cx, -5.8, zPier);
        bridgeGroup.add(pier);
      }
    }
    group.add(bridgeGroup);
  };

  buildBridgeStructure(0, 4.75, 15.5, 45.5, true); // Grand Ravine Bridge
  buildBridgeStructure(-58, 3.5, 14.0, 44.0, true); // West Broken Causeway
  buildBridgeStructure(58, 3.5, 14.0, 44.0, true); // East Pilgrim's Crossing

  // Bridge Entry Lanterns
  addBlueLantern(-4.8, 44.5, true);
  addBlueLantern(4.8, 44.5, false);
  addBlueLantern(-4.8, 16.5, true);
  addBlueLantern(4.8, 16.5, false);

  // Subtle glowing blue mist veil deep inside the ravine floor
  const gorgeMist = new THREE.Mesh(
    trackGeom(new THREE.PlaneGeometry(300, 26)),
    trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x0c243d,
        transparent: true,
        opacity: 0.48,
        side: THREE.DoubleSide,
      })
    )
  );
  gorgeMist.rotation.x = -Math.PI / 2;
  gorgeMist.position.set(0, -7.2, 30);
  group.add(gorgeMist);

  // =========================================================================
  // 2. OUTER RUINS SANCTUM (SPAWN OVERLOOK AT Z = +114)
  // =========================================================================
  const outerArchPos: [number, number][] = [
    [-7.5, 108],
    [7.5, 108],
    [-10, 122],
    [10, 122],
  ];
  outerArchPos.forEach(([px, pz], i) => {
    const py = getLimboGroundHeightAt(px, pz);
    const col = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(0.75, 0.95, 6.2 + (i % 2) * 1.4, 8)), stoneMat);
    col.position.set(px, py + 3.0, pz);
    col.castShadow = true;
    col.receiveShadow = true;
    group.add(col);
  });
  addBlueLantern(-6.2, 104, true);
  addBlueLantern(6.2, 104, true);

  // =========================================================================
  // 3. FORGOTTEN SETTLEMENT ("HOLLOWSTEAD HAMLET", -64, +72)
  // =========================================================================
  const cottages: Array<{ x: number; z: number; w: number; h: number; d: number; rot: number }> = [
    { x: -73, z: 69, w: 5.5, h: 3.6, d: 5.5, rot: 0.12 },
    { x: -55, z: 79, w: 5.8, h: 3.4, d: 5.2, rot: -0.18 },
    { x: -71, z: 82.5, w: 5.0, h: 3.0, d: 4.5, rot: 0.28 },
  ];
  cottages.forEach((c) => {
    const cy = getLimboGroundHeightAt(c.x, c.z);
    const house = new THREE.Group();
    house.position.set(c.x, cy, c.z);
    house.rotation.y = c.rot;

    const walls = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(c.w, c.h, c.d)), stoneMat);
    walls.position.y = c.h * 0.5;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    // Collapsed timber & slate roof beam
    const roof = new THREE.Mesh(trackGeom(new THREE.ConeGeometry(c.w * 0.72, 2.4, 4)), woodMat);
    roof.position.set(0.3, c.h + 0.8, 0);
    roof.rotation.y = Math.PI / 4;
    roof.rotation.z = 0.18;
    house.add(roof);

    group.add(house);
  });
  // Ruined stone well in Hamlet square
  const wellY = getLimboGroundHeightAt(-64, 72);
  const wellRim = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(1.4, 1.5, 1.0, 10, 1, true)), paleStoneMat);
  wellRim.position.set(-64, wellY + 0.5, 72);
  group.add(wellRim);
  addBlueLantern(-61.5, 69.5, true);

  // =========================================================================
  // 4. ABANDONED BATTLEFIELD ("FIELD OF BROKEN OATH", +68, +66)
  // =========================================================================
  const spearGeom = trackGeom(new THREE.CylinderGeometry(0.04, 0.05, 3.2, 5));
  const bannerGeom = trackGeom(new THREE.PlaneGeometry(1.2, 2.6));
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2 + (i % 3) * 0.3;
    const rad = 4 + ((i * 7) % 13);
    const sx = 68 + Math.cos(ang) * rad;
    const sz = 66 + Math.sin(ang) * rad;
    const sy = getLimboGroundHeightAt(sx, sz);

    const spear = new THREE.Mesh(spearGeom, rustedIronMat);
    spear.position.set(sx, sy + 1.35, sz);
    spear.rotation.z = (Math.sin(i * 1.9) - 0.5) * 0.45;
    spear.rotation.x = (Math.cos(i * 2.3) - 0.5) * 0.45;
    spear.castShadow = true;
    group.add(spear);

    if (i % 5 === 0) {
      const banner = new THREE.Mesh(bannerGeom, clothMat);
      banner.position.set(sx + 0.5, sy + 2.1, sz);
      banner.rotation.y = ang;
      group.add(banner);
    }
  }
  addBlueLantern(60, 58, true);

  // =========================================================================
  // 5. ANCIENT SHRINES (X2: WEST OVERLOOK & EAST SANCTUM)
  // =========================================================================
  const shrineSpecs = [
    {
      id: 'shrine_west_overlook',
      name: 'Shrine of Iron Vigor',
      buffName: 'Seal of Iron Vigor',
      buffDescription: '+20 Max Stamina & +20% Stamina Recovery',
      x: -88,
      z: 18,
    },
    {
      id: 'shrine_east_sanctum',
      name: 'Shrine of Frostblood',
      buffName: 'Seal of Frostblood',
      buffDescription: '+30 Max Health & +25% Healing Potency',
      x: 94,
      z: -18,
    },
  ];

  shrineSpecs.forEach((sp) => {
    const sy = getLimboGroundHeightAt(sp.x, sp.z);
    const isAwakened = awakenedShrineIds.includes(sp.id);
    const sg = new THREE.Group();
    sg.position.set(sp.x, sy, sp.z);

    const base = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(2.8, 3.2, 0.5, 8)), stoneMat);
    base.position.y = 0.25;
    base.receiveShadow = true;
    sg.add(base);

    const altar = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(1.5, 1.5, 1.5)), paleStoneMat);
    altar.position.y = 1.05;
    altar.castShadow = true;
    sg.add(altar);

    // Flanking small obelisks
    for (let o = 0; o < 4; o++) {
      const a = (o / 4) * Math.PI * 2 + Math.PI / 4;
      const ob = new THREE.Mesh(trackGeom(new THREE.ConeGeometry(0.35, 3.2, 4)), darkSlateMat);
      ob.position.set(Math.cos(a) * 3.1, 1.6, Math.sin(a) * 3.1);
      ob.castShadow = true;
      sg.add(ob);
    }

    const orbMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: isAwakened ? 0x34d399 : 0x38bdf8,
        emissive: isAwakened ? 0x10b981 : 0x38bdf8,
        emissiveIntensity: 2.2,
      })
    );
    const orbMesh = new THREE.Mesh(trackGeom(new THREE.OctahedronGeometry(0.55, 0)), orbMat);
    orbMesh.position.y = 2.65;
    sg.add(orbMesh);
    spinners.push(orbMesh);

    const ringMesh = new THREE.Mesh(
      trackGeom(new THREE.RingGeometry(2.9, 3.3, 32)),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: isAwakened ? 0x34d399 : 0x38bdf8,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
    );
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.08;
    sg.add(ringMesh);

    const light = new THREE.PointLight(isAwakened ? 0x34d399 : 0x38bdf8, 3.6, 18);
    light.position.y = 3.0;
    sg.add(light);

    group.add(sg);

    shrines.push({
      id: sp.id,
      name: sp.name,
      buffName: sp.buffName,
      buffDescription: sp.buffDescription,
      position: new THREE.Vector3(sp.x, sy, sp.z),
      cooldownTimer: 0,
      orbMesh,
      ringMesh,
      light,
    });
  });

  // =========================================================================
  // 6. RUINED WATCHTOWER ("MOONWATCH KEEP", -90, -56, SPIRAL RAMP -> Y = 11.2)
  // =========================================================================
  const wtGroup = new THREE.Group();
  wtGroup.position.set(-90, 6.8, -56);

  const wtCore = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(3.4, 3.8, 12.5, 10)), darkSlateMat);
  wtCore.position.y = 6.25;
  wtCore.castShadow = true;
  wtCore.receiveShadow = true;
  wtGroup.add(wtCore);

  // Exterior Spiral Stone Ramp Segments matching terrain ramp angle
  const rampSteps = 28;
  for (let i = 0; i < rampSteps; i++) {
    const t = i / (rampSteps - 1);
    const cwAngle = t * Math.PI * 1.38;
    const worldAngle = Math.PI * 0.5 - cwAngle;
    const r = 6.2;
    const rx = Math.cos(worldAngle) * r;
    const rz = Math.sin(worldAngle) * r;
    const ry = t * 4.4;

    const tread = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(4.4, 0.5, 2.2)), paleStoneMat);
    tread.position.set(rx, ry - 0.15, rz);
    tread.rotation.y = -worldAngle;
    tread.receiveShadow = true;
    tread.castShadow = true;
    wtGroup.add(tread);
  }
  // Upper Battlement Beacon
  const wtBeacon = new THREE.Mesh(trackGeom(new THREE.OctahedronGeometry(0.45, 0)), cyanGlowMat);
  wtBeacon.position.set(-6.2, 6.2, 0);
  wtGroup.add(wtBeacon);
  group.add(wtGroup);

  // =========================================================================
  // 7. UNDERGROUND CRYPT ("VAULT OF FIRST KINGS", +84, -40..-74)
  // =========================================================================
  const cryptGroup = new THREE.Group();
  // Carved Stone Portal Entrance at Z = -40 (Y = 2.0)
  for (const side of [-1, 1] as const) {
    const portalPillar = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(1.8, 7.5, 2.2)), darkSlateMat);
    portalPillar.position.set(84 + side * 6.2, 2.0 + 3.5, -40);
    portalPillar.castShadow = true;
    cryptGroup.add(portalPillar);

    // Retaining corridor walls descending underground
    const stairWall = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(1.6, 10.5, 16)), darkSlateMat);
    stairWall.position.set(84 + side * 6.4, -0.8, -47);
    cryptGroup.add(stairWall);

    // Chamber Side Walls
    const chamberWall = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(1.8, 9.5, 22)), darkSlateMat);
    chamberWall.position.set(84 + side * 12.6, -1.2, -64.5);
    cryptGroup.add(chamberWall);
  }
  const cryptLintel = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(14.6, 2.2, 2.4)), stoneMat);
  cryptLintel.position.set(84, 9.5, -40);
  cryptGroup.add(cryptLintel);

  const cryptRearWall = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(27, 10.5, 2.2)), darkSlateMat);
  cryptRearWall.position.set(84, -1.0, -74.8);
  cryptGroup.add(cryptRearWall);

  // Vaulted Gothic Overhead Ribs leaving center skylights open for camera clarity
  for (let r = 0; r < 3; r++) {
    const rz = -56 - r * 7.5;
    const ribArch = new THREE.Mesh(
      trackGeom(new THREE.TorusGeometry(11.6, 0.65, 6, 16, Math.PI)),
      stoneMat
    );
    ribArch.position.set(84, -1.5, rz);
    cryptGroup.add(ribArch);
  }

  // Stone Sarcophagi inside Crypt (-5.5m floor)
  for (const sx of [76, 92]) {
    for (const sz of [-58, -68]) {
      const tomb = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(2.1, 1.3, 3.6)), paleStoneMat);
      tomb.position.set(sx, -5.5 + 0.65, sz);
      tomb.castShadow = true;
      cryptGroup.add(tomb);
    }
  }
  const cryptLight = new THREE.PointLight(0x38bdf8, 4.2, 26);
  cryptLight.position.set(84, -1.8, -64);
  cryptGroup.add(cryptLight);
  flickerLights.push({ light: cryptLight, baseIntensity: 4.2, phase: 2.1 });
  group.add(cryptGroup);

  // =========================================================================
  // 8. HIDDEN CAVE ("HOLLOWED CRYSTAL CAVERN", -114, -4)
  // =========================================================================
  const caveGroup = new THREE.Group();
  caveGroup.position.set(-114, 2.0, -4);

  // Towering Basalt Cavern Spire Walls & Natural Arch Overhangs
  const cragGeom = trackGeom(new THREE.ConeGeometry(4.2, 13, 6));
  const caveWalls: [number, number, number][] = [
    [-11, -9, 1.1],
    [-12, 0, 1.25],
    [-11, 9, 1.15],
    [-4, -12, 1.0],
    [-4, 12, 1.0],
    [4, -12, 0.9],
    [4, 12, 0.9],
  ];
  caveWalls.forEach(([cx, cz, sc]) => {
    const crag = new THREE.Mesh(cragGeom, darkSlateMat);
    crag.position.set(cx, 5.5, cz);
    crag.scale.set(sc, sc, sc);
    crag.castShadow = true;
    caveGroup.add(crag);
  });

  // Overhead Cavern Arch Bridge (at Y + 8.5m so camera stays comfortably beneath)
  const caveArch = new THREE.Mesh(trackGeom(new THREE.TorusGeometry(11.0, 2.1, 6, 14, Math.PI)), darkSlateMat);
  caveArch.position.set(-2, 4.5, 0);
  caveArch.rotation.y = Math.PI / 2;
  caveGroup.add(caveArch);

  // Bioluminescent Crystal Veins
  const crystalGeom = trackGeom(new THREE.OctahedronGeometry(0.75, 0));
  for (let c = 0; c < 8; c++) {
    const a = (c / 8) * Math.PI * 2;
    const cry = new THREE.Mesh(crystalGeom, cyanGlowMat);
    cry.position.set(Math.cos(a) * 8.5 - 2, 0.8 + (c % 2) * 0.5, Math.sin(a) * 8.5);
    cry.scale.set(0.7, 2.1, 0.7);
    cry.rotation.z = (Math.random() - 0.5) * 0.4;
    caveGroup.add(cry);
  }
  const caveLight = new THREE.PointLight(0x38bdf8, 4.0, 22);
  caveLight.position.set(-2, 4.5, 0);
  caveGroup.add(caveLight);
  flickerLights.push({ light: caveLight, baseIntensity: 4.0, phase: 4.4 });
  group.add(caveGroup);

  // =========================================================================
  // 9. SECRET RELIC CHAMBER ("SANCTUM OF THE FIRST SEAL", +116, +12)
  // =========================================================================
  const secretGroup = new THREE.Group();
  secretGroup.position.set(116, 2.4, 12);

  const chamberBack = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(3.2, 9.5, 18)), darkSlateMat);
  chamberBack.position.set(9.5, 4.75, 0);
  secretGroup.add(chamberBack);

  for (const sz of [-7.5, 7.5]) {
    const pillar = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(0.95, 1.1, 8.2, 8)), stoneMat);
    pillar.position.set(-4, 4.1, sz);
    pillar.castShadow = true;
    secretGroup.add(pillar);
  }
  const chamberDial = new THREE.Mesh(trackGeom(new THREE.RingGeometry(3.6, 4.1, 24)), runeRingMat);
  chamberDial.rotation.x = -Math.PI / 2;
  chamberDial.position.y = 0.08;
  secretGroup.add(chamberDial);
  spinners.push(chamberDial);
  group.add(secretGroup);

  // =========================================================================
  // 10. HIDDEN RELICS & LORE TABLETS
  // =========================================================================
  const relicSpecs: Array<Omit<InteractiveRelicNode, 'collected' | 'group' | 'position'> & { x: number; z: number }> = [
    {
      id: 'relic_battlefield_oath',
      name: 'Relic of the Fallen Legion',
      buffName: 'Oath of Fallen Steel',
      buffDescription: '+12% Physical & Weapon Damage',
      loreTitle: 'Oath of the Vanguard',
      loreText: 'Hundreds fell holding the southern ford against an enemy wearing Azrael’s own crest.',
      emberReward: 120,
      x: 68,
      z: 66,
      requiresMiniBossId: 'miniboss_battlefield',
    },
    {
      id: 'relic_watchtower_vigil',
      name: 'Astral Sextant of Moonwatch',
      buffName: 'Vigil of Moonwatch',
      buffDescription: '+15% Stamina Recovery & +15% Wrath Gain',
      loreTitle: 'The Watchtower Log',
      loreText: 'The moon over Limbo has not moved in seven centuries. Every tower watches a frozen hour.',
      emberReward: 110,
      x: -96.2,
      z: -56,
    },
    {
      id: 'relic_crypt_monarch',
      name: 'Signet of the First Sovereign',
      buffName: 'Crownborn Wrath',
      buffDescription: '+25% Wrath Generation from Strikes',
      loreTitle: 'Epitaph of the First King',
      loreText: 'Here sleeps the Hollow King’s mortal twin—the one who refused to close the Seventh Gate.',
      emberReward: 160,
      x: 84,
      z: -68,
      requiresMiniBossId: 'miniboss_crypt',
    },
    {
      id: 'relic_cave_mist',
      name: 'Mistheart Crystal',
      buffName: 'Pale Ember Resonance',
      buffDescription: '+18% Embers Gained from All Foes',
      loreTitle: 'Whispers in the Pale Stone',
      loreText: 'Before blood stained these stones, celestial fire pooled beneath the cliffs like frozen dew.',
      emberReward: 130,
      x: -119,
      z: -4,
    },
    {
      id: 'relic_secret_seal',
      name: 'Shard of the First Seal',
      buffName: 'First Seal Ward',
      buffDescription: '+25 Max Health & +8% Attack Damage',
      loreTitle: 'The Architect’s Confession',
      loreText: 'A seal is never a lock alone—it is a mirror that asks what waits on the other side.',
      emberReward: 200,
      x: 119,
      z: 12,
    },
  ];

  relicSpecs.forEach((r) => {
    const ry = getLimboGroundHeightAt(r.x, r.z);
    const rg = new THREE.Group();
    rg.position.set(r.x, ry, r.z);

    const isCollected = collectedRelicIds.includes(r.id);

    const ped = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(0.55, 0.72, 1.1, 6)), paleStoneMat);
    ped.position.y = 0.55;
    ped.castShadow = true;
    rg.add(ped);

    if (!isCollected) {
      const crystal = new THREE.Mesh(trackGeom(new THREE.OctahedronGeometry(0.45, 0)), goldGlowMat);
      crystal.position.y = 1.65;
      rg.add(crystal);
      spinners.push(crystal);

      const halo = new THREE.Mesh(trackGeom(new THREE.RingGeometry(0.95, 1.2, 20)), runeRingMat);
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.06;
      rg.add(halo);
    }

    group.add(rg);
    relics.push({
      id: r.id,
      name: r.name,
      buffName: r.buffName,
      buffDescription: r.buffDescription,
      loreTitle: r.loreTitle,
      loreText: r.loreText,
      emberReward: r.emberReward,
      position: new THREE.Vector3(r.x, ry, r.z),
      collected: isCollected,
      requiresMiniBossId: r.requiresMiniBossId,
      group: rg,
    });
  });

  const loreSpecs: Array<{ id: string; title: string; text: string; emberReward: number; x: number; z: number }> = [
    {
      id: 'lore_hamlet',
      title: 'Chronicle of Hollowstead',
      text: 'When the sky turned cerulean, the villagers packed their hearths for a dawn that never broke.',
      emberReward: 55,
      x: -64,
      z: 75,
    },
    {
      id: 'lore_bridge',
      title: 'Inscription of Moonstone Gorge',
      text: 'Cross only with steel drawn; the chasm below drinks memory faster than stone.',
      emberReward: 55,
      x: 0,
      z: 49,
    },
    {
      id: 'lore_citadel_gate',
      title: 'Decree of the Hollow Court',
      text: 'None shall step beyond the Sealed Gate save the Sovereign who forged the Seven Locks.',
      emberReward: 70,
      x: -5.5,
      z: -44,
    },
  ];

  loreSpecs.forEach((l) => {
    const ly = getLimboGroundHeightAt(l.x, l.z);
    const lg = new THREE.Group();
    lg.position.set(l.x, ly, l.z);

    const isCollected = discoveredLoreTitles.includes(l.title);
    const slab = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(0.9, 1.4, 0.35)), stoneMat);
    slab.position.y = 0.7;
    slab.castShadow = true;
    lg.add(slab);

    if (!isCollected) {
      const rune = new THREE.Mesh(trackGeom(new THREE.OctahedronGeometry(0.26, 0)), cyanGlowMat);
      rune.position.y = 1.75;
      lg.add(rune);
      spinners.push(rune);
    }

    group.add(lg);
    loreNodes.push({
      id: l.id,
      title: l.title,
      text: l.text,
      emberReward: l.emberReward,
      position: new THREE.Vector3(l.x, ly, l.z),
      collected: isCollected,
      group: lg,
    });
  });

  return {
    group,
    shrines,
    relics,
    loreNodes,
    flickerLights,
    spinners,
  };
}
