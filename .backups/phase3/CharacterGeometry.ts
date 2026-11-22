/**
 * The Seven Hellgates - Procedural Anatomical Character Geometry
 * Generates continuous, anatomical humanoid and demonic creature geometry
 * with sculpted musculature, facial features, fitted gothic armor,
 * digitigrade demon limbs, articulated hands, and executioner greatsword.
 */

import * as THREE from 'three';

export interface LoftedSlice {
  y: number;
  rx: number;
  rz: number;
  cx?: number;
  cz?: number;
  bulgeZFront?: number;
  bulgeXSide?: number;
  indentZBack?: number;
}

/**
 * Generates a smooth, seamless lofted organic BufferGeometry from cross-sectional anatomical slices
 */
export function createLoftedBodyGeometry(
  slices: LoftedSlice[],
  radialSegments: number = 20,
  closeTop: boolean = false,
  closeBottom: boolean = false
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j < slices.length; j++) {
    const s = slices[j];
    const v = j / (slices.length - 1);
    const cx = s.cx || 0;
    const cz = s.cz || 0;
    const rx = s.rx;
    const rz = s.rz;
    const bzf = s.bulgeZFront || 0;
    const bxs = s.bulgeXSide || 0;
    const izb = s.indentZBack || 0;

    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const angle = u * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Anatomical shaping: forward pectoral/belly bulge, latissimus side flare, spine groove
      let curRx = rx;
      if (bxs !== 0 && Math.abs(cosA) > 0.5) {
        curRx += bxs * (Math.abs(cosA) - 0.5) * 2;
      }

      let curRz = rz;
      if (bzf > 0 && sinA > 0) {
        // Forward pectoral / abdominal fullness
        curRz += bzf * Math.pow(sinA, 1.6);
      } else if (izb !== 0 && sinA < 0) {
        // Spine groove indentation
        curRz -= izb * Math.pow(-sinA, 2.0);
      }

      const x = cx + cosA * curRx;
      const z = cz + sinA * curRz;
      const y = s.y;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  const stride = radialSegments + 1;
  for (let j = 0; j < slices.length - 1; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * stride + i;
      const b = (j + 1) * stride + i;
      const c = (j + 1) * stride + (i + 1);
      const d = j * stride + (i + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  // Optional caps
  if (closeBottom) {
    const centerIdx = positions.length / 3;
    const bottomSlice = slices[0];
    positions.push(bottomSlice.cx || 0, bottomSlice.y, bottomSlice.cz || 0);
    uvs.push(0.5, 0);
    for (let i = 0; i < radialSegments; i++) {
      indices.push(centerIdx, i + 1, i);
    }
  }

  if (closeTop) {
    const centerIdx = positions.length / 3;
    const topSlice = slices[slices.length - 1];
    const topRowStart = (slices.length - 1) * stride;
    positions.push(topSlice.cx || 0, topSlice.y, topSlice.cz || 0);
    uvs.push(0.5, 1);
    for (let i = 0; i < radialSegments; i++) {
      indices.push(centerIdx, topRowStart + i, topRowStart + i + 1);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds Azrael's complete athletic humanoid torso with muscular pectorals, lats, and spine
 */
export function createAthleticHumanoidTorso(): THREE.BufferGeometry {
  const slices: LoftedSlice[] = [
    { y: -0.22, rx: 0.19,  rz: 0.135, cz: 0.01, bulgeZFront: 0.01 }, // Lower pelvic base
    { y: -0.12, rx: 0.175, rz: 0.125, cz: 0.01, bulgeZFront: 0.02 }, // Narrow athletic waist
    { y: 0.0,   rx: 0.205, rz: 0.135, cz: 0.02, bulgeZFront: 0.035, indentZBack: 0.012 }, // Solar plexus & serratus
    { y: 0.14,  rx: 0.25,  rz: 0.165, cz: 0.03, bulgeZFront: 0.065, bulgeXSide: 0.035, indentZBack: 0.018 }, // Muscular lats
    { y: 0.26,  rx: 0.275, rz: 0.175, cz: 0.04, bulgeZFront: 0.075, bulgeXSide: 0.045, indentZBack: 0.022 }, // Broad muscular chest
    { y: 0.38,  rx: 0.265, rz: 0.155, cz: 0.03, bulgeZFront: 0.055, bulgeXSide: 0.035 }, // Clavicle shelf
    { y: 0.44,  rx: 0.16,  rz: 0.12,  cz: 0.02 }, // Trapezius & neck base
  ];
  return createLoftedBodyGeometry(slices, 24, true, true);
}

/**
 * Builds Azrael's fitted gothic Damascus steel cuirass with central tapul ridge and fauld lames
 */
export function createFittedCuirass(): THREE.BufferGeometry {
  const slices: LoftedSlice[] = [
    { y: -0.18, rx: 0.215, rz: 0.155, cz: 0.01, bulgeZFront: 0.025 }, // Fauld lame flange
    { y: -0.06, rx: 0.205, rz: 0.145, cz: 0.01, bulgeZFront: 0.035 }, // Lower breastplate
    { y: 0.08,  rx: 0.24,  rz: 0.168, cz: 0.03, bulgeZFront: 0.068, bulgeXSide: 0.025 }, // Mid breastplate
    { y: 0.22,  rx: 0.285, rz: 0.188, cz: 0.04, bulgeZFront: 0.095, bulgeXSide: 0.035 }, // Gothic tapul apex
    { y: 0.36,  rx: 0.272, rz: 0.168, cz: 0.03, bulgeZFront: 0.065 }, // Upper gorget rim
  ];
  return createLoftedBodyGeometry(slices, 24, false, false);
}

/**
 * Builds Azrael's sculpted face and head with jawline, chin, brow ridge, eye sockets, and cheekbones
 */
export function createSculptedHead(): THREE.BufferGeometry {
  const slices: LoftedSlice[] = [
    { y: -0.16, rx: 0.055, rz: 0.075, cz: 0.025 }, // Chiseled masculine chin
    { y: -0.10, rx: 0.088, rz: 0.098, cz: 0.032, bulgeZFront: 0.024, bulgeXSide: 0.018 }, // Defined jawline angle
    { y: -0.04, rx: 0.104, rz: 0.112, cz: 0.034, bulgeZFront: 0.032 }, // Mouth & philtrum
    { y: 0.025, rx: 0.112, rz: 0.116, cz: 0.034, bulgeZFront: 0.036, bulgeXSide: 0.026 }, // Cheekbones
    { y: 0.055, rx: 0.112, rz: 0.114, cz: 0.030, bulgeZFront: 0.024 }, // Eye socket orbital level
    { y: 0.095, rx: 0.114, rz: 0.124, cz: 0.028, bulgeZFront: 0.044 }, // Prominent brow ridge overhang
    { y: 0.145, rx: 0.11,  rz: 0.116, cz: 0.012 }, // Forehead
    { y: 0.195, rx: 0.092, rz: 0.098, cz: 0.0 }, // Upper skull
    { y: 0.23,  rx: 0.06,  rz: 0.068, cz: -0.01 }, // Cranium crown
  ];
  const geom = createLoftedBodyGeometry(slices, 24, true, true);

  // Carve subtle bilateral eye socket recesses around y ~ 0.03..0.075 on front of face
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (z > 0.09 && y > 0.015 && y < 0.088 && Math.abs(x) > 0.024 && Math.abs(x) < 0.082) {
      const dx = (Math.abs(x) - 0.050) / 0.028;
      const dy = (y - 0.052) / 0.034;
      const d2 = dx * dx + dy * dy;
      if (d2 < 1.0) {
        const indent = (1.0 - d2) * 0.022;
        pos.setZ(i, z - indent);
      }
    }
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

/**
 * Generates a sculpted, tapered 3D hair lock along a CatmullRomCurve3 with root-to-tip UVs
 * for Elden Ring-style windswept shoulder-length hair layers.
 */
export function createHairLockGeometry(
  curve: THREE.CatmullRomCurve3,
  rootWidth: number = 0.065,
  tipWidth: number = 0.010,
  thickness: number = 0.018,
  segments: number = 14
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(segments, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // 6-vertex flattened elliptical ribbon profile per ring (wide flat lock with subtle central ridge)
  const profileAngles = [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3];
  const ringVerts = profileAngles.length + 1; // closed UV seam

  for (let j = 0; j <= segments; j++) {
    const t = j / segments;
    const pt = curve.getPointAt(t);
    const tangent = frames.tangents[j];

    // Stable outward lateral axis perpendicular to tangent and world Z/X radial direction
    const radial = new THREE.Vector3(pt.x, 0, pt.z);
    if (radial.lengthSq() < 0.0001) radial.set(0, 0, 1);
    radial.normalize();

    const side = new THREE.Vector3().crossVectors(radial, tangent);
    if (side.lengthSq() < 0.0001) side.set(1, 0, 0);
    side.normalize();
    const out = new THREE.Vector3().crossVectors(tangent, side).normalize();

    // Smooth taper from fuller root/mid-shaft to wispy sharp tip
    const taper = t < 0.25
      ? THREE.MathUtils.lerp(0.85, 1.0, t / 0.25)
      : Math.pow(1.0 - (t - 0.25) / 0.75, 0.85);
    const w = THREE.MathUtils.lerp(tipWidth, rootWidth, taper) * 0.5;
    const th = thickness * Math.max(0.28, taper) * 0.5;

    for (let i = 0; i < ringVerts; i++) {
      const idx = i % profileAngles.length;
      const ang = profileAngles[idx];
      const cx = Math.cos(ang) * w;
      const cy = Math.sin(ang) * th;

      const vx = pt.x + side.x * cx + out.x * cy;
      const vy = pt.y + side.y * cx + out.y * cy;
      const vz = pt.z + side.z * cx + out.z * cy;

      positions.push(vx, vy, vz);
      uvs.push(i / profileAngles.length, t);
    }
  }

  for (let j = 0; j < segments; j++) {
    for (let i = 0; i < profileAngles.length; i++) {
      const a = j * ringVerts + i;
      const b = (j + 1) * ringVerts + i;
      const c = (j + 1) * ringVerts + (i + 1);
      const d = j * ringVerts + (i + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds anatomical limb segment (bicep / forearm / thigh / calf)
 */
export function createAnatomicalLimb(
  upperR: number,
  midR: number,
  lowerR: number,
  length: number,
  bulgeFront: number = 0,
  bulgeSide: number = 0
): THREE.BufferGeometry {
  const slices: LoftedSlice[] = [
    { y: 0, rx: upperR, rz: upperR },
    { y: -length * 0.35, rx: midR + bulgeSide, rz: midR + bulgeFront, bulgeZFront: bulgeFront },
    { y: -length * 0.7, rx: (midR + lowerR) * 0.5, rz: (midR + lowerR) * 0.5 },
    { y: -length, rx: lowerR, rz: lowerR },
  ];
  return createLoftedBodyGeometry(slices, 16, true, true);
}

/**
 * Builds a complete Gothic Armored Gauntlet with wrist collar bridge, dorsal metacarpal plates,
 * beveled knuckle guard + bosses, restrained blue rune inlay, and individually modeled armored thumb & fingers.
 */
export function createArticulatedHand(
  isRight: boolean,
  material: THREE.Material,
  trimMat?: THREE.Material,
  runeAccentMat?: THREE.Material
): THREE.Group {
  const handGroup = new THREE.Group();
  const sign = isRight ? 1 : -1;
  const edgeMat = trimMat ?? material;
  const accentMat = runeAccentMat ?? edgeMat;

  // 1. Armored Wrist Hinge Dome & Carpal Collar (bridges inside forearm bell cuff with zero gap)
  const wristBall = new THREE.Mesh(
    finalizeArmorGeom(new THREE.SphereGeometry(0.056, 10, 8)),
    material
  );
  wristBall.scale.set(1.12, 0.78, 0.85);
  handGroup.add(wristBall);

  // 2. Palm / Metacarpal Block + Dorsal Armored Backplate & Overlapping Carpal Lames
  const palmGeom = new THREE.BoxGeometry(0.082, 0.092, 0.044);
  const palm = new THREE.Mesh(palmGeom, material);
  palm.position.set(0, -0.046, 0);
  palm.castShadow = true;
  handGroup.add(palm);

  const dorsalPlateGeom = createBeveledGothicPlate(
    [
      [0, -0.042],
      [0.042, -0.025],
      [0.038, 0.036],
      [0, 0.045],
      [-0.038, 0.036],
      [-0.042, -0.025],
    ],
    0.012,
    0.005,
    0.005
  );
  const dorsalPlate = new THREE.Mesh(dorsalPlateGeom, edgeMat);
  dorsalPlate.position.set(0, -0.044, -0.024);
  dorsalPlate.castShadow = true;
  handGroup.add(dorsalPlate);

  // Overlapping carpal articulation lames bridging wrist to metacarpal plate
  for (let l = 0; l < 2; l++) {
    const carpalLame = new THREE.Mesh(
      new THREE.CylinderGeometry(0.054 - l * 0.003, 0.058 - l * 0.003, 0.022, 10),
      l === 0 ? edgeMat : material
    );
    carpalLame.scale.set(1.06, 1.0, 0.68);
    carpalLame.position.set(0, -0.014 - l * 0.018, -0.004);
    handGroup.add(carpalLame);
  }

  // Restrained supernatural blue rune sigil inlaid on dorsal gauntlet plate
  const handRune = new THREE.Mesh(new THREE.OctahedronGeometry(0.013, 0), accentMat);
  handRune.scale.set(0.75, 1.45, 0.35);
  handRune.position.set(0, -0.045, -0.034);
  handGroup.add(handRune);

  // Beveled Gothic Knuckle Guard Bar
  const knuckleGuard = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.018, 0.026), edgeMat);
  knuckleGuard.position.set(0, -0.086, -0.020);
  knuckleGuard.castShadow = true;
  handGroup.add(knuckleGuard);

  // 3. Individually Modeled Armored Thumb (Metacarpal Shield + Proximal + Pointed Distal Plate)
  const thumbBase = new THREE.Group();
  thumbBase.position.set(sign * 0.045, -0.028, 0.014);
  thumbBase.rotation.set(-0.28, -sign * 0.45, -sign * 0.38);
  handGroup.add(thumbBase);

  const thumbKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), edgeMat);
  thumbBase.add(thumbKnuckle);

  const thumbMeta = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.028, 0.016), edgeMat);
  thumbMeta.position.set(0, -0.014, -0.006);
  thumbBase.add(thumbMeta);

  const thumbProximal = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.012, 0.038, 6), material);
  thumbProximal.position.y = -0.022;
  thumbBase.add(thumbProximal);

  const thumbPlate1 = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.028, 0.012), edgeMat);
  thumbPlate1.position.set(0, -0.024, -0.010);
  thumbBase.add(thumbPlate1);

  const thumbDistal = new THREE.Mesh(new THREE.ConeGeometry(0.0115, 0.034, 6), edgeMat);
  thumbDistal.rotation.x = Math.PI * 0.88;
  thumbDistal.position.set(0, -0.052, 0.006);
  thumbBase.add(thumbDistal);

  // 4. Four Individually Modeled Articulated Armored Fingers (Knuckle Boss + 3 Segmented Armor Phalanges)
  const fingerConfigs = [
    { offset: 0.030, len: 0.078, thick: 0.0120 }, // Index
    { offset: 0.010, len: 0.086, thick: 0.0128 }, // Middle
    { offset: -0.010, len: 0.080, thick: 0.0120 }, // Ring
    { offset: -0.030, len: 0.068, thick: 0.0108 }, // Pinky
  ];

  fingerConfigs.forEach((cfg) => {
    const fingerGroup = new THREE.Group();
    fingerGroup.position.set(sign * cfg.offset, -0.090, 0);
    // Curl forward toward palmar +Z around the greatsword grip while showing dorsal finger armor
    fingerGroup.rotation.x = -Math.PI * 0.44;
    handGroup.add(fingerGroup);

    // Knuckle Boss & Hinge
    const knuckleBoss = new THREE.Mesh(new THREE.OctahedronGeometry(cfg.thick * 1.15, 0), edgeMat);
    knuckleBoss.position.set(0, 0.004, -0.010);
    fingerGroup.add(knuckleBoss);

    // Proximal armored phalanx
    const f1Len = cfg.len * 0.44;
    const f1 = new THREE.Mesh(
      new THREE.CylinderGeometry(cfg.thick, cfg.thick * 0.92, f1Len, 6),
      material
    );
    f1.position.y = -f1Len * 0.5;
    fingerGroup.add(f1);

    const p1Plate = new THREE.Mesh(
      new THREE.BoxGeometry(cfg.thick * 1.85, f1Len * 0.92, cfg.thick * 0.9),
      edgeMat
    );
    p1Plate.position.set(0, -f1Len * 0.5, -cfg.thick * 0.72);
    fingerGroup.add(p1Plate);

    // Medial joint & armored phalanx
    const midJoint = new THREE.Group();
    midJoint.position.set(0, -f1Len, 0);
    midJoint.rotation.x = -0.52;
    fingerGroup.add(midJoint);

    const midKnuckle = new THREE.Mesh(new THREE.SphereGeometry(cfg.thick * 0.9, 6, 6), edgeMat);
    midJoint.add(midKnuckle);

    const f2Len = cfg.len * 0.34;
    const f2 = new THREE.Mesh(
      new THREE.CylinderGeometry(cfg.thick * 0.90, cfg.thick * 0.78, f2Len, 6),
      material
    );
    f2.position.y = -f2Len * 0.5;
    midJoint.add(f2);

    const p2Plate = new THREE.Mesh(
      new THREE.BoxGeometry(cfg.thick * 1.65, f2Len * 0.9, cfg.thick * 0.8),
      material
    );
    p2Plate.position.set(0, -f2Len * 0.5, -cfg.thick * 0.65);
    midJoint.add(p2Plate);

    // Distal tapered Gothic fingertip armor
    const distJoint = new THREE.Group();
    distJoint.position.set(0, -f2Len, 0);
    distJoint.rotation.x = -0.38;
    midJoint.add(distJoint);

    const f3Len = cfg.len * 0.28;
    const f3 = new THREE.Mesh(new THREE.ConeGeometry(cfg.thick * 0.82, f3Len, 6), edgeMat);
    f3.rotation.x = Math.PI;
    f3.position.y = -f3Len * 0.5;
    distJoint.add(f3);
  });

  return handGroup;
}

/**
 * Builds sculpted gothic pointed sabaton foot with articulated lames and heel spur
 */
export function createGothicSabatonFoot(material: THREE.Material, silverMat: THREE.Material): THREE.Group {
  const foot = new THREE.Group();

  // 1. Ankle & Heel cup
  const heel = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.12), material);
  heel.position.set(0, -0.04, -0.04);
  heel.castShadow = true;
  foot.add(heel);

  // 2. Arch & Metatarsal ridge
  const instep = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 5), material);
  instep.rotation.x = Math.PI * 0.45;
  instep.position.set(0, -0.03, 0.04);
  foot.add(instep);

  // 3. Pointed gothic toe (Poulin / Cracowe point)
  const toePoint = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 4), silverMat);
  toePoint.rotation.x = -Math.PI / 2;
  toePoint.position.set(0, -0.05, 0.15);
  toePoint.castShadow = true;
  foot.add(toePoint);

  // 4. Heel spur
  const spur = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), silverMat);
  spur.rotation.x = Math.PI / 2;
  spur.position.set(0, -0.03, -0.11);
  foot.add(spur);

  return foot;
}

function finalizeArmorGeom(geom: THREE.BufferGeometry): THREE.BufferGeometry {
  geom.computeVertexNormals();
  if (geom.index && geom.attributes.uv && geom.attributes.normal) {
    geom.computeTangents();
  }
  return geom;
}

/**
 * Helper to create a beveled angular Gothic plate via ExtrudeGeometry
 */
function createBeveledGothicPlate(
  points: [number, number][],
  depth: number = 0.018,
  bevelSize: number = 0.008,
  bevelThickness: number = 0.008
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize,
    bevelThickness,
  });
  geom.center();
  return finalizeArmorGeom(geom);
}

/**
 * Builds expanded Sovereign-forged 3-layer overlapping Gothic pauldron
 * Preserves shoulder joint origin & animation articulation while expanding silhouette,
 * beveled rims, raised structural ridges, engraved trim, and subtle spikes.
 */
export function createTieredGothicPauldron(
  isRight: boolean,
  damascusMat: THREE.Material,
  trimMat: THREE.Material,
  highlightMat?: THREE.Material
): THREE.Group {
  const pauldron = new THREE.Group();
  const sign = isRight ? -1 : 1;
  const edgeMat = highlightMat ?? trimMat;

  // 1. Expanded Primary Deltoid Dome Shell with Beveled Collar Rim
  const domeGeom = finalizeArmorGeom(
    new THREE.SphereGeometry(0.245, 18, 12, 0, Math.PI, 0, Math.PI * 0.68)
  );
  const dome = new THREE.Mesh(domeGeom, damascusMat);
  dome.rotation.z = sign * 0.34;
  dome.rotation.x = -Math.PI / 2;
  dome.scale.set(1.18, 0.96, 1.24);
  dome.castShadow = true;
  pauldron.add(dome);

  // Raised central spine ridge arching over upper shoulder dome
  const crownRidgeGeom = finalizeArmorGeom(new THREE.TorusGeometry(0.242, 0.017, 6, 16, Math.PI * 0.72));
  const crownRidge = new THREE.Mesh(crownRidgeGeom, trimMat);
  crownRidge.rotation.set(Math.PI * 0.14, sign * 0.12, sign * 0.34);
  crownRidge.position.set(sign * 0.02, 0.01, 0);
  crownRidge.castShadow = true;
  pauldron.add(crownRidge);

  // Beveled front/rear collar flange lip
  const collarFlangeGeom = finalizeArmorGeom(new THREE.TorusGeometry(0.225, 0.013, 6, 16, Math.PI * 0.9));
  const collarFlange = new THREE.Mesh(collarFlangeGeom, edgeMat);
  collarFlange.rotation.set(Math.PI * 0.5, sign * 0.35, -sign * Math.PI * 0.45);
  collarFlange.position.set(sign * 0.01, 0.06, 0);
  pauldron.add(collarFlange);

  // 2. Expanded Flared Gothic Gardbrace (Angular neck-guard shield with beveled edges)
  const gardbraceGeom = createBeveledGothicPlate(
    [
      [-0.06, -0.02],
      [0.08, 0.02],
      [0.13, 0.24],
      [0.04, 0.34],
      [-0.08, 0.20],
    ],
    0.024,
    0.011,
    0.012
  );
  const gardbrace = new THREE.Mesh(gardbraceGeom, trimMat);
  gardbrace.rotation.set(0.10, sign * 0.22, -sign * 0.36);
  gardbrace.position.set(sign * 0.08, 0.18, -0.02);
  gardbrace.castShadow = true;
  pauldron.add(gardbrace);

  // 3. Three Overlapping Gothic Plate Layers (Stepped downward & outward over deltoid)
  const layerConfigs = [
    { rTop: 0.235, rBot: 0.265, h: 0.095, x: 0.055, y: -0.045, rotZ: 0.38, mat: damascusMat, ridgeScale: 1.0 },
    { rTop: 0.225, rBot: 0.258, h: 0.090, x: 0.095, y: -0.115, rotZ: 0.50, mat: trimMat, ridgeScale: 0.92 },
    { rTop: 0.208, rBot: 0.245, h: 0.088, x: 0.132, y: -0.185, rotZ: 0.62, mat: damascusMat, ridgeScale: 0.85 },
  ];

  layerConfigs.forEach((cfg, idx) => {
    const layerGroup = new THREE.Group();
    layerGroup.position.set(sign * cfg.x, cfg.y, 0);
    layerGroup.rotation.z = sign * cfg.rotZ;

    // Curved overlapping plate layer oriented laterally over outer deltoid (+/-X)
    const lameGeom = finalizeArmorGeom(
      new THREE.CylinderGeometry(cfg.rTop, cfg.rBot, cfg.h, 14, 1, false, -Math.PI * 0.45, Math.PI * 0.9)
    );
    const lame = new THREE.Mesh(lameGeom, cfg.mat);
    lame.rotation.y = sign * (Math.PI / 2);
    lame.castShadow = true;
    layerGroup.add(lame);

    // Beveled lower metallic rim trim along plate edge
    const rimGeom = finalizeArmorGeom(
      new THREE.TorusGeometry(cfg.rBot * 0.98, 0.010, 5, 14, Math.PI * 0.88)
    );
    const rim = new THREE.Mesh(rimGeom, edgeMat);
    rim.rotation.x = Math.PI / 2;
    rim.rotation.z = sign > 0 ? Math.PI * 0.44 : -Math.PI * 0.56;
    rim.position.y = -cfg.h * 0.48;
    layerGroup.add(rim);

    // Raised vertical central rib + angular gothic cusp point on outer edge
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.024 * cfg.ridgeScale, cfg.h * 1.12, 0.032),
      edgeMat
    );
    rib.position.set(sign * cfg.rBot * 0.97, 0, 0);
    layerGroup.add(rib);

    if (idx === 2) {
      const cuspPoint = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.095, 4), edgeMat);
      cuspPoint.rotation.z = sign * Math.PI;
      cuspPoint.position.set(sign * cfg.rBot * 0.98, -cfg.h * 0.72, 0);
      layerGroup.add(cuspPoint);
    }

    pauldron.add(layerGroup);
  });

  // 4. Sovereign Executioner Ridge Spikes (Primary crown spike + twin swept dorsal thorns)
  const crestSpike = new THREE.Mesh(finalizeArmorGeom(new THREE.ConeGeometry(0.052, 0.25, 6)), edgeMat);
  crestSpike.position.set(sign * 0.16, 0.27, 0);
  crestSpike.rotation.z = -sign * 0.52;
  crestSpike.castShadow = true;
  pauldron.add(crestSpike);

  for (const zOff of [-0.075, 0.075]) {
    const minorSpike = new THREE.Mesh(finalizeArmorGeom(new THREE.ConeGeometry(0.026, 0.135, 4)), edgeMat);
    minorSpike.position.set(sign * 0.20, 0.19, zOff);
    minorSpike.rotation.set(zOff > 0 ? 0.28 : -0.28, 0, -sign * 0.72);
    minorSpike.castShadow = true;
    pauldron.add(minorSpike);
  }

  return pauldron;
}

/**
 * Additive Cuirass Layering (Beveled Gothic V-Plackart, Gorget Wings & Lower Fauld Lames)
 * Preserves Azrael's central blue Sovereign Wrath chest rune at (0, 0.16, 0.235).
 */
export function createCuirassRuinicOverlay(
  damascusMat: THREE.Material,
  trimMat: THREE.Material
): THREE.Group {
  const overlay = new THREE.Group();

  // 1. Beveled Lower V-Plackart Shield rising from waist up to sternum (clears chest rune above y=0.09)
  const plackartGeom = createBeveledGothicPlate(
    [
      [0, -0.14],
      [0.145, -0.06],
      [0.175, 0.075],
      [0, 0.115],
      [-0.175, 0.075],
      [-0.145, -0.06],
    ],
    0.032,
    0.012,
    0.012
  );
  const plackart = new THREE.Mesh(plackartGeom, damascusMat);
  plackart.position.set(0, -0.01, 0.214);
  plackart.rotation.x = -0.18;
  plackart.castShadow = true;
  overlay.add(plackart);

  // Raised central spine rib on lower plackart
  const plackartRib = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.21, 4), trimMat);
  plackartRib.position.set(0, -0.01, 0.242);
  plackartRib.rotation.x = -0.18;
  overlay.add(plackartRib);

  // 2. Twin Beveled Gorget / Clavicle Wing Plates flanking the neck & framing the blue chest rune
  for (const side of [-1, 1] as const) {
    const gorgetWingGeom = createBeveledGothicPlate(
      [
        [0, -0.04],
        [0.14, 0.02],
        [0.17, 0.08],
        [0.03, 0.06],
      ],
      0.018,
      0.008,
      0.008
    );
    const wing = new THREE.Mesh(gorgetWingGeom, trimMat);
    wing.position.set(side * 0.14, 0.285, 0.165);
    wing.rotation.set(-0.26, side * 0.34, side * 0.16);
    if (side < 0) wing.scale.x = -1;
    wing.castShadow = true;
    overlay.add(wing);

    // Lower lateral ribcage guard plates
    const ribPlateGeom = createBeveledGothicPlate(
      [
        [-0.06, -0.07],
        [0.06, -0.05],
        [0.08, 0.07],
        [-0.05, 0.05],
      ],
      0.022,
      0.008,
      0.008
    );
    const ribPlate = new THREE.Mesh(ribPlateGeom, damascusMat);
    ribPlate.position.set(side * 0.225, 0.03, 0.075);
    ribPlate.rotation.set(0, side * 1.15, -side * 0.10);
    ribPlate.castShadow = true;
    overlay.add(ribPlate);
  }

  return overlay;
}

/**
 * Additive Back & Spine Armor Plating (Beveled Scapula Wing Plates + Overlapping Vertebral Lames)
 * Positioned cleanly ahead of the cape mount (z >= -0.175) so the shredded cape remains free.
 */
export function createBackSpinePlating(
  damascusMat: THREE.Material,
  trimMat: THREE.Material
): THREE.Group {
  const backGroup = new THREE.Group();

  // 1. Twin Beveled Scapula Wing Plates flanking the upper back
  for (const side of [-1, 1] as const) {
    const scapulaGeom = createBeveledGothicPlate(
      [
        [0, -0.11],
        [0.13, -0.07],
        [0.17, 0.09],
        [0.02, 0.12],
      ],
      0.020,
      0.009,
      0.009
    );
    const scapula = new THREE.Mesh(scapulaGeom, damascusMat);
    scapula.position.set(side * 0.13, 0.20, -0.145);
    scapula.rotation.set(0.14, -side * 0.28, -side * 0.12);
    if (side < 0) scapula.scale.x = -1;
    scapula.castShadow = true;
    backGroup.add(scapula);
  }

  // 2. Five Overlapping Articulated Vertebral Spine Lames descending down dorsal spine
  for (let v = 0; v < 5; v++) {
    const w = 0.092 - v * 0.008;
    const lameGeom = createBeveledGothicPlate(
      [
        [0, -0.042],
        [w, 0.012],
        [0, 0.045],
        [-w, 0.012],
      ],
      0.020,
      0.006,
      0.006
    );
    const lame = new THREE.Mesh(lameGeom, v % 2 === 0 ? trimMat : damascusMat);
    lame.position.set(0, 0.27 - v * 0.076, -0.158 + v * 0.006);
    lame.rotation.x = 0.18;
    lame.castShadow = true;
    backGroup.add(lame);

    // Subtle dorsal spine spur
    const spur = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.055, 4), trimMat);
    spur.rotation.x = -Math.PI * 0.56;
    spur.position.set(0, 0.27 - v * 0.076, -0.180 + v * 0.006);
    backGroup.add(spur);
  }

  return backGroup;
}

/**
 * Additive Shoulder Socket Bridge & Besagew Guards (seals gap between cuirass armhole, pauldron, and bicep)
 */
export function createShoulderSocketBridge(
  isRight: boolean,
  damascusMat: THREE.Material,
  trimMat: THREE.Material
): THREE.Group {
  const bridge = new THREE.Group();
  const sign = isRight ? -1 : 1;

  // Full 360-degree armored shoulder joint sleeve sealing chest-to-deltoid transition
  const socketCollar = new THREE.Mesh(
    finalizeArmorGeom(new THREE.CylinderGeometry(0.114, 0.106, 0.13, 14)),
    damascusMat
  );
  socketCollar.position.set(-sign * 0.015, -0.025, 0);
  socketCollar.rotation.z = sign * 0.12;
  socketCollar.castShadow = true;
  bridge.add(socketCollar);

  // Anterior & Posterior Besagew Roundels sealing front & back armpit seams during swings
  for (const zDir of [-1, 1] as const) {
    const besagew = new THREE.Mesh(
      finalizeArmorGeom(new THREE.CylinderGeometry(0.068, 0.072, 0.018, 8)),
      trimMat
    );
    besagew.rotation.x = Math.PI / 2;
    besagew.rotation.z = zDir * 0.14;
    besagew.position.set(-sign * 0.02, -0.035, zDir * 0.095);
    besagew.castShadow = true;
    bridge.add(besagew);
  }

  return bridge;
}

/**
 * Additive Upper-Arm Rerebrace Guard & Articulated Elbow Hinge Bridge (on leftArm / rightArm)
 * Provides continuous 360-degree upper-arm coverage + sealed elbow ball joint.
 */
export function createRerebraceGuard(
  isRight: boolean,
  damascusMat: THREE.Material,
  trimMat: THREE.Material,
  runeAccentMat?: THREE.Material
): THREE.Group {
  const rerebrace = new THREE.Group();
  const sign = isRight ? -1 : 1;
  const accentMat = runeAccentMat ?? trimMat;

  // Continuous 360-degree fitted Damascus upper-arm cannon sleeve (y = -0.02 to -0.265)
  const upperCuff = new THREE.Mesh(
    finalizeArmorGeom(new THREE.CylinderGeometry(0.104, 0.098, 0.095, 14)),
    damascusMat
  );
  upperCuff.position.set(0, -0.068, 0);
  upperCuff.castShadow = true;
  rerebrace.add(upperCuff);

  const mainCannon = new THREE.Mesh(
    finalizeArmorGeom(new THREE.CylinderGeometry(0.096, 0.086, 0.165, 14)),
    damascusMat
  );
  mainCannon.position.set(0, -0.175, 0);
  mainCannon.castShadow = true;
  rerebrace.add(mainCannon);

  // Layered outer overlapping Gothic shells
  for (let i = 0; i < 2; i++) {
    const shellGeom = finalizeArmorGeom(
      new THREE.CylinderGeometry(
        0.108 - i * 0.006,
        0.100 - i * 0.006,
        0.10,
        12,
        1,
        false,
        -Math.PI * 0.45,
        Math.PI * 0.90
      )
    );
    const shell = new THREE.Mesh(shellGeom, i === 0 ? damascusMat : trimMat);
    shell.position.set(sign * 0.006, -0.09 - i * 0.08, 0);
    shell.rotation.y = sign * (Math.PI / 2);
    shell.castShadow = true;
    rerebrace.add(shell);
  }

  // Lateral Gothic ridge rib + restrained blue supernatural rune strip
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.19, 0.026), trimMat);
  ridge.position.set(sign * 0.102, -0.13, 0);
  rerebrace.add(ridge);

  const runeStrip = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.135, 0.010), accentMat);
  runeStrip.position.set(sign * 0.111, -0.13, 0);
  rerebrace.add(runeStrip);

  // Articulated 360-degree Armored Elbow Pivot Sphere (seals elbow crease up to 90deg flexion)
  const elbowSphere = new THREE.Mesh(
    finalizeArmorGeom(new THREE.SphereGeometry(0.086, 12, 10)),
    damascusMat
  );
  elbowSphere.position.set(0, -0.278, 0);
  elbowSphere.castShadow = true;
  rerebrace.add(elbowSphere);

  return rerebrace;
}

/**
 * Additive Forearm Vambrace, Winged Gothic Couter & Flared Gauntlet Bell Cuff (on leftForearm / rightForearm)
 * Overlaps both elbow hinge above and wrist/gauntlet collar below with zero exposed gaps.
 */
export function createGothicCouterAndVambrace(
  isRight: boolean,
  damascusMat: THREE.Material,
  trimMat: THREE.Material,
  runeAccentMat?: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  const sign = isRight ? -1 : 1;
  const accentMat = runeAccentMat ?? trimMat;

  // 1. Overlapping Articulated Elbow Bridge Lames (front/back upper forearm lames sealing elbow joint)
  for (let e = 0; e < 2; e++) {
    const elbowLame = new THREE.Mesh(
      finalizeArmorGeom(new THREE.CylinderGeometry(0.094 - e * 0.003, 0.098 - e * 0.003, 0.048, 14)),
      e === 0 ? trimMat : damascusMat
    );
    elbowLame.position.set(0, 0.008 - e * 0.036, -0.005);
    elbowLame.castShadow = true;
    group.add(elbowLame);
  }

  // Sculpted Winged Gothic Couter (Elbow Guard Cup + Lateral Fan Wing)
  const couterCupGeom = finalizeArmorGeom(
    new THREE.SphereGeometry(0.092, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58)
  );
  const couterCup = new THREE.Mesh(couterCupGeom, damascusMat);
  couterCup.rotation.x = -Math.PI * 0.55;
  couterCup.position.set(0, -0.022, -0.035);
  couterCup.castShadow = true;
  group.add(couterCup);

  const couterWingGeom = createBeveledGothicPlate(
    [
      [0, -0.048],
      [0.090, -0.026],
      [0.110, 0.038],
      [0.02, 0.064],
    ],
    0.018,
    0.006,
    0.006
  );
  const couterWing = new THREE.Mesh(couterWingGeom, trimMat);
  couterWing.position.set(sign * 0.078, -0.022, -0.025);
  couterWing.rotation.set(0.15, sign * 0.35, -sign * 0.18);
  if (sign < 0) couterWing.scale.x = -1;
  couterWing.castShadow = true;
  group.add(couterWing);

  // 2. Layered 360-degree Forearm Vambrace Sleeves (continuous armor down to wrist)
  const upperVambrace = new THREE.Mesh(
    finalizeArmorGeom(new THREE.CylinderGeometry(0.095, 0.086, 0.11, 14)),
    damascusMat
  );
  upperVambrace.position.set(0, -0.095, 0);
  upperVambrace.castShadow = true;
  group.add(upperVambrace);

  const lowerVambrace = new THREE.Mesh(
    finalizeArmorGeom(new THREE.CylinderGeometry(0.086, 0.074, 0.11, 14)),
    damascusMat
  );
  lowerVambrace.position.set(0, -0.185, 0);
  lowerVambrace.castShadow = true;
  group.add(lowerVambrace);

  // Fluted Outer Vambrace Ridge Plate + restrained blue rune energy channel
  const vambraceRidge = new THREE.Mesh(
    createBeveledGothicPlate(
      [
        [0, -0.105],
        [0.044, -0.065],
        [0.050, 0.085],
        [0, 0.115],
        [-0.050, 0.085],
        [-0.044, -0.065],
      ],
      0.018,
      0.006,
      0.006
    ),
    damascusMat
  );
  vambraceRidge.position.set(sign * 0.078, -0.155, 0.012);
  vambraceRidge.rotation.y = sign * Math.PI * 0.45;
  vambraceRidge.castShadow = true;
  group.add(vambraceRidge);

  const vambraceRune = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.155, 0.010), accentMat);
  vambraceRune.position.set(sign * 0.090, -0.155, 0.012);
  group.add(vambraceRune);

  // 3. Flared Gothic Gauntlet Bell Cuff (overlaps y = -0.215 down to -0.298 over wrist pivot)
  const wristCuff = new THREE.Mesh(
    finalizeArmorGeom(new THREE.CylinderGeometry(0.084, 0.096, 0.082, 14)),
    trimMat
  );
  wristCuff.position.set(0, -0.256, 0);
  wristCuff.castShadow = true;
  group.add(wristCuff);

  return group;
}

/**
 * Additive Waist Armor (Beveled Sovereign Belt Clasp & Layered Multi-Tier Hip Tasset Shields)
 */
export function createWaistTassetAssembly(
  damascusMat: THREE.Material,
  trimMat: THREE.Material
): THREE.Group {
  const waist = new THREE.Group();

  // Beveled frontal Sovereign waist guard plate framing the belt buckle
  const centerPlateGeom = createBeveledGothicPlate(
    [
      [0, -0.055],
      [0.095, -0.02],
      [0.085, 0.05],
      [-0.085, 0.05],
      [-0.095, -0.02],
    ],
    0.022,
    0.008,
    0.008
  );
  const centerPlate = new THREE.Mesh(centerPlateGeom, trimMat);
  centerPlate.position.set(0, 0.095, 0.246);
  centerPlate.castShadow = true;
  waist.add(centerPlate);

  // Two-tier overlapping angular hip tasset shields on each flank
  for (const side of [-1, 1] as const) {
    for (let tier = 0; tier < 2; tier++) {
      const wTop = 0.105 - tier * 0.014;
      const wBot = 0.072 - tier * 0.012;
      const h = 0.092;
      const tassetGeom = createBeveledGothicPlate(
        [
          [0, -h * 0.68],
          [wBot, -h * 0.25],
          [wTop, h * 0.5],
          [-wTop, h * 0.5],
          [-wBot, -h * 0.25],
        ],
        0.018,
        0.007,
        0.007
      );
      const tasset = new THREE.Mesh(tassetGeom, tier === 0 ? damascusMat : trimMat);
      tasset.position.set(side * (0.255 + tier * 0.018), -0.02 - tier * 0.105, 0.035);
      tasset.rotation.set(-0.08, side * 1.15, -side * (0.18 + tier * 0.06));
      tasset.castShadow = true;
      waist.add(tasset);
    }
  }

  return waist;
}

/**
 * Additive Thigh Cuisse Plate Overlay (mounted on leftThigh / rightThigh)
 */
export function createThighCuisseOverlay(
  isRight: boolean,
  damascusMat: THREE.Material,
  trimMat: THREE.Material
): THREE.Group {
  const cuisse = new THREE.Group();
  const sign = isRight ? -1 : 1;

  const frontPlateGeom = createBeveledGothicPlate(
    [
      [0, -0.14],
      [0.075, -0.08],
      [0.092, 0.11],
      [0, 0.15],
      [-0.092, 0.11],
      [-0.075, -0.08],
    ],
    0.020,
    0.008,
    0.008
  );
  const frontPlate = new THREE.Mesh(frontPlateGeom, damascusMat);
  frontPlate.position.set(sign * 0.012, -0.20, 0.112);
  frontPlate.castShadow = true;
  cuisse.add(frontPlate);

  // Raised center ridge along thigh plate
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.24, 0.024), trimMat);
  ridge.position.set(sign * 0.012, -0.20, 0.126);
  cuisse.add(ridge);

  return cuisse;
}

/**
 * Additive Winged Knee Poleyn & Fluted Anterior Leg Greave Overlay (mounted on leftShin / rightShin)
 */
export function createShinPoleynAndGreaveOverlay(
  isRight: boolean,
  damascusMat: THREE.Material,
  trimMat: THREE.Material
): THREE.Group {
  const shinGroup = new THREE.Group();
  const sign = isRight ? -1 : 1;

  // 1. Winged Gothic Knee Poleyn (frames existing knee point)
  const poleynCupGeom = createBeveledGothicPlate(
    [
      [0, -0.07],
      [0.082, -0.01],
      [0.072, 0.065],
      [0, 0.088],
      [-0.072, 0.065],
      [-0.082, -0.01],
    ],
    0.024,
    0.009,
    0.009
  );
  const poleynCup = new THREE.Mesh(poleynCupGeom, trimMat);
  poleynCup.position.set(0, 0.01, 0.105);
  poleynCup.castShadow = true;
  shinGroup.add(poleynCup);

  const sideWingGeom = createBeveledGothicPlate(
    [
      [0, -0.055],
      [0.085, -0.02],
      [0.095, 0.045],
      [0.01, 0.06],
    ],
    0.016,
    0.006,
    0.006
  );
  const sideWing = new THREE.Mesh(sideWingGeom, damascusMat);
  sideWing.position.set(sign * 0.095, 0.005, 0.045);
  sideWing.rotation.y = sign * 0.65;
  if (sign < 0) sideWing.scale.x = -1;
  sideWing.castShadow = true;
  shinGroup.add(sideWing);

  // 2. Fluted Anterior Shin Greave Plate + Beveled Ankle Cuff
  const greaveFrontGeom = createBeveledGothicPlate(
    [
      [0, -0.155],
      [0.058, -0.11],
      [0.078, 0.12],
      [0, 0.155],
      [-0.078, 0.12],
      [-0.058, -0.11],
    ],
    0.020,
    0.007,
    0.007
  );
  const greaveFront = new THREE.Mesh(greaveFrontGeom, damascusMat);
  greaveFront.position.set(0, -0.225, 0.098);
  greaveFront.castShadow = true;
  shinGroup.add(greaveFront);

  const shinRidge = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.27, 0.022), trimMat);
  shinRidge.position.set(0, -0.225, 0.112);
  shinGroup.add(shinRidge);

  const ankleCuff = new THREE.Mesh(
    finalizeArmorGeom(new THREE.CylinderGeometry(0.090, 0.096, 0.058, 12)),
    trimMat
  );
  ankleCuff.position.set(0, -0.395, 0);
  ankleCuff.castShadow = true;
  shinGroup.add(ankleCuff);

  return shinGroup;
}

/**
 * Builds Azrael's iconic Executioner Greatsword with glowing cyan runic fuller
 */
export function createExecutionerGreatsword(
  bladeSteelMat: THREE.Material,
  runeGlowMat: THREE.Material,
  silverMat: THREE.Material,
  leatherMat: THREE.Material
): { swordGroup: THREE.Group; runeLight: THREE.PointLight } {
  const sword = new THREE.Group();

  // 1. Central Blade Geometry (Double-edged broad executioner blade)
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0.11, 0);
  bladeShape.lineTo(0.10, 1.7);
  bladeShape.lineTo(0.12, 1.82); // Flared executioner bevel
  bladeShape.lineTo(0, 2.05);    // Chiseled diamond point
  bladeShape.lineTo(-0.12, 1.82);
  bladeShape.lineTo(-0.10, 1.7);
  bladeShape.lineTo(-0.11, 0);
  bladeShape.closePath();

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.028,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.012,
    bevelThickness: 0.014,
  };

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
  bladeGeom.center();
  const blade = new THREE.Mesh(bladeGeom, bladeSteelMat);
  blade.position.y = 1.05;
  blade.castShadow = true;
  sword.add(blade);

  // 2. Central Fuller with Glowing Supernatural Runes (Front & Back)
  const fullerGeom = new THREE.BoxGeometry(0.065, 1.55, 0.058);
  const fullerMesh = new THREE.Mesh(fullerGeom, runeGlowMat);
  fullerMesh.position.y = 1.0;
  sword.add(fullerMesh);

  // 3. Down-curved Gothic Crossguard with Quillons
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.11), silverMat);
  guard.position.y = 0.05;
  guard.castShadow = true;
  sword.add(guard);

  const quillonL = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.24, 4), silverMat);
  quillonL.rotation.z = Math.PI * 0.72;
  quillonL.position.set(0.35, -0.02, 0);
  sword.add(quillonL);

  const quillonR = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.24, 4), silverMat);
  quillonR.rotation.z = -Math.PI * 0.72;
  quillonR.position.set(-0.35, -0.02, 0);
  sword.add(quillonR);

  // Central Gothic Crest Jewel
  const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), runeGlowMat);
  jewel.position.set(0, 0.05, 0.065);
  sword.add(jewel);

  // 4. Two-Handed Grip with Wire Wrap
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.034, 0.52, 10), leatherMat);
  grip.position.y = -0.22;
  sword.add(grip);

  // Grip wire ribs
  for (let w = 0; w < 6; w++) {
    const wire = new THREE.Mesh(new THREE.TorusGeometry(0.039, 0.005, 6, 12), silverMat);
    wire.rotation.x = Math.PI / 2;
    wire.position.y = -0.06 - w * 0.07;
    sword.add(wire);
  }

  // 5. Faceted Diamond Pommel with Occult Engraving
  const pommel = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 6), silverMat);
  pommel.rotation.x = Math.PI;
  pommel.position.y = -0.54;
  sword.add(pommel);

  // 6. Supernatural Cyan Light Source on the Blade
  const runeLight = new THREE.PointLight(0x38bdf8, 0.75, 3.2);
  runeLight.position.set(0, 1.1, 0.12);
  sword.add(runeLight);

  return { swordGroup: sword, runeLight };
}

/**
 * Builds anatomical demonic creature geometry (Hellspawn, Hellbrute, Shade, etc.)
 */
export function createDemonicBeastTorso(isHeavy: boolean = false): THREE.BufferGeometry {
  const slices: LoftedSlice[] = isHeavy
    ? [
        { y: -0.3, rx: 0.32, rz: 0.24, cz: 0.02 }, // Pelvic base
        { y: -0.1, rx: 0.36, rz: 0.28, cz: 0.04, bulgeZFront: 0.05 }, // Heavy belly
        { y: 0.15, rx: 0.44, rz: 0.34, cz: 0.08, bulgeZFront: 0.09, bulgeXSide: 0.06 }, // Muscular ribcage
        { y: 0.45, rx: 0.52, rz: 0.38, cz: 0.12, bulgeZFront: 0.12, bulgeXSide: 0.08, indentZBack: 0.03 }, // Immense brute chest
        { y: 0.68, rx: 0.46, rz: 0.32, cz: 0.16, bulgeZFront: 0.08 }, // Massive shoulders/traps
        { y: 0.82, rx: 0.28, rz: 0.22, cz: 0.20 }, // Hunched forward neck
      ]
    : [
        { y: -0.25, rx: 0.16, rz: 0.13, cz: 0.01 }, // Sinewy fiend pelvis
        { y: -0.1,  rx: 0.14, rz: 0.12, cz: 0.02, bulgeZFront: 0.02 }, // Starved demon waist
        { y: 0.1,   rx: 0.20, rz: 0.16, cz: 0.06, bulgeZFront: 0.05, indentZBack: 0.02 }, // Exposed sinewy ribs
        { y: 0.3,   rx: 0.23, rz: 0.18, cz: 0.10, bulgeZFront: 0.07, bulgeXSide: 0.03 }, // Predatory chest
        { y: 0.48,  rx: 0.18, rz: 0.14, cz: 0.14, bulgeZFront: 0.04 }, // Hunched neck base
      ];

  return createLoftedBodyGeometry(slices, 20, true, true);
}

/**
 * Builds digitigrade demon leg (thigh, backwards hock joint, cannon bone, and raptor talons)
 */
export function createDigitigradeDemonLeg(materials: { flesh: THREE.Material; bone: THREE.Material; claw: THREE.Material }): THREE.Group {
  const leg = new THREE.Group();

  // 1. Muscular upper thigh
  const thighGeom = createAnatomicalLimb(0.14, 0.12, 0.09, 0.42, 0.04);
  const thigh = new THREE.Mesh(thighGeom, materials.flesh);
  thigh.rotation.x = -0.35; // Forward lean
  thigh.castShadow = true;
  leg.add(thigh);

  // 2. Knee & Backwards Hock Joint
  const hockJoint = new THREE.Group();
  hockJoint.position.set(0, -0.38, 0.14);
  hockJoint.rotation.x = 0.85; // Sharp backwards bend (digitigrade)
  leg.add(hockJoint);

  const hockSpike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 4), materials.bone);
  hockSpike.rotation.x = -Math.PI / 2;
  hockSpike.position.set(0, 0, -0.08);
  hockJoint.add(hockSpike);

  // 3. Lower Cannon Bone / Shank
  const shankGeom = createAnatomicalLimb(0.09, 0.07, 0.05, 0.48, 0.02);
  const shank = new THREE.Mesh(shankGeom, materials.flesh);
  hockJoint.add(shank);

  // 4. Raptor Talon Foot
  const foot = new THREE.Group();
  foot.position.set(0, -0.48, 0);
  foot.rotation.x = -0.5;
  hockJoint.add(foot);

  // Three forward talons + one dewclaw
  for (let t = -1; t <= 1; t++) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.16, 4), materials.claw);
    claw.rotation.x = -Math.PI * 0.45;
    claw.rotation.z = t * 0.25;
    claw.position.set(t * 0.04, -0.02, 0.08);
    claw.castShadow = true;
    foot.add(claw);
  }

  const dewclaw = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.11, 4), materials.claw);
  dewclaw.rotation.x = Math.PI * 0.45;
  dewclaw.position.set(0, -0.01, -0.06);
  foot.add(dewclaw);

  return leg;
}

/**
 * Builds elongated snarling demon skull with articulated fanged jaw and horns
 */
export function createDemonicSkull(materials: { bone: THREE.Material; eye: THREE.Material }): THREE.Group {
  const headGroup = new THREE.Group();

  // 1. Elongated Predatory Cranium
  const skullSlices: LoftedSlice[] = [
    { y: -0.08, rx: 0.08, rz: 0.18, cz: 0.08 }, // Snout tip
    { y: 0.0,   rx: 0.12, rz: 0.22, cz: 0.06, bulgeZFront: 0.04 }, // Nasal bridge & brow
    { y: 0.10,  rx: 0.14, rz: 0.18, cz: 0.02, bulgeXSide: 0.03 }, // Eye sockets & zygomatic arches
    { y: 0.18,  rx: 0.12, rz: 0.14, cz: -0.03 }, // Cranial vault
  ];
  const craniumGeom = createLoftedBodyGeometry(skullSlices, 16, true, true);
  const cranium = new THREE.Mesh(craniumGeom, materials.bone);
  cranium.castShadow = true;
  headGroup.add(cranium);

  // 2. Lower Snarling Jaw with Fangs
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.06, 0.02);
  jaw.rotation.x = 0.28; // Open snarling maw
  headGroup.add(jaw);

  const jawMesh = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 4), materials.bone);
  jawMesh.rotation.x = -Math.PI / 2;
  jawMesh.position.set(0, 0, 0.1);
  jaw.add(jawMesh);

  // Sharp fangs lining upper and lower jaws
  for (let f = -2; f <= 2; f++) {
    const fangUpper = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.06, 4), materials.bone);
    fangUpper.rotation.x = Math.PI;
    fangUpper.position.set(f * 0.028, -0.04, 0.18 - Math.abs(f) * 0.02);
    headGroup.add(fangUpper);

    const fangLower = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.06, 4), materials.bone);
    fangLower.position.set(f * 0.025, 0.03, 0.18 - Math.abs(f) * 0.02);
    jaw.add(fangLower);
  }

  // 3. Swept Obsidian Horns
  for (let s = -1; s <= 1; s += 2) {
    const hornGroup = new THREE.Group();
    hornGroup.position.set(s * 0.11, 0.12, -0.02);
    hornGroup.rotation.set(-0.3, s * 0.4, s * 0.5);
    headGroup.add(hornGroup);

    const hornGeom = new THREE.ConeGeometry(0.05, 0.42, 6);
    const horn = new THREE.Mesh(hornGeom, materials.bone);
    horn.position.y = 0.2;
    horn.castShadow = true;
    hornGroup.add(horn);
  }

  // 4. Glowing Predatory Eyes
  for (let s = -1; s <= 1; s += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), materials.eye);
    eye.position.set(s * 0.085, 0.05, 0.12);
    headGroup.add(eye);
  }

  return headGroup;
}

/**
 * Builds a smoothly tapering, curved swept horn along a 3D bezier arc
 * with smooth surface normals and high radial fidelity.
 */
export function createCurvedHorn(
  baseRadius: number,
  length: number,
  curveAmount: THREE.Vector3,
  radialSegments: number = 24,
  tubularSegments: number = 32
): THREE.BufferGeometry {
  const p0 = new THREE.Vector3(0, 0, 0);
  const p1 = new THREE.Vector3(curveAmount.x * 0.4, length * 0.55, curveAmount.z * 0.4);
  const p2 = new THREE.Vector3(curveAmount.x, length, curveAmount.z);

  const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);

  // Custom lofted geometry along the curve with tapering radius
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const frames = curve.computeFrenetFrames(tubularSegments, false);

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const point = curve.getPointAt(u);
    const N = frames.normals[i];
    const B = frames.binormals[i];

    // Tapering radius from baseRadius to sharp tip (non-zero to avoid degenerate faces)
    const curR = Math.max(0.003, baseRadius * Math.pow(1 - u, 0.95));

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const theta = v * Math.PI * 2;
      const sin = Math.sin(theta);
      const cos = -Math.cos(theta);

      const normal = new THREE.Vector3()
        .copy(N).multiplyScalar(cos)
        .addScaledVector(B, sin);

      const vertex = new THREE.Vector3()
        .copy(point)
        .addScaledVector(normal, curR);

      positions.push(vertex.x, vertex.y, vertex.z);
      uvs.push(u, v);
    }
  }

  const stride = radialSegments + 1;
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds a sculpted, high-fidelity gothic monarch skull with anatomical eye sockets,
 * recessed nasal cavity, chiseled maxilla, articulated dental arch, and smooth cranium.
 */
export function createGothicMonarchSkull(materials: {
  bone: THREE.Material;
  eye: THREE.Material;
  ironTrim?: THREE.Material;
}): THREE.Group {
  const headGroup = new THREE.Group();

  // 1. Smooth, sculpted anatomical cranium (32 radial segments)
  const skullSlices: LoftedSlice[] = [
    { y: -0.16, rx: 0.082, rz: 0.115, cz: 0.05, bulgeZFront: 0.045 }, // Chiseled chin & mental tubercle
    { y: -0.10, rx: 0.115, rz: 0.145, cz: 0.06, bulgeZFront: 0.065, bulgeXSide: 0.025 }, // Mandible angle & jaw
    { y: -0.03, rx: 0.128, rz: 0.165, cz: 0.07, bulgeZFront: 0.085 }, // Maxilla & alveolar arch (teeth)
    { y: 0.04,  rx: 0.148, rz: 0.178, cz: 0.06, bulgeZFront: 0.095, bulgeXSide: 0.042 }, // Zygomatic arches (cheekbones)
    { y: 0.11,  rx: 0.146, rz: 0.172, cz: 0.04, bulgeZFront: 0.075, bulgeXSide: 0.035 }, // Prominent supraorbital brow ridge
    { y: 0.18,  rx: 0.138, rz: 0.158, cz: 0.01, bulgeXSide: 0.02 }, // Forehead & temporal line
    { y: 0.25,  rx: 0.118, rz: 0.135, cz: -0.02 }, // Parietal vault
    { y: 0.30,  rx: 0.075, rz: 0.095, cz: -0.04 }, // Occipital apex
  ];
  const craniumGeom = createLoftedBodyGeometry(skullSlices, 32, true, true);
  const cranium = new THREE.Mesh(craniumGeom, materials.bone);
  cranium.castShadow = true;
  headGroup.add(cranium);

  // 2. Sculpted Piriform Aperture (Nasal Cavity Cleft)
  const darkCavityMat = new THREE.MeshStandardMaterial({
    color: 0x06070a,
    roughness: 0.95,
  });
  const nasalCavity = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.07, 12), darkCavityMat);
  nasalCavity.position.set(0, 0.015, 0.22);
  nasalCavity.rotation.x = Math.PI * 0.95;
  headGroup.add(nasalCavity);

  // 3. Deep Recessed Orbital Sockets with Piercing Soul Eyes
  for (let s = -1; s <= 1; s += 2) {
    const orbitGroup = new THREE.Group();
    orbitGroup.position.set(s * 0.078, 0.08, 0.16);
    orbitGroup.rotation.y = s * 0.15;
    headGroup.add(orbitGroup);

    // Dark recessed socket liner (absorbs light to create gothic depth)
    const socketLiner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.018, 0.06, 16, 1, false, 0, Math.PI * 2),
      darkCavityMat
    );
    socketLiner.rotation.x = Math.PI / 2;
    orbitGroup.add(socketLiner);

    // Piercing soul eye positioned deeply within the socket
    const eyeCore = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 16), materials.eye);
    eyeCore.position.set(0, 0, 0.015);
    orbitGroup.add(eyeCore);

    // Glowing pupil slit
    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    pupil.scale.set(0.5, 1.2, 0.6);
    pupil.position.set(0, 0, 0.032);
    orbitGroup.add(pupil);
  }

  // 4. Anatomical Dental Arch (Upper & Lower Teeth)
  const toothMat = new THREE.MeshStandardMaterial({
    color: 0xc8c0b2,
    roughness: 0.45,
  });

  const toothCount = 6;
  for (let t = -toothCount / 2; t < toothCount / 2; t++) {
    const u = (t + 0.5) / (toothCount / 2);
    const archAngle = u * 0.75;
    const rad = 0.095;
    const x = Math.sin(archAngle) * rad;
    const z = Math.cos(archAngle) * rad + 0.105;

    // Upper incisor/canine
    const toothU = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.032, 0.014), toothMat);
    toothU.position.set(x, -0.052, z);
    toothU.rotation.y = archAngle;
    headGroup.add(toothU);

    // Lower incisor/canine
    const toothL = new THREE.Mesh(new THREE.BoxGeometry(0.017, 0.028, 0.013), toothMat);
    toothL.position.set(x * 0.94, -0.082, z * 0.96);
    toothL.rotation.y = archAngle;
    headGroup.add(toothL);
  }

  // 5. Swept Gothic Demon Horns
  for (let s = -1; s <= 1; s += 2) {
    const hornGeom = createCurvedHorn(
      0.052,
      0.58,
      new THREE.Vector3(s * 0.28, 0.15, -0.22),
      20,
      28
    );
    const horn = new THREE.Mesh(hornGeom, materials.bone);
    horn.position.set(s * 0.10, 0.20, -0.02);
    horn.rotation.set(-0.25, s * 0.25, s * 0.35);
    horn.castShadow = true;
    headGroup.add(horn);
  }

  return headGroup;
}

/**
 * Builds a sculpted, high-fidelity gothic pauldron with rounded gardbrace,
 * beveled flanged lames, and filigree ridges.
 */
export function createSculptedGothicPauldron(
  isRight: boolean,
  armorMat: THREE.Material,
  trimMat: THREE.Material
): THREE.Group {
  const pauldron = new THREE.Group();
  const sign = isRight ? -1 : 1;

  // 1. Deltoid shoulder dome (smooth 24x16 sphere segments)
  const domeGeom = new THREE.SphereGeometry(0.28, 24, 16, 0, Math.PI, 0, Math.PI * 0.65);
  domeGeom.computeVertexNormals();
  const dome = new THREE.Mesh(domeGeom, armorMat);
  dome.rotation.z = sign * 0.35;
  dome.rotation.x = -Math.PI / 2;
  dome.scale.set(1.15, 0.95, 1.25);
  dome.castShadow = true;
  pauldron.add(dome);

  // 2. Beveled Flanged Gardbrace (High Gothic neck guard fin)
  const gardbraceShape = new THREE.Shape();
  gardbraceShape.moveTo(0, 0);
  gardbraceShape.lineTo(0.12, 0.35);
  gardbraceShape.lineTo(0.08, 0.48);
  gardbraceShape.lineTo(-0.06, 0.32);
  gardbraceShape.closePath();

  const gardbraceGeom = new THREE.ExtrudeGeometry(gardbraceShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015,
  });
  gardbraceGeom.computeVertexNormals();
  const gardbrace = new THREE.Mesh(gardbraceGeom, trimMat);
  gardbrace.rotation.z = -sign * 0.45;
  gardbrace.rotation.y = sign * 0.2;
  gardbrace.position.set(sign * 0.12, 0.18, -0.04);
  gardbrace.castShadow = true;
  pauldron.add(gardbrace);

  // 3. Three Articulated Descending Lames with Beveled Rims
  for (let i = 0; i < 3; i++) {
    const lameGeom = new THREE.CylinderGeometry(
      0.26 - i * 0.025,
      0.29 - i * 0.025,
      0.10,
      24,
      2,
      true,
      0,
      Math.PI * 0.95
    );
    lameGeom.computeVertexNormals();
    const lame = new THREE.Mesh(lameGeom, i === 1 ? trimMat : armorMat);
    lame.position.set(sign * (0.05 + i * 0.04), -0.08 - i * 0.08, 0);
    lame.rotation.z = sign * (0.35 + i * 0.12);
    lame.castShadow = true;
    pauldron.add(lame);
  }

  // 4. Gothic Crest Spike with smooth octagonal cross-section
  const spikeGeom = new THREE.ConeGeometry(0.055, 0.32, 12);
  spikeGeom.computeVertexNormals();
  const spike = new THREE.Mesh(spikeGeom, trimMat);
  spike.position.set(sign * 0.18, 0.30, 0);
  spike.rotation.z = -sign * 0.42;
  spike.castShadow = true;
  pauldron.add(spike);

  return pauldron;
}

/**
 * Builds an anatomical, high-resolution skeletal ribcage and vertebral column
 * wrapped around a glowing soul core.
 */
export function createAnatomicalRibcage(
  boneMat: THREE.Material,
  coreMat: THREE.Material,
  ribCount: number = 6
): THREE.Group {
  const ribcage = new THREE.Group();

  // 1. Central Vertebral Column (Spine with anatomical vertebrae discs)
  for (let v = 0; v < 10; v++) {
    const vertGeom = new THREE.CylinderGeometry(0.065, 0.068, 0.09, 16);
    vertGeom.computeVertexNormals();
    const vertebra = new THREE.Mesh(vertGeom, boneMat);
    vertebra.position.set(0, 0.85 - v * 0.11, -0.16);
    ribcage.add(vertebra);

    // Spinous process (dorsal spine spike)
    const spinous = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.11, 8), boneMat);
    spinous.rotation.x = -Math.PI * 0.6;
    spinous.position.set(0, 0.85 - v * 0.11, -0.25);
    ribcage.add(spinous);
  }

  // 2. Sculpted Sternum (Breastbone plate in front)
  const sternumShape = new THREE.Shape();
  sternumShape.moveTo(0.04, 0.45);
  sternumShape.lineTo(0.06, 0.35); // Manubrium
  sternumShape.lineTo(0.035, -0.10); // Gladiolus
  sternumShape.lineTo(0.015, -0.22); // Xiphoid process
  sternumShape.lineTo(-0.015, -0.22);
  sternumShape.lineTo(-0.035, -0.10);
  sternumShape.lineTo(-0.06, 0.35);
  sternumShape.lineTo(-0.04, 0.45);
  sternumShape.closePath();

  const sternumGeom = new THREE.ExtrudeGeometry(sternumShape, {
    depth: 0.035,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.01,
    bevelThickness: 0.01,
  });
  sternumGeom.computeVertexNormals();
  const sternum = new THREE.Mesh(sternumGeom, boneMat);
  sternum.position.set(0, 0.35, 0.32);
  sternum.castShadow = true;
  ribcage.add(sternum);

  // 3. Smooth Curved Rib Pairs (16 tube segments x 24 radial segments each)
  for (let r = 0; r < ribCount; r++) {
    const t = r / (ribCount - 1);
    const y = 0.72 - r * 0.14;
    const rx = 0.44 - t * 0.08;
    const rz = 0.32 - t * 0.05;

    // Left and right rib arcs
    for (let s = -1; s <= 1; s += 2) {
      const ribCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(s * 0.06, y, -0.15), // origin at vertebra
        new THREE.Vector3(s * rx * 1.15, y - 0.06, 0.06), // lateral flaring curve
        new THREE.Vector3(s * 0.04, y - 0.08, rz) // anterior costal tip joining sternum
      );

      const ribGeom = new THREE.TubeGeometry(ribCurve, 20, 0.032 - t * 0.005, 12, false);
      ribGeom.computeVertexNormals();
      const ribMesh = new THREE.Mesh(ribGeom, boneMat);
      ribMesh.castShadow = true;
      ribcage.add(ribMesh);
    }

    // Inner Glowing Core behind the ribs
    const corePoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.085 - t * 0.01, 16, 16),
      coreMat
    );
    corePoint.position.set(0, y, 0.04);
    ribcage.add(corePoint);
  }

  return ribcage;
}

/**
 * Builds a majestic gothic royal crown with sculpted filigree arches,
 * fluted fleur-de-lis and beveled thorn pinnacles.
 */
export function createSculptedImperialCrown(
  radius: number,
  height: number,
  spireCount: number = 8,
  material: THREE.Material
): THREE.Group {
  const crownGroup = new THREE.Group();

  // 1. Beveled Circlet Ring (Smooth 32 segments)
  const ringGeom = new THREE.TorusGeometry(radius, 0.045, 16, 32);
  ringGeom.computeVertexNormals();
  const circlet = new THREE.Mesh(ringGeom, material);
  circlet.rotation.x = Math.PI / 2;
  crownGroup.add(circlet);

  // Upper and lower beveled rim bands
  for (const yOff of [-0.035, 0.035]) {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.02, 0.014, 12, 32),
      material
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = yOff;
    crownGroup.add(rim);
  }

  // 2. Sculpted Fleur-de-lis / Thorn Pinnacles
  for (let i = 0; i < spireCount; i++) {
    const angle = (i / spireCount) * Math.PI * 2;
    const isMajor = i % 2 === 0;
    const spireH = isMajor ? height * 1.35 : height * 0.85;

    const spireGroup = new THREE.Group();
    spireGroup.position.set(Math.cos(angle) * radius, 0.02, Math.sin(angle) * radius);
    spireGroup.rotation.y = -angle;

    // Curved gothic petal/spire
    const spireShape = new THREE.Shape();
    spireShape.moveTo(0, 0);
    spireShape.lineTo(0.04, spireH * 0.4);
    spireShape.lineTo(0.055, spireH * 0.65);
    spireShape.lineTo(0, spireH);
    spireShape.lineTo(-0.055, spireH * 0.65);
    spireShape.lineTo(-0.04, spireH * 0.4);
    spireShape.closePath();

    const spireGeom = new THREE.ExtrudeGeometry(spireShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.01,
      bevelThickness: 0.012,
    });
    spireGeom.computeVertexNormals();

    const spireMesh = new THREE.Mesh(spireGeom, material);
    spireMesh.rotation.y = Math.PI / 2;
    spireMesh.castShadow = true;
    spireGroup.add(spireMesh);

    crownGroup.add(spireGroup);
  }

  return crownGroup;
}

/**
 * Builds the high-fidelity Prison Seal Greatsword with extruded faceted blade,
 * deep hollow-ground fuller, down-curved gothic crossguard, and wire-wrapped grip.
 */
export function createBeveledPrisonBlade(
  bladeSteelMat: THREE.Material,
  runeGlowMat: THREE.Material,
  ironArmorMat: THREE.Material,
  hiltMat: THREE.Material
): { swordGroup: THREE.Group; bladeMesh: THREE.Mesh; runeMesh: THREE.Mesh } {
  const sword = new THREE.Group();

  // 1. Double-Edged Flared Greatsword Blade with Beveled Cutting Edges
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0.16, 0);
  bladeShape.lineTo(0.15, 2.1);
  bladeShape.lineTo(0.175, 2.35); // Flared executioner taper
  bladeShape.lineTo(0, 2.75);     // Chiseled diamond point
  bladeShape.lineTo(-0.175, 2.35);
  bladeShape.lineTo(-0.15, 2.1);
  bladeShape.lineTo(-0.16, 0);
  bladeShape.closePath();

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.02,
    bevelThickness: 0.025,
  });
  bladeGeom.computeVertexNormals();

  const bladeMesh = new THREE.Mesh(bladeGeom, bladeSteelMat);
  bladeMesh.position.y = 0.65;
  bladeMesh.castShadow = true;
  sword.add(bladeMesh);

  // 2. Inlaid Deep Fuller with Cosmic Seal Runes (Front & Back)
  const runeShape = new THREE.Shape();
  runeShape.moveTo(0.05, 0.1);
  runeShape.lineTo(0.045, 1.95);
  runeShape.lineTo(0, 2.15);
  runeShape.lineTo(-0.045, 1.95);
  runeShape.lineTo(-0.05, 0.1);
  runeShape.closePath();

  const runeGeom = new THREE.ExtrudeGeometry(runeShape, {
    depth: 0.055,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.008,
    bevelThickness: 0.01,
  });
  runeGeom.computeVertexNormals();

  const runeMesh = new THREE.Mesh(runeGeom, runeGlowMat);
  runeMesh.position.y = 0.65;
  sword.add(runeMesh);

  // 3. Heavy Sculpted Gothic Crossguard with Downswept Quillons
  const guardShape = new THREE.Shape();
  guardShape.moveTo(0.52, -0.06);
  guardShape.lineTo(0.50, 0.08);
  guardShape.lineTo(0.18, 0.14);
  guardShape.lineTo(0, 0.16); // Central peaked ridge
  guardShape.lineTo(-0.18, 0.14);
  guardShape.lineTo(-0.50, 0.08);
  guardShape.lineTo(-0.52, -0.06);
  guardShape.lineTo(-0.44, -0.12);
  guardShape.lineTo(0, 0.02);
  guardShape.lineTo(0.44, -0.12);
  guardShape.closePath();

  const guardGeom = new THREE.ExtrudeGeometry(guardShape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.022,
    bevelThickness: 0.025,
  });
  guardGeom.center();
  guardGeom.computeVertexNormals();

  const guardMesh = new THREE.Mesh(guardGeom, ironArmorMat);
  guardMesh.position.y = 0.60;
  guardMesh.castShadow = true;
  sword.add(guardMesh);

  // Quillon Finial Beasts (Sculpted diamond finials on both crossguard ends)
  for (const s of [-1, 1]) {
    const finialGeom = new THREE.OctahedronGeometry(0.075);
    finialGeom.computeVertexNormals();
    const finial = new THREE.Mesh(finialGeom, ironArmorMat);
    finial.position.set(s * 0.52, 0.60, 0);
    sword.add(finial);
  }

  // 4. Two-Handed Sculpted Leather Grip with Wire Counter-Wrap
  const gripGeom = new THREE.CylinderGeometry(0.046, 0.042, 0.85, 20);
  gripGeom.computeVertexNormals();
  const grip = new THREE.Mesh(gripGeom, hiltMat);
  grip.position.y = 0.12;
  sword.add(grip);

  // Counter-wrap wire ridges
  for (let w = 0; w < 8; w++) {
    const wireGeom = new THREE.TorusGeometry(0.047, 0.007, 8, 20);
    wireGeom.computeVertexNormals();
    const wire = new THREE.Mesh(wireGeom, ironArmorMat);
    wire.rotation.x = Math.PI / 2;
    wire.position.y = 0.46 - w * 0.095;
    sword.add(wire);
  }

  // 5. Heavy Faceted Crown Pommel
  const pommelGeom = new THREE.DodecahedronGeometry(0.11);
  pommelGeom.computeVertexNormals();
  const pommel = new THREE.Mesh(pommelGeom, ironArmorMat);
  pommel.position.y = -0.36;
  pommel.castShadow = true;
  sword.add(pommel);

  return { swordGroup: sword, bladeMesh, runeMesh };
}
