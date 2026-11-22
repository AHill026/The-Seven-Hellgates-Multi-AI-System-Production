/**
 * The Seven Hellgates - The Seven Sovereign 3D Character Models
 * Distinct, high-fidelity procedural PBR character models for all 7 major bosses:
 *
 * Gate 1 - Limbo:     The Hollow King (Skeletal Monarch & Prison Seal Greatsword)
 * Gate 2 - Gluttony:  The Maw of Endless Hunger (Grotesque Beast, Chest Maw & Bone Harvester)
 * Gate 3 - Greed:     The Gilded Tyrant (Gilded Colossus, Imperial Crown & War Hammer)
 * Gate 4 - Wrath:     The Red Calamity (Volcanic Warlord, Magma Fissures & Hellfire Blade)
 * Gate 5 - Heresy:    The Saint of Ash (Fallen Inquisitor, Spectral Wings & Inverted Staff)
 * Gate 6 - Violence:  The Butcher of Ruin (Executioner, Meat Hooks & Colossal Cleaver)
 * Gate 7 - Sovereign: The Sovereign of Desire (Celestial Monarch, Astrolabe Halo & Needle Blade)
 */

import * as THREE from 'three';
import { materialFactory } from '../vfx/MaterialFactory';
import {
  createLoftedBodyGeometry,
  createAnatomicalLimb,
  createDemonicSkull,
  createCurvedHorn,
  createGothicMonarchSkull,
  createIntegratedBoneCrown,
  createSculptedGothicPauldron,
  createAnatomicalRibcage,
  createSkeletalArmSegment,
  createSkeletalHand,
  createSkeletalLegSegment,
  createSkeletalFoot,
  createSculptedImperialCrown,
  createBeveledPrisonBlade,
  createArticulatedHand,
  createGothicSabatonFoot,
  LoftedSlice,
} from './CharacterGeometry';

export interface SovereignVisualRig {
  realmId: number;
  bossName: string;
  weapon: THREE.Group;
  emissiveMaterials: THREE.MeshStandardMaterial[];
  phase2Visuals: THREE.Object3D[];
  phase3Visuals: THREE.Object3D[];
  animatedNodes: {
    node?: THREE.Object3D | THREE.Material;
    update: (time: number, delta: number, phase: number) => void;
  }[];
  onPhaseChange: (phase: number) => void;
  update: (time: number, delta: number, phase: number) => void;
}

export interface BossRigNodes {
  mainBody: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  auraLight: THREE.PointLight;
}

// ============================================================================
// 1. GATE 1 - LIMBO: THE HOLLOW KING (High-Fidelity Monarch)
// ============================================================================
function buildHollowKingModel(nodes: BossRigNodes): SovereignVisualRig {
  const { mainBody, head, leftArm, rightArm, auraLight } = nodes;
  const emissiveMats: THREE.MeshStandardMaterial[] = [];
  const phase2Visuals: THREE.Object3D[] = [];
  const phase3Visuals: THREE.Object3D[] = [];
  const animatedNodes: SovereignVisualRig['animatedNodes'] = [];

  // PBR Materials (Cold moonlit ivory bone + tarnished joint condyles + dark iron Damascus steel + restrained runes)
  const blackPlateMat = materialFactory.createHollowMonarchSteel();
  const silverTrimMat = materialFactory.createHollowMonarchSteelTrim();
  const boneMat = materialFactory.createAncientMonarchBone();
  const boneCondyleMat = materialFactory.createHollowKingJointBone();

  const shroudMat = materialFactory.createTatteredCloth();
  shroudMat.color.setHex(0x141720);

  const leatherMat = materialFactory.createWeatheredLeather();

  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x082f49,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.36,
    roughness: 0.28,
    metalness: 0.72,
  });
  emissiveMats.push(cyanGlowMat);

  const crownMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.85,
    roughness: 0.22,
    transparent: true,
    opacity: 0.0,
  });
  emissiveMats.push(crownMat);

  // 1. Torso: Open-Front Regal Funeral Mantle & Flared Waist Tassets
  // Draped behind spine & flanks so the entire skeletal ribcage, sternum, pelvis & femurs read clearly
  mainBody.position.y = 1.8;
  const capeGeom = new THREE.CylinderGeometry(0.46, 1.08, 2.55, 24, 6, true, Math.PI * 0.62, Math.PI * 0.76);
  const capePos = capeGeom.attributes.position;
  for (let i = 0; i < capePos.count; i++) {
    const y = capePos.getY(i);
    const x = capePos.getX(i);
    const z = capePos.getZ(i);
    const t = (1.275 - y) / 2.55; // 0 top -> 1 bottom
    const ripple = Math.sin(x * 7.5 + t * 4.0) * 0.05 * t;
    capePos.setZ(i, z - 0.12 - t * 0.22 + ripple);
  }
  capePos.needsUpdate = true;
  capeGeom.computeVertexNormals();
  const shroud = new THREE.Mesh(capeGeom, shroudMat);
  shroud.position.set(0, -0.35, -0.04);
  shroud.castShadow = true;
  mainBody.add(shroud);

  // Fitted curved Gothic hip war-tasset plates flanking iliac crests (dark iron Damascus trim)
  const matteTrimArmorMat = silverTrimMat;
  const curvedTassetSlices: LoftedSlice[] = [
    { y: -0.28, rx: 0.035, rz: 0.012 },
    { y: -0.14, rx: 0.088, rz: 0.016, bulgeZFront: 0.012 },
    { y: 0.02,  rx: 0.112, rz: 0.018, bulgeZFront: 0.014 },
    { y: 0.18,  rx: 0.105, rz: 0.018, bulgeZFront: 0.010 },
    { y: 0.26,  rx: 0.072, rz: 0.014 },
  ];
  const curvedTassetGeom = createLoftedBodyGeometry(curvedTassetSlices, 16, true, true);

  for (const s of [-1, 1]) {
    const tasset = new THREE.Mesh(curvedTassetGeom, matteTrimArmorMat);
    tasset.position.set(s * 0.34, -0.34, 0.0);
    tasset.rotation.z = s * 0.14;
    tasset.rotation.y = s * Math.PI * 0.45;
    tasset.castShadow = true;
    mainBody.add(tasset);
  }

  // 2. Anatomical Skeletal Ribcage, Clavicles, 3-Part Sternum, Spine & Continuous Pelvis
  const ribcage = createAnatomicalRibcage(boneMat, cyanGlowMat, 8);
  ribcage.position.set(0, 0.30, 0);
  mainBody.add(ribcage);

  // Sculpted cervical vertebrae column connecting thoracic spine into skull occipital condyle
  const cervShape = new THREE.Shape();
  cervShape.moveTo(0, 0.036);
  cervShape.lineTo(0.048, 0.018);
  cervShape.lineTo(0.034, -0.022);
  cervShape.lineTo(0, -0.072);
  cervShape.lineTo(-0.034, -0.022);
  cervShape.lineTo(-0.048, 0.018);
  cervShape.closePath();
  const cervGeom = new THREE.ExtrudeGeometry(cervShape, {
    depth: 0.044,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.008,
    bevelThickness: 0.008,
  });
  cervGeom.center();
  cervGeom.computeVertexNormals();

  for (let c = 0; c < 3; c++) {
    const neckVert = new THREE.Mesh(cervGeom, boneMat);
    neckVert.position.set(0, 1.13 + c * 0.095, -0.05 + c * 0.038);
    neckVert.rotation.x = Math.PI / 2 + 0.18;
    neckVert.castShadow = true;
    mainBody.add(neckVert);
  }

  // 3. Head: High-Resolution Skeletal Monarch Skull + Integrated Royal Bone Crown
  head.position.set(0, 1.44, 0.12);
  const skull = createGothicMonarchSkull({
    bone: boneMat,
    eye: cyanGlowMat,
    ironTrim: blackPlateMat,
    includeHorns: false,
  });
  skull.scale.set(1.25, 1.25, 1.25);
  head.add(skull);

  // Integrated bone-and-iron royal crown with irregular branching bone spires & subtle rune glow
  const boneCrown = createIntegratedBoneCrown(boneMat, matteTrimArmorMat, cyanGlowMat);
  boneCrown.position.set(0, 0.215, -0.006);
  skull.add(boneCrown);

  // Phase 3 Spectral Crown of Cerulean Flame hovering softly above the bone crown
  const spectralCrown = createSculptedImperialCrown(0.42, 0.36, 7, crownMat);
  spectralCrown.position.set(0, 0.72, 0);
  spectralCrown.scale.set(0.01, 0.01, 0.01);
  head.add(spectralCrown);
  phase3Visuals.push(spectralCrown);

  // 4. Shoulders & Arms: PRESERVED Gothic Tiered Pauldrons + Articulated Skeletal Humerus / Radius & Ulna / Phalanges
  leftArm.position.set(0.76, 0.85, 0);
  rightArm.position.set(-0.76, 0.85, 0);

  for (const [arm, isRight] of [[leftArm, false], [rightArm, true]] as const) {
    const skeletalArm = createSkeletalArmSegment(boneMat, boneCondyleMat);
    arm.add(skeletalArm);

    // Preserved iconic Gothic Shoulder Pauldron
    const pauldron = createSculptedGothicPauldron(isRight, blackPlateMat, silverTrimMat);
    pauldron.position.set(isRight ? -0.15 : 0.15, 0.16, 0);
    arm.add(pauldron);
  }

  // Articulated Skeletal Hands with splayed metacarpals & phalanges
  const handL = createSkeletalHand(false, boneMat, boneCondyleMat);
  handL.position.set(0, -1.32, 0.04);
  handL.rotation.y = Math.PI * 0.15;
  leftArm.add(handL);

  const handR = createSkeletalHand(true, boneMat, boneCondyleMat);
  handR.position.set(0, -1.32, 0.04);
  handR.rotation.y = -Math.PI * 0.15;
  rightArm.add(handR);

  // 5. Lower Skeletal Legs (Femur, Patella, Tibia & Fibula) aligned to pelvic acetabulum sockets & grounded on y=0
  const legsGroup = new THREE.Group();
  legsGroup.position.set(0, -0.24, 0);
  for (const [xPos] of [[0.24], [-0.24]] as const) {
    const leg = createSkeletalLegSegment(boneMat, boneCondyleMat);
    leg.position.set(xPos, 0, 0);
    legsGroup.add(leg);

    const skeletalFoot = createSkeletalFoot(boneMat, blackPlateMat, boneCondyleMat);
    skeletalFoot.position.set(xPos, -1.50, 0.01);
    legsGroup.add(skeletalFoot);
  }
  mainBody.add(legsGroup);

  // 6. Weapon: The Prison Seal Greatsword (High-Fidelity Beveled Blade & Quillons)
  const { swordGroup } = createBeveledPrisonBlade(
    blackPlateMat,
    cyanGlowMat,
    silverTrimMat,
    leatherMat
  );
  const weapon = swordGroup;
  weapon.position.set(0, -0.5, 0.45);
  weapon.rotation.x = Math.PI / 2.3;
  rightArm.add(weapon);

  animatedNodes.push({
    node: spectralCrown,
    update: (time, delta, phase) => {
      if (phase === 3) {
        spectralCrown.rotation.y += delta * 1.5;
        spectralCrown.position.y = 0.72 + Math.sin(time * 3) * 0.05;
      }
    },
  });

  return {
    realmId: 1,
    bossName: 'The Hollow King',
    weapon,
    emissiveMaterials: emissiveMats,
    phase2Visuals,
    phase3Visuals,
    animatedNodes,
    onPhaseChange: (p) => {
      if (p === 2) {
        cyanGlowMat.emissiveIntensity = 1.15;
        auraLight.intensity = 3.8;
      } else if (p === 3) {
        cyanGlowMat.emissiveIntensity = 1.55;
        crownMat.opacity = 0.56;
        spectralCrown.scale.set(1.12, 1.12, 1.12);
        auraLight.intensity = 5.2;
      }
    },
    update: (time, delta, phase) => {
      animatedNodes.forEach(an => an.update(time, delta, phase));
    },
  };
}

// ============================================================================
// 2. GATE 2 - GLUTTONY: THE MAW OF ENDLESS HUNGER (High-Fidelity)
// ============================================================================
// ============================================================================
// 2. GATE 2 - GLUTTONY: THE MAW OF ENDLESS HUNGER (Authoritative Canon Sovereign)
// ============================================================================
function buildGluttonyModel(nodes: BossRigNodes): SovereignVisualRig {
  const { mainBody, head, leftArm, rightArm, auraLight } = nodes;
  const emissiveMats: THREE.MeshStandardMaterial[] = [];
  const phase2Visuals: THREE.Object3D[] = [];
  const phase3Visuals: THREE.Object3D[] = [];
  const animatedNodes: SovereignVisualRig['animatedNodes'] = [];

  // PBR Materials: Corrupted religious monarch palette
  const tarnishedGoldMat = new THREE.MeshStandardMaterial({
    color: 0x997738,
    roughness: 0.38,
    metalness: 0.88,
  });
  const ceremonialCrimsonMat = new THREE.MeshStandardMaterial({
    color: 0x5a0812,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.9,
    roughness: 0.28,
    metalness: 0.5,
  });
  emissiveMats.push(ceremonialCrimsonMat);

  const corruptedFleshMat = new THREE.MeshStandardMaterial({
    color: 0x3d1a1c,
    roughness: 0.62,
    metalness: 0.15,
  });
  const ancientBoneMat = new THREE.MeshStandardMaterial({
    color: 0x5c5040,
    roughness: 0.52,
    metalness: 0.20,
  });
  const bileAcidMat = new THREE.MeshStandardMaterial({
    color: 0x1a3308,
    emissive: 0x84cc16,
    emissiveIntensity: 0.75,
    roughness: 0.25,
    metalness: 0.45,
  });
  emissiveMats.push(bileAcidMat);

  const crimsonHaloGlowMat = new THREE.MeshStandardMaterial({
    color: 0x7f0909,
    emissive: 0xdc2626,
    emissiveIntensity: 1.6,
    roughness: 0.18,
    metalness: 0.7,
  });
  emissiveMats.push(crimsonHaloGlowMat);

  // 1. Massive Living Lower-Body Structure (Sprawling throne of flesh, tendrils & bone roots)
  mainBody.position.y = 1.95;
  const livingLowerBody = new THREE.Group();
  livingLowerBody.position.set(0, -1.2, 0);

  // Colossal organic base mound
  const baseMoundGeom = new THREE.CylinderGeometry(1.4, 2.2, 1.2, 24, 4);
  baseMoundGeom.computeVertexNormals();
  const baseMound = new THREE.Mesh(baseMoundGeom, corruptedFleshMat);
  baseMound.position.y = -0.3;
  baseMound.receiveShadow = true;
  livingLowerBody.add(baseMound);

  // Coiled muscular roots anchoring to the ground
  for (let r = 0; r < 8; r++) {
    const ang = (r / 8) * Math.PI * 2;
    const rootGeom = createCurvedHorn(0.18, 1.8, new THREE.Vector3(Math.cos(ang) * 0.8, -0.4, Math.sin(ang) * 0.8), 12, 16);
    const root = new THREE.Mesh(rootGeom, corruptedFleshMat);
    root.rotation.x = Math.PI * 0.45;
    root.rotation.y = ang;
    root.position.set(Math.cos(ang) * 1.1, -0.4, Math.sin(ang) * 1.1);
    root.castShadow = true;
    livingLowerBody.add(root);
  }

  // Piled consumed skulls, bone shards & tarnished liturgical chalices embedded in the base mound
  for (let sk = 0; sk < 9; sk++) {
    const skAng = (sk / 9) * Math.PI * 2 + 0.15;
    const skDist = 1.25 + (sk % 3) * 0.3;
    const baseSkull = createGothicMonarchSkull({
      bone: ancientBoneMat,
      eye: ceremonialCrimsonMat,
      ironTrim: tarnishedGoldMat,
    });
    baseSkull.scale.set(0.35, 0.35, 0.35);
    baseSkull.position.set(Math.cos(skAng) * skDist, -0.45 + (sk % 2) * 0.2, Math.sin(skAng) * skDist);
    baseSkull.rotation.set((sk % 2 === 0 ? 0.3 : -0.3), skAng, 0.2);
    livingLowerBody.add(baseSkull);

    // Embedded discarded gold communion chalices
    if (sk % 3 === 0) {
      const chalice = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.04, 0.22, 10),
        tarnishedGoldMat
      );
      chalice.position.set(Math.cos(skAng + 0.2) * (skDist * 0.95), -0.4, Math.sin(skAng + 0.2) * (skDist * 0.95));
      chalice.rotation.set(0.4, skAng, 0.5);
      livingLowerBody.add(chalice);
    }
  }
  mainBody.add(livingLowerBody);

  // Phase 3 Colossal Expansion of Lower Body
  const phase3ExpandedMaw = new THREE.Group();
  phase3ExpandedMaw.position.set(0, -0.8, 0);
  const colossalRingGeom = new THREE.TorusGeometry(2.4, 0.45, 12, 32);
  colossalRingGeom.computeVertexNormals();
  const colossalMawRing = new THREE.Mesh(colossalRingGeom, corruptedFleshMat);
  colossalMawRing.rotation.x = Math.PI / 2;
  phase3ExpandedMaw.add(colossalMawRing);
  for (let fang = 0; fang < 16; fang++) {
    const a = (fang / 16) * Math.PI * 2;
    const fGeom = createCurvedHorn(0.08, 0.6, new THREE.Vector3(0, 0.15, -0.3), 10, 14);
    const fMesh = new THREE.Mesh(fGeom, ancientBoneMat);
    fMesh.rotation.x = -Math.PI * 0.4;
    fMesh.rotation.y = a;
    fMesh.position.set(Math.cos(a) * 2.2, 0.2, Math.sin(a) * 2.2);
    phase3ExpandedMaw.add(fMesh);
  }
  phase3ExpandedMaw.scale.set(0.01, 0.01, 0.01);
  mainBody.add(phase3ExpandedMaw);
  phase3Visuals.push(phase3ExpandedMaw);

  // 2. Grotesque Bloated Torso with Consumed Remains & Tarnished Gold Regalia
  const torsoSlices: LoftedSlice[] = [
    { y: 1.15, rx: 0.62, rz: 0.50, cz: 0.03 }, // High neck & vestment collar
    { y: 0.55, rx: 0.94, rz: 0.74, cz: 0.10, bulgeZFront: 0.26, bulgeXSide: 0.08 }, // Pectoral ribs & stole
    { y: -0.15, rx: 1.10, rz: 0.90, cz: 0.16, bulgeZFront: 0.35, bulgeXSide: 0.12 }, // Distended belly of souls
    { y: -0.80, rx: 0.96, rz: 0.80, cz: 0.10, bulgeZFront: 0.25 }, // Lower chasuble drape
    { y: -1.35, rx: 0.78, rz: 0.65, cz: 0.04 }, // Hip junction
  ];
  const torsoGeom = createLoftedBodyGeometry(torsoSlices, 32, true, true);
  const torso = new THREE.Mesh(torsoGeom, corruptedFleshMat);
  torso.castShadow = true;
  mainBody.add(torso);

  // Tarnished Gold Ceremonial Mantle / Chasuble Regalia
  const mantleSlices: LoftedSlice[] = [
    { y: 1.18, rx: 0.68, rz: 0.54, cz: 0.03 },
    { y: 0.65, rx: 1.02, rz: 0.80, cz: 0.12, bulgeZFront: 0.28 },
    { y: 0.05, rx: 0.90, rz: 0.72, cz: 0.10 },
  ];
  const mantleGeom = createLoftedBodyGeometry(mantleSlices, 28, true, true);
  const mantle = new THREE.Mesh(mantleGeom, tarnishedGoldMat);
  mantle.position.set(0, 0.05, 0.02);
  mantle.castShadow = true;
  mainBody.add(mantle);

  // Pectoral Chalice Relief Medallion & Belt Medallions
  const pectoralPlaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.44, 0.12),
    tarnishedGoldMat
  );
  pectoralPlaque.position.set(0, 0.58, 0.78);
  pectoralPlaque.castShadow = true;
  mainBody.add(pectoralPlaque);

  // Belt Medallions
  for (let bm = -1; bm <= 1; bm++) {
    const beltRoundel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16),
      tarnishedGoldMat
    );
    beltRoundel.rotation.x = Math.PI / 2;
    beltRoundel.position.set(bm * 0.28, -0.15, 0.84);
    mainBody.add(beltRoundel);
  }

  // Hanging ceremonial scale pendants & liturgical stole tassels
  for (let s = -2; s <= 2; s++) {
    const scaleGeom = new THREE.DodecahedronGeometry(0.09, 1);
    scaleGeom.computeVertexNormals();
    const scaleMesh = new THREE.Mesh(scaleGeom, tarnishedGoldMat);
    scaleMesh.position.set(s * 0.26, -0.4, 0.82);
    mainBody.add(scaleMesh);
  }

  // Arching Shoulder Bone Yokes with Hanging Censers (Suspended on chains)
  const hangingCensers: THREE.Group[] = [];
  for (const yokeSide of [-1, 1] as const) {
    const yokeGeom = createCurvedHorn(0.08, 0.95, new THREE.Vector3(yokeSide * 0.45, 0.2, 0), 12, 16);
    const yoke = new THREE.Mesh(yokeGeom, ancientBoneMat);
    yoke.rotation.z = -yokeSide * 0.6;
    yoke.position.set(yokeSide * 0.95, 0.95, 0);
    mainBody.add(yoke);

    // Hanging Censer / Bell
    const censerGroup = new THREE.Group();
    censerGroup.position.set(yokeSide * 1.45, 0.85, 0);

    // Chain links
    const chainGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.55, 6);
    const chain = new THREE.Mesh(chainGeom, tarnishedGoldMat);
    chain.position.y = -0.28;
    censerGroup.add(chain);

    // Ornate Censer Pot
    const potGeom = new THREE.DodecahedronGeometry(0.14, 1);
    const censerPot = new THREE.Mesh(potGeom, tarnishedGoldMat);
    censerPot.position.y = -0.55;
    censerGroup.add(censerPot);

    // Subtle smoke glowing point
    const censerGlow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), ceremonialCrimsonMat);
    censerGlow.position.y = -0.55;
    censerGroup.add(censerGlow);

    mainBody.add(censerGroup);
    hangingCensers.push(censerGroup);
  }

  // 3. Multiple Faces & Consumed Skulls embedded in the chest and belly
  for (let f = 0; f < 5; f++) {
    const faceSkull = createGothicMonarchSkull({
      bone: ancientBoneMat,
      eye: bileAcidMat,
      ironTrim: tarnishedGoldMat,
    });
    faceSkull.scale.set(0.42, 0.42, 0.42);
    const ang = (f / 5) * Math.PI * 0.9 - Math.PI * 0.45;
    faceSkull.position.set(Math.sin(ang) * 0.55, 0.25 - (f % 2) * 0.35, 0.72 + Math.cos(ang) * 0.15);
    faceSkull.rotation.y = ang * 0.6;
    faceSkull.rotation.x = (f % 2 === 0 ? 0.2 : -0.2);
    mainBody.add(faceSkull);
  }

  // Exposed Vertical Chest Maw with 12 Curved Rib-Fangs
  const chestMaw = new THREE.Group();
  chestMaw.position.set(0, 0.22, 0.78);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const fangGeom = createCurvedHorn(0.055, 0.42, new THREE.Vector3(side * 0.14, -0.06, 0.20), 12, 16);
      const fang = new THREE.Mesh(fangGeom, ancientBoneMat);
      fang.rotation.z = side * (0.85 + i * 0.08);
      fang.position.set(side * (0.15 + i * 0.055), 0.38 - i * 0.14, 0);
      chestMaw.add(fang);
    }
  }
  mainBody.add(chestMaw);

  // 4. Head: Distinctive Horned Headpiece with Corrupted Mitre
  head.position.set(0, 1.45, 0.22);
  const headSkull = createGothicMonarchSkull({
    bone: ancientBoneMat,
    eye: ceremonialCrimsonMat,
    ironTrim: tarnishedGoldMat,
  });
  headSkull.scale.set(1.25, 1.25, 1.25);
  head.add(headSkull);

  // Central Cyclopean Crimson Gem Eye on Head Crest
  const gemSetting = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.03, 10, 20),
    tarnishedGoldMat
  );
  gemSetting.position.set(0, 0.42, 0.42);
  head.add(gemSetting);

  const crimsonGemEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.10, 16, 16),
    crimsonHaloGlowMat
  );
  crimsonGemEye.scale.set(1.0, 1.35, 0.75);
  crimsonGemEye.position.set(0, 0.42, 0.43);
  head.add(crimsonGemEye);

  // Corrupted High Ceremonial Mitre / Diadem Crest
  const mitreGeom = new THREE.CylinderGeometry(0.24, 0.38, 0.75, 16);
  mitreGeom.computeVertexNormals();
  const mitre = new THREE.Mesh(mitreGeom, tarnishedGoldMat);
  mitre.position.set(0, 0.65, -0.05);
  head.add(mitre);

  // Distinctive Sweeping Grand Horns
  for (const side of [-1, 1] as const) {
    const hornGeom = createCurvedHorn(
      0.13,
      1.25,
      new THREE.Vector3(side * 0.6, 0.5, -0.2),
      16,
      24
    );
    const horn = new THREE.Mesh(hornGeom, ancientBoneMat);
    horn.rotation.z = -side * 0.7;
    horn.rotation.x = -0.3;
    horn.position.set(side * 0.38, 0.45, -0.05);
    horn.castShadow = true;
    head.add(horn);

    // Secondary brow horns
    const browHornGeom = createCurvedHorn(0.07, 0.5, new THREE.Vector3(side * 0.2, 0.1, 0.25), 10, 14);
    const browHorn = new THREE.Mesh(browHornGeom, tarnishedGoldMat);
    browHorn.rotation.x = Math.PI * 0.3;
    browHorn.position.set(side * 0.22, 0.18, 0.22);
    head.add(browHorn);
  }

  // 5. ENORMOUS CRIMSON CIRCULAR HALO WITH SPIKED SILHOUETTE
  // Mounted grandly behind head and upper torso
  const haloGroup = new THREE.Group();
  haloGroup.position.set(0, 1.45, -0.35);

  // Inner Crimson Ring Disc
  const haloRingGeom = new THREE.TorusGeometry(1.65, 0.08, 16, 48);
  haloRingGeom.computeVertexNormals();
  const haloRing = new THREE.Mesh(haloRingGeom, crimsonHaloGlowMat);
  haloGroup.add(haloRing);

  // Secondary filigree inner ring
  const innerRingGeom = new THREE.TorusGeometry(1.35, 0.04, 12, 36);
  innerRingGeom.computeVertexNormals();
  const innerRing = new THREE.Mesh(innerRingGeom, tarnishedGoldMat);
  haloGroup.add(innerRing);

  // 12 Recognizable Radiant Crimson Spikes along the perimeter
  for (let s = 0; s < 12; s++) {
    const ang = (s / 12) * Math.PI * 2;
    const spikeLen = (s % 3 === 0) ? 0.95 : 0.65;
    const spikeGeom = new THREE.ConeGeometry(0.075, spikeLen, 8);
    spikeGeom.computeVertexNormals();
    const spike = new THREE.Mesh(spikeGeom, crimsonHaloGlowMat);
    spike.position.set(Math.cos(ang) * 1.65, Math.sin(ang) * 1.65, 0);
    spike.rotation.z = ang - Math.PI / 2;
    haloGroup.add(spike);
  }
  mainBody.add(haloGroup);

  // 6. Prehensile Writhing Tentacles and Organic Extensions (6 tentacles)
  const tentacles: THREE.Group[] = [];
  for (let t = 0; t < 6; t++) {
    const tentacle = new THREE.Group();
    const ang = (t / 6) * Math.PI * 2;
    tentacle.position.set(Math.cos(ang) * 0.85, 0.15 - (t % 2) * 0.4, Math.sin(ang) * 0.85);

    // Chain of 4 tapered segments
    for (let seg = 0; seg < 4; seg++) {
      const segGeom = new THREE.CylinderGeometry(0.12 - seg * 0.025, 0.14 - seg * 0.025, 0.55, 12);
      segGeom.computeVertexNormals();
      const segMesh = new THREE.Mesh(segGeom, ceremonialCrimsonMat);
      segMesh.position.y = -seg * 0.5;
      tentacle.add(segMesh);
    }
    mainBody.add(tentacle);
    tentacles.push(tentacle);
  }

  // 7. Arms: Regalia Pauldrons & The Devouring Monstrance
  leftArm.position.set(0.95, 0.82, 0);
  rightArm.position.set(-0.95, 0.82, 0);
  for (const [arm, isRight] of [[leftArm, false], [rightArm, true]] as const) {
    const limb = new THREE.Mesh(createAnatomicalLimb(0.22, 0.18, 0.15, 1.38, 0.08), corruptedFleshMat);
    limb.castShadow = true;
    arm.add(limb);

    const pauldron = createSculptedGothicPauldron(isRight, tarnishedGoldMat, ceremonialCrimsonMat);
    pauldron.position.set(isRight ? -0.16 : 0.16, 0.18, 0);
    pauldron.scale.set(1.2, 1.2, 1.2);
    arm.add(pauldron);
  }

  // 8. Weapon: The Gluttonous Monstrance (Corrupted Religious Reliquary Scepter)
  const weapon = new THREE.Group();
  const shaftGeom = new THREE.CylinderGeometry(0.065, 0.075, 3.8, 16);
  shaftGeom.computeVertexNormals();
  const shaft = new THREE.Mesh(shaftGeom, tarnishedGoldMat);
  weapon.add(shaft);

  // Spiked Monstrance Cage
  const cageGeom = new THREE.TorusGeometry(0.55, 0.06, 12, 28);
  cageGeom.computeVertexNormals();
  const cage = new THREE.Mesh(cageGeom, tarnishedGoldMat);
  cage.position.y = 1.65;
  weapon.add(cage);

  // Encased Weeping Eye of Gluttony
  const eyeGeom = new THREE.SphereGeometry(0.24, 16, 16);
  eyeGeom.computeVertexNormals();
  const eye = new THREE.Mesh(eyeGeom, ceremonialCrimsonMat);
  eye.position.y = 1.65;
  weapon.add(eye);

  // 8 Radiating Spikes on Monstrance Rim
  for (let m = 0; m < 8; m++) {
    const ang = (m / 8) * Math.PI * 2;
    const mSpikeGeom = new THREE.ConeGeometry(0.045, 0.35, 6);
    const mSpike = new THREE.Mesh(mSpikeGeom, ancientBoneMat);
    mSpike.position.set(Math.cos(ang) * 0.55, 1.65 + Math.sin(ang) * 0.55, 0);
    mSpike.rotation.z = ang - Math.PI / 2;
    weapon.add(mSpike);
  }

  weapon.position.set(0, -0.65, 0.42);
  weapon.rotation.x = Math.PI / 2.3;
  rightArm.add(weapon);

  animatedNodes.push({
    node: haloGroup,
    update: (time, delta, phase) => {
      // Rotating halo with phase-dependent agitation
      const speed = phase === 3 ? 2.5 : (phase === 2 ? 1.6 : 0.6);
      haloGroup.rotation.z += delta * speed;

      // Tentacle undulating & writhing animation
      const tentacleFreq = phase === 3 ? 4.5 : (phase === 2 ? 3.0 : 1.5);
      tentacles.forEach((tent, idx) => {
        const wave = Math.sin(time * tentacleFreq + idx) * (phase >= 2 ? 0.35 : 0.18);
        tent.rotation.x = wave;
        tent.rotation.z = Math.cos(time * tentacleFreq * 0.8 + idx) * 0.25;
      });

      // Hanging censers pendulum sway
      hangingCensers.forEach((censer, idx) => {
        const sway = Math.sin(time * 2.0 + idx * Math.PI) * 0.15;
        censer.rotation.z = sway;
      });

      // Chest maw subtle breathing
      const breath = Math.sin(time * 2.2) * 0.05;
      chestMaw.scale.set(1 + breath, 1 + breath, 1 + breath * 1.5);
    },
  });

  return {
    realmId: 2,
    bossName: 'The Maw of Endless Hunger',
    weapon,
    emissiveMaterials: emissiveMats,
    phase2Visuals,
    phase3Visuals,
    animatedNodes,
    onPhaseChange: (p) => {
      if (p === 2) {
        ceremonialCrimsonMat.emissiveIntensity = 1.8;
        crimsonHaloGlowMat.emissiveIntensity = 2.4;
        auraLight.intensity = 6.0;
        auraLight.color.setHex(0xdc2626);
      } else if (p === 3) {
        ceremonialCrimsonMat.emissiveIntensity = 3.2;
        crimsonHaloGlowMat.emissiveIntensity = 3.8;
        phase3ExpandedMaw.scale.set(1.0, 1.0, 1.0);
        auraLight.intensity = 9.0;
        auraLight.color.setHex(0xb91c1c);
      }
    },
    update: (time, delta, phase) => {
      animatedNodes.forEach(an => an.update(time, delta, phase));
    },
  };
}

// ============================================================================
// 3. GATE 3 - GREED: THE GILDED TYRANT (High-Fidelity Baroque Colossus)
// ============================================================================
function buildGreedModel(nodes: BossRigNodes): SovereignVisualRig {
  const { mainBody, head, leftArm, rightArm, auraLight } = nodes;
  const emissiveMats: THREE.MeshStandardMaterial[] = [];
  const phase2Visuals: THREE.Object3D[] = [];
  const phase3Visuals: THREE.Object3D[] = [];
  const animatedNodes: SovereignVisualRig['animatedNodes'] = [];

  // PBR Materials (Lustrous polished gold plate with high specular reflectivity)
  const goldArmorMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.22,
    metalness: 0.95,
  });
  const darkVelvetMat = new THREE.MeshStandardMaterial({
    color: 0x181210,
    roughness: 0.88,
  });
  const moltenGoldMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.55,
    roughness: 0.20,
    metalness: 0.80,
  });
  emissiveMats.push(moltenGoldMat);

  // 1. Massive Sculpted Baroque Gilded Torso with Gothic Tapul Ridge (32 radial segments)
  mainBody.position.y = 1.9;
  const torsoSlices: LoftedSlice[] = [
    { y: 0.95, rx: 0.62, rz: 0.44, cz: 0.02 }, // Gorget collar
    { y: 0.50, rx: 0.78, rz: 0.54, cz: 0.06, bulgeZFront: 0.16, bulgeXSide: 0.06 }, // Upper baroque breastplate
    { y: 0.0,  rx: 0.72, rz: 0.48, cz: 0.05, bulgeZFront: 0.12, indentZBack: 0.03 }, // Chiseled waist
    { y: -0.50, rx: 0.80, rz: 0.56, cz: 0.04, bulgeZFront: 0.08 }, // Fauld belt rim
    { y: -1.20, rx: 0.75, rz: 0.52, cz: 0.02 }, // Lower tassets
  ];
  const torsoGeom = createLoftedBodyGeometry(torsoSlices, 32, true, true);
  const plate = new THREE.Mesh(torsoGeom, goldArmorMat);
  plate.castShadow = true;
  mainBody.add(plate);

  // 2. Sculpted Fauld Lames with Beveled Flanges
  for (let i = 0; i < 4; i++) {
    const lameGeom = new THREE.CylinderGeometry(
      0.80 + i * 0.04,
      0.84 + i * 0.04,
      0.15,
      28,
      2,
      true,
      0,
      Math.PI * 2
    );
    lameGeom.computeVertexNormals();
    const fauld = new THREE.Mesh(lameGeom, goldArmorMat);
    fauld.position.y = -0.50 - i * 0.15;
    fauld.scale.set(1.0, 1.0, 0.72);
    mainBody.add(fauld);
  }

  // Royal dark velvet sash with rich hem
  const sashGeom = new THREE.PlaneGeometry(0.55, 1.25, 6, 12);
  sashGeom.computeVertexNormals();
  const royalSash = new THREE.Mesh(sashGeom, darkVelvetMat);
  royalSash.position.set(0, -0.65, 0.48);
  royalSash.rotation.x = -0.12;
  mainBody.add(royalSash);

  // 3. Molten Gold Veins across Breastplate (Curved glowing seams)
  for (let v = 0; v < 3; v++) {
    const veinGeom = new THREE.TorusGeometry(0.48 - v * 0.08, 0.022, 12, 24, Math.PI * 0.85);
    veinGeom.computeVertexNormals();
    const vein = new THREE.Mesh(veinGeom, moltenGoldMat);
    vein.rotation.x = Math.PI / 2 + (v * 0.2);
    vein.rotation.z = (v % 2 === 0 ? 0.3 : -0.3);
    vein.position.set(0, 0.45 - v * 0.24, 0.42);
    mainBody.add(vein);
    phase2Visuals.push(vein);
  }

  // 4. Head: Chiseled Imperial Helm with Faceless Executioner Slit & Crown
  head.position.set(0, 1.30, 0.08);
  const helmGeom = new THREE.SphereGeometry(0.38, 28, 20);
  helmGeom.computeVertexNormals();
  helmGeom.scale(0.9, 1.15, 1.0);
  const helm = new THREE.Mesh(helmGeom, goldArmorMat);
  helm.castShadow = true;
  head.add(helm);

  // Narrow molten slit visor
  const visorGeom = new THREE.BoxGeometry(0.42, 0.065, 0.05);
  visorGeom.computeVertexNormals();
  const visor = new THREE.Mesh(visorGeom, moltenGoldMat);
  visor.position.set(0, 0.06, 0.38);
  head.add(visor);

  // Imperial Horned Crown with 8 Spire Jewels
  const imperialCrown = createSculptedImperialCrown(0.42, 0.38, 8, goldArmorMat);
  imperialCrown.position.set(0, 0.48, 0);

  // Faceted ruby gems on crown tips
  for (let s = 0; s < 8; s++) {
    const jewelGeom = new THREE.DodecahedronGeometry(0.045);
    jewelGeom.computeVertexNormals();
    const jewel = new THREE.Mesh(jewelGeom, moltenGoldMat);
    const ang = (s / 8) * Math.PI * 2;
    jewel.position.set(Math.cos(ang) * 0.42, 0.52, Math.sin(ang) * 0.42);
    imperialCrown.add(jewel);
  }
  head.add(imperialCrown);

  // 5. Shoulders: Sculpted Tiered Pauldrons with Beveled Gardbraces
  leftArm.position.set(0.92, 0.82, 0);
  rightArm.position.set(-0.92, 0.82, 0);

  for (const [arm, isRight] of [[leftArm, false], [rightArm, true]] as const) {
    const limb = new THREE.Mesh(createAnatomicalLimb(0.18, 0.155, 0.13, 1.32, 0.04), goldArmorMat);
    limb.castShadow = true;
    arm.add(limb);

    const pauldron = createSculptedGothicPauldron(isRight, goldArmorMat, moltenGoldMat);
    pauldron.position.set(isRight ? -0.16 : 0.16, 0.18, 0);
    arm.add(pauldron);
  }

  // Articulated Gilded Gauntlet Hands
  const handL = createArticulatedHand(false, goldArmorMat);
  handL.position.set(0, -1.32, 0.04);
  leftArm.add(handL);

  const handR = createArticulatedHand(true, goldArmorMat);
  handR.position.set(0, -1.32, 0.04);
  rightArm.add(handR);

  // 6. Weapon: The Sovereign Gilded War Hammer (Extruded Octagonal Head & Vault Runes)
  const weapon = new THREE.Group();
  const handleGeom = new THREE.CylinderGeometry(0.065, 0.075, 3.6, 20);
  handleGeom.computeVertexNormals();
  const handle = new THREE.Mesh(handleGeom, goldArmorMat);
  weapon.add(handle);

  // Octagonal War Hammer Block with Beveled Edges
  const hammerHeadShape = new THREE.Shape();
  const hr = 0.45;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(a) * hr;
    const y = Math.sin(a) * hr;
    if (i === 0) hammerHeadShape.moveTo(x, y);
    else hammerHeadShape.lineTo(x, y);
  }
  hammerHeadShape.closePath();

  const hammerHeadGeom = new THREE.ExtrudeGeometry(hammerHeadShape, {
    depth: 1.4,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.03,
    bevelThickness: 0.035,
  });
  hammerHeadGeom.center();
  hammerHeadGeom.computeVertexNormals();

  const hammerHead = new THREE.Mesh(hammerHeadGeom, goldArmorMat);
  hammerHead.position.set(0, 1.4, 0);
  hammerHead.castShadow = true;
  weapon.add(hammerHead);

  // Vault Rune Carvings on Hammer Face
  const runePlateGeom = new THREE.BoxGeometry(0.65, 0.65, 0.06);
  runePlateGeom.computeVertexNormals();
  const hammerRuneF = new THREE.Mesh(runePlateGeom, moltenGoldMat);
  hammerRuneF.position.set(0, 1.4, 0.72);
  weapon.add(hammerRuneF);

  const hammerRuneB = new THREE.Mesh(runePlateGeom, moltenGoldMat);
  hammerRuneB.position.set(0, 1.4, -0.72);
  weapon.add(hammerRuneB);

  // Back-Spiked War Pick for Armor Breaching
  const pickGeom = createCurvedHorn(0.09, 0.55, new THREE.Vector3(0, 0, -0.22), 16, 20);
  const pick = new THREE.Mesh(pickGeom, goldArmorMat);
  pick.rotation.x = -Math.PI / 2;
  pick.position.set(0, 1.4, -0.75);
  pick.castShadow = true;
  weapon.add(pick);

  weapon.position.set(0, -0.6, 0.4);
  weapon.rotation.x = Math.PI / 2.2;
  rightArm.add(weapon);

  animatedNodes.push({
    node: moltenGoldMat,
    update: (time, delta, phase) => {
      // Liquid molten pulsing in veins and hammer
      const speed = phase === 3 ? 5.0 : 2.5;
      moltenGoldMat.emissiveIntensity = (phase === 3 ? 2.5 : 0.6) + Math.sin(time * speed) * 0.3;
    },
  });

  return {
    realmId: 3,
    bossName: 'The Gilded Tyrant',
    weapon,
    emissiveMaterials: emissiveMats,
    phase2Visuals,
    phase3Visuals,
    animatedNodes,
    onPhaseChange: (p) => {
      if (p === 2) {
        moltenGoldMat.emissive.setHex(0xf59e0b);
        auraLight.intensity = 5.5;
      } else if (p === 3) {
        moltenGoldMat.emissive.setHex(0xfbbf24);
        auraLight.intensity = 8.5;
      }
    },
    update: (time, delta, phase) => {
      animatedNodes.forEach(an => an.update(time, delta, phase));
    },
  };
}

// ============================================================================
// 4. GATE 4 - WRATH: THE RED CALAMITY (Volcanic Warlord)
// ============================================================================
function buildWrathModel(nodes: BossRigNodes): SovereignVisualRig {
  const { mainBody, head, leftArm, rightArm, auraLight } = nodes;
  const emissiveMats: THREE.MeshStandardMaterial[] = [];
  const phase2Visuals: THREE.Object3D[] = [];
  const phase3Visuals: THREE.Object3D[] = [];
  const animatedNodes: SovereignVisualRig['animatedNodes'] = [];

  // High-Quality PBR Materials
  const volcanicBasaltMat = new THREE.MeshStandardMaterial({
    color: 0x160c0c,
    roughness: 0.78,
    metalness: 0.45,
  });
  const darkIronTrimMat = new THREE.MeshStandardMaterial({
    color: 0x221818,
    roughness: 0.45,
    metalness: 0.82,
  });
  const magmaGlowMat = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    emissive: 0xef4444,
    emissiveIntensity: 0.85,
    roughness: 0.20,
    metalness: 0.30,
  });
  emissiveMats.push(magmaGlowMat);

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xef4444,
    emissiveIntensity: 1.8,
    roughness: 0.1,
    transparent: true,
    opacity: 0.0,
  });
  emissiveMats.push(flameMat);

  // 1. Towering Volcanic Muscular Torso (32 radial segments)
  mainBody.position.y = 2.0;
  const torsoSlices: LoftedSlice[] = [
    { y: 1.05, rx: 0.65, rz: 0.46, cz: 0.02 }, // Gorget
    { y: 0.45, rx: 0.82, rz: 0.56, cz: 0.06, bulgeZFront: 0.20, bulgeXSide: 0.10 }, // Heavy pectoral plates
    { y: -0.25, rx: 0.68, rz: 0.48, cz: 0.03, indentZBack: 0.04 }, // Chiseled basalt abdominal core
    { y: -0.85, rx: 0.75, rz: 0.52, cz: 0.02 }, // Volcanic fauld
    { y: -1.35, rx: 0.65, rz: 0.44 }, // Lower groin plate
  ];
  const torsoGeom = createLoftedBodyGeometry(torsoSlices, 32, true, true);
  const torso = new THREE.Mesh(torsoGeom, volcanicBasaltMat);
  torso.castShadow = true;
  mainBody.add(torso);

  // 2. Glowing Magma Fissures across Basalt Chest
  for (let f = 0; f < 4; f++) {
    const fissureGeom = new THREE.TorusGeometry(0.55 - f * 0.10, 0.026, 12, 28, Math.PI * 0.9);
    fissureGeom.computeVertexNormals();
    const fissure = new THREE.Mesh(fissureGeom, magmaGlowMat);
    fissure.rotation.x = Math.PI / 2 + (f * 0.22);
    fissure.rotation.z = (f % 2 === 0 ? 0.35 : -0.35);
    fissure.position.set(0, 0.50 - f * 0.26, 0.46);
    mainBody.add(fissure);
    phase2Visuals.push(fissure);
  }

  // 3. Head: Demonic Warlord Skull with Sweeping Bull Horns
  head.position.set(0, 1.45, 0.15);
  const skull = createDemonicSkull({ bone: volcanicBasaltMat, eye: magmaGlowMat });
  skull.scale.set(1.4, 1.4, 1.4);
  head.add(skull);

  // Dual Sweeping Obsidian Bull Horns (Smooth Bezier Horn Generator)
  for (const side of [-1, 1] as const) {
    const hornGeom = createCurvedHorn(
      0.14,
      1.15,
      new THREE.Vector3(side * 0.55, 0.45, -0.25),
      20,
      28
    );
    const horn = new THREE.Mesh(hornGeom, volcanicBasaltMat);
    horn.rotation.z = -side * 0.65;
    horn.rotation.x = -0.3;
    horn.position.set(side * 0.42, 0.38, -0.05);
    horn.castShadow = true;
    head.add(horn);

    const hornCoreGeom = createCurvedHorn(
      0.08,
      0.65,
      new THREE.Vector3(side * 0.25, 0.25, -0.15),
      14,
      18
    );
    const hornCore = new THREE.Mesh(hornCoreGeom, flameMat);
    hornCore.position.y = 0.45;
    horn.add(hornCore);
  }

  // 4. Phase 3 Hellfire Wings (Manifest upon reaching Phase 3)
  const hellfireWings = new THREE.Group();
  hellfireWings.position.set(0, 0.5, -0.45);
  for (const side of [-1, 1] as const) {
    const wingGeom = new THREE.PlaneGeometry(2.2, 3.6, 8, 8);
    wingGeom.computeVertexNormals();
    const wing = new THREE.Mesh(wingGeom, flameMat);
    wing.rotation.y = side * 0.45;
    wing.position.set(side * 1.25, 0.9, 0);
    hellfireWings.add(wing);
  }
  hellfireWings.scale.set(0.01, 0.01, 0.01);
  mainBody.add(hellfireWings);
  phase3Visuals.push(hellfireWings);

  // 5. Arms: Heavy Muscular Basalt Limbs with Sculpted Pauldrons
  leftArm.position.set(0.96, 0.85, 0);
  rightArm.position.set(-0.96, 0.85, 0);
  for (const [arm, isRight] of [[leftArm, false], [rightArm, true]] as const) {
    const limb = new THREE.Mesh(createAnatomicalLimb(0.22, 0.18, 0.15, 1.38, 0.06), volcanicBasaltMat);
    limb.castShadow = true;
    arm.add(limb);

    const pauldron = createSculptedGothicPauldron(isRight, volcanicBasaltMat, darkIronTrimMat);
    pauldron.position.set(isRight ? -0.18 : 0.18, 0.20, 0);
    pauldron.scale.set(1.2, 1.2, 1.2);
    arm.add(pauldron);
  }

  // Articulated Basalt Gauntlets
  const handL = createArticulatedHand(false, volcanicBasaltMat);
  handL.position.set(0, -1.38, 0.04);
  leftArm.add(handL);

  const handR = createArticulatedHand(true, volcanicBasaltMat);
  handR.position.set(0, -1.38, 0.04);
  rightArm.add(handR);

  // 6. Weapon: The Colossal Hellfire Executioner Blade (Beveled Extrusion)
  const weapon = new THREE.Group();
  const hiltGeom = new THREE.CylinderGeometry(0.07, 0.075, 1.4, 16);
  hiltGeom.computeVertexNormals();
  const hilt = new THREE.Mesh(hiltGeom, darkIronTrimMat);
  weapon.add(hilt);

  const crossguardGeom = new THREE.BoxGeometry(1.25, 0.20, 0.28);
  crossguardGeom.computeVertexNormals();
  const guard = new THREE.Mesh(crossguardGeom, darkIronTrimMat);
  guard.position.y = 0.70;
  weapon.add(guard);

  // Extruded Hellfire Executioner Blade
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.lineTo(0.28, 0.15);
  bladeShape.lineTo(0.32, 3.4);
  bladeShape.lineTo(-0.32, 3.4);
  bladeShape.lineTo(-0.28, 0.15);
  bladeShape.closePath();

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.03,
    bevelThickness: 0.035,
  });
  bladeGeom.center();
  bladeGeom.computeVertexNormals();

  const blade = new THREE.Mesh(bladeGeom, volcanicBasaltMat);
  blade.position.y = 2.4;
  blade.castShadow = true;
  weapon.add(blade);

  // Inlaid Magma Fuller Core
  const magmaCoreGeom = new THREE.BoxGeometry(0.18, 2.8, 0.14);
  magmaCoreGeom.computeVertexNormals();
  const magmaCore = new THREE.Mesh(magmaCoreGeom, magmaGlowMat);
  magmaCore.position.y = 2.35;
  weapon.add(magmaCore);

  weapon.position.set(0, -0.65, 0.45);
  weapon.rotation.x = Math.PI / 2.2;
  rightArm.add(weapon);

  animatedNodes.push({
    node: hellfireWings,
    update: (time, delta, phase) => {
      if (phase === 3) {
        hellfireWings.rotation.y = Math.sin(time * 3) * 0.18;
      }
    },
  });

  return {
    realmId: 4,
    bossName: 'The Red Calamity',
    weapon,
    emissiveMaterials: emissiveMats,
    phase2Visuals,
    phase3Visuals,
    animatedNodes,
    onPhaseChange: (p) => {
      if (p === 2) {
        magmaGlowMat.emissiveIntensity = 2.2;
        magmaGlowMat.emissive.setHex(0xf97316);
        auraLight.intensity = 6.0;
      } else if (p === 3) {
        magmaGlowMat.emissiveIntensity = 3.6;
        flameMat.opacity = 0.90;
        hellfireWings.scale.set(1.25, 1.25, 1.25);
        auraLight.intensity = 9.0;
      }
    },
    update: (time, delta, phase) => {
      animatedNodes.forEach(an => an.update(time, delta, phase));
    },
  };
}

// ============================================================================
// 5. GATE 5 - HERESY: THE SAINT OF ASH (Inquisitor)
// ============================================================================
function buildHeresyModel(nodes: BossRigNodes): SovereignVisualRig {
  const { mainBody, head, leftArm, rightArm, auraLight } = nodes;
  const emissiveMats: THREE.MeshStandardMaterial[] = [];
  const phase2Visuals: THREE.Object3D[] = [];
  const phase3Visuals: THREE.Object3D[] = [];
  const animatedNodes: SovereignVisualRig['animatedNodes'] = [];

  // High-Quality PBR Materials
  const ashVestmentMat = new THREE.MeshStandardMaterial({
    color: 0x181a24,
    roughness: 0.90,
  });
  const antiqueSilverMat = new THREE.MeshStandardMaterial({
    color: 0x818cf8,
    roughness: 0.32,
    metalness: 0.88,
  });
  const blackFlameMat = new THREE.MeshStandardMaterial({
    color: 0x312e81,
    emissive: 0x818cf8,
    emissiveIntensity: 0.85,
    roughness: 0.22,
    metalness: 0.65,
  });
  emissiveMats.push(blackFlameMat);

  // 1. Slender Gothic Vestment Silhouette (32 radial segments)
  mainBody.position.y = 2.1; // Levitation stance
  const robeSlices: LoftedSlice[] = [
    { y: 0.95, rx: 0.42, rz: 0.32, cz: 0.01 }, // High collar
    { y: 0.35, rx: 0.48, rz: 0.36, bulgeZFront: 0.08 }, // Upper chest
    { y: -0.45, rx: 0.62, rz: 0.48, bulgeZFront: 0.12 }, // Mid robes
    { y: -1.35, rx: 0.82, rz: 0.66, bulgeZFront: 0.18 }, // Flowing hemline
    { y: -1.85, rx: 1.05, rz: 0.82, bulgeZFront: 0.22 }, // Trailing skirts
  ];
  const robeGeom = createLoftedBodyGeometry(robeSlices, 32, true, false);
  const robes = new THREE.Mesh(robeGeom, ashVestmentMat);
  robes.castShadow = true;
  mainBody.add(robes);

  // 2. Antique Silver Gothic Inquisitor Breastplate with Tapul Ridge
  const breastplateSlices: LoftedSlice[] = [
    { y: 0.75, rx: 0.44, rz: 0.34, cz: 0.02 },
    { y: 0.30, rx: 0.50, rz: 0.38, cz: 0.06, bulgeZFront: 0.14 },
    { y: -0.20, rx: 0.42, rz: 0.32, cz: 0.04 },
  ];
  const breastplateGeom = createLoftedBodyGeometry(breastplateSlices, 28, true, true);
  const cuirass = new THREE.Mesh(breastplateGeom, antiqueSilverMat);
  cuirass.position.set(0, 0.15, 0.04);
  mainBody.add(cuirass);

  // 3. Corrupted Inverted Cross Sigil on Chest
  const sigilVertGeom = new THREE.BoxGeometry(0.08, 0.55, 0.05);
  sigilVertGeom.computeVertexNormals();
  const sigilVert = new THREE.Mesh(sigilVertGeom, blackFlameMat);
  sigilVert.position.set(0, 0.32, 0.42);
  mainBody.add(sigilVert);

  const sigilHorizGeom = new THREE.BoxGeometry(0.34, 0.08, 0.05);
  sigilHorizGeom.computeVertexNormals();
  const sigilHoriz = new THREE.Mesh(sigilHorizGeom, blackFlameMat);
  sigilHoriz.position.set(0, 0.20, 0.42); // Lower bar = inverted cross
  mainBody.add(sigilHoriz);

  // 4. Head: Seraphic Visage with Sculpted Blindfold & Inverted Halo
  head.position.set(0, 1.35, 0.02);
  const headGeom = new THREE.SphereGeometry(0.34, 28, 20);
  headGeom.scale(0.88, 1.15, 0.95);
  headGeom.computeVertexNormals();
  const seraphHead = new THREE.Mesh(headGeom, antiqueSilverMat);
  seraphHead.castShadow = true;
  head.add(seraphHead);

  // Silver Blindfold Mask
  const blindfoldGeom = new THREE.BoxGeometry(0.62, 0.16, 0.22);
  blindfoldGeom.computeVertexNormals();
  const blindfold = new THREE.Mesh(blindfoldGeom, blackFlameMat);
  blindfold.position.set(0, 0.06, 0.28);
  head.add(blindfold);

  // Inverted Iron Thorn Halo (Smooth Ring with Inverted Spikes)
  const invertedHalo = new THREE.Group();
  invertedHalo.position.set(0, 0.62, -0.05);
  const haloRingGeom = new THREE.TorusGeometry(0.48, 0.032, 12, 32);
  haloRingGeom.computeVertexNormals();
  const haloRing = new THREE.Mesh(haloRingGeom, antiqueSilverMat);
  haloRing.rotation.x = Math.PI / 2;
  invertedHalo.add(haloRing);

  for (let s = 0; s < 8; s++) {
    const spikeGeom = new THREE.ConeGeometry(0.045, 0.32, 12);
    spikeGeom.computeVertexNormals();
    const spike = new THREE.Mesh(spikeGeom, blackFlameMat);
    const ang = (s / 8) * Math.PI * 2;
    spike.position.set(Math.cos(ang) * 0.48, -0.16, Math.sin(ang) * 0.48);
    spike.rotation.x = Math.PI; // Inverted pointing downwards
    invertedHalo.add(spike);
  }
  head.add(invertedHalo);

  // 5. Four Layered Spectral Ash Wings (Manifest in Phase 2 & 3)
  const spectralWings = new THREE.Group();
  spectralWings.position.set(0, 0.45, -0.35);
  for (const side of [-1, 1] as const) {
    for (let w = 0; w < 2; w++) {
      const wingGeom = new THREE.PlaneGeometry(1.8, 3.2, 6, 6);
      wingGeom.computeVertexNormals();
      const wing = new THREE.Mesh(wingGeom, blackFlameMat);
      wing.rotation.y = side * (0.4 + w * 0.25);
      wing.rotation.z = side * (0.2 + w * 0.45);
      wing.position.set(side * (0.9 + w * 0.55), 0.7 - w * 0.55, 0);
      spectralWings.add(wing);
    }
  }
  spectralWings.scale.set(0.01, 0.01, 0.01);
  mainBody.add(spectralWings);
  phase2Visuals.push(spectralWings);

  // 6. Arms: Flowing Clerical Sleeves & Sculpted Pauldrons
  leftArm.position.set(0.72, 0.75, 0);
  rightArm.position.set(-0.72, 0.75, 0);
  for (const [arm, isRight] of [[leftArm, false], [rightArm, true]] as const) {
    const sleeve = new THREE.Mesh(createAnatomicalLimb(0.14, 0.165, 0.19, 1.28), ashVestmentMat);
    sleeve.castShadow = true;
    arm.add(sleeve);

    const pauldron = createSculptedGothicPauldron(isRight, antiqueSilverMat, blackFlameMat);
    pauldron.position.set(isRight ? -0.14 : 0.14, 0.16, 0);
    arm.add(pauldron);
  }

  // 7. Weapon: The Inverted Cathedral Staff / Reliquary Scythe
  const weapon = new THREE.Group();
  const staffShaftGeom = new THREE.CylinderGeometry(0.045, 0.052, 3.9, 16);
  staffShaftGeom.computeVertexNormals();
  const staffShaft = new THREE.Mesh(staffShaftGeom, antiqueSilverMat);
  weapon.add(staffShaft);

  // Cathedral Spire Head with Inverted Relic Blades
  const spireHeadGeom = new THREE.BoxGeometry(0.32, 0.75, 0.32);
  spireHeadGeom.computeVertexNormals();
  const spireHead = new THREE.Mesh(spireHeadGeom, antiqueSilverMat);
  spireHead.position.y = 1.65;
  weapon.add(spireHead);

  const crossArmGeom = new THREE.BoxGeometry(0.95, 0.12, 0.12);
  crossArmGeom.computeVertexNormals();
  const crossArm = new THREE.Mesh(crossArmGeom, blackFlameMat);
  crossArm.position.y = 1.38;
  weapon.add(crossArm);

  // Curved Relic Scythe Blade
  const scytheBladeShape = new THREE.Shape();
  scytheBladeShape.moveTo(0, 0);
  scytheBladeShape.quadraticCurveTo(0.65, 0.8, 1.35, 1.1);
  scytheBladeShape.quadraticCurveTo(0.7, 0.4, 0, 0.25);
  scytheBladeShape.closePath();

  const scytheGeom = new THREE.ExtrudeGeometry(scytheBladeShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.02,
    bevelThickness: 0.025,
  });
  scytheGeom.computeVertexNormals();
  const relicBlade = new THREE.Mesh(scytheGeom, blackFlameMat);
  relicBlade.position.set(0.15, 1.25, 0);
  weapon.add(relicBlade);

  weapon.position.set(0, -0.6, 0.42);
  weapon.rotation.x = Math.PI / 2.4;
  rightArm.add(weapon);

  animatedNodes.push({
    node: invertedHalo,
    update: (time, delta, phase) => {
      invertedHalo.rotation.y += delta * (phase >= 2 ? 1.6 : 0.7);
      if (phase >= 2) {
        spectralWings.position.y = 0.45 + Math.sin(time * 3) * 0.08;
      }
    },
  });

  return {
    realmId: 5,
    bossName: 'The Saint of Ash',
    weapon,
    emissiveMaterials: emissiveMats,
    phase2Visuals,
    phase3Visuals,
    animatedNodes,
    onPhaseChange: (p) => {
      if (p === 2) {
        blackFlameMat.emissiveIntensity = 2.0;
        spectralWings.scale.set(1.05, 1.05, 1.05);
        auraLight.intensity = 6.0;
      } else if (p === 3) {
        blackFlameMat.emissiveIntensity = 3.4;
        spectralWings.scale.set(1.35, 1.35, 1.35);
        auraLight.intensity = 9.0;
      }
    },
    update: (time, delta, phase) => {
      animatedNodes.forEach(an => an.update(time, delta, phase));
    },
  };
}

// ============================================================================
// 6. GATE 6 - VIOLENCE: THE BUTCHER OF RUIN (Executioner)
// ============================================================================
function buildViolenceModel(nodes: BossRigNodes): SovereignVisualRig {
  const { mainBody, head, leftArm, rightArm, auraLight } = nodes;
  const emissiveMats: THREE.MeshStandardMaterial[] = [];
  const phase2Visuals: THREE.Object3D[] = [];
  const phase3Visuals: THREE.Object3D[] = [];
  const animatedNodes: SovereignVisualRig['animatedNodes'] = [];

  // High-Quality PBR Materials
  const rustedIronMat = new THREE.MeshStandardMaterial({
    color: 0x4a2a22,
    roughness: 0.82,
    metalness: 0.78,
  });
  const scarredFleshMat = new THREE.MeshStandardMaterial({
    color: 0x2e1919,
    roughness: 0.65,
  });
  const driedBloodMat = new THREE.MeshStandardMaterial({
    color: 0x1f0b0b,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.65,
    roughness: 0.35,
    metalness: 0.45,
  });
  emissiveMats.push(driedBloodMat);

  // 1. Massive Muscular Executioner Frame (32 radial segments)
  mainBody.position.y = 1.95;
  const bodySlices: LoftedSlice[] = [
    { y: 0.95, rx: 0.72, rz: 0.52, bulgeZFront: 0.18 }, // Neck & Trapezius
    { y: 0.35, rx: 0.84, rz: 0.58, bulgeZFront: 0.24, bulgeXSide: 0.10 }, // Hulking chest
    { y: -0.30, rx: 0.76, rz: 0.50, bulgeZFront: 0.14 }, // Abdomen
    { y: -0.90, rx: 0.78, rz: 0.52 }, // Butcher apron waist
    { y: -1.35, rx: 0.70, rz: 0.45 }, // Legs junction
  ];
  const torsoGeom = createLoftedBodyGeometry(bodySlices, 32, true, true);
  const torso = new THREE.Mesh(torsoGeom, scarredFleshMat);
  torso.castShadow = true;
  mainBody.add(torso);

  // 2. Rusted Spiked Iron Cuirass Harness with Rivets
  const cuirassSlices: LoftedSlice[] = [
    { y: 0.80, rx: 0.76, rz: 0.54, cz: 0.02 },
    { y: 0.25, rx: 0.88, rz: 0.60, cz: 0.05, bulgeZFront: 0.18 },
    { y: -0.25, rx: 0.80, rz: 0.52 },
  ];
  const ironPlates = new THREE.Mesh(createLoftedBodyGeometry(cuirassSlices, 28, true, true), rustedIronMat);
  ironPlates.position.set(0, 0.15, 0.02);
  mainBody.add(ironPlates);

  // 3. Barbed Chains wrapped around waist and chest
  const chainBelt = new THREE.Group();
  for (let c = 0; c < 4; c++) {
    const ringGeom = new THREE.TorusGeometry(0.76, 0.052, 10, 28);
    ringGeom.computeVertexNormals();
    const ring = new THREE.Mesh(ringGeom, rustedIronMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.32 - c * 0.18;
    chainBelt.add(ring);
  }
  mainBody.add(chainBelt);

  // 4. Dangling Meat Hooks with Curved Barbs
  for (let h = -2; h <= 2; h++) {
    const hookShape = new THREE.Shape();
    hookShape.moveTo(0, 0);
    hookShape.lineTo(0.04, -0.22);
    hookShape.quadraticCurveTo(0.18, -0.35, 0.12, -0.12);
    hookShape.lineTo(0.08, -0.15);
    hookShape.closePath();

    const hookGeom = new THREE.ExtrudeGeometry(hookShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.01,
      bevelThickness: 0.015,
    });
    hookGeom.computeVertexNormals();
    const hook = new THREE.Mesh(hookGeom, rustedIronMat);
    hook.position.set(h * 0.28, -0.85, 0.62);
    mainBody.add(hook);
  }

  // 5. Head: Iron Executioner Cowl with Riveted Grate Visor
  head.position.set(0, 1.35, 0.1);
  const cowlGeom = new THREE.BoxGeometry(0.68, 0.72, 0.68);
  cowlGeom.computeVertexNormals();
  const cowl = new THREE.Mesh(cowlGeom, rustedIronMat);
  head.add(cowl);

  const grateVisorGeom = new THREE.BoxGeometry(0.48, 0.18, 0.08);
  grateVisorGeom.computeVertexNormals();
  const grateVisor = new THREE.Mesh(grateVisorGeom, driedBloodMat);
  grateVisor.position.set(0, 0.06, 0.36);
  head.add(grateVisor);

  // 6. Massive Hypertrophied Arms with Sculpted Pauldrons
  leftArm.position.set(1.02, 0.80, 0);
  rightArm.position.set(-1.02, 0.80, 0);
  for (const [arm, isRight] of [[leftArm, false], [rightArm, true]] as const) {
    const bicep = new THREE.Mesh(createAnatomicalLimb(0.25, 0.22, 0.18, 1.40, 0.09), scarredFleshMat);
    bicep.castShadow = true;
    arm.add(bicep);

    const pauldron = createSculptedGothicPauldron(isRight, rustedIronMat, driedBloodMat);
    pauldron.position.set(isRight ? -0.18 : 0.18, 0.18, 0);
    pauldron.scale.set(1.25, 1.25, 1.25);
    arm.add(pauldron);

    const bracerGeom = new THREE.CylinderGeometry(0.20, 0.22, 0.60, 16);
    bracerGeom.computeVertexNormals();
    const heavyBracer = new THREE.Mesh(bracerGeom, rustedIronMat);
    heavyBracer.position.y = -0.90;
    arm.add(heavyBracer);
  }

  // 7. Weapon: The Colossal Ruin Cleaver (Extruded Beveled Slab)
  const weapon = new THREE.Group();
  const cleaverHiltGeom = new THREE.CylinderGeometry(0.075, 0.082, 1.5, 16);
  cleaverHiltGeom.computeVertexNormals();
  const cleaverHilt = new THREE.Mesh(cleaverHiltGeom, rustedIronMat);
  weapon.add(cleaverHilt);

  // Beveled rectangular cleaver slab (3.3m long, 0.9m wide)
  const cleaverShape = new THREE.Shape();
  cleaverShape.moveTo(0, 0);
  cleaverShape.lineTo(0.90, 0);
  cleaverShape.lineTo(0.95, 3.3);
  cleaverShape.lineTo(0, 3.3);
  cleaverShape.closePath();

  const cleaverGeom = new THREE.ExtrudeGeometry(cleaverShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.035,
    bevelThickness: 0.04,
  });
  cleaverGeom.computeVertexNormals();
  const cleaverBlade = new THREE.Mesh(cleaverGeom, rustedIronMat);
  cleaverBlade.position.set(-0.25, 0.75, -0.07);
  cleaverBlade.castShadow = true;
  weapon.add(cleaverBlade);

  // Blood-soaked serrated cutting edge
  const edgeGeom = new THREE.BoxGeometry(0.12, 3.3, 0.16);
  edgeGeom.computeVertexNormals();
  const edge = new THREE.Mesh(edgeGeom, driedBloodMat);
  edge.position.set(0.72, 2.4, 0);
  weapon.add(edge);

  weapon.position.set(0, -0.65, 0.48);
  weapon.rotation.x = Math.PI / 2.2;
  rightArm.add(weapon);

  animatedNodes.push({
    node: driedBloodMat,
    update: (time, delta, phase) => {
      const rate = phase === 3 ? 5.8 : 2.6;
      driedBloodMat.emissiveIntensity = (phase === 3 ? 3.0 : 0.7) + Math.sin(time * rate) * 0.35;
    },
  });

  return {
    realmId: 6,
    bossName: 'The Butcher of Ruin',
    weapon,
    emissiveMaterials: emissiveMats,
    phase2Visuals,
    phase3Visuals,
    animatedNodes,
    onPhaseChange: (p) => {
      if (p === 2) {
        driedBloodMat.emissiveIntensity = 2.0;
        auraLight.intensity = 6.0;
      } else if (p === 3) {
        driedBloodMat.emissiveIntensity = 3.5;
        auraLight.intensity = 9.0;
      }
    },
    update: (time, delta, phase) => {
      animatedNodes.forEach(an => an.update(time, delta, phase));
    },
  };
}

// ============================================================================
// 7. GATE 7 - SOVEREIGN: THE SOVEREIGN OF DESIRE (Celestial Monarch)
// ============================================================================
function buildSovereignOfDesireModel(nodes: BossRigNodes): SovereignVisualRig {
  const { mainBody, head, leftArm, rightArm, auraLight } = nodes;
  const emissiveMats: THREE.MeshStandardMaterial[] = [];
  const phase2Visuals: THREE.Object3D[] = [];
  const phase3Visuals: THREE.Object3D[] = [];
  const animatedNodes: SovereignVisualRig['animatedNodes'] = [];

  // High-Quality PBR Materials
  const porcelainMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.10,
    metalness: 0.92,
  });
  const platinumMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.18,
    metalness: 0.96,
  });
  const celestialVoidMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.90,
    roughness: 0.12,
    metalness: 0.80,
  });
  emissiveMats.push(celestialVoidMat);

  // 1. Slender Otherworldly Porcelain Torso (32 radial segments)
  mainBody.position.y = 2.05; // Levitation stance
  const torsoSlices: LoftedSlice[] = [
    { y: 0.95, rx: 0.44, rz: 0.32, cz: 0.01 },
    { y: 0.35, rx: 0.42, rz: 0.30, cz: 0.04, bulgeZFront: 0.08 },
    { y: -0.35, rx: 0.48, rz: 0.34, cz: 0.02 },
    { y: -1.25, rx: 0.40, rz: 0.28 },
    { y: -1.85, rx: 0.34, rz: 0.24 }, // Tapered celestial tail
  ];
  const torsoGeom = createLoftedBodyGeometry(torsoSlices, 32, true, true);
  const torso = new THREE.Mesh(torsoGeom, porcelainMat);
  torso.castShadow = true;
  mainBody.add(torso);

  // 2. Floating Detached Mantle Plates (Hovering Orbitals with Bevels)
  const floatingPlates = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const plateGeom = new THREE.BoxGeometry(0.38, 0.78, 0.08);
    plateGeom.computeVertexNormals();
    const plate = new THREE.Mesh(plateGeom, platinumMat);
    const ang = (i / 6) * Math.PI * 2;
    plate.position.set(Math.cos(ang) * 0.85, 0, Math.sin(ang) * 0.85);
    plate.rotation.y = -ang;
    floatingPlates.add(plate);
  }
  mainBody.add(floatingPlates);

  // 3. Head: Faceless Porcelain Mask & Concentric Gyroscopic Astrolabe Halo
  head.position.set(0, 1.35, 0);
  const maskGeom = new THREE.SphereGeometry(0.35, 28, 24);
  maskGeom.scale(0.88, 1.25, 0.92);
  maskGeom.computeVertexNormals();
  const mask = new THREE.Mesh(maskGeom, porcelainMat);
  head.add(mask);

  // Triple-Ring Concentric Astrolabe Halo
  const astrolabe = new THREE.Group();
  astrolabe.position.set(0, 0.52, -0.05);
  for (let r = 0; r < 3; r++) {
    const ringGeom = new THREE.TorusGeometry(0.50 + r * 0.18, 0.026, 12, 36);
    ringGeom.computeVertexNormals();
    const ring = new THREE.Mesh(ringGeom, platinumMat);
    ring.rotation.x = Math.PI / 2 + r * 0.25;
    ring.rotation.y = r * 0.35;
    astrolabe.add(ring);
  }
  head.add(astrolabe);

  // 4. Arms: Segmented Platinum Limbs & Gauntlets
  leftArm.position.set(0.68, 0.75, 0);
  rightArm.position.set(-0.68, 0.75, 0);
  for (const [arm, isRight] of [[leftArm, false], [rightArm, true]] as const) {
    const limb = new THREE.Mesh(createAnatomicalLimb(0.13, 0.11, 0.09, 1.28), porcelainMat);
    arm.add(limb);

    const pauldron = createSculptedGothicPauldron(isRight, platinumMat, celestialVoidMat);
    pauldron.position.set(isRight ? -0.13 : 0.13, 0.15, 0);
    arm.add(pauldron);
  }

  // 5. Weapon: The Celestial Threshold Needle-Blade (Rapier & Cup Guard)
  const weapon = new THREE.Group();
  const gripGeom = new THREE.CylinderGeometry(0.042, 0.046, 0.85, 16);
  gripGeom.computeVertexNormals();
  const grip = new THREE.Mesh(gripGeom, platinumMat);
  weapon.add(grip);

  const basketGuardGeom = new THREE.SphereGeometry(0.26, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  basketGuardGeom.computeVertexNormals();
  const basketGuard = new THREE.Mesh(basketGuardGeom, platinumMat);
  basketGuard.position.y = 0.42;
  basketGuard.rotation.x = Math.PI;
  weapon.add(basketGuard);

  // Diamond-section needle blade
  const needleGeom = new THREE.CylinderGeometry(0.022, 0.050, 3.4, 8);
  needleGeom.computeVertexNormals();
  const needle = new THREE.Mesh(needleGeom, celestialVoidMat);
  needle.position.y = 2.15;
  needle.castShadow = true;
  weapon.add(needle);

  weapon.position.set(0, -0.55, 0.42);
  weapon.rotation.x = Math.PI / 2.3;
  rightArm.add(weapon);

  animatedNodes.push({
    node: astrolabe,
    update: (time, delta, phase) => {
      astrolabe.rotation.y += delta * (phase >= 2 ? 1.5 : 0.65);
      astrolabe.rotation.z += delta * 0.45;

      floatingPlates.rotation.y += delta * (phase === 3 ? 1.9 : 0.85);
      const bob = Math.sin(time * 2.5) * 0.06;
      floatingPlates.position.y = bob;
    },
  });

  return {
    realmId: 7,
    bossName: 'The Sovereign of Desire',
    weapon,
    emissiveMaterials: emissiveMats,
    phase2Visuals,
    phase3Visuals,
    animatedNodes,
    onPhaseChange: (p) => {
      if (p === 2) {
        celestialVoidMat.emissiveIntensity = 2.0;
        floatingPlates.scale.set(1.2, 1.2, 1.2);
        auraLight.intensity = 6.0;
      } else if (p === 3) {
        celestialVoidMat.emissiveIntensity = 3.6;
        floatingPlates.scale.set(1.4, 1.4, 1.4);
        auraLight.intensity = 9.0;
      }
    },
    update: (time, delta, phase) => {
      animatedNodes.forEach(an => an.update(time, delta, phase));
    },
  };
}

// ============================================================================
// MAIN DISPATCHER
// ============================================================================
export function buildSovereignModel(realmId: number, nodes: BossRigNodes): SovereignVisualRig {
  switch (realmId) {
    case 1: return buildHollowKingModel(nodes);
    case 2: return buildGluttonyModel(nodes);
    case 3: return buildGreedModel(nodes);
    case 4: return buildWrathModel(nodes);
    case 5: return buildHeresyModel(nodes);
    case 6: return buildViolenceModel(nodes);
    case 7: return buildSovereignOfDesireModel(nodes);
    default: return buildHollowKingModel(nodes);
  }
}
