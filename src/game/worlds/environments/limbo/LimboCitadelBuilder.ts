import * as THREE from 'three';

export interface CitadelBuildResult {
  group: THREE.Group;
  runeSealMeshes: THREE.Mesh[];
  gateLights: THREE.PointLight[];
  animatedSpinners: THREE.Object3D[];
}

export function buildLimboAncientCitadel(
  trackGeom: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
  registerDetail: (obj: THREE.Object3D, tier: 'high' | 'medium') => void
): CitadelBuildResult {
  const group = new THREE.Group();
  const runeSealMeshes: THREE.Mesh[] = [];
  const gateLights: THREE.PointLight[] = [];
  const animatedSpinners: THREE.Object3D[] = [];

  const obsidianMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x161b26,
      roughness: 0.78,
      metalness: 0.25,
    })
  );
  const coldStoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x262f40,
      roughness: 0.85,
      metalness: 0.14,
    })
  );
  const paleMarbleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x4b5870,
      roughness: 0.72,
      metalness: 0.12,
    })
  );
  const darkIronMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1c212c,
      roughness: 0.45,
      metalness: 0.82,
    })
  );
  const runeGlowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.1,
      roughness: 0.2,
      metalness: 0.4,
    })
  );
  const softRuneMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  // 1. GRAND APPROACH STAIRCASE (Z: -46 -> -68, Y: 1.5 -> 6.0)
  const stairGroup = new THREE.Group();
  const numSteps = 16;
  const stepGeom = trackGeom(new THREE.BoxGeometry(17.6, 0.35, 1.48));
  for (let i = 0; i < numSteps; i++) {
    const t = i / (numSteps - 1);
    const step = new THREE.Mesh(stepGeom, coldStoneMat);
    step.position.set(0, 1.5 + t * 4.5 - 0.12, -47.0 - t * 20.5);
    step.receiveShadow = true;
    step.castShadow = true;
    stairGroup.add(step);
  }
  // Staircase Flanking Balustrades & Runic Braziers
  const wallGeom = trackGeom(new THREE.BoxGeometry(1.6, 4.8, 22.5));
  for (const side of [-1, 1] as const) {
    const bal = new THREE.Mesh(wallGeom, obsidianMat);
    bal.position.set(side * 9.8, 3.6, -57.5);
    bal.rotation.x = 0.21;
    bal.castShadow = true;
    bal.receiveShadow = true;
    stairGroup.add(bal);

    // Torch obelisks at foot & top of stairs
    for (let k = 0; k < 2; k++) {
      const zPos = k === 0 ? -47.5 : -64.5;
      const yPos = k === 0 ? 1.8 : 5.6;
      const post = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(1.3, 4.2, 1.3)), coldStoneMat);
      post.position.set(side * 9.9, yPos + 1.8, zPos);
      post.castShadow = true;
      stairGroup.add(post);

      const orb = new THREE.Mesh(trackGeom(new THREE.OctahedronGeometry(0.45, 0)), runeGlowMat);
      orb.position.set(side * 9.9, yPos + 4.3, zPos);
      stairGroup.add(orb);
      runeSealMeshes.push(orb);
    }
  }
  group.add(stairGroup);

  // 2. GIANT SEALED ENTRANCE GATEHOUSE (Z = -68, opening at X in [-7.5, +7.5])
  const gatehouse = new THREE.Group();
  gatehouse.position.set(0, 6.0, -68);

  // Twin colossal gatehouse towers flanking the 15m entrance
  const towerShaftGeom = trackGeom(new THREE.CylinderGeometry(2.6, 3.2, 26, 8));
  const spireGeom = trackGeom(new THREE.ConeGeometry(3.1, 11, 8));
  for (const side of [-1, 1] as const) {
    const tower = new THREE.Mesh(towerShaftGeom, obsidianMat);
    tower.position.set(side * 9.4, 13.0, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    gatehouse.add(tower);

    const crown = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(3.4, 2.7, 2.4, 8)), coldStoneMat);
    crown.position.set(side * 9.4, 26.2, 0);
    gatehouse.add(crown);

    const spire = new THREE.Mesh(spireGeom, obsidianMat);
    spire.position.set(side * 9.4, 32.5, 0);
    gatehouse.add(spire);

    // Glowing vertical runic slit facing South toward player across valley!
    const slit = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(0.45, 14, 0.2)), runeGlowMat);
    slit.position.set(side * 9.4, 13.5, 2.85);
    gatehouse.add(slit);
    runeSealMeshes.push(slit);

    // Giant shattered Iron/Bronze Seal Gate doors wedged wide ajar
    const door = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(6.8, 12.2, 0.7)), darkIronMat);
    door.position.set(side * 7.2, 6.1, -1.6);
    door.rotation.y = side * -1.15; // Wedged open!
    door.castShadow = true;
    gatehouse.add(door);

    const doorRune = new THREE.Mesh(trackGeom(new THREE.RingGeometry(1.1, 1.4, 6)), runeGlowMat);
    doorRune.position.set(side * 6.9, 6.2, -1.2);
    doorRune.rotation.y = side * -1.15;
    gatehouse.add(doorRune);
    runeSealMeshes.push(doorRune);
  }

  // Towering Gothic Gate Arch & Floating Runic Seal Ring (visible from Spawn!)
  const archLintel = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(21, 3.4, 3.2)), obsidianMat);
  archLintel.position.set(0, 14.5, 0);
  archLintel.castShadow = true;
  gatehouse.add(archLintel);

  const archPeak = new THREE.Mesh(trackGeom(new THREE.ConeGeometry(8.2, 9.5, 4)), coldStoneMat);
  archPeak.position.set(0, 20.5, 0);
  archPeak.rotation.y = Math.PI / 4;
  gatehouse.add(archPeak);

  const sealSpinner = new THREE.Group();
  sealSpinner.position.set(0, 14.8, 1.85);
  const outerRing = new THREE.Mesh(trackGeom(new THREE.RingGeometry(2.6, 2.95, 24)), softRuneMat);
  const innerHex = new THREE.Mesh(trackGeom(new THREE.RingGeometry(1.4, 1.7, 6)), runeGlowMat);
  sealSpinner.add(outerRing, innerHex);
  gatehouse.add(sealSpinner);
  animatedSpinners.push(sealSpinner);

  const gateBeaconLight = new THREE.PointLight(0x38bdf8, 4.5, 36);
  gateBeaconLight.position.set(0, 12, 3.5);
  gatehouse.add(gateBeaconLight);
  gateLights.push(gateBeaconLight);
  registerDetail(gateBeaconLight, 'medium');

  group.add(gatehouse);

  // 3. ENORMOUS RUINED OUTER CURTAIN WALLS & COLLAPSED BATTLEMENTS
  const curtainGroup = new THREE.Group();
  curtainGroup.position.set(0, 6.0, 0);

  // South Curtain flanks (X: +-11 -> +-40)
  for (const side of [-1, 1] as const) {
    const sWall = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(29, 13.5, 3.2)), obsidianMat);
    sWall.position.set(side * 25.5, 6.75, -68.2);
    sWall.castShadow = true;
    sWall.receiveShadow = true;
    curtainGroup.add(sWall);

    // Battlement crenelations (some collapsed/angled)
    for (let m = 0; m < 7; m++) {
      if (m === 3) continue; // Collapsed gap
      const merlon = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(2.4, 2.4, 1.4)), coldStoneMat);
      merlon.position.set(side * (14 + m * 3.8), 14.5, -67.5);
      if (m === 4) merlon.rotation.z = side * 0.18;
      curtainGroup.add(merlon);
    }

    // West & East Curtain Walls (Z: -70 -> -136)
    const sideWall = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(3.4, 14.5, 66)), obsidianMat);
    sideWall.position.set(side * 40.5, 7.25, -103);
    sideWall.castShadow = true;
    sideWall.receiveShadow = true;
    curtainGroup.add(sideWall);

    // Tall Cathedral Buttresses along courtyard inner walls
    for (let b = 0; b < 5; b++) {
      const bz = -77 - b * 13;
      const buttress = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(2.6, 17, 2.6)), coldStoneMat);
      buttress.position.set(side * 37.5, 8.5, bz);
      buttress.castShadow = true;
      curtainGroup.add(buttress);

      if (b % 2 === 1) {
        const lanternOrb = new THREE.Mesh(trackGeom(new THREE.OctahedronGeometry(0.4, 0)), runeGlowMat);
        lanternOrb.position.set(side * 35.6, 6.2, bz);
        curtainGroup.add(lanternOrb);
        runeSealMeshes.push(lanternOrb);
      }
    }

    // Corner Keep Towers (Colossal 34m silhouette!)
    for (const zCorner of [-69, -134]) {
      const keep = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(3.4, 4.2, 30, 8)), obsidianMat);
      keep.position.set(side * 39.5, 15, zCorner);
      keep.castShadow = true;
      curtainGroup.add(keep);

      const keepSpire = new THREE.Mesh(trackGeom(new THREE.ConeGeometry(4.0, 12, 8)), coldStoneMat);
      keepSpire.position.set(side * 39.5, 35.5, zCorner);
      curtainGroup.add(keepSpire);
    }
  }

  // North Rear Apse Wall
  const northWall = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(82, 16, 3.6)), obsidianMat);
  northWall.position.set(0, 8, -138);
  northWall.receiveShadow = true;
  curtainGroup.add(northWall);

  group.add(curtainGroup);

  // 4. COURTYARD RUNIC FLOOR SEAL & BROKEN SOVEREIGN STATUES
  const courtyardSealGroup = new THREE.Group();
  courtyardSealGroup.position.set(0, 6.06, -98);

  const sealOuter = new THREE.Mesh(trackGeom(new THREE.RingGeometry(19.2, 20.0, 48)), softRuneMat);
  sealOuter.rotation.x = -Math.PI / 2;
  courtyardSealGroup.add(sealOuter);

  const sealInner = new THREE.Mesh(trackGeom(new THREE.RingGeometry(11.4, 11.9, 36)), softRuneMat);
  sealInner.rotation.x = -Math.PI / 2;
  courtyardSealGroup.add(sealInner);

  const sealHex = new THREE.Mesh(trackGeom(new THREE.RingGeometry(5.2, 5.6, 6)), softRuneMat);
  sealHex.rotation.x = -Math.PI / 2;
  courtyardSealGroup.add(sealHex);
  animatedSpinners.push(sealHex);

  group.add(courtyardSealGroup);

  // Broken Statues & Ancient Monuments lining the Courtyard
  const statuePositions: [number, number, number][] = [
    [-25, -80, 0.35],
    [25, -80, -0.35],
    [-26, -98, 0.0],
    [26, -98, 0.0],
    [-25, -116, -0.35],
    [25, -116, 0.35],
  ];

  statuePositions.forEach(([sx, sz, tilt], idx) => {
    const mon = new THREE.Group();
    mon.position.set(sx, 6.0, sz);

    const plinth = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(2.6, 2.0, 2.6)), obsidianMat);
    plinth.position.y = 1.0;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    mon.add(plinth);

    const torso = new THREE.Mesh(trackGeom(new THREE.CylinderGeometry(0.65, 0.9, 3.6, 7)), paleMarbleMat);
    torso.position.y = 3.6;
    torso.rotation.z = tilt * 0.22;
    torso.castShadow = true;
    mon.add(torso);

    // Every other statue is headless/shattered; intact ones hold cracked stone swords
    if (idx % 2 === 0) {
      const head = new THREE.Mesh(trackGeom(new THREE.DodecahedronGeometry(0.55, 0)), paleMarbleMat);
      head.position.set(tilt * 0.2, 5.85, 0);
      mon.add(head);
    }
    const runeBand = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(2.7, 0.16, 2.7)), runeGlowMat);
    runeBand.position.y = 1.9;
    mon.add(runeBand);
    runeSealMeshes.push(runeBand);

    group.add(mon);
  });

  // 5. HOLLOW KING'S THRONE CHAMBER & COLOSSAL CATHEDRAL APSE (Z = -124..-136)
  const throneChamber = new THREE.Group();
  throneChamber.position.set(0, 6.8, -127.5);

  // Obsidian Throne Pedestal & Jagged Sovereign Seat
  const dais = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(8.5, 0.7, 6.2)), obsidianMat);
  dais.position.set(0, -0.25, 0);
  dais.receiveShadow = true;
  throneChamber.add(dais);

  const throneSeat = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(2.6, 1.5, 2.2)), darkIronMat);
  throneSeat.position.set(0, 0.8, 0);
  throneSeat.castShadow = true;
  throneChamber.add(throneSeat);

  const throneBack = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(2.8, 6.2, 0.7)), obsidianMat);
  throneBack.position.set(0, 3.6, -0.95);
  throneBack.castShadow = true;
  throneChamber.add(throneBack);

  // Crown Spires behind Throne
  for (let s = -2; s <= 2; s++) {
    const spikeH = 3.2 - Math.abs(s) * 0.6;
    const spike = new THREE.Mesh(trackGeom(new THREE.ConeGeometry(0.24, spikeH, 4)), darkIronMat);
    spike.position.set(s * 0.55, 6.7 + spikeH * 0.4, -0.95);
    throneChamber.add(spike);
  }

  // Runic Seal Halo framed behind the Throne & towering Cathedral Rib Arches
  const throneHalo = new THREE.Mesh(trackGeom(new THREE.RingGeometry(4.2, 4.7, 32)), softRuneMat);
  throneHalo.position.set(0, 6.5, -2.2);
  throneChamber.add(throneHalo);
  animatedSpinners.push(throneHalo);

  // Towering Cathedral Rib Columns rising 34m into the moonlight (visible from Outer Ruins!)
  for (const side of [-1, 1] as const) {
    const ribCol = new THREE.Mesh(trackGeom(new THREE.BoxGeometry(2.8, 32, 3.2)), obsidianMat);
    ribCol.position.set(side * 12, 16, -2.8);
    ribCol.castShadow = true;
    throneChamber.add(ribCol);

    const highSpire = new THREE.Mesh(trackGeom(new THREE.ConeGeometry(2.2, 10, 5)), coldStoneMat);
    highSpire.position.set(side * 12, 36.5, -2.8);
    throneChamber.add(highSpire);
  }

  // Central Rose Cathedral Crown visible above the Citadel skyline
  const centralCrownSpire = new THREE.Mesh(trackGeom(new THREE.ConeGeometry(4.8, 18, 6)), obsidianMat);
  centralCrownSpire.position.set(0, 35, -7.5);
  throneChamber.add(centralCrownSpire);

  const centralBeaconOrb = new THREE.Mesh(trackGeom(new THREE.OctahedronGeometry(1.15, 0)), runeGlowMat);
  centralBeaconOrb.position.set(0, 44.5, -7.5);
  throneChamber.add(centralBeaconOrb);
  runeSealMeshes.push(centralBeaconOrb);

  const throneLight = new THREE.PointLight(0x38bdf8, 4.0, 28);
  throneLight.position.set(0, 5.5, 2.5);
  throneChamber.add(throneLight);
  gateLights.push(throneLight);
  registerDetail(throneLight, 'medium');

  group.add(throneChamber);

  return {
    group,
    runeSealMeshes,
    gateLights,
    animatedSpinners,
  };
}
