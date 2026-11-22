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

export interface FingerBoneChain {
  proximal: THREE.Bone;
  medial: THREE.Bone;
  distal: THREE.Bone;
  restProxRotX: number;
  restMidRotX: number;
  restDistRotX: number;
}

export interface ArmSkinRig {
  group: THREE.Group;
  skeleton: THREE.Skeleton;
  skinnedMeshes: THREE.SkinnedMesh[];
  forearmBone: THREE.Bone;
  handBone: THREE.Bone;
  thumbBones: {
    proximal: THREE.Bone;
    distal: THREE.Bone;
    restProxRot: THREE.Euler;
    restDistRotX: number;
  };
  fingerBones: FingerBoneChain[];
}

interface SkinInfluence {
  i0: number;
  w0: number;
  i1: number;
  w1: number;
}

interface SkinnedPartBucket {
  positions: number[];
  normals: number[];
  uvs: number[];
  skinIndices: number[];
  skinWeights: number[];
}

function createEmptySkinBucket(): SkinnedPartBucket {
  return {
    positions: [],
    normals: [],
    uvs: [],
    skinIndices: [],
    skinWeights: [],
  };
}

function smoothstep01(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function appendWeightedPart(
  bucket: SkinnedPartBucket,
  sourceGeom: THREE.BufferGeometry,
  partToBindMatrix: THREE.Matrix4,
  weightFn: (localPos: THREE.Vector3, bindPos: THREE.Vector3) => SkinInfluence
): void {
  const nonIndexed = sourceGeom.index ? sourceGeom.toNonIndexed() : sourceGeom.clone();
  if (!nonIndexed.attributes.normal) {
    nonIndexed.computeVertexNormals();
  }

  const posAttr = nonIndexed.attributes.position;
  const normAttr = nonIndexed.attributes.normal;
  const uvAttr = nonIndexed.attributes.uv;
  const vertCount = posAttr.count;

  const normalMat = new THREE.Matrix3().getNormalMatrix(partToBindMatrix);
  const flipWinding = partToBindMatrix.determinant() < 0;

  const localV = new THREE.Vector3();
  const bindV = new THREE.Vector3();
  const normV = new THREE.Vector3();

  // Process triangles so inverted-scale matrices flip winding cleanly
  for (let tri = 0; tri < vertCount; tri += 3) {
    const order = flipWinding ? [tri, tri + 2, tri + 1] : [tri, tri + 1, tri + 2];
    for (const idx of order) {
      if (idx >= vertCount) continue;
      localV.fromBufferAttribute(posAttr, idx);
      bindV.copy(localV).applyMatrix4(partToBindMatrix);

      if (normAttr) {
        normV.fromBufferAttribute(normAttr, idx).applyMatrix3(normalMat).normalize();
      } else {
        normV.set(0, 1, 0);
      }

      const u = uvAttr ? uvAttr.getX(idx) : 0;
      const v = uvAttr ? uvAttr.getY(idx) : 0;

      const inf = weightFn(localV, bindV);
      const sum = inf.w0 + inf.w1;
      const w0 = sum > 0 ? inf.w0 / sum : 1;
      const w1 = sum > 0 ? inf.w1 / sum : 0;

      bucket.positions.push(bindV.x, bindV.y, bindV.z);
      bucket.normals.push(normV.x, normV.y, normV.z);
      bucket.uvs.push(u, v);
      bucket.skinIndices.push(inf.i0, inf.i1, 0, 0);
      bucket.skinWeights.push(w0, w1, 0, 0);
    }
  }

  nonIndexed.dispose();
}

function buildSkinnedMeshFromBucket(
  bucket: SkinnedPartBucket,
  material: THREE.Material,
  skeleton: THREE.Skeleton,
  name: string
): THREE.SkinnedMesh | null {
  if (bucket.positions.length === 0) return null;

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(bucket.positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(bucket.normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(bucket.uvs, 2));
  geom.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(bucket.skinIndices, 4));
  geom.setAttribute('skinWeight', new THREE.Float32BufferAttribute(bucket.skinWeights, 4));
  geom.computeBoundingBox();
  geom.computeBoundingSphere();

  const mesh = new THREE.SkinnedMesh(geom, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  mesh.bind(skeleton);
  return mesh;
}

/**
 * Builds Azrael's complete vertex-skinned forearm vambrace, elbow couter, flared bell cuff,
 * and 16-bone articulated armored gauntlet with smooth wrist, carpal, thumb, and phalanx weights.
 * Split into synced single-material SkinnedMeshes sharing one Skeleton for GLTFExporter & shading fidelity.
 */
export function createSkinnedForearmAndGauntlet(
  isRight: boolean,
  damascusMat: THREE.Material,
  trimMat: THREE.Material,
  runeAccentMat?: THREE.Material
): ArmSkinRig {
  const group = new THREE.Group();
  group.name = isRight ? 'RightArmSkinnedAssembly' : 'LeftArmSkinnedAssembly';

  const armSign = isRight ? -1 : 1; // Outward lateral (+X left, -X right)
  const handSign = isRight ? 1 : -1; // Medial/thumb side (+X right, -X left)
  const accentMat = runeAccentMat ?? trimMat;

  // --- 1. BUILD 16-BONE HIERARCHY IN BIND POSE ---
  const bones: THREE.Bone[] = [];

  const forearmBone = new THREE.Bone();
  forearmBone.name = isRight ? 'RightForearm' : 'LeftForearm';
  bones.push(forearmBone); // idx 0

  const handBone = new THREE.Bone();
  handBone.name = isRight ? 'RightHand' : 'LeftHand';
  handBone.position.set(0, -0.28, 0);
  forearmBone.add(handBone);
  bones.push(handBone); // idx 1

  // Thumb 2-bone chain (idx 2, 3)
  const thumbProxBone = new THREE.Bone();
  thumbProxBone.name = isRight ? 'RightThumbProx' : 'LeftThumbProx';
  thumbProxBone.position.set(handSign * 0.045, -0.028, 0.014);
  thumbProxBone.rotation.set(-0.28, -handSign * 0.45, -handSign * 0.38);
  handBone.add(thumbProxBone);
  bones.push(thumbProxBone); // idx 2

  const thumbDistBone = new THREE.Bone();
  thumbDistBone.name = isRight ? 'RightThumbDist' : 'LeftThumbDist';
  thumbDistBone.position.set(0, -0.036, 0);
  thumbProxBone.add(thumbDistBone);
  bones.push(thumbDistBone); // idx 3

  // 4 Fingers x 3 Phalanx Bones (idx 4..15)
  const fingerConfigs = [
    { name: 'Index', offset: 0.030, len: 0.078, thick: 0.0120 },
    { name: 'Middle', offset: 0.010, len: 0.086, thick: 0.0128 },
    { name: 'Ring', offset: -0.010, len: 0.080, thick: 0.0120 },
    { name: 'Pinky', offset: -0.030, len: 0.068, thick: 0.0108 },
  ];

  const fingerBones: FingerBoneChain[] = [];
  const restProxRotX = -Math.PI * 0.44;
  const restMidRotX = -0.52;
  const restDistRotX = -0.38;

  fingerConfigs.forEach((cfg) => {
    const f1Len = cfg.len * 0.44;
    const f2Len = cfg.len * 0.34;
    const sidePrefix = isRight ? 'Right' : 'Left';

    const proxBone = new THREE.Bone();
    proxBone.name = `${sidePrefix}${cfg.name}1`;
    proxBone.position.set(handSign * cfg.offset, -0.090, 0);
    proxBone.rotation.x = restProxRotX;
    handBone.add(proxBone);
    bones.push(proxBone);

    const midBone = new THREE.Bone();
    midBone.name = `${sidePrefix}${cfg.name}2`;
    midBone.position.set(0, -f1Len, 0);
    midBone.rotation.x = restMidRotX;
    proxBone.add(midBone);
    bones.push(midBone);

    const distBone = new THREE.Bone();
    distBone.name = `${sidePrefix}${cfg.name}3`;
    distBone.position.set(0, -f2Len, 0);
    distBone.rotation.x = restDistRotX;
    midBone.add(distBone);
    bones.push(distBone);

    fingerBones.push({
      proximal: proxBone,
      medial: midBone,
      distal: distBone,
      restProxRotX,
      restMidRotX,
      restDistRotX,
    });
  });

  group.add(forearmBone);
  group.updateMatrixWorld(true);

  // --- 2. MATERIAL BUCKETS & MATRIX HELPERS ---
  const damascusBucket = createEmptySkinBucket();
  const trimBucket = createEmptySkinBucket();
  const accentBucket = createEmptySkinBucket();

  const tmpLocalMat = new THREE.Matrix4();
  const tmpBindMat = new THREE.Matrix4();
  const tmpEuler = new THREE.Euler();
  const tmpQuat = new THREE.Quaternion();
  const tmpPos = new THREE.Vector3();
  const tmpScale = new THREE.Vector3(1, 1, 1);

  const composePartMatrix = (
    parentBoneWorldMat: THREE.Matrix4,
    px: number,
    py: number,
    pz: number,
    rx = 0,
    ry = 0,
    rz = 0,
    sx = 1,
    sy = 1,
    sz = 1
  ): THREE.Matrix4 => {
    tmpPos.set(px, py, pz);
    tmpEuler.set(rx, ry, rz);
    tmpQuat.setFromEuler(tmpEuler);
    tmpScale.set(sx, sy, sz);
    tmpLocalMat.compose(tmpPos, tmpQuat, tmpScale);
    return tmpBindMat.multiplyMatrices(parentBoneWorldMat, tmpLocalMat);
  };

  const identityMat = new THREE.Matrix4();
  const handBindMat = handBone.matrixWorld;
  const thumbProxBindMat = thumbProxBone.matrixWorld;
  const thumbDistBindMat = thumbDistBone.matrixWorld;

  // --- 3. FOREARM VAMBRACE, COUTER & WRIST BLEND ZONE (BONE 0 <-> BONE 1) ---
  const wristBlend = (_local: THREE.Vector3, bindPos: THREE.Vector3): SkinInfluence => {
    if (bindPos.y >= -0.215) return { i0: 0, w0: 1, i1: 1, w1: 0 };
    const t = smoothstep01((-0.215 - bindPos.y) / 0.083);
    const w1 = 0.12 + 0.68 * t; // Smooth wrist follow up to 80% near bell cuff rim
    return { i0: 0, w0: 1 - w1, i1: 1, w1 };
  };

  const forearmRigid = (): SkinInfluence => ({ i0: 0, w0: 1, i1: 1, w1: 0 });

  // Core anatomical vambrace base (y = 0 down to -0.28)
  const coreVambraceGeom = createAnatomicalLimb(0.095, 0.085, 0.07, 0.28, 0.02);
  appendWeightedPart(damascusBucket, coreVambraceGeom, identityMat, (_l, b) => {
    if (b.y >= -0.215) return { i0: 0, w0: 1, i1: 1, w1: 0 };
    const t = smoothstep01((-0.215 - b.y) / 0.065);
    return { i0: 0, w0: 1 - 0.55 * t, i1: 1, w1: 0.55 * t };
  });
  coreVambraceGeom.dispose();

  // Articulated Elbow Bridge Lames
  for (let e = 0; e < 2; e++) {
    const lameG = new THREE.CylinderGeometry(0.094 - e * 0.003, 0.098 - e * 0.003, 0.048, 14);
    appendWeightedPart(
      e === 0 ? trimBucket : damascusBucket,
      lameG,
      composePartMatrix(identityMat, 0, 0.008 - e * 0.036, -0.005),
      forearmRigid
    );
    lameG.dispose();
  }

  // Winged Gothic Couter Cup & Lateral Fan Wing
  const couterCupG = new THREE.SphereGeometry(0.092, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58);
  appendWeightedPart(
    damascusBucket,
    couterCupG,
    composePartMatrix(identityMat, 0, -0.022, -0.035, -Math.PI * 0.55, 0, 0),
    forearmRigid
  );
  couterCupG.dispose();

  const couterWingG = createBeveledGothicPlate(
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
  appendWeightedPart(
    trimBucket,
    couterWingG,
    composePartMatrix(
      identityMat,
      armSign * 0.078,
      -0.022,
      -0.025,
      0.15,
      armSign * 0.35,
      -armSign * 0.18,
      armSign < 0 ? -1 : 1,
      1,
      1
    ),
    forearmRigid
  );
  couterWingG.dispose();

  // Layered 360-degree Forearm Vambrace Sleeves
  const upperVamG = new THREE.CylinderGeometry(0.095, 0.086, 0.11, 14);
  appendWeightedPart(damascusBucket, upperVamG, composePartMatrix(identityMat, 0, -0.095, 0), forearmRigid);
  upperVamG.dispose();

  const lowerVamG = new THREE.CylinderGeometry(0.086, 0.074, 0.11, 14);
  appendWeightedPart(damascusBucket, lowerVamG, composePartMatrix(identityMat, 0, -0.185, 0), wristBlend);
  lowerVamG.dispose();

  // Fluted Outer Vambrace Ridge Plate + Restrained Blue Rune Channel
  const vambraceRidgeG = createBeveledGothicPlate(
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
  );
  appendWeightedPart(
    damascusBucket,
    vambraceRidgeG,
    composePartMatrix(identityMat, armSign * 0.078, -0.155, 0.012, 0, armSign * Math.PI * 0.45, 0),
    wristBlend
  );
  vambraceRidgeG.dispose();

  const vambraceRuneG = new THREE.BoxGeometry(0.008, 0.155, 0.010);
  appendWeightedPart(
    accentBucket,
    vambraceRuneG,
    composePartMatrix(identityMat, armSign * 0.090, -0.155, 0.012),
    forearmRigid
  );
  vambraceRuneG.dispose();

  // Flared Gothic Gauntlet Bell Cuff (smoothly bridges forearm to hand across wrist joint)
  const wristCuffG = new THREE.CylinderGeometry(0.084, 0.096, 0.082, 14);
  appendWeightedPart(trimBucket, wristCuffG, composePartMatrix(identityMat, 0, -0.256, 0), wristBlend);
  wristCuffG.dispose();

  // --- 4. GAUNTLET WRIST COLLAR, METACARPAL PALM & DORSAL PLATE (HAND BONE 1) ---
  const handRigid = (): SkinInfluence => ({ i0: 1, w0: 1, i1: 0, w1: 0 });

  const wristBallG = new THREE.SphereGeometry(0.056, 10, 8);
  appendWeightedPart(
    damascusBucket,
    wristBallG,
    composePartMatrix(handBindMat, 0, 0, 0, 0, 0, 0, 1.12, 0.78, 0.85),
    (local) => {
      // Top half blends slightly with forearm bone for clean cuff contact
      if (local.y > 0) {
        const w0 = 0.42 * smoothstep01(local.y / 0.056);
        return { i0: 1, w0: 1 - w0, i1: 0, w1: w0 };
      }
      return { i0: 1, w0: 1, i1: 0, w1: 0 };
    }
  );
  wristBallG.dispose();

  // Palm / Metacarpal Block (lower palmar edge subtly follows closest finger MCP)
  const palmG = new THREE.BoxGeometry(0.082, 0.092, 0.044);
  appendWeightedPart(
    damascusBucket,
    palmG,
    composePartMatrix(handBindMat, 0, -0.046, 0),
    (local) => {
      if (local.y < -0.032) {
        const t = smoothstep01((-0.032 - local.y) / 0.014);
        // Closest finger bone based on local X
        let closestIdx = 4; // Index bone idx
        let bestDist = Infinity;
        fingerConfigs.forEach((cfg, fIdx) => {
          const d = Math.abs(local.x - handSign * cfg.offset);
          if (d < bestDist) {
            bestDist = d;
            closestIdx = 4 + fIdx * 3;
          }
        });
        return { i0: 1, w0: 1 - 0.25 * t, i1: closestIdx, w1: 0.25 * t };
      }
      return { i0: 1, w0: 1, i1: 0, w1: 0 };
    }
  );
  palmG.dispose();

  const dorsalPlateG = createBeveledGothicPlate(
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
  appendWeightedPart(trimBucket, dorsalPlateG, composePartMatrix(handBindMat, 0, -0.044, -0.024), handRigid);
  dorsalPlateG.dispose();

  for (let l = 0; l < 2; l++) {
    const carpalG = new THREE.CylinderGeometry(0.054 - l * 0.003, 0.058 - l * 0.003, 0.022, 10);
    const forearmShare = l === 0 ? 0.25 : 0.10;
    appendWeightedPart(
      l === 0 ? trimBucket : damascusBucket,
      carpalG,
      composePartMatrix(handBindMat, 0, -0.014 - l * 0.018, -0.004, 0, 0, 0, 1.06, 1.0, 0.68),
      () => ({ i0: 1, w0: 1 - forearmShare, i1: 0, w1: forearmShare })
    );
    carpalG.dispose();
  }

  const handRuneG = new THREE.OctahedronGeometry(0.013, 0);
  appendWeightedPart(
    accentBucket,
    handRuneG,
    composePartMatrix(handBindMat, 0, -0.045, -0.034, 0, 0, 0, 0.75, 1.45, 0.35),
    handRigid
  );
  handRuneG.dispose();

  const knuckleGuardG = new THREE.BoxGeometry(0.088, 0.018, 0.026);
  appendWeightedPart(trimBucket, knuckleGuardG, composePartMatrix(handBindMat, 0, -0.086, -0.020), handRigid);
  knuckleGuardG.dispose();

  // --- 5. SKINNED ARMORED THUMB (HAND BONE 1 <-> THUMB PROX 2 <-> THUMB DIST 3) ---
  const thumbKnuckleG = new THREE.SphereGeometry(0.014, 8, 6);
  appendWeightedPart(trimBucket, thumbKnuckleG, composePartMatrix(thumbProxBindMat, 0, 0, 0), () => ({
    i0: 2,
    w0: 0.6,
    i1: 1,
    w1: 0.4,
  }));
  thumbKnuckleG.dispose();

  const thumbMetaG = new THREE.BoxGeometry(0.022, 0.028, 0.016);
  appendWeightedPart(trimBucket, thumbMetaG, composePartMatrix(thumbProxBindMat, 0, -0.014, -0.006), (local) => {
    const t = smoothstep01((local.y + 0.014) / 0.028);
    return { i0: 2, w0: 1 - 0.35 * t, i1: 1, w1: 0.35 * t };
  });
  thumbMetaG.dispose();

  const thumbProxG = new THREE.CylinderGeometry(0.013, 0.012, 0.038, 6);
  appendWeightedPart(damascusBucket, thumbProxG, composePartMatrix(thumbProxBindMat, 0, -0.022, 0), (local) => {
    if (local.y > 0.008) return { i0: 2, w0: 0.7, i1: 1, w1: 0.3 };
    if (local.y < -0.008) {
      const t = smoothstep01((-0.008 - local.y) / 0.011);
      return { i0: 2, w0: 1 - 0.35 * t, i1: 3, w1: 0.35 * t };
    }
    return { i0: 2, w0: 1, i1: 3, w1: 0 };
  });
  thumbProxG.dispose();

  const thumbPlate1G = new THREE.BoxGeometry(0.020, 0.028, 0.012);
  appendWeightedPart(trimBucket, thumbPlate1G, composePartMatrix(thumbProxBindMat, 0, -0.024, -0.010), () => ({
    i0: 2,
    w0: 1,
    i1: 3,
    w1: 0,
  }));
  thumbPlate1G.dispose();

  // Thumb distal plate relative to thumbDistBone (origin at thumbProx y = -0.036, so local y = -0.052 becomes y = -0.016)
  const thumbDistG = new THREE.ConeGeometry(0.0115, 0.034, 6);
  appendWeightedPart(
    trimBucket,
    thumbDistG,
    composePartMatrix(thumbDistBindMat, 0, -0.016, 0.006, Math.PI * 0.88, 0, 0),
    (local) => {
      // Cone local y > 0.005 is the base near thumbDist joint
      if (local.y > 0.005) {
        const t = smoothstep01((local.y - 0.005) / 0.012);
        return { i0: 3, w0: 1 - 0.25 * t, i1: 2, w1: 0.25 * t };
      }
      return { i0: 3, w0: 1, i1: 2, w1: 0 };
    }
  );
  thumbDistG.dispose();

  // --- 6. SKINNED FOUR ARTICULATED ARMORED FINGERS (MCP -> PIP -> DIP) ---
  fingerConfigs.forEach((cfg, fIdx) => {
    const proxIdx = 4 + fIdx * 3;
    const midIdx = proxIdx + 1;
    const distIdx = proxIdx + 2;

    const chain = fingerBones[fIdx];
    const proxBindMat = chain.proximal.matrixWorld;
    const midBindMat = chain.medial.matrixWorld;
    const distBindMat = chain.distal.matrixWorld;

    const f1Len = cfg.len * 0.44;
    const f2Len = cfg.len * 0.34;
    const f3Len = cfg.len * 0.28;

    // MCP Knuckle Boss & Hinge (blended between handBone and proximal finger bone)
    const knuckleBossG = new THREE.OctahedronGeometry(cfg.thick * 1.15, 0);
    appendWeightedPart(trimBucket, knuckleBossG, composePartMatrix(proxBindMat, 0, 0.004, -0.010), () => ({
      i0: proxIdx,
      w0: 0.65,
      i1: 1,
      w1: 0.35,
    }));
    knuckleBossG.dispose();

    // Proximal armored phalanx
    const f1G = new THREE.CylinderGeometry(cfg.thick, cfg.thick * 0.92, f1Len, 6);
    appendWeightedPart(damascusBucket, f1G, composePartMatrix(proxBindMat, 0, -f1Len * 0.5, 0), (local) => {
      const half = f1Len * 0.5;
      if (local.y > half * 0.55) {
        const t = smoothstep01((local.y - half * 0.55) / (half * 0.45));
        return { i0: proxIdx, w0: 1 - 0.30 * t, i1: 1, w1: 0.30 * t };
      }
      if (local.y < -half * 0.55) {
        const t = smoothstep01((-half * 0.55 - local.y) / (half * 0.45));
        return { i0: proxIdx, w0: 1 - 0.35 * t, i1: midIdx, w1: 0.35 * t };
      }
      return { i0: proxIdx, w0: 1, i1: midIdx, w1: 0 };
    });
    f1G.dispose();

    const p1PlateG = new THREE.BoxGeometry(cfg.thick * 1.85, f1Len * 0.92, cfg.thick * 0.9);
    appendWeightedPart(
      trimBucket,
      p1PlateG,
      composePartMatrix(proxBindMat, 0, -f1Len * 0.5, -cfg.thick * 0.72),
      () => ({ i0: proxIdx, w0: 1, i1: midIdx, w1: 0 })
    );
    p1PlateG.dispose();

    // Medial PIP joint & armored phalanx
    const midKnuckleG = new THREE.SphereGeometry(cfg.thick * 0.9, 6, 6);
    appendWeightedPart(trimBucket, midKnuckleG, composePartMatrix(midBindMat, 0, 0, 0), () => ({
      i0: midIdx,
      w0: 0.65,
      i1: proxIdx,
      w1: 0.35,
    }));
    midKnuckleG.dispose();

    const f2G = new THREE.CylinderGeometry(cfg.thick * 0.90, cfg.thick * 0.78, f2Len, 6);
    appendWeightedPart(damascusBucket, f2G, composePartMatrix(midBindMat, 0, -f2Len * 0.5, 0), (local) => {
      const half = f2Len * 0.5;
      if (local.y > half * 0.55) {
        const t = smoothstep01((local.y - half * 0.55) / (half * 0.45));
        return { i0: midIdx, w0: 1 - 0.35 * t, i1: proxIdx, w1: 0.35 * t };
      }
      if (local.y < -half * 0.55) {
        const t = smoothstep01((-half * 0.55 - local.y) / (half * 0.45));
        return { i0: midIdx, w0: 1 - 0.35 * t, i1: distIdx, w1: 0.35 * t };
      }
      return { i0: midIdx, w0: 1, i1: distIdx, w1: 0 };
    });
    f2G.dispose();

    const p2PlateG = new THREE.BoxGeometry(cfg.thick * 1.65, f2Len * 0.9, cfg.thick * 0.8);
    appendWeightedPart(
      damascusBucket,
      p2PlateG,
      composePartMatrix(midBindMat, 0, -f2Len * 0.5, -cfg.thick * 0.65),
      () => ({ i0: midIdx, w0: 1, i1: distIdx, w1: 0 })
    );
    p2PlateG.dispose();

    // Distal DIP tapered Gothic fingertip armor (ConeGeometry inverted via rotX = Math.PI)
    const f3G = new THREE.ConeGeometry(cfg.thick * 0.82, f3Len, 6);
    appendWeightedPart(
      trimBucket,
      f3G,
      composePartMatrix(distBindMat, 0, -f3Len * 0.5, 0, Math.PI, 0, 0),
      (local) => {
        // After rotX = Math.PI, local y < -f3Len * 0.15 corresponds to the DIP base
        if (local.y < -f3Len * 0.15) {
          const t = smoothstep01((-f3Len * 0.15 - local.y) / (f3Len * 0.35));
          return { i0: distIdx, w0: 1 - 0.35 * t, i1: midIdx, w1: 0.35 * t };
        }
        return { i0: distIdx, w0: 1, i1: midIdx, w1: 0 };
      }
    );
    f3G.dispose();
  });

  // --- 7. BIND SHARED SKELETON ACROSS SYNCED MATERIAL SKINNED MESHES ---
  const skeleton = new THREE.Skeleton(bones);
  const sideLabel = isRight ? 'Right' : 'Left';
  const skinnedMeshes: THREE.SkinnedMesh[] = [];

  const damascusMesh = buildSkinnedMeshFromBucket(damascusBucket, damascusMat, skeleton, `${sideLabel}ArmDamascusSkinned`);
  if (damascusMesh) {
    group.add(damascusMesh);
    skinnedMeshes.push(damascusMesh);
  }

  const trimMesh = buildSkinnedMeshFromBucket(trimBucket, trimMat, skeleton, `${sideLabel}ArmTrimSkinned`);
  if (trimMesh) {
    group.add(trimMesh);
    skinnedMeshes.push(trimMesh);
  }

  const accentMesh = buildSkinnedMeshFromBucket(accentBucket, accentMat, skeleton, `${sideLabel}ArmAccentSkinned`);
  if (accentMesh) {
    group.add(accentMesh);
    skinnedMeshes.push(accentMesh);
  }

  return {
    group,
    skeleton,
    skinnedMeshes,
    forearmBone,
    handBone,
    thumbBones: {
      proximal: thumbProxBone,
      distal: thumbDistBone,
      restProxRot: new THREE.Euler(-0.28, -handSign * 0.45, -handSign * 0.38),
      restDistRotX: 0,
    },
    fingerBones,
  };
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
 * Generates an organic anatomical long-bone BufferGeometry along any 3D curve:
 * - Bulbous proximal & distal epiphyses (condyle ends)
 * - Smoothly tapered fluted diaphysis shaft with subtle osteon ridges
 * - Closed rounded end caps and continuous UVs + smooth vertex normals
 */
export function createSculptedLongBoneGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  rProximal: number,
  rMidShaft: number,
  rDistal: number,
  eccentricX: number = 1.0,
  eccentricZ: number = 1.0,
  radialSegments: number = 18,
  tubularSegments: number = 18,
  flutingStrength: number = 0.08
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const stride = radialSegments + 1;

  for (let j = 0; j <= tubularSegments; j++) {
    const t = j / tubularSegments;
    const pt = curve.getPointAt(t);
    const normal = frames.normals[j];
    const binormal = frames.binormals[j];

    // Smooth epiphysis-to-diaphysis profile
    const endCap = t < 0.04 ? Math.sin((t / 0.04) * (Math.PI / 2)) : t > 0.96 ? Math.sin(((1 - t) / 0.04) * (Math.PI / 2)) : 1.0;
    const proxBlend = Math.exp(-Math.pow(t / 0.14, 2));
    const distBlend = Math.exp(-Math.pow((1 - t) / 0.14, 2));
    const midWeight = Math.max(0, 1 - proxBlend - distBlend);
    const radius = (rProximal * proxBlend + rMidShaft * midWeight + rDistal * distBlend) * Math.max(0.18, endCap);

    // Subtle double-condyle flare at very proximal/distal tips
    const condyleSplit = (proxBlend * 0.18 + distBlend * 0.22);

    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const angle = u * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Subtle anatomical linea-aspera / osteon ridge along diaphysis
      const flute = 1 + flutingStrength * Math.cos(angle * 3.0 + t * 1.2) + condyleSplit * Math.cos(angle * 2.0);
      const rx = radius * eccentricX * flute;
      const rz = radius * eccentricZ * (1 - condyleSplit * 0.28 + flutingStrength * 0.5 * Math.sin(angle * 3.0));

      const vx = pt.x + (normal.x * cosA * rx + binormal.x * sinA * rz);
      const vy = pt.y + (normal.y * cosA * rx + binormal.y * sinA * rz);
      const vz = pt.z + (normal.z * cosA * rx + binormal.z * sinA * rz);

      positions.push(vx, vy, vz);
      uvs.push(u, t);
    }
  }

  for (let j = 0; j < tubularSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * stride + i;
      const b = (j + 1) * stride + i;
      const c = (j + 1) * stride + (i + 1);
      const d = j * stride + (i + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  // Cap ends cleanly
  const startPt = curve.getPointAt(0);
  const startCenter = positions.length / 3;
  positions.push(startPt.x, startPt.y, startPt.z);
  uvs.push(0.5, 0);
  for (let i = 0; i < radialSegments; i++) {
    indices.push(startCenter, i + 1, i);
  }

  const endPt = curve.getPointAt(1);
  const endCenter = positions.length / 3;
  const topRow = tubularSegments * stride;
  positions.push(endPt.x, endPt.y, endPt.z);
  uvs.push(0.5, 1.0);
  for (let i = 0; i < radialSegments; i++) {
    indices.push(endCenter, topRow + i, topRow + i + 1);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Generates an organic curved, fluted, razor-tapered bone crown spire (zero cones).
 */
function createCurvedBoneSpireGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  baseRx: number,
  baseRz: number,
  radialSegments: number = 14,
  tubularSegments: number = 16
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const stride = radialSegments + 1;

  for (let j = 0; j <= tubularSegments; j++) {
    const t = j / tubularSegments;
    const pt = curve.getPointAt(t);
    const normal = frames.normals[j];
    const binormal = frames.binormals[j];

    // Root socket swell (t < 0.14) tapering smoothly to sharp curved bone point
    const rootSwell = t < 0.15 ? 1.18 - t * 1.2 : 1.0;
    const taper = Math.pow(Math.max(0.02, 1.0 - t), 0.78) * rootSwell;

    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const angle = u * Math.PI * 2;
      const flute = 1.0 + 0.11 * Math.cos(angle * 4.0 + t * 2.2);
      const rx = baseRx * taper * flute;
      const rz = baseRz * taper * flute;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      positions.push(
        pt.x + normal.x * cosA * rx + binormal.x * sinA * rz,
        pt.y + normal.y * cosA * rx + binormal.y * sinA * rz,
        pt.z + normal.z * cosA * rx + binormal.z * sinA * rz
      );
      uvs.push(u, t);
    }
  }

  for (let j = 0; j < tubularSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * stride + i;
      const b = (j + 1) * stride + i;
      const c = (j + 1) * stride + (i + 1);
      const d = j * stride + (i + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const tipPt = curve.getPointAt(1);
  const tipIdx = positions.length / 3;
  positions.push(tipPt.x, tipPt.y, tipPt.z);
  uvs.push(0.5, 1);
  const topRow = tubularSegments * stride;
  for (let i = 0; i < radialSegments; i++) {
    indices.push(tipIdx, topRow + i, topRow + i + 1);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Generates an anatomical flattened curved rib bone (elliptical cross-section wider vertically,
 * costal groove indent along inner edge, tapering naturally at vertebral & sternal ends).
 */
function createFlatAnatomicalRibGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  halfHeight: number,
  halfThickness: number,
  tubularSegments: number = 22,
  radialSegments: number = 14
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const stride = radialSegments + 1;
  const upAxis = new THREE.Vector3(0, 1, 0);

  for (let j = 0; j <= tubularSegments; j++) {
    const t = j / tubularSegments;
    const pt = curve.getPointAt(t);
    const tangent = frames.tangents[j];

    // Keep flat wide face consistently oriented vertically/outward along thoracic wall
    const outVec = new THREE.Vector3().crossVectors(upAxis, tangent);
    if (outVec.lengthSq() < 0.0001) outVec.set(1, 0, 0);
    outVec.normalize();
    const ribUp = new THREE.Vector3().crossVectors(tangent, outVec).normalize();

    const endTaper = 0.72 + 0.34 * Math.sin(t * Math.PI);
    const hh = halfHeight * endTaper;
    const ht = halfThickness * endTaper;

    for (let i = 0; i <= radialSegments; i++) {
      const u = i / radialSegments;
      const angle = u * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Subtle costal groove along inferior inner margin
      const groove = cosA < 0 && sinA < 0 ? 0.82 : 1.0;
      const offsetOut = cosA * ht * groove;
      const offsetUp = sinA * hh;

      positions.push(
        pt.x + outVec.x * offsetOut + ribUp.x * offsetUp,
        pt.y + outVec.y * offsetOut + ribUp.y * offsetUp,
        pt.z + outVec.z * offsetOut + ribUp.z * offsetUp
      );
      uvs.push(u, t * 2.0);
    }
  }

  for (let j = 0; j < tubularSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * stride + i;
      const b = (j + 1) * stride + i;
      const c = (j + 1) * stride + (i + 1);
      const d = j * stride + (i + 1);
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
 * Applies non-destructive anatomical vertex-color occlusion / weathering
 * onto an existing bone BufferGeometry without moving vertices or altering silhouette.
 */
function applyBoneVertexOcclusion(
  geom: THREE.BufferGeometry,
  shadeFn: (x: number, y: number, z: number, nx: number, ny: number, nz: number) => number
): void {
  if (!geom.attributes.normal) {
    geom.computeVertexNormals();
  }
  const pos = geom.attributes.position as THREE.BufferAttribute;
  const norm = geom.attributes.normal as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = norm ? norm.getX(i) : 0;
    const ny = norm ? norm.getY(i) : 1;
    const nz = norm ? norm.getZ(i) : 0;
    const s = Math.max(0.45, Math.min(1.06, shadeFn(x, y, z, nx, ny, nz)));
    // Slight cool moonlit-ivory desaturation in crevices (cooler shadows, neutral ivory highlights)
    const r = s * (0.98 + (s - 0.8) * 0.05);
    const g = s * 0.99;
    const b = s * (1.01 - (s - 0.8) * 0.03);
    colors[i * 3] = Math.min(1.0, r);
    colors[i * 3 + 1] = Math.min(1.0, g);
    colors[i * 3 + 2] = Math.min(1.0, b);
  }
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

function cloneOccludedBoneMaterial(baseMat: THREE.Material): THREE.Material {
  const mat = baseMat.clone();
  mat.vertexColors = true;
  mat.needsUpdate = true;
  return mat;
}

/**
 * Builds a sculpted, high-fidelity gothic monarch skull with anatomical eye sockets,
 * recessed nasal cavity, chiseled maxilla, sculpted mandible jaw, articulated teeth, and smooth cranium.
 */
export function createGothicMonarchSkull(materials: {
  bone: THREE.Material;
  eye: THREE.Material;
  ironTrim?: THREE.Material;
  includeHorns?: boolean;
}): THREE.Group {
  const headGroup = new THREE.Group();

  // 1. Sculpted Upper Cranium & Facial Vault (Maxilla up to Parietal/Occipital Dome, 36 radial segments)
  // Smooth organic silhouette with carved orbital sockets & piriform nasal aperture directly on anterior wall
  const skullSlices: LoftedSlice[] = [
    { y: -0.062, rx: 0.088, rz: 0.112, cz: 0.046, bulgeZFront: 0.048 }, // Maxilla alveolar rim (front z ~ 0.206)
    { y: -0.015, rx: 0.108, rz: 0.126, cz: 0.038, bulgeZFront: 0.042, bulgeXSide: 0.014 }, // Maxilla / lower cheek
    { y: 0.036,  rx: 0.122, rz: 0.138, cz: 0.028, bulgeZFront: 0.038, bulgeXSide: 0.022 }, // Malar cheekbones / zygoma
    { y: 0.076,  rx: 0.120, rz: 0.138, cz: 0.020, bulgeZFront: 0.036, bulgeXSide: 0.012 }, // Mid-orbital plane (front z ~ 0.194)
    { y: 0.118,  rx: 0.124, rz: 0.146, cz: 0.014, bulgeZFront: 0.050, bulgeXSide: 0.012 }, // Supraorbital brow ridge (front z ~ 0.210)
    { y: 0.175,  rx: 0.122, rz: 0.146, cz: -0.004, bulgeZFront: 0.022 }, // Frontal bone forehead
    { y: 0.238,  rx: 0.116, rz: 0.142, cz: -0.022 }, // Parietal vault
    { y: 0.290,  rx: 0.092, rz: 0.116, cz: -0.036 }, // Upper parietal
    { y: 0.322,  rx: 0.054, rz: 0.074, cz: -0.044 }, // Cranial apex
  ];
  const craniumGeom = createLoftedBodyGeometry(skullSlices, 36, true, true);
  const cPos = craniumGeom.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    let x = cPos.getX(i);
    const y = cPos.getY(i);
    let z = cPos.getZ(i);
    const absX = Math.abs(x);

    // Smooth temporal fossa concavities behind lateral orbital margins (Gaussian blend, no hard seam)
    if (y > 0.06 && y < 0.21 && z > -0.04 && z < 0.14) {
      const ty = Math.exp(-Math.pow((y - 0.13) / 0.055, 2));
      const tz = Math.exp(-Math.pow((z - 0.04) / 0.065, 2));
      const tx = Math.max(0, (absX - 0.085) / 0.045);
      x *= 1.0 - 0.11 * ty * tz * Math.min(1, tx);
    }

    // Smooth sub-malar cheek hollow beneath cheekbones
    if (y > -0.065 && y < 0.035 && z > 0.0 && z < 0.15 && absX > 0.052) {
      const cy = Math.exp(-Math.pow((y + 0.018) / 0.035, 2));
      const cx = Math.min(1, (absX - 0.052) / 0.055);
      x *= 1.0 - 0.10 * cy * cx;
      z -= 0.012 * cy * cx;
    }

    // Carve deep anatomical eye sockets & raised bony orbital rims directly into anterior face wall
    if (z > 0.09) {
      const dxOrb = (absX - 0.050) / 0.037;
      const dyOrb = (y - 0.068) / 0.032;
      const d2Orb = dxOrb * dxOrb + dyOrb * dyOrb;
      if (d2Orb < 1.0) {
        z -= Math.pow(1.0 - d2Orb, 0.72) * 0.072;
      } else if (d2Orb < 1.55) {
        // Subtle raised orbital bone margin framing each eye socket
        const rimT = 1.0 - Math.abs((d2Orb - 1.24) / 0.31);
        z += Math.max(0, rimT) * 0.008;
      }

      // Carve piriform nasal aperture between upper cheek & bridge
      const nasalW = 0.021 * (1.0 - Math.max(0, (y - 0.006) / 0.055) * 0.48);
      const dxNose = absX / Math.max(0.010, nasalW);
      const dyNose = (y - 0.025) / 0.028;
      const d2Nose = dxNose * dxNose + dyNose * dyNose;
      if (d2Nose < 1.0) {
        z -= Math.pow(1.0 - d2Nose, 0.75) * 0.064;
      }

      // Sculpted protruding nasal bone bridge above piriform aperture
      if (y >= 0.048 && y <= 0.106 && absX < 0.022) {
        const ny = Math.sin(((y - 0.048) / 0.058) * Math.PI);
        const nx = 1.0 - absX / 0.022;
        z += 0.014 * ny * nx;
      }

      // Subtle frontal sagittal crest on forehead
      if (y > 0.13 && absX < 0.028) {
        z += 0.007 * (1.0 - absX / 0.028);
      }
    }

    cPos.setXYZ(i, x, y, z);
  }
  cPos.needsUpdate = true;
  craniumGeom.computeVertexNormals();

  // Anatomical cold-ivory crevice & suture occlusion on existing skull geometry
  const skullBoneMat = cloneOccludedBoneMaterial(materials.bone);
  applyBoneVertexOcclusion(craniumGeom, (x, y, z, nx, ny, nz) => {
    const absX = Math.abs(x);
    let shade = 0.96 + 0.05 * ny + 0.03 * Math.sin(x * 38.0 + y * 29.0) * Math.cos(z * 31.0);

    // Temporal fossa concavity darkening
    if (y > 0.055 && y < 0.215 && z > -0.04 && z < 0.145 && absX > 0.075) {
      const tf = Math.exp(-Math.pow((y - 0.13) / 0.055, 2)) * Math.exp(-Math.pow((z - 0.04) / 0.065, 2));
      shade -= 0.22 * tf * Math.min(1, (absX - 0.075) / 0.04);
    }
    // Sub-malar cheek hollow beneath zygomatic arch
    if (y < 0.038 && z > -0.01 && absX > 0.048) {
      const sh = Math.exp(-Math.pow((y + 0.018) / 0.036, 2));
      shade -= 0.20 * sh * Math.min(1, (absX - 0.048) / 0.05);
    }
    // Deep orbital socket & nasal cavity anterior darkening + brow ridge crisp highlight
    if (z > 0.085) {
      const dxOrb = (absX - 0.050) / 0.038;
      const dyOrb = (y - 0.068) / 0.033;
      const d2Orb = dxOrb * dxOrb + dyOrb * dyOrb;
      if (d2Orb < 1.05) {
        shade -= 0.40 * Math.pow(1.0 - Math.min(1, d2Orb), 0.65);
      } else if (d2Orb < 1.55) {
        shade += 0.05; // Crisp bony orbital margin
      }
      const dxNose = absX / 0.022;
      const dyNose = (y - 0.024) / 0.028;
      const d2Nose = dxNose * dxNose + dyNose * dyNose;
      if (d2Nose < 1.05) {
        shade -= 0.36 * (1.0 - Math.min(1, d2Nose));
      }
      if (y > 0.105 && y < 0.135 && absX < 0.085 && nz > 0.4) {
        shade += 0.06; // Supraorbital brow ridge highlight
      }
    }
    // Subtle cranial sutures (sagittal + coronal seams)
    if (y > 0.16 && absX < 0.009) {
      shade -= 0.14 * (1.0 - absX / 0.009);
    }
    if (y > 0.14 && Math.abs(z - 0.025) < 0.010) {
      shade -= 0.12 * (1.0 - Math.abs(z - 0.025) / 0.010);
    }
    // Occipital base underside shadow
    if (y < 0.02 && z < 0.0) {
      shade -= 0.16 * (1.0 - Math.max(0, y + 0.06) / 0.08);
    }
    return shade + Math.abs(nx) * 0.015;
  });

  const cranium = new THREE.Mesh(craniumGeom, skullBoneMat);
  cranium.castShadow = true;
  headGroup.add(cranium);

  const darkCavityMat = new THREE.MeshStandardMaterial({
    color: 0x030406,
    roughness: 0.98,
    metalness: 0.0,
  });

  // 2. Sculpted Anatomical Mandible (Tightly articulated to zygoma condyles, angled gonial corners, chiseled chin)
  const mandibleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.098, 0.020, 0.012),  // Left TMJ condyle inside zygoma
    new THREE.Vector3(-0.092, -0.084, 0.036), // Left gonial jaw angle
    new THREE.Vector3(-0.058, -0.122, 0.140), // Left jaw body
    new THREE.Vector3(0.0, -0.132, 0.186),    // Chiseled mental protuberance (chin)
    new THREE.Vector3(0.058, -0.122, 0.140),  // Right jaw body
    new THREE.Vector3(0.092, -0.084, 0.036),  // Right gonial jaw angle
    new THREE.Vector3(0.098, 0.020, 0.012),   // Right TMJ condyle inside zygoma
  ]);
  const mandibleGeom = createSculptedLongBoneGeometry(mandibleCurve, 0.017, 0.022, 0.017, 0.72, 1.15, 16, 30, 0.04);
  applyBoneVertexOcclusion(mandibleGeom, (_x, y, z, _nx, ny, nz) => {
    let shade = 0.88 + 0.08 * ny + 0.05 * Math.max(0, nz);
    // Darken sub-mandibular underside and posterior TMJ condyle joints
    if (ny < -0.25) shade -= 0.14;
    if (z < 0.05) shade -= 0.12;
    if (y < -0.11 && z > 0.16 && nz > 0.3) shade += 0.07; // Chiseled mental chin ridge
    return shade;
  });
  const mandible = new THREE.Mesh(mandibleGeom, skullBoneMat);
  mandible.castShadow = true;
  headGroup.add(mandible);

  // Dark inner oral & pharyngeal shadow behind upper & lower dental arches
  const oralShadow = new THREE.Mesh(new THREE.SphereGeometry(0.068, 14, 12), darkCavityMat);
  oralShadow.scale.set(0.98, 0.56, 0.95);
  oralShadow.position.set(0, -0.080, 0.126);
  headGroup.add(oralShadow);

  // 3. Bilateral Sculpted Zygomatic Arch Bridges (Malar cheekbone to Temporal Bone)
  for (let s = -1; s <= 1; s += 2) {
    const zygCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 0.088, 0.032, 0.126),
      new THREE.Vector3(s * 0.134, 0.036, 0.062),
      new THREE.Vector3(s * 0.118, 0.044, -0.018),
    ]);
    const zygGeom = createSculptedLongBoneGeometry(zygCurve, 0.020, 0.013, 0.017, 0.65, 1.18, 12, 14, 0.04);
    applyBoneVertexOcclusion(zygGeom, (_x, _y, z, _nx, ny) => {
      return 0.86 + 0.10 * ny + (z > 0.07 ? 0.08 : -0.06);
    });
    const zygMesh = new THREE.Mesh(zygGeom, skullBoneMat);
    zygMesh.castShadow = true;
    headGroup.add(zygMesh);
  }

  // 4. Sculpted Nasal Bridge & Deep Piriform Nasal Cavities (positioned flush on carved nasal face)
  const nasalBridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.106, 0.194),
    new THREE.Vector3(0, 0.072, 0.204),
    new THREE.Vector3(0, 0.046, 0.198),
  ]);
  const nasalBridgeGeom = createSculptedLongBoneGeometry(nasalBridgeCurve, 0.016, 0.012, 0.010, 1.1, 0.78, 12, 10, 0.03);
  applyBoneVertexOcclusion(nasalBridgeGeom, (x, _y, _z, _nx, _ny, nz) => {
    return 0.84 + 0.14 * Math.max(0, nz) - Math.min(0.14, Math.abs(x) * 8.0);
  });
  const nasalBridge = new THREE.Mesh(nasalBridgeGeom, skullBoneMat);
  headGroup.add(nasalBridge);

  for (let s = -1; s <= 1; s += 2) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), darkCavityMat);
    nostril.scale.set(0.72, 1.65, 1.15);
    nostril.position.set(s * 0.0095, 0.020, 0.158);
    headGroup.add(nostril);
  }

  // Thin bony vomer / septum dividing piriform aperture
  const vomerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.046, 0.180),
    new THREE.Vector3(0, -0.002, 0.178),
  ]);
  const septumGeom = createSculptedLongBoneGeometry(vomerCurve, 0.0045, 0.0038, 0.005, 0.55, 1.5, 8, 6, 0.0);
  applyBoneVertexOcclusion(septumGeom, () => 0.74);
  const septum = new THREE.Mesh(septumGeom, skullBoneMat);
  headGroup.add(septum);

  // 5. Deep Shadowed Orbital Sockets with Flush Bony Rim, Recessed Liner & Deep-Set Glowing Eyes
  for (let s = -1; s <= 1; s += 2) {
    const orbitGroup = new THREE.Group();
    orbitGroup.position.set(s * 0.048, 0.068, 0.124);
    orbitGroup.rotation.y = s * 0.16;
    headGroup.add(orbitGroup);

    // Subtle arched orbital bone lip blended flush into carved socket perimeter
    const rimGeom = new THREE.TorusGeometry(0.030, 0.006, 10, 20);
    applyBoneVertexOcclusion(rimGeom, (_x, y, z) => {
      return 0.76 + (z > 0 ? 0.18 : -0.14) + (y > 0.015 ? 0.08 : -0.04);
    });
    const rim = new THREE.Mesh(rimGeom, skullBoneMat);
    rim.scale.set(1.06, 0.88, 0.72);
    rim.position.z = 0.014;
    orbitGroup.add(rim);

    // Deep blackened orbital socket cavity liner (openEnded so front cap doesn't occlude the eye orb)
    const socketLiner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.030, 0.013, 0.068, 18, 1, true, 0, Math.PI * 2),
      darkCavityMat
    );
    socketLiner.rotation.x = Math.PI / 2;
    socketLiner.position.z = -0.006;
    orbitGroup.add(socketLiner);

    // Back wall of orbital socket + glowing cerulean eye orb deep inside dark hollow
    const socketBack = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), darkCavityMat);
    socketBack.position.z = -0.024;
    orbitGroup.add(socketBack);

    const eyeCore = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 16, 16), materials.eye);
    eyeCore.position.set(0, 0, 0.004);
    orbitGroup.add(eyeCore);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.0062, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
    );
    pupil.scale.set(0.75, 1.15, 0.55);
    pupil.position.set(0, 0, 0.014);
    orbitGroup.add(pupil);
  }

  // 6. Individual Sculpted Anatomical Teeth (Upper Maxilla & Lower Mandibular Alveolar Arches)
  const toothMat = new THREE.MeshStandardMaterial({
    color: 0xbcb6a6,
    roughness: 0.74,
    metalness: 0.01,
    vertexColors: true,
  });

  const toothShape = new THREE.Shape();
  toothShape.moveTo(-0.0052, 0);
  toothShape.lineTo(0.0052, 0);
  toothShape.lineTo(0.0042, 0.020);
  toothShape.lineTo(0, 0.023);
  toothShape.lineTo(-0.0042, 0.020);
  toothShape.closePath();

  const incisorGeom = new THREE.ExtrudeGeometry(toothShape, {
    depth: 0.006,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.0016,
    bevelThickness: 0.0016,
  });
  incisorGeom.center();
  incisorGeom.computeVertexNormals();
  applyBoneVertexOcclusion(incisorGeom, (x, y) => {
    const interdentalShade = Math.max(0, 1.0 - Math.abs(x) * 42.0);
    const rootShade = y < 0 ? 0.74 : 0.98;
    return rootShade * (0.76 + 0.24 * interdentalShade);
  });

  const canineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.014, 0),
    new THREE.Vector3(0, -0.015, 0.002),
  ]);
  const canineGeom = createCurvedBoneSpireGeometry(canineCurve, 0.006, 0.006, 10, 8);
  applyBoneVertexOcclusion(canineGeom, (_x, y) => (y > 0.002 ? 0.74 : 0.98));

  const toothCount = 10;
  for (let t = -toothCount / 2; t < toothCount / 2; t++) {
    const u = (t + 0.5) / (toothCount / 2);
    const archAngle = u * 0.95;
    const rad = 0.068;
    const x = Math.sin(archAngle) * rad;
    const z = Math.cos(archAngle) * rad + 0.126;
    const isCanine = Math.abs(t + 0.5) === 2.5;

    const toothU = new THREE.Mesh(isCanine ? canineGeom : incisorGeom, toothMat);
    toothU.position.set(x, -0.064, z);
    toothU.rotation.y = archAngle;
    headGroup.add(toothU);

    if (Math.abs(t + 0.5) <= 3.5) {
      const toothL = new THREE.Mesh(isCanine ? canineGeom : incisorGeom, toothMat);
      toothL.position.set(x * 0.94, -0.102, Math.cos(archAngle) * rad * 0.94 + 0.120);
      toothL.rotation.y = archAngle;
      if (isCanine) toothL.rotation.x = Math.PI;
      headGroup.add(toothL);
    }
  }

  // 7. Optional Swept Gothic Demon Horns (disabled on pure skeletal monarch skulls with integrated bone crown)
  if (materials.includeHorns !== false) {
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
  }

  return headGroup;
}

/**
 * Builds an irregular royal bone crown fused directly into the skull silhouette:
 * - Forged dark steel circlet band with beveled brow clasps
 * - Curved, tapered irregular bone spires along organic trajectories (zero cones)
 * - Layered branching lateral bone splinters & subtle cerulean socket rune glow
 */
export function createIntegratedBoneCrown(
  boneMat: THREE.Material,
  darkSteelMat: THREE.Material,
  glowMat?: THREE.Material
): THREE.Group {
  const crownGroup = new THREE.Group();
  const crownBoneMat = cloneOccludedBoneMaterial(boneMat);

  // 1. Sculpted Dark Iron Fillet Circlet & Raised Rib Moldings
  const bandGeom = new THREE.CylinderGeometry(0.145, 0.151, 0.050, 32, 2, true);
  bandGeom.computeVertexNormals();
  const band = new THREE.Mesh(bandGeom, darkSteelMat);
  band.scale.set(0.95, 1.0, 1.12);
  crownGroup.add(band);

  for (const yOff of [-0.022, 0.022]) {
    const trimRing = new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.0085, 10, 32), darkSteelMat);
    trimRing.rotation.x = Math.PI / 2;
    trimRing.scale.set(0.95, 1.12, 1.0);
    trimRing.position.y = yOff;
    crownGroup.add(trimRing);
  }

  // Weathered bone suture ridge fusing band cleanly onto parietal/frontal vault
  const browFuseGeom = new THREE.TorusGeometry(0.144, 0.015, 10, 32);
  applyBoneVertexOcclusion(browFuseGeom, (x, _y, z) => {
    const crackWave = Math.sin(x * 48.0 + z * 42.0) * 0.07;
    return 0.78 + crackWave;
  });
  const browFuse = new THREE.Mesh(browFuseGeom, crownBoneMat);
  browFuse.rotation.x = Math.PI / 2;
  browFuse.scale.set(0.95, 1.12, 1.0);
  browFuse.position.y = -0.024;
  crownGroup.add(browFuse);

  // Subtle cerulean rune jewel inlaid into the central brow clasp
  if (glowMat) {
    const browRune = new THREE.Mesh(new THREE.OctahedronGeometry(0.016, 1), glowMat);
    browRune.scale.set(0.75, 1.45, 0.55);
    browRune.position.set(0, 0.006, 0.168);
    crownGroup.add(browRune);
  }

  // 2. Irregular Curved & Branching Bone Spires around the Royal Silhouette
  const spireSpecs = [
    { angle: Math.PI * 0.50, h: 0.25, rx: 0.021, rz: 0.016, leanOut: 0.04, hookZ: -0.02, branch: true },
    { angle: Math.PI * 0.33, h: 0.19, rx: 0.016, rz: 0.013, leanOut: 0.05, hookZ: 0.01, branch: true },
    { angle: Math.PI * 0.67, h: 0.20, rx: 0.016, rz: 0.013, leanOut: 0.05, hookZ: -0.01, branch: true },
    { angle: Math.PI * 0.14, h: 0.15, rx: 0.014, rz: 0.011, leanOut: 0.055, hookZ: 0.02, branch: false },
    { angle: Math.PI * 0.86, h: 0.16, rx: 0.014, rz: 0.011, leanOut: 0.055, hookZ: -0.02, branch: false },
    { angle: -Math.PI * 0.06, h: 0.125, rx: 0.012, rz: 0.010, leanOut: 0.045, hookZ: 0.01, branch: false },
    { angle: -Math.PI * 0.94, h: 0.120, rx: 0.012, rz: 0.010, leanOut: 0.045, hookZ: -0.01, branch: false },
    { angle: -Math.PI * 0.34, h: 0.17, rx: 0.015, rz: 0.012, leanOut: 0.04, hookZ: 0.015, branch: true },
    { angle: -Math.PI * 0.66, h: 0.16, rx: 0.015, rz: 0.012, leanOut: 0.04, hookZ: -0.015, branch: true },
  ];

  spireSpecs.forEach((spec, idx) => {
    const px = Math.cos(spec.angle) * 0.136;
    const pz = Math.sin(spec.angle) * 0.158;

    const spireHolder = new THREE.Group();
    spireHolder.position.set(px, 0.012, pz);
    spireHolder.lookAt(px * 2, 0.012, pz * 2);

    // Sculpted dark metallic clasp socket binding the bone root onto the circlet
    const clasp = new THREE.Mesh(
      new THREE.TorusGeometry(spec.rx * 1.12, 0.007, 10, 16),
      darkSteelMat
    );
    clasp.rotation.x = Math.PI / 2;
    clasp.position.y = 0.014;
    spireHolder.add(clasp);

    // Organic S-curved bone spire (zero cones) with root soot & tip weathering
    const spireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(spec.hookZ * 0.4, spec.h * 0.42, spec.leanOut * 0.55),
      new THREE.Vector3(spec.hookZ, spec.h * 0.78, spec.leanOut * 0.85),
      new THREE.Vector3(spec.hookZ * 0.5, spec.h, spec.leanOut * 0.35),
    ]);
    const spireGeom = createCurvedBoneSpireGeometry(spireCurve, spec.rx, spec.rz, 14, 16);
    applyBoneVertexOcclusion(spireGeom, (x, y, z) => {
      const hFrac = Math.max(0, Math.min(1, y / spec.h));
      const fissure = Math.abs(Math.sin(y * 92 + x * 110 + idx * 1.7)) < 0.16 ? -0.14 : 0.0;
      const fluteShade = 0.03 * Math.cos(Math.atan2(z, x) * 4.0);
      return 0.66 + 0.36 * Math.pow(hFrac, 0.72) + fissure + fluteShade;
    });
    const spireMesh = new THREE.Mesh(spireGeom, crownBoneMat);
    spireMesh.castShadow = true;
    spireHolder.add(spireMesh);

    // Layered secondary branching bone thorn sprouting mid-shaft on major spires
    if (spec.branch) {
      const branchCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, spec.h * 0.34, spec.leanOut * 0.42),
        new THREE.Vector3(spec.hookZ * 1.3 + 0.016, spec.h * 0.56, spec.leanOut * 1.05),
        new THREE.Vector3(spec.hookZ * 1.6 + 0.022, spec.h * 0.72, spec.leanOut * 1.25),
      ]);
      const branchGeom = createCurvedBoneSpireGeometry(branchCurve, spec.rx * 0.58, spec.rz * 0.58, 10, 12);
      applyBoneVertexOcclusion(branchGeom, (_x, y) => {
        const bFrac = Math.max(0, Math.min(1, (y - spec.h * 0.32) / (spec.h * 0.42)));
        return 0.70 + 0.30 * bFrac;
      });
      const branchMesh = new THREE.Mesh(branchGeom, crownBoneMat);
      branchMesh.castShadow = true;
      spireHolder.add(branchMesh);
    }

    crownGroup.add(spireHolder);
  });

  return crownGroup;
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
 * Builds an anatomical, high-resolution skeletal ribcage, sculpted vertebrae, clavicles,
 * dorsal scapulae, three-part sternum, pelvic iliac wings & sacrum, wrapped around a soul core.
 */
export function createAnatomicalRibcage(
  boneMat: THREE.Material,
  coreMat: THREE.Material,
  ribCount: number = 8
): THREE.Group {
  const ribcage = new THREE.Group();

  // 0. Slim Recessed Thoracic Shadow Depth (leaves vertebral column & open rib cage visible from front)
  const cavityMat = new THREE.MeshStandardMaterial({
    color: 0x030406,
    roughness: 0.96,
    metalness: 0.0,
  });
  const thoracicCavity = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12), cavityMat);
  thoracicCavity.scale.set(0.90, 1.25, 0.45);
  thoracicCavity.position.set(0, 0.36, -0.035);
  ribcage.add(thoracicCavity);

  // 1. Sculpted Anatomical Vertebral Column (Beveled Vertebral Body + Transverse Wings + Dorsal Spinous Process)
  const vertShape = new THREE.Shape();
  vertShape.moveTo(0, 0.042);
  vertShape.lineTo(0.044, 0.026);
  vertShape.lineTo(0.088, 0.008); // Right transverse process
  vertShape.lineTo(0.042, -0.022);
  vertShape.lineTo(0.016, -0.095); // Dorsal spinous process apex
  vertShape.lineTo(-0.016, -0.095);
  vertShape.lineTo(-0.042, -0.022);
  vertShape.lineTo(-0.088, 0.008); // Left transverse process
  vertShape.lineTo(-0.044, 0.026);
  vertShape.closePath();

  const vertebraGeom = new THREE.ExtrudeGeometry(vertShape, {
    depth: 0.056,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.009,
    bevelThickness: 0.009,
  });
  vertebraGeom.center();
  vertebraGeom.computeVertexNormals();

  for (let v = 0; v < 12; v++) {
    const s = 1.0 - Math.abs(v - 6) * 0.025;
    const zCurve = -0.17 - Math.sin(v * 0.28) * 0.028;
    const vertebra = new THREE.Mesh(vertebraGeom, boneMat);
    vertebra.rotation.x = Math.PI / 2;
    vertebra.position.set(0, 0.88 - v * 0.115, zCurve);
    vertebra.scale.set(s, s, s);
    vertebra.castShadow = true;
    ribcage.add(vertebra);

    // Intervertebral dark disc spacing
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.042 * s, 0.042 * s, 0.024, 14), cavityMat);
    disc.position.set(0, 0.822 - v * 0.115, zCurve);
    ribcage.add(disc);
  }

  // 2. Sculpted Bilateral S-Curved Clavicles reaching out cleanly to humeral heads & Dorsal Scapulae
  const scapShape = new THREE.Shape();
  scapShape.moveTo(0, 0.17);
  scapShape.lineTo(0.11, 0.14);
  scapShape.lineTo(0.13, 0.02);
  scapShape.lineTo(0.04, -0.16);
  scapShape.lineTo(-0.05, -0.12);
  scapShape.lineTo(-0.08, 0.08);
  scapShape.closePath();
  const scapGeom = new THREE.ExtrudeGeometry(scapShape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.010,
    bevelThickness: 0.008,
  });
  scapGeom.center();
  scapGeom.computeVertexNormals();

  for (let s = -1; s <= 1; s += 2) {
    const clavCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 0.052, 0.72, 0.255),
      new THREE.Vector3(s * 0.26, 0.77, 0.205),
      new THREE.Vector3(s * 0.50, 0.69, 0.085),
      new THREE.Vector3(s * 0.72, 0.59, 0.005), // Meets shoulder humeral joint under pauldron
    ]);
    const clavicle = new THREE.Mesh(
      createSculptedLongBoneGeometry(clavCurve, 0.028, 0.020, 0.032, 1.1, 0.85, 14, 16, 0.05),
      boneMat
    );
    clavicle.castShadow = true;
    ribcage.add(clavicle);

    const scapula = new THREE.Mesh(scapGeom, boneMat);
    scapula.position.set(s * 0.23, 0.54, -0.185);
    scapula.rotation.set(0.15, s * -0.24, s * -0.18);
    scapula.scale.x = s;
    scapula.castShadow = true;
    ribcage.add(scapula);
  }

  // 3. Sculpted Three-Part Sternum (Manubrium, Segmented Gladiolus, Xiphoid Apex)
  const sternumShape = new THREE.Shape();
  sternumShape.moveTo(0.064, 0.42);
  sternumShape.lineTo(0.092, 0.34);
  sternumShape.lineTo(0.042, 0.20);
  sternumShape.lineTo(0.038, -0.09);
  sternumShape.lineTo(0.015, -0.23);
  sternumShape.lineTo(-0.015, -0.23);
  sternumShape.lineTo(-0.038, -0.09);
  sternumShape.lineTo(-0.042, 0.20);
  sternumShape.lineTo(-0.092, 0.34);
  sternumShape.lineTo(-0.064, 0.42);
  sternumShape.closePath();

  const sternumGeom = new THREE.ExtrudeGeometry(sternumShape, {
    depth: 0.032,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.011,
    bevelThickness: 0.011,
  });
  sternumGeom.computeVertexNormals();
  const sternum = new THREE.Mesh(sternumGeom, boneMat);
  sternum.position.set(0, 0.31, 0.262);
  sternum.rotation.x = -0.08;
  sternum.castShadow = true;
  ribcage.add(sternum);

  // 4. Anatomical Flattened Curved True, False & Floating Rib Pairs (~18deg downward anterior slant)
  const safeCount = Math.max(4, ribCount);
  for (let r = 0; r < safeCount; r++) {
    const t = r / (safeCount - 1);
    const yBack = 0.76 - r * 0.088;
    const rx = 0.25 + Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.72) * 0.16;
    const rz = 0.275 - t * 0.045;
    const isFalse = r >= safeCount - 3 && r < safeCount - 1;
    const isFloating = r >= safeCount - 1;

    for (let s = -1; s <= 1; s += 2) {
      const dropY = 0.125 + t * 0.045;
      const endPoint = isFloating
        ? new THREE.Vector3(s * (rx * 0.72), yBack - 0.18, rz * 0.25)
        : isFalse
        ? new THREE.Vector3(s * (0.095 + (r - (safeCount - 4)) * 0.035), yBack - dropY * 0.85, rz * 0.84)
        : new THREE.Vector3(s * 0.044, yBack - dropY, rz);

      const ribCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(s * 0.052, yBack, -0.155),
        new THREE.Vector3(s * rx * 0.86, yBack - 0.025, -0.06),
        new THREE.Vector3(s * rx * 1.06, yBack - dropY * 0.72, 0.11),
        endPoint,
      ]);

      const ribGeom = createFlatAnatomicalRibGeometry(
        ribCurve,
        0.026 - t * 0.004,
        0.011 - t * 0.0015,
        22,
        14
      );
      const ribMesh = new THREE.Mesh(ribGeom, boneMat);
      ribMesh.castShadow = true;
      ribcage.add(ribMesh);
    }

    // Subtle Soul Core Heartbeat recessed deep inside thoracic cavity behind sternum
    if (r === 2 || r === 4) {
      const corePoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.068, 14, 14),
        coreMat
      );
      corePoint.position.set(0, yBack - 0.06, 0.03);
      ribcage.add(corePoint);
    }
  }

  // 5. Continuous Sculpted Pelvic Basin: Lofted Sacrum + Curved Iliac Wings + Pubic Arch + Acetabulum Sockets
  const sacrumSlices: LoftedSlice[] = [
    { y: -0.60, rx: 0.024, rz: 0.022, cz: -0.09 },  // Coccyx tip
    { y: -0.52, rx: 0.056, rz: 0.036, cz: -0.115 }, // Mid sacrum
    { y: -0.43, rx: 0.094, rz: 0.044, cz: -0.135 }, // Sacroiliac base
    { y: -0.36, rx: 0.072, rz: 0.042, cz: -0.145 }, // Promontory
  ];
  const sacrum = new THREE.Mesh(createLoftedBodyGeometry(sacrumSlices, 16, true, true), boneMat);
  sacrum.castShadow = true;
  ribcage.add(sacrum);

  for (let s = -1; s <= 1; s += 2) {
    // Upper Curved Iliac Wing & Crest sweeping around to anterior spine & hip socket
    const iliacCrestCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 0.078, -0.39, -0.125),
      new THREE.Vector3(s * 0.245, -0.34, -0.055),
      new THREE.Vector3(s * 0.295, -0.39, 0.055),
      new THREE.Vector3(s * 0.240, -0.47, 0.095),
      new THREE.Vector3(s * 0.238, -0.528, 0.005),
    ]);
    const iliacWing = new THREE.Mesh(
      createFlatAnatomicalRibGeometry(iliacCrestCurve, 0.072, 0.025, 22, 14),
      boneMat
    );
    iliacWing.castShadow = true;
    ribcage.add(iliacWing);

    // Pubic & Ischial Arch closing anterior hip ring cleanly into pubic symphysis
    const pubisCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 0.222, -0.538, 0.015),
      new THREE.Vector3(s * 0.138, -0.585, 0.110),
      new THREE.Vector3(s * 0.020, -0.575, 0.130),
    ]);
    const pubis = new THREE.Mesh(
      createSculptedLongBoneGeometry(pubisCurve, 0.030, 0.023, 0.028, 1.0, 0.9, 12, 12, 0.03),
      boneMat
    );
    pubis.castShadow = true;
    ribcage.add(pubis);

    // Sculpted Acetabulum Hip Socket Rim aligned precisely to femur head at (s * 0.24, -0.54, 0)
    const acetabulum = new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.016, 12, 20), boneMat);
    acetabulum.position.set(s * 0.238, -0.538, 0);
    acetabulum.rotation.y = s * Math.PI * 0.42;
    acetabulum.rotation.x = 0.22;
    ribcage.add(acetabulum);
  }

  return ribcage;
}

/**
 * Builds an articulated skeletal arm using anatomical long-bones (flared epiphyses + fluted diaphysis):
 * humeral head, curved humerus shaft, bicondylar elbow hinge + olecranon, twin radius & ulna bones, and wrist carpal condyle.
 */
export function createSkeletalArmSegment(
  boneMat: THREE.Material,
  jointMat?: THREE.Material
): THREE.Group {
  const arm = new THREE.Group();
  const condyleMat = jointMat ?? boneMat;

  // Shoulder humeral head & anatomical neck
  const humeralHead = new THREE.Mesh(new THREE.SphereGeometry(0.086, 16, 12), condyleMat);
  humeralHead.scale.set(1.0, 0.92, 0.95);
  arm.add(humeralHead);

  // Upper arm Humerus long-bone (y: 0 -> -0.64)
  const humerusCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.02, 0),
    new THREE.Vector3(0.016, -0.22, -0.012),
    new THREE.Vector3(0.008, -0.44, -0.006),
    new THREE.Vector3(0, -0.635, 0.012),
  ]);
  const humerus = new THREE.Mesh(
    createSculptedLongBoneGeometry(humerusCurve, 0.072, 0.044, 0.068, 1.12, 0.88, 18, 18, 0.09),
    boneMat
  );
  humerus.castShadow = true;
  arm.add(humerus);

  // Sculpted Elbow Bicondylar Hinge & Olecranon Process at y = -0.64
  for (const s of [-1, 1]) {
    const epicondyle = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 10), condyleMat);
    epicondyle.position.set(s * 0.042, -0.64, 0.010);
    arm.add(epicondyle);
  }
  const olecranon = new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 10), condyleMat);
  olecranon.scale.set(0.95, 1.25, 1.15);
  olecranon.position.set(0, -0.65, -0.022);
  arm.add(olecranon);

  // Forearm Twin Bowed Bones: Radius (lateral) & Ulna (medial), y: -0.64 -> -1.30
  const radiusCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.032, -0.66, 0.016),
    new THREE.Vector3(0.046, -0.96, 0.038),
    new THREE.Vector3(0.028, -1.29, 0.038),
  ]);
  const radiusBone = new THREE.Mesh(
    createSculptedLongBoneGeometry(radiusCurve, 0.034, 0.024, 0.038, 1.0, 0.85, 14, 16, 0.07),
    boneMat
  );
  radiusBone.castShadow = true;
  arm.add(radiusBone);

  const ulnaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.030, -0.65, 0.002),
    new THREE.Vector3(-0.036, -0.96, 0.018),
    new THREE.Vector3(-0.024, -1.29, 0.032),
  ]);
  const ulnaBone = new THREE.Mesh(
    createSculptedLongBoneGeometry(ulnaCurve, 0.036, 0.022, 0.030, 0.95, 0.90, 14, 16, 0.07),
    boneMat
  );
  ulnaBone.castShadow = true;
  arm.add(ulnaBone);

  // Smooth Bi-styloid Wrist Carpal Condyle Bridge at y = -1.31
  const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 10), condyleMat);
  wrist.scale.set(1.28, 0.68, 0.84);
  wrist.position.set(0, -1.31, 0.036);
  arm.add(wrist);

  return arm;
}

/**
 * Builds an articulated skeletal hand using smooth sculpted carpals, 5 curved metacarpals,
 * and individual tapered 3-phalanx fingers + 2-phalanx thumb (zero dodecahedrons/cones).
 */
export function createSkeletalHand(
  isRight: boolean,
  boneMat: THREE.Material,
  trimMat?: THREE.Material
): THREE.Group {
  const hand = new THREE.Group();
  const sign = isRight ? 1 : -1;
  const knuckleMat = trimMat ?? boneMat;
  const handBoneMat = cloneOccludedBoneMaterial(boneMat);

  // Smooth sculpted carpal wrist arch (two-row carpal bone loft)
  const carpalSlices: LoftedSlice[] = [
    { y: 0.012, rx: 0.046, rz: 0.028 },
    { y: -0.006, rx: 0.056, rz: 0.032, bulgeXSide: 0.006 },
    { y: -0.026, rx: 0.052, rz: 0.026 },
  ];
  const carpals = new THREE.Mesh(createLoftedBodyGeometry(carpalSlices, 16, true, true), knuckleMat);
  hand.add(carpals);

  // 4 Articulated Fingers (Metacarpal + Proximal + Middle + Tapered Distal Phalanx + DIP/PIP/MCP Condyles)
  const fingerOffsets = [-0.038, -0.013, 0.013, 0.038];
  const fingerLengths = [0.092, 0.104, 0.096, 0.078];

  fingerOffsets.forEach((xOff, i) => {
    // Metacarpal bone arching slightly toward knuckle
    const metaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xOff * 0.72, -0.018, 0),
      new THREE.Vector3(xOff * 0.95, -0.052, -0.004),
      new THREE.Vector3(xOff * 1.15, -0.084, 0.006),
    ]);
    const metaGeom = createSculptedLongBoneGeometry(metaCurve, 0.011, 0.0075, 0.012, 1.0, 0.9, 10, 8, 0.04);
    applyBoneVertexOcclusion(metaGeom, (_x, y) => {
      const t = Math.max(0, Math.min(1, (-0.018 - y) / 0.066));
      return 0.80 + 0.22 * Math.sin(t * Math.PI);
    });
    const meta = new THREE.Mesh(metaGeom, handBoneMat);
    hand.add(meta);

    // MCP Knuckle Condyle (defined tarnished marrow joint)
    const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.0132, 10, 8), knuckleMat);
    knuckle.position.set(xOff * 1.15, -0.084, 0.006);
    hand.add(knuckle);

    // Curled Articulated Proximal + Distal Phalanx chain
    const pLen = fingerLengths[i] * 0.52;
    const dLen = fingerLengths[i] * 0.48;
    const proxEndY = -0.084 - pLen * 0.85;
    const proxEndZ = 0.028;

    const proxCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xOff * 1.15, -0.084, 0.006),
      new THREE.Vector3(xOff * 1.15, proxEndY, proxEndZ),
    ]);
    const proxGeom = createSculptedLongBoneGeometry(proxCurve, 0.010, 0.007, 0.0095, 1.0, 0.9, 10, 7, 0.03);
    applyBoneVertexOcclusion(proxGeom, (_x, y) => {
      const t = Math.max(0, Math.min(1, (-0.084 - y) / (pLen * 0.85)));
      return 0.78 + 0.24 * Math.sin(t * Math.PI);
    });
    const prox = new THREE.Mesh(proxGeom, handBoneMat);
    hand.add(prox);

    const pipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.010, 8, 8), knuckleMat);
    pipJoint.position.set(xOff * 1.15, proxEndY, proxEndZ);
    hand.add(pipJoint);

    // Subtle DIP joint condyle at distal phalanx inflection point
    const dipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.0076, 8, 8), knuckleMat);
    dipJoint.position.set(xOff * 1.15, proxEndY - dLen * 0.48, proxEndZ + 0.019);
    hand.add(dipJoint);

    const distCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xOff * 1.15, proxEndY, proxEndZ),
      new THREE.Vector3(xOff * 1.15, proxEndY - dLen * 0.55, proxEndZ + 0.022),
      new THREE.Vector3(xOff * 1.15, proxEndY - dLen * 0.85, proxEndZ + 0.042),
    ]);
    const distGeom = createCurvedBoneSpireGeometry(distCurve, 0.0085, 0.0075, 10, 8);
    applyBoneVertexOcclusion(distGeom, (_x, y) => {
      const t = Math.max(0, Math.min(1, (proxEndY - y) / (dLen * 0.85)));
      return 0.78 + 0.22 * t;
    });
    const dist = new THREE.Mesh(distGeom, handBoneMat);
    hand.add(dist);
  });

  // Opposable 2-Phalanx Skeletal Thumb
  const thumbMetaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sign * 0.034, -0.018, 0.008),
    new THREE.Vector3(sign * 0.058, -0.046, 0.028),
  ]);
  const thumbMetaGeom = createSculptedLongBoneGeometry(thumbMetaCurve, 0.011, 0.008, 0.010, 1.0, 0.9, 10, 7, 0.03);
  applyBoneVertexOcclusion(thumbMetaGeom, (_x, y) => {
    const t = Math.max(0, Math.min(1, (-0.018 - y) / 0.028));
    return 0.78 + 0.22 * Math.sin(t * Math.PI);
  });
  const thumbMeta = new THREE.Mesh(thumbMetaGeom, handBoneMat);
  hand.add(thumbMeta);

  const thumbKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.0105, 8, 8), knuckleMat);
  thumbKnuckle.position.set(sign * 0.058, -0.046, 0.028);
  hand.add(thumbKnuckle);

  const thumbDistCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sign * 0.058, -0.046, 0.028),
    new THREE.Vector3(sign * 0.062, -0.072, 0.044),
    new THREE.Vector3(sign * 0.048, -0.088, 0.058),
  ]);
  const thumbDistGeom = createCurvedBoneSpireGeometry(thumbDistCurve, 0.009, 0.008, 10, 8);
  applyBoneVertexOcclusion(thumbDistGeom, (_x, y) => {
    const t = Math.max(0, Math.min(1, (-0.046 - y) / 0.042));
    return 0.78 + 0.22 * t;
  });
  const thumbDist = new THREE.Mesh(thumbDistGeom, handBoneMat);
  hand.add(thumbDist);

  return hand;
}

/**
 * Builds an articulated skeletal leg using anatomical long-bones (femur, bowed tibia & fibula),
 * sculpted rounded patella kneecap, bicondylar knee hinge, and medial/lateral ankle malleoli matching y=0..-1.50.
 */
export function createSkeletalLegSegment(
  boneMat: THREE.Material,
  jointMat?: THREE.Material
): THREE.Group {
  const leg = new THREE.Group();
  const condyleMat = jointMat ?? boneMat;

  // Hip femoral head & greater trochanter neck
  const femHead = new THREE.Mesh(new THREE.SphereGeometry(0.078, 16, 12), condyleMat);
  leg.add(femHead);

  // Bowed Femur long-bone (y: 0 -> -0.76) with flared distal condyles
  const femurCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.03, 0),
    new THREE.Vector3(-0.010, -0.26, 0.022),
    new THREE.Vector3(-0.005, -0.54, 0.028),
    new THREE.Vector3(0, -0.76, 0.010),
  ]);
  const femur = new THREE.Mesh(
    createSculptedLongBoneGeometry(femurCurve, 0.076, 0.048, 0.078, 1.12, 0.92, 18, 18, 0.08),
    boneMat
  );
  femur.castShadow = true;
  leg.add(femur);

  // Bicondylar Knee Hinge & Smooth Sculpted Patella Shield at y = -0.76
  for (const s of [-1, 1]) {
    const femCondyle = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 10), condyleMat);
    femCondyle.position.set(s * 0.038, -0.76, 0.010);
    leg.add(femCondyle);
  }

  const patellaSlices: LoftedSlice[] = [
    { y: -0.045, rx: 0.022, rz: 0.014 },
    { y: -0.015, rx: 0.042, rz: 0.024, bulgeZFront: 0.010 },
    { y: 0.022,  rx: 0.046, rz: 0.024, bulgeZFront: 0.010 },
    { y: 0.045,  rx: 0.030, rz: 0.016 },
  ];
  const patella = new THREE.Mesh(createLoftedBodyGeometry(patellaSlices, 16, true, true), boneMat);
  patella.position.set(0, -0.755, 0.068);
  leg.add(patella);

  // Shin Twin Long-Bones: Anterior Tibia & Lateral Fibula (y: -0.76 -> -1.50)
  const tibiaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.012, -0.78, 0.012),
    new THREE.Vector3(-0.010, -1.14, 0.020),
    new THREE.Vector3(-0.008, -1.50, 0.005),
  ]);
  const tibia = new THREE.Mesh(
    createSculptedLongBoneGeometry(tibiaCurve, 0.064, 0.036, 0.052, 0.92, 1.12, 16, 18, 0.09),
    boneMat
  );
  tibia.castShadow = true;
  leg.add(tibia);

  const fibulaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.042, -0.80, -0.012),
    new THREE.Vector3(0.046, -1.15, -0.014),
    new THREE.Vector3(0.036, -1.50, -0.004),
  ]);
  const fibula = new THREE.Mesh(
    createSculptedLongBoneGeometry(fibulaCurve, 0.024, 0.017, 0.026, 0.95, 0.95, 12, 16, 0.04),
    boneMat
  );
  fibula.castShadow = true;
  leg.add(fibula);

  // Medial & Lateral Ankle Malleoli at y = -1.49
  const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.050, 14, 10), condyleMat);
  ankle.scale.set(1.22, 0.72, 0.92);
  ankle.position.set(0, -1.49, 0.006);
  leg.add(ankle);

  return leg;
}

/**
 * Builds an articulated skeletal foot with calcaneus heel bone, talus/tarsal midfoot arch,
 * 5 splayed metatarsal shafts, and 5 individual toe phalanx chains grounded cleanly at y = -0.055.
 */
export function createSkeletalFoot(
  boneMat: THREE.Material,
  darkSteelMat?: THREE.Material,
  jointMat?: THREE.Material
): THREE.Group {
  const foot = new THREE.Group();
  const condyleMat = jointMat ?? boneMat;

  // 1. Talus Ankle Dome & Posterior Calcaneus Heel Bone
  const talusSlices: LoftedSlice[] = [
    { y: -0.052, rx: 0.052, rz: 0.088, cz: -0.025 },
    { y: -0.024, rx: 0.048, rz: 0.075, cz: -0.015 },
    { y: 0.005,  rx: 0.040, rz: 0.048, cz: -0.005 },
  ];
  const calcaneusTalus = new THREE.Mesh(
    createLoftedBodyGeometry(talusSlices, 16, true, true),
    boneMat
  );
  calcaneusTalus.castShadow = true;
  foot.add(calcaneusTalus);

  // Optional subtle weathered iron ankle greave cuff framing the skeletal talus
  if (darkSteelMat) {
    const ankleCuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.058, 0.012, 10, 20),
      darkSteelMat
    );
    ankleCuff.rotation.x = Math.PI / 2;
    ankleCuff.position.set(0, 0.005, 0);
    foot.add(ankleCuff);
  }

  // 2. Five Individual Splayed Metatarsal Long-Bones & Curled Toe Phalanges
  const toeOffsetsX = [-0.042, -0.021, 0.0, 0.021, 0.042];
  const toeReachZ = [0.165, 0.175, 0.172, 0.160, 0.145];

  toeOffsetsX.forEach((xOff, idx) => {
    const isHallux = idx === 0;
    const zBall = toeReachZ[idx] * 0.62;
    const zTip = toeReachZ[idx];

    const metaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xOff * 0.45, -0.026, 0.01),
      new THREE.Vector3(xOff * 0.78, -0.036, zBall * 0.55),
      new THREE.Vector3(xOff * 1.05, -0.048, zBall),
    ]);
    const meta = new THREE.Mesh(
      createSculptedLongBoneGeometry(
        metaCurve,
        isHallux ? 0.016 : 0.012,
        isHallux ? 0.011 : 0.0085,
        isHallux ? 0.015 : 0.011,
        1.0,
        0.95,
        10,
        10,
        0.04
      ),
      boneMat
    );
    meta.castShadow = true;
    foot.add(meta);

    // Metatarsophalangeal ball joint
    const mtp = new THREE.Mesh(new THREE.SphereGeometry(isHallux ? 0.015 : 0.011, 8, 8), condyleMat);
    mtp.position.set(xOff * 1.05, -0.048, zBall);
    foot.add(mtp);

    // Tapered curved toe phalanges resting on ground plane
    const toeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xOff * 1.05, -0.048, zBall),
      new THREE.Vector3(xOff * 1.10, -0.052, (zBall + zTip) * 0.5),
      new THREE.Vector3(xOff * 1.12, -0.056, zTip),
    ]);
    const toe = new THREE.Mesh(
      createCurvedBoneSpireGeometry(toeCurve, isHallux ? 0.013 : 0.0095, isHallux ? 0.011 : 0.008, 10, 8),
      boneMat
    );
    toe.castShadow = true;
    foot.add(toe);
  });

  return foot;
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
