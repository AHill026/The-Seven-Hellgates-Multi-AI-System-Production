/**
 * The Seven Hellgates - Azrael 3D Model & Kinematics
 * Fully modeled to match the dark-fantasy reference:
 * - Blackened Damascus steel gothic armor with fluted ridges
 * - Layered dark cowl/scarf wrapped around neck & shoulders
 * - Criss-crossing leather harness straps with silver buckles
 * - Multi-tiered spiked gothic pauldrons on both shoulders
 * - Crimson tattered sash/tabard hanging between leg faulds
 * - Multi-segment shredded battle cape with back silver filigree spine clasp
 * - Shaggy dark hair with pale-blue supernatural glowing eyes
 * - Executioner greatsword with cyan glowing occult runes down central fuller
 */

import * as THREE from 'three';
import { CombatStance, WeaponClass, WeaponId } from '../types';
import { materialFactory } from '../vfx/MaterialFactory';
import {
  createAthleticHumanoidTorso,
  createFittedCuirass,
  createSculptedHead,
  createHairLockGeometry,
  createAnatomicalLimb,
  createArticulatedHand,
  createGothicSabatonFoot,
  createTieredGothicPauldron,
  createShoulderSocketBridge,
  createCuirassRuinicOverlay,
  createBackSpinePlating,
  createRerebraceGuard,
  createGothicCouterAndVambrace,
  createWaistTassetAssembly,
  createThighCuisseOverlay,
  createShinPoleynAndGreaveOverlay,
} from './CharacterGeometry';
import { glbLoaderService } from '../loaders/GLBModelLoader';
import { buildSevenfoldWeapon } from '../arsenal/SevenfoldWeaponFactory';
import { WEAPON_BY_ID } from '../arsenal/WeaponRegistry';

export class AzraelModel {
  public group: THREE.Group;

  // Articulated joints
  private rootJoint: THREE.Group;
  private pelvis: THREE.Group;
  private spine: THREE.Group;
  private chest: THREE.Group;
  private neck: THREE.Group;
  private head: THREE.Group;
  
  private leftShoulder: THREE.Group;
  private leftArm: THREE.Group;
  private leftForearm: THREE.Group;
  private leftHand: THREE.Group;

  private rightShoulder: THREE.Group;
  private rightArm: THREE.Group;
  private rightForearm: THREE.Group;
  private rightHand: THREE.Group;

  private leftThigh: THREE.Group;
  private leftShin: THREE.Group;
  private leftFoot: THREE.Group;

  private rightThigh: THREE.Group;
  private rightShin: THREE.Group;
  private rightFoot: THREE.Group;

  private capeGroup: THREE.Group;
  private capeSegments: THREE.Mesh[] = [];
  private frontSash: THREE.Mesh;
  private hairFlowGroup!: THREE.Group;
  private hairSwishLocks: { mesh: THREE.Mesh; baseRotX: number; baseRotZ: number; phase: number }[] = [];

  // Weapons & FX
  private greatsword: THREE.Group;
  private offhandWeapon: THREE.Group | null = null;
  private swordRuneLight: THREE.PointLight | null;
  private eyeGlowLight: THREE.PointLight;
  private wrathAuraGroup: THREE.Group;
  private chestRuneMat: THREE.MeshStandardMaterial;
  private chestRuneGroup: THREE.Group;
  private chestRuneLight: THREE.PointLight;
  private chestRuneFlashTimer: number = 0;
  private resonanceLevel: number = 0.65;

  // Equipped weapon state
  public equippedWeaponId: WeaponId = 'kings_remnant';
  public equippedWeaponClass: WeaponClass = 'greatsword';
  private attackSpeedMultiplier: number = 1.0;

  // State
  public currentAnim: string = 'idle';
  private animTime: number = 0;
  private attackPhase: number = 0;
  public isAttacking: boolean = false;
  public isDodging: boolean = false;
  public dodgeProgress: number = 0;
  public isDead: boolean = false;
  public deathProgress: number = 0;
  public currentStance: CombatStance = 'reaper';
  public onFootstep?: (isSprinting: boolean) => void;
  private lastStepSide: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // Procedural PBR materials from MaterialFactory
    const damascusSteel = materialFactory.createDamascusSteel();
    const limbPlate = materialFactory.createGothicLimbPlate();
    const gothicSilver = materialFactory.createGothicSilver();
    const pauldronBlackenedSteel = materialFactory.createPauldronBlackenedSteel();
    const pauldronWornTrim = materialFactory.createPauldronWornTrim();
    const armorBlueAccent = materialFactory.createArmorBlueEnergyAccent();
    const weatheredLeather = materialFactory.createWeatheredLeather();
    const crimsonSashMat = materialFactory.createCrimsonSash();
    const tatteredCloth = materialFactory.createTatteredCloth();
    const swordBladeMat = materialFactory.createSwordBladeSteel();
    const runeGlowMat = materialFactory.createRunicGlowMaterial();
    const eyeMat = materialFactory.createGlowingEyes();
    const eyelidMat = materialFactory.createEyelidRim();
    const skinMat = materialFactory.createAzraelSkin();
    const scarMat = materialFactory.createBattleScar();
    const hairMat = materialFactory.createDarkHair();

    // --- SKELETAL RIG HIERARCHY ---
    this.rootJoint = new THREE.Group();
    this.group.add(this.rootJoint);

    // 1. Pelvis & Articulated Faulds
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.05;
    this.rootJoint.add(this.pelvis);

    // Anatomical pelvic girdle & glutes base
    const pelvisGeom = createAnatomicalLimb(0.20, 0.22, 0.19, 0.24, 0.03, 0.02);
    const pelvisMesh = new THREE.Mesh(pelvisGeom, damascusSteel);
    pelvisMesh.position.y = 0.12;
    pelvisMesh.castShadow = true;
    this.pelvis.add(pelvisMesh);

    // Leather belt with sculpted gothic silver buckle
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.22, 0.07, 16), weatheredLeather);
    belt.position.y = 0.1;
    this.pelvis.add(belt);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.10, 0.25), gothicSilver);
    buckle.position.set(0, 0.1, 0.12);
    this.pelvis.add(buckle);

    // Crimson Tattered Front Sash (hanging between thighs as in reference image)
    const sashGeom = new THREE.PlaneGeometry(0.22, 0.48, 3, 5);
    this.frontSash = new THREE.Mesh(sashGeom, crimsonSashMat);
    this.frontSash.position.set(0, -0.22, 0.16);
    this.frontSash.castShadow = true;
    this.pelvis.add(this.frontSash);

    // Anatomical Side Hip Tassets conforming to thighs
    for (let s = -1; s <= 1; s += 2) {
      const tasset = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.15, 0.32, 8, 1, true, 0, Math.PI),
        limbPlate
      );
      tasset.position.set(s * 0.24, -0.08, 0);
      tasset.rotation.z = -s * 0.18;
      tasset.rotation.y = s * 0.4;
      tasset.castShadow = true;
      this.pelvis.add(tasset);
    }

    // Additive Sovereign Ruinic Waist Guard & Multi-Tier Hip Tasset Shields
    this.pelvis.add(createWaistTassetAssembly(damascusSteel, pauldronWornTrim));

    // 2. Spine & Chest (Muscular Humanoid Torso + Fitted Gothic Cuirass)
    this.spine = new THREE.Group();
    this.spine.position.y = 0.18;
    this.pelvis.add(this.spine);

    this.chest = new THREE.Group();
    this.chest.position.y = 0.26;
    this.spine.add(this.chest);

    // Muscular athletic humanoid torso base
    const torsoMesh = new THREE.Mesh(createAthleticHumanoidTorso(), skinMat);
    torsoMesh.position.y = 0.08;
    torsoMesh.castShadow = true;
    this.chest.add(torsoMesh);

    // Fitted gothic Damascus steel cuirass with central tapul ridge and fauld lames
    const cuirass = new THREE.Mesh(createFittedCuirass(), damascusSteel);
    cuirass.position.y = 0.08;
    cuirass.castShadow = true;
    this.chest.add(cuirass);

    // Fluted gothic center ridge (tapul) & layered pectoral armor plates
    const tapulRidge = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.38, 4), gothicSilver);
    tapulRidge.rotation.x = -0.15;
    tapulRidge.position.set(0, 0.12, 0.22);
    this.chest.add(tapulRidge);

    for (const side of [-1, 1] as const) {
      const pecPlate = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.04), limbPlate);
      pecPlate.position.set(side * 0.11, 0.20, 0.18);
      pecPlate.rotation.set(-0.14, side * 0.28, side * 0.12);
      pecPlate.castShadow = true;
      this.chest.add(pecPlate);
    }

    // Additive Sovereign Ruinic Cuirass Layering (V-Plackart, Gorget Wings & Rib Guards — frames blue chest rune)
    this.chest.add(createCuirassRuinicOverlay(damascusSteel, pauldronWornTrim));

    // Supernatural Chest Seal Rune Core (Sovereign Wrath & Seal Resonance)
    this.chestRuneGroup = new THREE.Group();
    this.chestRuneGroup.position.set(0, 0.16, 0.235);
    this.chestRuneMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x60a5fa,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.4,
    });
    const runeOuter = new THREE.Mesh(new THREE.RingGeometry(0.055, 0.072, 6), this.chestRuneMat);
    this.chestRuneGroup.add(runeOuter);
    const runeCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.036, 0), this.chestRuneMat);
    runeCore.scale.set(1, 1.35, 0.5);
    this.chestRuneGroup.add(runeCore);
    this.chestRuneLight = new THREE.PointLight(0x60a5fa, 0.55, 2.4);
    this.chestRuneLight.position.set(0, 0, 0.08);
    this.chestRuneGroup.add(this.chestRuneLight);
    this.chest.add(this.chestRuneGroup);

    // Criss-crossing Leather Harness Straps over chest
    const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.38), weatheredLeather);
    strap1.rotation.z = 0.52;
    strap1.position.y = 0.08;
    this.chest.add(strap1);

    const strap2 = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.38), weatheredLeather);
    strap2.rotation.z = -0.52;
    strap2.position.y = 0.08;
    this.chest.add(strap2);

    // 3. Layered Dark Cowl / Hood Draped Around Neck & Shoulders (Exact reference match)
    const cowlRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.10, 10, 20), tatteredCloth);
    cowlRing1.rotation.x = Math.PI / 2 + 0.15;
    cowlRing1.position.set(0, 0.32, 0.04);
    cowlRing1.castShadow = true;
    this.chest.add(cowlRing1);

    const cowlRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.09, 10, 20), tatteredCloth);
    cowlRing2.rotation.x = Math.PI / 2 + 0.28;
    cowlRing2.position.set(0, 0.24, 0.06);
    cowlRing2.castShadow = true;
    this.chest.add(cowlRing2);

    // 4. Head, Face, Battle Scars & Glowing Pale-Blue Eyes
    this.neck = new THREE.Group();
    this.neck.position.y = 0.34;
    this.chest.add(this.neck);

    const neckGeom = new THREE.CylinderGeometry(0.09, 0.11, 0.16, 12);
    const neckMesh = new THREE.Mesh(neckGeom, skinMat);
    neckMesh.position.y = 0.06;
    this.neck.add(neckMesh);

    this.head = new THREE.Group();
    this.head.position.y = 0.15;
    this.neck.add(this.head);

    // Sculpted anatomical head with defined jawline, chin, brow overhang, and orbital eye recesses
    const face = new THREE.Mesh(createSculptedHead(), skinMat);
    face.position.y = 0.02;
    face.castShadow = true;
    this.head.add(face);

    // Visible Battle Scar across right eye and cheekbone (positioned on true facial surface)
    const scarCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.044, 0.112, 0.156),
      new THREE.Vector3(0.056, 0.068, 0.162),
      new THREE.Vector3(0.068, 0.005, 0.156),
    ]);
    const scarGeom = new THREE.TubeGeometry(scarCurve, 10, 0.005, 5, false);
    const scarMesh = new THREE.Mesh(scarGeom, scarMat);
    this.head.add(scarMesh);

    // Defined 3D Nose Bridge aligned with cheekbones & brow
    const noseGeom = new THREE.ConeGeometry(0.022, 0.088, 4);
    const noseMesh = new THREE.Mesh(noseGeom, skinMat);
    noseMesh.rotation.set(0.28, Math.PI / 4, 0);
    noseMesh.position.set(0, 0.052, 0.172);
    this.head.add(noseMesh);

    // Sculpted Dark Eyebrows framing the overhanging brow ridge
    const browGeomL = new THREE.BoxGeometry(0.048, 0.012, 0.024);
    const browL = new THREE.Mesh(browGeomL, hairMat);
    browL.rotation.set(0.12, -0.18, -0.14);
    browL.position.set(0.049, 0.098, 0.160);
    this.head.add(browL);

    const browGeomR = new THREE.BoxGeometry(0.048, 0.012, 0.024);
    const browR = new THREE.Mesh(browGeomR, hairMat);
    browR.rotation.set(0.12, 0.18, 0.14);
    browR.position.set(-0.049, 0.098, 0.160);
    this.head.add(browR);

    // Two Distinct Glowing Blue Eyes (Dark eyelid frame + textured cobalt-cyan iris cap)
    const eyePatchGeom = new THREE.SphereGeometry(
      0.022,
      18,
      14,
      Math.PI * 0.5 - 0.72,
      1.44,
      Math.PI * 0.5 - 0.62,
      1.24
    );
    const eyelidUpperGeom = new THREE.TorusGeometry(0.022, 0.0045, 6, 14, Math.PI);

    for (const side of [-1, 1] as const) {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(side * 0.048, 0.072, 0.140);
      eyeGroup.rotation.y = side * 0.16;

      // Dark sclera backing sphere
      const backing = new THREE.Mesh(new THREE.SphereGeometry(0.0205, 12, 10), eyelidMat);
      eyeGroup.add(backing);

      // Forward-facing textured blue iris & pupil patch
      const irisMesh = new THREE.Mesh(eyePatchGeom, eyeMat);
      eyeGroup.add(irisMesh);

      // Sculpted upper & lower eyelid rims framing the eye almond shape
      const upperLid = new THREE.Mesh(eyelidUpperGeom, eyelidMat);
      upperLid.position.set(0, 0.003, 0.006);
      upperLid.rotation.set(0.35, 0, side * 0.08);
      eyeGroup.add(upperLid);

      const lowerLid = new THREE.Mesh(eyelidUpperGeom, eyelidMat);
      lowerLid.position.set(0, -0.004, 0.005);
      lowerLid.rotation.set(-0.35, 0, Math.PI + side * 0.08);
      eyeGroup.add(lowerLid);

      this.head.add(eyeGroup);
    }

    // Restrained blue eye luminescence illuminating upper cheeks & nose bridge
    this.eyeGlowLight = new THREE.PointLight(0x38bdf8, 0.52, 1.8);
    this.eyeGlowLight.position.set(0, 0.072, 0.22);
    this.head.add(this.eyeGlowLight);

    // --- ELDEN RING STYLE SHOULDER-LENGTH LAYERED HAIR ---
    // 1. Fitted Cranial Hair Cap
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.132, 16, 14), hairMat);
    hairCap.position.set(0, 0.125, -0.018);
    hairCap.scale.set(1.04, 0.96, 1.15);
    hairCap.castShadow = true;
    this.head.add(hairCap);

    this.hairFlowGroup = new THREE.Group();
    this.head.add(this.hairFlowGroup);

    const addHairLock = (
      points: [number, number, number][],
      rootW: number,
      tipW: number,
      thick: number,
      dynamicSway: boolean,
      phase: number
    ) => {
      const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
      const geom = createHairLockGeometry(curve, rootW, tipW, thick, 14);
      const mesh = new THREE.Mesh(geom, hairMat);
      mesh.castShadow = true;
      this.hairFlowGroup.add(mesh);
      if (dynamicSway) {
        this.hairSwishLocks.push({
          mesh,
          baseRotX: mesh.rotation.x,
          baseRotZ: mesh.rotation.z,
          phase,
        });
      }
    };

    // 2. Asymmetrical Parted Curtain Bangs & Cheekbone Framing Strands (leaves both blue eyes & scar clearly visible)
    addHairLock(
      [[-0.025, 0.215, 0.055], [-0.075, 0.165, 0.118], [-0.118, 0.075, 0.125], [-0.128, -0.055, 0.095], [-0.115, -0.185, 0.068]],
      0.068, 0.010, 0.018, false, 0.2
    );
    addHairLock(
      [[-0.020, 0.218, 0.062], [0.055, 0.172, 0.122], [0.112, 0.088, 0.126], [0.126, -0.045, 0.098], [0.115, -0.175, 0.072]],
      0.072, 0.010, 0.018, false, 0.6
    );
    // Thin windswept center-left wisp across temple
    addHairLock(
      [[-0.015, 0.210, 0.075], [0.008, 0.148, 0.132], [-0.004, 0.095, 0.148], [-0.018, 0.062, 0.150]],
      0.032, 0.006, 0.010, false, 1.0
    );

    // 3. Layered Side-Temple to Shoulder/Collarbone Locks (Right & Left)
    for (const side of [-1, 1] as const) {
      addHairLock(
        [
          [side * 0.078, 0.188, 0.025],
          [side * 0.132, 0.105, 0.042],
          [side * 0.148, -0.035, 0.048],
          [side * 0.165, -0.175, 0.055],
          [side * 0.185, -0.310, 0.045],
        ],
        0.082, 0.014, 0.022, true, side * 0.9
      );
      addHairLock(
        [
          [side * 0.095, 0.165, -0.035],
          [side * 0.142, 0.065, -0.040],
          [side * 0.158, -0.085, -0.045],
          [side * 0.175, -0.225, -0.050],
          [side * 0.195, -0.340, -0.042],
        ],
        0.088, 0.015, 0.024, true, side * 1.4
      );
      addHairLock(
        [
          [side * 0.065, 0.198, -0.065],
          [side * 0.118, 0.095, -0.105],
          [side * 0.138, -0.065, -0.125],
          [side * 0.158, -0.215, -0.135],
          [side * 0.168, -0.355, -0.128],
        ],
        0.092, 0.016, 0.024, true, side * 2.1
      );
    }

    // 4. Full Back Cascading Shoulder-Length Elden Ring Mane (7 layered overlapping locks)
    const backAngles = [-0.85, -0.56, -0.28, 0, 0.28, 0.56, 0.85];
    backAngles.forEach((ang, idx) => {
      const sinA = Math.sin(ang);
      const cosA = Math.cos(ang);
      const lengthDrop = -0.33 - (idx % 2 === 0 ? 0.05 : 0.01);
      addHairLock(
        [
          [sinA * 0.06, 0.195, -0.075 - cosA * 0.04],
          [sinA * 0.115, 0.095, -0.115 - cosA * 0.045],
          [sinA * 0.138, -0.045, -0.125 - cosA * 0.055],
          [sinA * 0.155, -0.195, -0.145 - cosA * 0.058],
          [sinA * 0.172, lengthDrop, -0.152 - cosA * 0.048],
        ],
        0.098, 0.018, 0.026, true, idx * 0.75
      );
    });

    // 5. Multi-Tier Spiked Gothic Pauldrons on Shoulders
    // Left Shoulder & Articulated Arm
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(0.34, 0.26, 0);
    this.chest.add(this.leftShoulder);

    // Anatomical deltoid muscle cap beneath pauldron bridging chest to bicep
    const deltoidL = new THREE.Mesh(createAnatomicalLimb(0.105, 0.098, 0.09, 0.18, 0.02, 0.02), weatheredLeather);
    deltoidL.position.set(0, -0.04, 0);
    deltoidL.castShadow = true;
    this.leftShoulder.add(deltoidL);

    const pauldronL = createTieredGothicPauldron(false, pauldronBlackenedSteel, pauldronWornTrim, gothicSilver);
    this.leftShoulder.add(pauldronL);
    this.leftShoulder.add(createShoulderSocketBridge(false, pauldronBlackenedSteel, pauldronWornTrim));

    this.leftArm = new THREE.Group();
    this.leftShoulder.add(this.leftArm);

    // Muscular bicep & tricep + continuous 360-degree Sovereign Rerebrace & elbow hinge bridge
    const bicepGeomL = createAnatomicalLimb(0.09, 0.085, 0.075, 0.28, 0.02, 0.015);
    const bicepL = new THREE.Mesh(bicepGeomL, weatheredLeather);
    bicepL.position.y = 0;
    bicepL.castShadow = true;
    this.leftArm.add(bicepL);
    this.leftArm.add(createRerebraceGuard(false, limbPlate, pauldronWornTrim, armorBlueAccent));

    this.leftForearm = new THREE.Group();
    this.leftForearm.position.y = -0.28;
    this.leftArm.add(this.leftForearm);

    // Fluted Damascus Vambrace with couter elbow spike + continuous couter, vambrace & gauntlet bell cuff
    const vambraceGeomL = createAnatomicalLimb(0.095, 0.085, 0.07, 0.28, 0.02);
    const vambraceL = new THREE.Mesh(vambraceGeomL, limbPlate);
    vambraceL.castShadow = true;
    this.leftForearm.add(vambraceL);
    this.leftForearm.add(createGothicCouterAndVambrace(false, limbPlate, pauldronWornTrim, armorBlueAccent));

    const elbowSpikeL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 4), gothicSilver);
    elbowSpikeL.rotation.x = Math.PI / 2;
    elbowSpikeL.position.set(0, -0.05, -0.1);
    this.leftForearm.add(elbowSpikeL);

    this.leftHand = new THREE.Group();
    this.leftHand.position.y = -0.28;
    this.leftForearm.add(this.leftHand);

    // Complete Gothic armored gauntlet with wrist collar, knuckle guard & individual armored fingers
    const handL = createArticulatedHand(false, limbPlate, pauldronWornTrim, armorBlueAccent);
    this.leftHand.add(handL);

    // Right Shoulder & Articulated Arm
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(-0.34, 0.26, 0);
    this.chest.add(this.rightShoulder);

    // Anatomical deltoid muscle cap beneath pauldron bridging chest to bicep
    const deltoidR = new THREE.Mesh(createAnatomicalLimb(0.105, 0.098, 0.09, 0.18, 0.02, 0.02), weatheredLeather);
    deltoidR.position.set(0, -0.04, 0);
    deltoidR.castShadow = true;
    this.rightShoulder.add(deltoidR);

    const pauldronR = createTieredGothicPauldron(true, pauldronBlackenedSteel, pauldronWornTrim, gothicSilver);
    this.rightShoulder.add(pauldronR);
    this.rightShoulder.add(createShoulderSocketBridge(true, pauldronBlackenedSteel, pauldronWornTrim));

    this.rightArm = new THREE.Group();
    this.rightShoulder.add(this.rightArm);

    const bicepGeomR = createAnatomicalLimb(0.09, 0.085, 0.075, 0.28, 0.02, 0.015);
    const bicepR = new THREE.Mesh(bicepGeomR, weatheredLeather);
    bicepR.position.y = 0;
    bicepR.castShadow = true;
    this.rightArm.add(bicepR);
    this.rightArm.add(createRerebraceGuard(true, limbPlate, pauldronWornTrim, armorBlueAccent));

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.y = -0.28;
    this.rightArm.add(this.rightForearm);

    const vambraceGeomR = createAnatomicalLimb(0.095, 0.085, 0.07, 0.28, 0.02);
    const vambraceR = new THREE.Mesh(vambraceGeomR, limbPlate);
    vambraceR.castShadow = true;
    this.rightForearm.add(vambraceR);
    this.rightForearm.add(createGothicCouterAndVambrace(true, limbPlate, pauldronWornTrim, armorBlueAccent));

    const elbowSpikeR = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 4), gothicSilver);
    elbowSpikeR.rotation.x = Math.PI / 2;
    elbowSpikeR.position.set(0, -0.05, -0.1);
    this.rightForearm.add(elbowSpikeR);

    this.rightHand = new THREE.Group();
    this.rightHand.position.y = -0.28;
    this.rightForearm.add(this.rightHand);

    const handR = createArticulatedHand(true, limbPlate, pauldronWornTrim, armorBlueAccent);
    this.rightHand.add(handR);

    // 6. Muscular Anatomical Legs, Greaves & Gothic Sabatons
    // Left Leg
    this.leftThigh = new THREE.Group();
    this.leftThigh.position.set(0.18, -0.08, 0);
    this.pelvis.add(this.leftThigh);

    const thighGeomL = createAnatomicalLimb(0.13, 0.115, 0.095, 0.44, 0.035, 0.02);
    const cuisseL = new THREE.Mesh(thighGeomL, limbPlate);
    cuisseL.castShadow = true;
    this.leftThigh.add(cuisseL);
    this.leftThigh.add(createThighCuisseOverlay(false, limbPlate, pauldronWornTrim));

    this.leftShin = new THREE.Group();
    this.leftShin.position.y = -0.44;
    this.leftThigh.add(this.leftShin);

    // Articulated Gothic Knee Cop (Poleyn) with point + additive winged poleyn & fluted shin greave
    const kneeL = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.15, 4), gothicSilver);
    kneeL.rotation.x = -Math.PI / 2;
    kneeL.position.set(0, 0, 0.12);
    this.leftShin.add(kneeL);

    const calfGeomL = createAnatomicalLimb(0.115, 0.10, 0.08, 0.44, 0.03, 0.015);
    const greaveL = new THREE.Mesh(calfGeomL, limbPlate);
    greaveL.castShadow = true;
    this.leftShin.add(greaveL);
    this.leftShin.add(createShinPoleynAndGreaveOverlay(false, limbPlate, pauldronWornTrim));

    this.leftFoot = new THREE.Group();
    this.leftFoot.position.y = -0.44;
    this.leftShin.add(this.leftFoot);

    // Sculpted pointed gothic sabaton with articulated lames & spur
    const sabatonL = createGothicSabatonFoot(limbPlate, gothicSilver);
    this.leftFoot.add(sabatonL);

    // Right Leg
    this.rightThigh = new THREE.Group();
    this.rightThigh.position.set(-0.18, -0.08, 0);
    this.pelvis.add(this.rightThigh);

    const thighGeomR = createAnatomicalLimb(0.13, 0.115, 0.095, 0.44, 0.035, 0.02);
    const cuisseR = new THREE.Mesh(thighGeomR, limbPlate);
    cuisseR.castShadow = true;
    this.rightThigh.add(cuisseR);
    this.rightThigh.add(createThighCuisseOverlay(true, limbPlate, pauldronWornTrim));

    this.rightShin = new THREE.Group();
    this.rightShin.position.y = -0.44;
    this.rightThigh.add(this.rightShin);

    const kneeR = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.15, 4), gothicSilver);
    kneeR.rotation.x = -Math.PI / 2;
    kneeR.position.set(0, 0, 0.12);
    this.rightShin.add(kneeR);

    const calfGeomR = createAnatomicalLimb(0.115, 0.10, 0.08, 0.44, 0.03, 0.015);
    const greaveR = new THREE.Mesh(calfGeomR, limbPlate);
    greaveR.castShadow = true;
    this.rightShin.add(greaveR);
    this.rightShin.add(createShinPoleynAndGreaveOverlay(true, limbPlate, pauldronWornTrim));

    this.rightFoot = new THREE.Group();
    this.rightFoot.position.y = -0.44;
    this.rightShin.add(this.rightFoot);

    const sabatonR = createGothicSabatonFoot(limbPlate, gothicSilver);
    this.rightFoot.add(sabatonR);

    // 7. Back: Ornate Silver Spine Clasp, Vertebral Spine Lames & Shredded Cape
    this.chest.add(createBackSpinePlating(damascusSteel, pauldronWornTrim));
    const spineClasp = new THREE.Group();
    spineClasp.position.set(0, 0.15, -0.18);
    const vertBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.04), gothicSilver);
    const horizBar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.04), gothicSilver);
    horizBar.position.y = 0.08;
    spineClasp.add(vertBar);
    spineClasp.add(horizBar);
    this.chest.add(spineClasp);

    // Articulated Shredded Cape Segments
    this.capeGroup = new THREE.Group();
    this.capeGroup.position.set(0, 0.18, -0.19);
    this.chest.add(this.capeGroup);

    let parentCapeNode: THREE.Group = this.capeGroup;
    for (let i = 0; i < 4; i++) {
      const nextCapeNode = new THREE.Group();
      nextCapeNode.position.y = -0.28;
      parentCapeNode.add(nextCapeNode);

      const segment = new THREE.Mesh(
        new THREE.PlaneGeometry(0.52 - i * 0.05, 0.3, 4, 1),
        tatteredCloth
      );
      segment.position.y = -0.15;
      segment.castShadow = true;
      nextCapeNode.add(segment);
      this.capeSegments.push(segment);

      parentCapeNode = nextCapeNode;
    }

    // 8. Initial Sevenfold Seal Weapon (The King's Remnant)
    const initialWeapon = buildSevenfoldWeapon('kings_remnant', false);
    this.greatsword = initialWeapon.mainGroup;
    this.swordRuneLight = initialWeapon.runeLight;
    this.offhandWeapon = initialWeapon.offhandGroup;

    // Attach primary weapon to right hand
    this.rightHand.add(this.greatsword);
    this.greatsword.position.set(0, -0.05, 0.06);
    this.greatsword.rotation.set(Math.PI / 2, 0, 0);

    // 9. Wrath Unbound Supernatural Awakening Rings
    this.wrathAuraGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.4 + i * 0.14, 0.52 + i * 0.14, 20),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.2 + i * 0.24;
      this.wrathAuraGroup.add(ring);
    }
    this.wrathAuraGroup.visible = false;
    this.group.add(this.wrathAuraGroup);
  }

  /**
   * Cleanly equips any of Azrael's 7 Seal Weapons with zero duplicate meshes.
   */
  public equipWeapon(weaponId: WeaponId) {
    if (this.equippedWeaponId === weaponId && this.greatsword) {
      return;
    }

    // 1. Detach & dispose current weapon meshes cleanly
    if (this.greatsword) {
      this.greatsword.parent?.remove(this.greatsword);
    }
    if (this.offhandWeapon) {
      this.offhandWeapon.parent?.remove(this.offhandWeapon);
      this.offhandWeapon = null;
    }

    // 2. Build newly selected weapon rig
    const def = WEAPON_BY_ID[weaponId] || WEAPON_BY_ID.kings_remnant;
    this.equippedWeaponId = def.id;
    this.equippedWeaponClass = def.weaponClass;

    const built = buildSevenfoldWeapon(def.id, false);
    this.greatsword = built.mainGroup;
    this.swordRuneLight = built.runeLight;
    this.offhandWeapon = built.offhandGroup;

    // 3. Re-apply stance mounting
    this.setStance(this.currentStance);
  }

  public setResonanceIntensity(intensity: number) {
    this.resonanceLevel = intensity;
  }

  public triggerChestRuneBurst(duration: number = 1.1) {
    this.chestRuneFlashTimer = duration;
  }

  public triggerSovereignWrathStrike() {
    this.isAttacking = true;
    this.attackPhase = 0;
    this.currentAnim = 'sovereign_wrath';
    this.attackSpeedMultiplier = 1.05;
    this.triggerChestRuneBurst(2.2);
  }

  public setStance(stance: CombatStance) {
    this.currentStance = stance;
    if (stance === 'executioner') {
      // Weapon sheathed on back, fists forward
      this.chest.add(this.greatsword);
      this.greatsword.position.set(0.12, 0.1, -0.24);
      this.greatsword.rotation.set(-0.35, 0.2, -2.4);
      if (this.offhandWeapon) {
        this.chest.add(this.offhandWeapon);
        this.offhandWeapon.position.set(-0.12, 0.1, -0.24);
        this.offhandWeapon.rotation.set(-0.35, -0.2, 2.4);
      }
      this.wrathAuraGroup.visible = false;
    } else if (stance === 'wrath_unbound') {
      this.rightHand.add(this.greatsword);
      this.greatsword.position.set(0, -0.05, 0.06);
      this.greatsword.rotation.set(Math.PI / 2, 0, 0);
      if (this.offhandWeapon) {
        this.leftHand.add(this.offhandWeapon);
        this.offhandWeapon.position.set(0, -0.05, 0.06);
        this.offhandWeapon.rotation.set(Math.PI / 2, 0, 0);
      }
      this.wrathAuraGroup.visible = true;
      if (this.swordRuneLight) this.swordRuneLight.intensity = 1.4;
    } else {
      // Reaper stance (Primary weapon held in hand)
      this.rightHand.add(this.greatsword);
      this.greatsword.position.set(0, -0.05, 0.06);
      this.greatsword.rotation.set(Math.PI / 2, 0, 0);
      if (this.offhandWeapon) {
        this.leftHand.add(this.offhandWeapon);
        this.offhandWeapon.position.set(0, -0.05, 0.06);
        this.offhandWeapon.rotation.set(Math.PI / 2, 0, 0);
      }
      this.wrathAuraGroup.visible = false;
      if (this.swordRuneLight) this.swordRuneLight.intensity = 0.75;
    }
  }

  public update(delta: number, isMoving: boolean, isSprinting: boolean) {
    this.animTime += delta;

    // Restrained, atmospheric glowing supernatural eyes, sword runes & Chest Seal Rune Core
    const eyePulse = 0.38 + Math.sin(this.animTime * 3.8) * 0.07;
    const isWrath = this.currentStance === 'wrath_unbound';
    this.eyeGlowLight.intensity = eyePulse * (isWrath ? 1.85 : 1.0);
    if (this.swordRuneLight) {
      this.swordRuneLight.intensity = (0.65 + Math.sin(this.animTime * 4.5) * 0.12) * (isWrath ? 1.6 : 1.0);
    }

    if (this.chestRuneFlashTimer > 0) {
      this.chestRuneFlashTimer = Math.max(0, this.chestRuneFlashTimer - delta);
    }
    const burstFactor = this.chestRuneFlashTimer > 0 ? 2.6 : (isWrath ? 1.85 : 1.0);
    const chestPulse = this.resonanceLevel + Math.sin(this.animTime * 4.2) * 0.18;
    this.chestRuneMat.emissive.setHex(isWrath || this.chestRuneFlashTimer > 0 ? 0xbae6fd : 0x60a5fa);
    this.chestRuneMat.emissiveIntensity = chestPulse * burstFactor;
    this.chestRuneLight.intensity = (0.55 + this.resonanceLevel * 0.4) * burstFactor;
    this.chestRuneGroup.rotation.z += delta * (isWrath ? 2.2 : 0.45);

    // Front crimson sash & shoulder-length hair secondary wind/stride flow
    this.frontSash.rotation.x = Math.sin(this.animTime * 5) * 0.12 + (isMoving ? 0.3 : 0.05);
    const swayAmp = isSprinting ? 0.07 : isMoving ? 0.04 : 0.018;
    const swayFreq = isSprinting ? 6.5 : isMoving ? 4.2 : 2.1;
    this.hairSwishLocks.forEach((lock) => {
      lock.mesh.rotation.x = lock.baseRotX + Math.sin(this.animTime * swayFreq + lock.phase) * swayAmp + (isMoving ? 0.045 : 0);
      lock.mesh.rotation.z = lock.baseRotZ + Math.cos(this.animTime * (swayFreq * 0.75) + lock.phase) * (swayAmp * 0.65);
    });

    if (this.currentStance === 'wrath_unbound') {
      this.wrathAuraGroup.rotation.y += delta * 3.0;
      this.wrathAuraGroup.children.forEach((c, i) => {
        c.scale.setScalar(1 + Math.sin(this.animTime * 5 + i) * 0.18);
      });
    }

    // 1. Death Animation
    if (this.isDead) {
      this.deathProgress = Math.min(1, this.deathProgress + delta * 1.5);
      this.rootJoint.position.y = THREE.MathUtils.lerp(0, -0.85, this.deathProgress);
      this.rootJoint.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2.2, this.deathProgress);
      return;
    }

    // 2. Dodge Roll (Keeps player grounded above floor without sinking)
    if (this.isDodging) {
      this.dodgeProgress += delta * 2.8;
      const p = Math.min(1, this.dodgeProgress);
      this.rootJoint.position.y = Math.sin(p * Math.PI) * 0.12; // slight athletic tuck, never sink into floor!
      this.rootJoint.rotation.x = p * Math.PI * 2;
      this.spine.rotation.x = 0.8;
      this.leftThigh.rotation.x = -1.2;
      this.rightThigh.rotation.x = -1.2;
      this.leftShin.rotation.x = 1.5;
      this.rightShin.rotation.x = 1.5;

      if (p >= 1) {
        this.isDodging = false;
        this.dodgeProgress = 0;
        this.rootJoint.position.y = 0;
        this.rootJoint.rotation.x = 0;
        this.spine.rotation.set(0, 0, 0);
        this.leftThigh.rotation.set(0, 0, 0);
        this.rightThigh.rotation.set(0, 0, 0);
        this.leftShin.rotation.set(0, 0, 0);
        this.rightShin.rotation.set(0, 0, 0);
      }
      return;
    }

    // 3. Attack Animations
    if (this.isAttacking) {
      this.updateAttackAnimation(delta);
      return;
    }

    // 4. Locomotion / Idle
    if (isMoving) {
      const speed = isSprinting ? 9.5 : 6.0;
      const legFreq = this.animTime * speed;
      const legAmp = isSprinting ? 0.75 : 0.5;

      // Stride-synchronized footstep detection (left / right foot ground strikes)
      const sinVal = Math.sin(legFreq);
      if (sinVal > 0.82 && this.lastStepSide !== 1) {
        this.lastStepSide = 1;
        this.onFootstep?.(isSprinting);
      } else if (sinVal < -0.82 && this.lastStepSide !== -1) {
        this.lastStepSide = -1;
        this.onFootstep?.(isSprinting);
      }

      this.rootJoint.position.y = Math.abs(Math.sin(legFreq)) * 0.08;

      this.leftThigh.rotation.x = Math.sin(legFreq) * legAmp;
      this.rightThigh.rotation.x = -Math.sin(legFreq) * legAmp;
      this.leftShin.rotation.x = Math.max(0, -Math.sin(legFreq) * legAmp * 1.2);
      this.rightShin.rotation.x = Math.max(0, Math.sin(legFreq) * legAmp * 1.2);

      this.spine.rotation.x = isSprinting ? 0.28 : 0.12;
      this.chest.rotation.y = -Math.sin(legFreq) * 0.15;

      if (this.currentStance === 'executioner') {
        this.leftShoulder.rotation.x = -Math.sin(legFreq) * legAmp;
        this.rightShoulder.rotation.x = Math.sin(legFreq) * legAmp;
      } else {
        this.rightShoulder.rotation.x = -0.4 + Math.sin(legFreq) * 0.15;
        this.leftShoulder.rotation.x = 0.3 - Math.sin(legFreq) * 0.15;
      }

      this.capeGroup.rotation.x = (isSprinting ? 0.7 : 0.4) + Math.sin(this.animTime * 14) * 0.15;
    } else {
      this.lastStepSide = 0;
      // Idle Breathing
      const breath = Math.sin(this.animTime * 2.2);
      this.rootJoint.position.y = 0;
      this.rootJoint.rotation.x = 0;
      this.chest.position.y = 0.26 + breath * 0.015;
      this.chest.rotation.x = breath * 0.02;
      this.head.rotation.x = -breath * 0.015;

      this.leftThigh.rotation.set(0, 0, 0);
      this.rightThigh.rotation.set(0, 0, 0);
      this.leftShin.rotation.set(0, 0, 0);
      this.rightShin.rotation.set(0, 0, 0);

      if (this.currentStance === 'executioner') {
        this.leftShoulder.rotation.set(-0.8, 0.4, 0.2);
        this.rightShoulder.rotation.set(-0.7, -0.4, -0.2);
        this.leftForearm.rotation.set(-1.0, 0, 0);
        this.rightForearm.rotation.set(-1.0, 0, 0);
      } else {
        this.rightShoulder.rotation.set(-0.5 + breath * 0.02, -0.2, 0.1);
        this.rightForearm.rotation.set(-0.6, 0.1, 0);
        this.leftShoulder.rotation.set(-0.3, 0.3, 0);
        this.leftForearm.rotation.set(-0.4, 0, 0);
      }

      this.capeGroup.rotation.x = 0.12 + Math.sin(this.animTime * 1.5) * 0.05;
    }
  }

  public triggerAttack(comboStep: number, isHeavy: boolean, speedMultiplier: number = 1.0) {
    this.isAttacking = true;
    this.attackPhase = 0;
    this.attackSpeedMultiplier = speedMultiplier;
    this.currentAnim = isHeavy ? 'heavy' : `light_${comboStep}`;
  }

  private updateAttackAnimation(delta: number) {
    const baseRate = this.currentAnim === 'sovereign_wrath' ? 2.4 : 3.8 * this.attackSpeedMultiplier;
    this.attackPhase += delta * baseRate;
    const p = Math.min(1, this.attackPhase);
    const wClass = this.equippedWeaponClass;

    if (this.currentAnim === 'sovereign_wrath') {
      // Cinematic Sovereign Wrath: Charge chest rune, raise blade overhead, unleash wide blue-white AoE cleave
      if (p < 0.35) {
        const t = p / 0.35;
        this.spine.rotation.x = -0.35 * t;
        this.chest.rotation.y = -0.55 * t;
        this.rightShoulder.rotation.set(-Math.PI * 0.92 * t, -0.25 * t, 0.35 * t);
        this.leftShoulder.rotation.set(-Math.PI * 0.85 * t, 0.25 * t, -0.35 * t);
      } else if (p < 0.68) {
        const t = (p - 0.35) / 0.33;
        this.spine.rotation.x = THREE.MathUtils.lerp(-0.35, 0.45, t);
        this.chest.rotation.y = THREE.MathUtils.lerp(-0.55, 1.35, t);
        this.rightShoulder.rotation.set(THREE.MathUtils.lerp(-Math.PI * 0.92, 0.65, t), 0.7 * t, -0.2);
        this.leftShoulder.rotation.set(THREE.MathUtils.lerp(-Math.PI * 0.85, 0.45, t), -0.4, 0.2);
      } else {
        const t = (p - 0.68) / 0.32;
        this.spine.rotation.x = THREE.MathUtils.lerp(0.45, 0, t);
        this.chest.rotation.y = THREE.MathUtils.lerp(1.35, 0, t);
        this.rightShoulder.rotation.set(THREE.MathUtils.lerp(0.65, -0.5, t), THREE.MathUtils.lerp(0.7, -0.2, t), 0);
        this.leftShoulder.rotation.set(THREE.MathUtils.lerp(0.45, -0.3, t), 0.3, 0);
      }
    } else if (this.currentAnim === 'heavy') {
      if (p < 0.4) {
        const t = p / 0.4;
        this.spine.rotation.x = -0.32 * t;
        this.rightShoulder.rotation.set(-Math.PI * 0.88 * t, 0, 0.3 * t);
        this.leftShoulder.rotation.set(-Math.PI * 0.82 * t, 0, -0.3 * t);
      } else if (p < 0.7) {
        const t = (p - 0.4) / 0.3;
        this.spine.rotation.x = THREE.MathUtils.lerp(-0.32, 0.52, t);
        this.rightShoulder.rotation.set(THREE.MathUtils.lerp(-Math.PI * 0.88, 0.82, t), 0, 0);
        this.leftShoulder.rotation.set(THREE.MathUtils.lerp(-Math.PI * 0.82, 0.72, t), 0, 0);
      } else {
        const t = (p - 0.7) / 0.3;
        this.spine.rotation.x = THREE.MathUtils.lerp(0.52, 0, t);
        this.rightShoulder.rotation.set(THREE.MathUtils.lerp(0.82, -0.5, t), 0, 0);
        this.leftShoulder.rotation.set(THREE.MathUtils.lerp(0.72, -0.3, t), 0, 0);
      }
    } else if (this.currentAnim === 'light_1') {
      if (wClass === 'spear') {
        // Long piercing ritual thrust
        if (p < 0.3) {
          const t = p / 0.3;
          this.chest.rotation.y = 0.4 * t;
          this.rightShoulder.rotation.set(-0.2, 0, 0.3 * t);
          this.rightForearm.rotation.set(-1.3 * t, 0, 0);
        } else if (p < 0.65) {
          const t = (p - 0.3) / 0.35;
          this.chest.rotation.y = THREE.MathUtils.lerp(0.4, -0.4, t);
          this.rightShoulder.rotation.set(THREE.MathUtils.lerp(-0.2, -1.55, t), 0, 0);
          this.rightForearm.rotation.set(THREE.MathUtils.lerp(-1.3, 0, t), 0, 0);
        } else {
          const t = (p - 0.65) / 0.35;
          this.chest.rotation.y = THREE.MathUtils.lerp(-0.4, 0, t);
          this.rightShoulder.rotation.set(THREE.MathUtils.lerp(-1.55, -0.5, t), -0.2, 0);
        }
      } else {
        if (p < 0.35) {
          const t = p / 0.35;
          this.chest.rotation.y = -0.85 * t;
          this.rightShoulder.rotation.set(-0.6, -0.85 * t, 0);
        } else if (p < 0.7) {
          const t = (p - 0.35) / 0.35;
          this.chest.rotation.y = THREE.MathUtils.lerp(-0.85, 0.95, t);
          this.rightShoulder.rotation.set(-0.4, THREE.MathUtils.lerp(-0.85, 0.85, t), 0);
        } else {
          const t = (p - 0.7) / 0.3;
          this.chest.rotation.y = THREE.MathUtils.lerp(0.95, 0, t);
          this.rightShoulder.rotation.set(THREE.MathUtils.lerp(-0.4, -0.5, t), THREE.MathUtils.lerp(0.85, -0.2, t), 0);
        }
      }
    } else if (this.currentAnim === 'light_2') {
      if (p < 0.35) {
        const t = p / 0.35;
        this.chest.rotation.y = 0.65 * t;
        this.rightShoulder.rotation.set(0.4 * t, 0.55 * t, 0);
        if (wClass === 'dual_swords') {
          this.leftShoulder.rotation.set(-0.8 * t, -0.7 * t, 0);
        }
      } else if (p < 0.7) {
        const t = (p - 0.35) / 0.35;
        this.chest.rotation.y = THREE.MathUtils.lerp(0.65, -0.75, t);
        this.rightShoulder.rotation.set(THREE.MathUtils.lerp(0.4, -1.25, t), -0.6, 0);
        if (wClass === 'dual_swords') {
          this.leftShoulder.rotation.set(THREE.MathUtils.lerp(-0.8, 0.75, t), 0.7, 0);
        }
      } else {
        const t = (p - 0.7) / 0.3;
        this.chest.rotation.y = THREE.MathUtils.lerp(-0.75, 0, t);
        this.rightShoulder.rotation.set(THREE.MathUtils.lerp(-1.25, -0.5, t), THREE.MathUtils.lerp(-0.6, -0.2, t), 0);
      }
    } else {
      // light_3: Grounded 3rd-step Cross-Execution Finisher with forward lunge recovery
      if (p < 0.32) {
        const t = p / 0.32;
        this.spine.rotation.x = -0.22 * t;
        this.chest.rotation.y = -0.95 * t;
        this.rightShoulder.rotation.set(-1.6 * t, -0.45 * t, 0.45 * t);
        this.leftShoulder.rotation.set(-1.3 * t, 0.35 * t, -0.35 * t);
      } else if (p < 0.7) {
        const t = (p - 0.32) / 0.38;
        this.spine.rotation.x = THREE.MathUtils.lerp(-0.22, 0.38, t);
        this.chest.rotation.y = THREE.MathUtils.lerp(-0.95, 1.15, t);
        this.rightShoulder.rotation.set(THREE.MathUtils.lerp(-1.6, 0.65, t), THREE.MathUtils.lerp(-0.45, 0.65, t), 0);
        this.leftShoulder.rotation.set(THREE.MathUtils.lerp(-1.3, 0.55, t), THREE.MathUtils.lerp(0.35, -0.55, t), 0);
      } else {
        const t = (p - 0.7) / 0.3;
        this.spine.rotation.x = THREE.MathUtils.lerp(0.38, 0, t);
        this.chest.rotation.y = THREE.MathUtils.lerp(1.15, 0, t);
        this.rightShoulder.rotation.set(THREE.MathUtils.lerp(0.65, -0.5, t), THREE.MathUtils.lerp(0.65, -0.2, t), 0);
        this.leftShoulder.rotation.set(THREE.MathUtils.lerp(0.55, -0.3, t), THREE.MathUtils.lerp(-0.55, 0.3, t), 0);
      }
    }

    if (p >= 1) {
      this.isAttacking = false;
      this.rootJoint.rotation.y = 0;
      this.spine.rotation.set(0, 0, 0);
      this.chest.rotation.set(0, 0, 0);
    }
  }

  public reset() {
    this.isDead = false;
    this.deathProgress = 0;
    this.isDodging = false;
    this.dodgeProgress = 0;
    this.isAttacking = false;
    this.attackPhase = 0;
    this.rootJoint.position.set(0, 0, 0);
    this.rootJoint.rotation.set(0, 0, 0);
    this.spine.rotation.set(0, 0, 0);
    this.chest.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    this.leftThigh.rotation.set(0, 0, 0);
    this.rightThigh.rotation.set(0, 0, 0);
    this.leftShin.rotation.set(0, 0, 0);
    this.rightShin.rotation.set(0, 0, 0);
    this.leftShoulder.rotation.set(0, 0, 0);
    this.rightShoulder.rotation.set(0, 0, 0);
    this.leftForearm.rotation.set(0, 0, 0);
    this.rightForearm.rotation.set(0, 0, 0);
    this.capeGroup.rotation.set(0.3, 0, 0);
  }

  /**
   * Supports loading external GLB models with embedded materials, textures, and animation clips
   */
  public async loadExternalGLB(url: string): Promise<boolean> {
    try {
      const gltf = await glbLoaderService.loadModel(url);
      const instance = glbLoaderService.createCharacterInstance(gltf);
      this.rootJoint.visible = false;
      this.group.add(instance.group);
      return true;
    } catch (e) {
      console.warn('Could not load external GLB for Azrael:', e);
      return false;
    }
  }

  public getForwardVector(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, 1).applyEuler(this.group.rotation);
  }
}
