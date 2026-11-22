/**
 * The Seven Hellgates - Abaddon Gluttony Ecosystem Creatures
 * Complete hierarchy of living organisms with distinct silhouettes,
 * organic PBR materials, articulation, movement styles, attack animations, and idle behaviors:
 *
 * 1. Carrion Leech (Wildlife) - Segmented writhing vermin with concentric sucker rings
 * 2. Bone Beetle (Wildlife) - Chitinous multi-segmented scavenger with articulated legs & mandibles
 * 3. Hungerborn (Common) - Emaciated humanoid predator with exposed ribcage, sunken skull & talons
 * 4. Flesh Crawler (Common) - Low-profile quadrupedal ambush predator with splayed scythe legs
 * 5. Mawling (Common) - Malformed aberration with cavernous snapping jaws & pulsing bile sac
 * 6. Gut Reaver (Elite) - Heavily built territorial hunter with bone cuirass, serrated cleaver & hook
 * 7. Fleshbound Brute (Elite) - Enormous armored organic monolith with stone fists & acid vents
 * 8. Devouring Matriarch (Mini-Boss) - Multi-jawed apex broodmother with curved horn crown
 */

import * as THREE from 'three';
import {
  EcosystemCreature,
  EcosystemCreatureStats,
  CreatureTier,
  CreatureAIState,
  EcosystemLODState,
} from '../core/types';
import {
  createAnatomicalLimb,
  createCurvedHorn,
  createLoftedBodyGeometry,
  LoftedSlice,
} from '../../entities/CharacterGeometry';

// ============================================================================
// BASE ABADDON CREATURE
// ============================================================================
export abstract class BaseAbaddonCreature implements EcosystemCreature {
  public id: string;
  public name: string;
  public tier: CreatureTier;
  public state: CreatureAIState = 'idle';
  public stats: EcosystemCreatureStats;
  public group: THREE.Group;
  public lodState: EcosystemLODState = 'active';
  public currentFeedingPitId: string | null = null;
  public targetPosition: THREE.Vector3 | null = null;
  public targetEntityId: string | null = null;
  public lastStateChangeTime: number = Date.now();
  public isDead: boolean = false;

  protected stateTimer: number = 2.0 + Math.random() * 3.0;
  protected materials: THREE.Material[] = [];
  protected animTime: number = Math.random() * 10;
  protected isAttacking: boolean = false;
  protected attackProgress: number = 0;

  constructor(id: string, name: string, tier: CreatureTier, stats: EcosystemCreatureStats) {
    this.id = id;
    this.name = name;
    this.tier = tier;
    this.stats = stats;
    this.group = new THREE.Group();
  }

  public takeDamage(amount: number): boolean {
    if (this.isDead) return false;
    this.stats.health = Math.max(0, this.stats.health - amount);

    if (this.tier === 'wildlife' || (this.stats.health < this.stats.maxHealth * 0.3 && this.tier === 'common')) {
      this.setState('fleeing');
    } else if (this.state !== 'hunting' && this.state !== 'defending') {
      this.setState('defending');
    }

    if (this.stats.health <= 0) {
      this.isDead = true;
      this.setState('dead');
      return true;
    }
    return false;
  }

  public setState(newState: CreatureAIState) {
    if (this.state === 'dead' || this.state === newState) return;
    this.state = newState;
    this.lastStateChangeTime = Date.now();
    this.stateTimer = 2.5 + Math.random() * 3.0;
  }

  public abstract update(delta: number, playerPos: THREE.Vector3, lod: EcosystemLODState): void;

  public dispose() {
    this.materials.forEach(m => m.dispose());
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
  }
}

// ============================================================================
// 1. WILDLIFE: CARRION LEECH (Writhing vermin with concentric sucker rings)
// ============================================================================
export class CarrionLeech extends BaseAbaddonCreature {
  private bodySegments: THREE.Mesh[] = [];

  constructor(id: string, pos: THREE.Vector3) {
    super(id, 'Carrion Leech', 'wildlife', {
      health: 30,
      maxHealth: 30,
      damage: 6,
      speed: 2.2,
      aggroRadius: 4.5,
      feedingRate: 3.0,
      hungerLevel: 85,
      fearLevel: 75,
      emberReward: 18,
    });

    this.group.position.copy(pos);

    const leechMat = new THREE.MeshStandardMaterial({
      color: 0x330b0b,
      emissive: 0x6e1b24,
      emissiveIntensity: 0.2,
      roughness: 0.32,
      metalness: 0.25,
    });
    this.materials.push(leechMat);

    // 5-segment tapered body with sinusoidal ripple
    for (let s = 0; s < 5; s++) {
      const r = 0.14 * (1 - s * 0.15);
      const segGeom = new THREE.SphereGeometry(r, 10, 8);
      segGeom.scale(1.0, 0.7, 1.4);
      segGeom.computeVertexNormals();
      const seg = new THREE.Mesh(segGeom, leechMat);
      seg.position.set(0, 0.08, -s * 0.18);
      seg.castShadow = true;
      this.group.add(seg);
      this.bodySegments.push(seg);
    }

    // Oral sucker ring
    const suckerMat = new THREE.MeshStandardMaterial({ color: 0x541212, roughness: 0.2 });
    this.materials.push(suckerMat);
    const suckerGeom = new THREE.TorusGeometry(0.08, 0.03, 6, 12);
    suckerGeom.computeVertexNormals();
    const sucker = new THREE.Mesh(suckerGeom, suckerMat);
    sucker.position.set(0, 0.08, 0.12);
    this.group.add(sucker);
  }

  public update(delta: number, playerPos: THREE.Vector3, lod: EcosystemLODState) {
    this.animTime += delta;
    if (this.isDead) {
      this.group.position.y = Math.max(-0.25, this.group.position.y - delta * 0.6);
      return;
    }

    const distToPlayer = this.group.position.distanceTo(playerPos);
    if (distToPlayer <= this.stats.aggroRadius) {
      this.setState('fleeing');
    }

    if (this.state === 'fleeing') {
      const away = new THREE.Vector3().subVectors(this.group.position, playerPos).normalize();
      away.y = 0;
      this.group.position.addScaledVector(away, this.stats.speed * delta * 1.4);
      this.group.rotation.y = Math.atan2(away.x, away.z);
    }

    // Undulating caterpillar slither
    const speedMult = this.state === 'fleeing' ? 14 : 7;
    this.bodySegments.forEach((seg, idx) => {
      seg.position.y = 0.08 + Math.sin(this.animTime * speedMult + idx * 0.8) * 0.05;
      seg.position.x = Math.sin(this.animTime * (speedMult * 0.8) + idx * 0.6) * 0.03;
    });
  }
}

// ============================================================================
// 2. WILDLIFE: BONE BEETLE (Armored chitinous scavenger with articulated legs)
// ============================================================================
export class BoneBeetle extends BaseAbaddonCreature {
  private legs: THREE.Mesh[] = [];
  private mandibles: THREE.Mesh[] = [];

  constructor(id: string, pos: THREE.Vector3) {
    super(id, 'Bone Beetle', 'wildlife', {
      health: 45,
      maxHealth: 45,
      damage: 10,
      speed: 1.8,
      aggroRadius: 5.0,
      feedingRate: 4.0,
      hungerLevel: 70,
      fearLevel: 60,
      emberReward: 30,
    });

    this.group.position.copy(pos);

    const chitinMat = new THREE.MeshStandardMaterial({
      color: 0x3d3228,
      roughness: 0.45,
      metalness: 0.7,
    });
    const fleshUnderMat = new THREE.MeshStandardMaterial({ color: 0x4a1818, roughness: 0.6 });
    this.materials.push(chitinMat, fleshUnderMat);

    // Multi-segmented carapace
    const thoraxGeom = new THREE.SphereGeometry(0.24, 12, 10);
    thoraxGeom.scale(1.1, 0.6, 1.4);
    thoraxGeom.computeVertexNormals();
    const thorax = new THREE.Mesh(thoraxGeom, chitinMat);
    thorax.position.y = 0.22;
    thorax.castShadow = true;
    this.group.add(thorax);

    // Elytra center seam ridge
    const ridgeGeom = new THREE.BoxGeometry(0.04, 0.06, 0.6);
    const ridge = new THREE.Mesh(ridgeGeom, chitinMat);
    ridge.position.set(0, 0.35, -0.05);
    this.group.add(ridge);

    // 6 Articulated legs
    const legGeom = new THREE.CylinderGeometry(0.02, 0.015, 0.28, 6);
    legGeom.computeVertexNormals();
    for (const [side, zOffset] of [[-1, 0.15], [1, 0.15], [-1, 0], [1, 0], [-1, -0.15], [1, -0.15]] as const) {
      const leg = new THREE.Mesh(legGeom, chitinMat);
      leg.position.set(side * 0.24, 0.14, zOffset);
      leg.rotation.z = side * Math.PI * 0.35;
      leg.castShadow = true;
      this.group.add(leg);
      this.legs.push(leg);
    }

    // Scissor mandibles
    const mandGeom = new THREE.ConeGeometry(0.04, 0.22, 5);
    mandGeom.computeVertexNormals();
    for (const side of [-1, 1] as const) {
      const mand = new THREE.Mesh(mandGeom, chitinMat);
      mand.position.set(side * 0.08, 0.18, 0.38);
      mand.rotation.x = -Math.PI / 2;
      this.group.add(mand);
      this.mandibles.push(mand);
    }
  }

  public update(delta: number, playerPos: THREE.Vector3, lod: EcosystemLODState) {
    this.animTime += delta;
    if (this.isDead) return;

    const distToPlayer = this.group.position.distanceTo(playerPos);
    if (distToPlayer <= this.stats.aggroRadius) {
      this.setState('fleeing');
      const away = new THREE.Vector3().subVectors(this.group.position, playerPos).normalize();
      away.y = 0;
      this.group.position.addScaledVector(away, this.stats.speed * delta);
      this.group.rotation.y = Math.atan2(away.x, away.z);
    }

    // Leg scuttle cycle
    const walk = Math.sin(this.animTime * 12);
    this.legs.forEach((leg, idx) => {
      leg.rotation.y = (idx % 2 === 0 ? walk : -walk) * 0.35;
    });

    // Mandible twitch
    const snap = Math.sin(this.animTime * 6) * 0.25;
    if (this.mandibles[0]) this.mandibles[0].rotation.y = snap;
    if (this.mandibles[1]) this.mandibles[1].rotation.y = -snap;
  }
}

// ============================================================================
// 3. COMMON ENEMY: HUNGERBORN (Emaciated humanoid predator with exposed anatomy)
// ============================================================================
export class Hungerborn extends BaseAbaddonCreature {
  private spineMesh: THREE.Group;
  private jawMesh: THREE.Mesh;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private eyeLight: THREE.PointLight;

  constructor(id: string, pos: THREE.Vector3) {
    super(id, 'Hungerborn Predator', 'common', {
      health: 145,
      maxHealth: 145,
      damage: 22,
      speed: 3.8,
      aggroRadius: 13.0,
      feedingRate: 7.0,
      hungerLevel: 98,
      fearLevel: 25,
      emberReward: 85,
    });

    this.group.position.copy(pos);

    // PBR Mottled Flesh & Exposed Bone Materials
    const mottledFleshMat = new THREE.MeshStandardMaterial({
      color: 0x47181c,
      emissive: 0x8a1c22,
      emissiveIntensity: 0.22,
      roughness: 0.65,
      metalness: 0.15,
    });

    const exposedBoneMat = new THREE.MeshStandardMaterial({
      color: 0x5a4f3e,
      roughness: 0.45,
      metalness: 0.30,
    });

    const clawMat = new THREE.MeshStandardMaterial({
      color: 0x1f1b17,
      roughness: 0.3,
      metalness: 0.7,
    });
    this.materials.push(mottledFleshMat, exposedBoneMat, clawMat);

    // 1. Hunched Emaciated Torso with Hollow Ribcage
    this.spineMesh = new THREE.Group();
    this.spineMesh.position.y = 1.05;
    this.spineMesh.rotation.x = 0.45; // Extreme predatory hunch

    const torsoSlices: LoftedSlice[] = [
      { y: -0.4, rx: 0.18, rz: 0.15 }, // Pelvis
      { y: -0.15, rx: 0.14, rz: 0.12, indentZBack: 0.04 }, // Sunken starvation waist
      { y: 0.15, rx: 0.26, rz: 0.22, bulgeZFront: 0.08, bulgeXSide: 0.04 }, // Flaired ribcage
      { y: 0.42, rx: 0.22, rz: 0.18 }, // Neck base
    ];
    const torsoGeom = createLoftedBodyGeometry(torsoSlices, 16, true, true);
    const torsoMesh = new THREE.Mesh(torsoGeom, mottledFleshMat);
    torsoMesh.castShadow = true;
    this.spineMesh.add(torsoMesh);

    // Visible protruding rib bones
    for (let r = 0; r < 5; r++) {
      const ribGeom = new THREE.TorusGeometry(0.24 - r * 0.02, 0.025, 4, 12, Math.PI * 0.7);
      ribGeom.computeVertexNormals();
      const rib = new THREE.Mesh(ribGeom, exposedBoneMat);
      rib.position.set(0, 0.25 - r * 0.09, 0.05);
      rib.rotation.x = Math.PI * 0.15;
      this.spineMesh.add(rib);
    }

    // Sharp dorsal spine nodes
    for (let s = 0; s < 6; s++) {
      const spurGeom = new THREE.ConeGeometry(0.035, 0.16, 4);
      spurGeom.computeVertexNormals();
      const spur = new THREE.Mesh(spurGeom, exposedBoneMat);
      spur.position.set(0, 0.35 - s * 0.12, -0.16);
      spur.rotation.x = -Math.PI * 0.55;
      this.spineMesh.add(spur);
    }

    // 2. Sunken Eyeless Skull with Gaping Needle-Teeth Jaw
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.55, 0.2);

    const craniumGeom = new THREE.SphereGeometry(0.18, 12, 10);
    craniumGeom.scale(0.85, 1.1, 1.25);
    craniumGeom.computeVertexNormals();
    const cranium = new THREE.Mesh(craniumGeom, exposedBoneMat);
    cranium.castShadow = true;
    headGroup.add(cranium);

    // Gaping lower jaw
    const jawGeom = new THREE.ConeGeometry(0.14, 0.35, 6);
    jawGeom.computeVertexNormals();
    this.jawMesh = new THREE.Mesh(jawGeom, exposedBoneMat);
    this.jawMesh.position.set(0, -0.16, 0.18);
    this.jawMesh.rotation.x = Math.PI * 0.65;
    headGroup.add(this.jawMesh);

    // Glowing red eye cavity light
    this.eyeLight = new THREE.PointLight(0xef4444, 0.8, 2.5);
    this.eyeLight.position.set(0, 0.05, 0.2);
    headGroup.add(this.eyeLight);

    this.spineMesh.add(headGroup);
    this.group.add(this.spineMesh);

    // 3. Elongated Spindly Arms ending in Bone Talons
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(0.34, 0.35, 0);
    this.leftArmGroup.add(new THREE.Mesh(createAnatomicalLimb(0.075, 0.065, 0.05, 0.95), mottledFleshMat));
    
    // Curved claw talons
    for (let c = -1; c <= 1; c++) {
      const clawGeom = new THREE.ConeGeometry(0.02, 0.22, 4);
      clawGeom.computeVertexNormals();
      const claw = new THREE.Mesh(clawGeom, clawMat);
      claw.position.set(c * 0.035, -0.98, 0.06);
      claw.rotation.x = Math.PI * 0.3;
      this.leftArmGroup.add(claw);
    }
    this.spineMesh.add(this.leftArmGroup);

    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(-0.34, 0.35, 0);
    this.rightArmGroup.add(new THREE.Mesh(createAnatomicalLimb(0.075, 0.065, 0.05, 0.95), mottledFleshMat));
    
    for (let c = -1; c <= 1; c++) {
      const clawGeom = new THREE.ConeGeometry(0.02, 0.22, 4);
      clawGeom.computeVertexNormals();
      const claw = new THREE.Mesh(clawGeom, clawMat);
      claw.position.set(c * 0.035, -0.98, 0.06);
      claw.rotation.x = Math.PI * 0.3;
      this.rightArmGroup.add(claw);
    }
    this.spineMesh.add(this.rightArmGroup);

    // 4. Digitigrade Starved Legs
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(0.18, 0.65, -0.05);
    const thighL = new THREE.Mesh(createAnatomicalLimb(0.09, 0.07, 0.05, 0.65), mottledFleshMat);
    this.leftLegGroup.add(thighL);
    this.group.add(this.leftLegGroup);

    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(-0.18, 0.65, -0.05);
    const thighR = new THREE.Mesh(createAnatomicalLimb(0.09, 0.07, 0.05, 0.65), mottledFleshMat);
    this.rightLegGroup.add(thighR);
    this.group.add(this.rightLegGroup);
  }

  public update(delta: number, playerPos: THREE.Vector3, lod: EcosystemLODState) {
    this.animTime += delta;
    if (this.isDead) {
      this.group.position.y = Math.max(-0.6, this.group.position.y - delta * 0.8);
      this.spineMesh.rotation.x = THREE.MathUtils.lerp(this.spineMesh.rotation.x, 1.4, delta * 4);
      this.eyeLight.intensity = Math.max(0, this.eyeLight.intensity - delta * 2);
      return;
    }

    const distToPlayer = this.group.position.distanceTo(playerPos);
    if (distToPlayer <= this.stats.aggroRadius) {
      this.setState('hunting');
    }

    // Attack state machine
    if (this.isAttacking) {
      this.attackProgress += delta * 3.2;
      const p = this.attackProgress;

      if (p < 0.4) {
        // Windup: raises both clawed arms overhead, opens needle jaw wide
        this.leftArmGroup.rotation.x = -Math.PI * 0.8 * (p / 0.4);
        this.rightArmGroup.rotation.x = -Math.PI * 0.7 * (p / 0.4);
        this.jawMesh.rotation.x = Math.PI * 0.9;
      } else if (p < 0.7) {
        // Double claw downward slash
        const t = (p - 0.4) / 0.3;
        this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.8, 0.8, t);
        this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.7, 0.9, t);
        this.jawMesh.rotation.x = THREE.MathUtils.lerp(Math.PI * 0.9, Math.PI * 0.4, t);
      } else {
        // Recovery
        const t = (p - 0.7) / 0.3;
        this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(0.8, 0, t);
        this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(0.9, 0, t);
      }

      if (p >= 1.0) {
        this.isAttacking = false;
        this.attackProgress = 0;
      }
      return;
    }

    // Movement & Idle Behavior
    if (this.state === 'hunting') {
      const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
      toPlayer.y = 0;
      const dist = toPlayer.length();

      if (dist > 1.8) {
        toPlayer.normalize();
        this.group.position.addScaledVector(toPlayer, this.stats.speed * delta);
        this.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

        // Frantic predatory stalk gait
        const runFreq = this.animTime * 14;
        this.leftLegGroup.rotation.x = Math.sin(runFreq) * 0.6;
        this.rightLegGroup.rotation.x = -Math.sin(runFreq) * 0.6;
        this.leftArmGroup.rotation.x = -Math.sin(runFreq) * 0.4;
        this.rightArmGroup.rotation.x = Math.sin(runFreq) * 0.4;
      } else {
        // Initiate claw lunge attack
        this.isAttacking = true;
        this.attackProgress = 0;
      }
    } else {
      // Idle: twitching ground sniffing & spine breathing
      const breath = Math.sin(this.animTime * 2.5) * 0.05;
      this.spineMesh.rotation.x = 0.45 + breath;
      this.leftArmGroup.rotation.z = Math.sin(this.animTime * 3) * 0.08;
      this.rightArmGroup.rotation.z = -Math.sin(this.animTime * 3) * 0.08;
    }
  }
}

// ============================================================================
// 4. COMMON ENEMY: FLESH CRAWLER (Low-profile quadrupedal ambush predator)
// ============================================================================
export class FleshCrawler extends BaseAbaddonCreature {
  private spineSegments: THREE.Mesh[] = [];
  private legJoints: THREE.Group[] = [];
  private mandibles: THREE.Mesh[] = [];
  private pounceTimer: number = 0;

  constructor(id: string, pos: THREE.Vector3) {
    super(id, 'Flesh Crawler', 'common', {
      health: 180,
      maxHealth: 180,
      damage: 28,
      speed: 4.8,
      aggroRadius: 14.0,
      feedingRate: 9.0,
      hungerLevel: 92,
      fearLevel: 15,
      emberReward: 110,
    });

    this.group.position.copy(pos);

    // Chitin & Flesh Materials
    const darkChitinMat = new THREE.MeshStandardMaterial({
      color: 0x300c0f,
      emissive: 0x5a0a10,
      emissiveIntensity: 0.25,
      roughness: 0.45,
      metalness: 0.4,
    });

    const ribbedUnderbellyMat = new THREE.MeshStandardMaterial({
      color: 0x541818,
      roughness: 0.55,
      metalness: 0.2,
    });

    const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.materials.push(darkChitinMat, ribbedUnderbellyMat, eyeGlowMat);

    // 1. Flattened Segmented Carapace (2.2m long, 0.75m high)
    const bodyRoot = new THREE.Group();
    bodyRoot.position.y = 0.45;

    for (let s = 0; s < 4; s++) {
      const segWidth = 0.65 - s * 0.08;
      const segGeom = new THREE.BoxGeometry(segWidth, 0.28, 0.55);
      segGeom.computeVertexNormals();
      const segMesh = new THREE.Mesh(segGeom, darkChitinMat);
      segMesh.position.set(0, 0, (s - 1.5) * 0.5);
      segMesh.castShadow = true;
      bodyRoot.add(segMesh);
      this.spineSegments.push(segMesh);

      // Flared rib plates
      for (const side of [-1, 1] as const) {
        const plateGeom = new THREE.ConeGeometry(0.12, 0.35, 4);
        plateGeom.computeVertexNormals();
        const plate = new THREE.Mesh(plateGeom, darkChitinMat);
        plate.position.set(side * (segWidth * 0.55), 0.05, (s - 1.5) * 0.5);
        plate.rotation.z = side * Math.PI * 0.45;
        bodyRoot.add(plate);
      }
    }

    // 2. Low Wedge-Shaped Head with 3 pairs of crimson eyes
    const headGeom = new THREE.ConeGeometry(0.32, 0.65, 5);
    headGeom.computeVertexNormals();
    const headMesh = new THREE.Mesh(headGeom, darkChitinMat);
    headMesh.position.set(0, 0.05, 1.2);
    headMesh.rotation.x = -Math.PI / 2.3;
    bodyRoot.add(headMesh);

    // 6 glowing eyes
    for (let e = 0; e < 3; e++) {
      for (const side of [-1, 1] as const) {
        const eyeGeom = new THREE.SphereGeometry(0.035, 6, 6);
        const eyeMesh = new THREE.Mesh(eyeGeom, eyeGlowMat);
        eyeMesh.position.set(side * (0.08 + e * 0.04), 0.12 - e * 0.03, 1.1 + e * 0.15);
        bodyRoot.add(eyeMesh);
      }
    }

    // Scissor mandibles
    for (const side of [-1, 1] as const) {
      const mandGeom = new THREE.ConeGeometry(0.065, 0.45, 4);
      mandGeom.computeVertexNormals();
      const mand = new THREE.Mesh(mandGeom, darkChitinMat);
      mand.position.set(side * 0.14, -0.05, 1.45);
      mand.rotation.x = -Math.PI / 2;
      bodyRoot.add(mand);
      this.mandibles.push(mand);
    }

    this.group.add(bodyRoot);

    // 3. 4 Splayed Multi-Jointed Arthropod / Canid Scythe Legs
    const legOffsets = [
      { x: 0.55, z: 0.6, isFront: true },
      { x: -0.55, z: 0.6, isFront: true },
      { x: 0.65, z: -0.6, isFront: false },
      { x: -0.65, z: -0.6, isFront: false },
    ];

    legOffsets.forEach((spec) => {
      const legRoot = new THREE.Group();
      legRoot.position.set(spec.x, 0.4, spec.z);

      // Upper splayed joint
      const upperLeg = new THREE.Mesh(createAnatomicalLimb(0.09, 0.075, 0.06, 0.55), darkChitinMat);
      upperLeg.rotation.z = Math.sign(spec.x) * Math.PI * 0.25;
      legRoot.add(upperLeg);

      // Lower reverse-canted scythe blade
      const lowerLeg = new THREE.Mesh(createAnatomicalLimb(0.06, 0.045, 0.02, 0.65), darkChitinMat);
      lowerLeg.position.set(Math.sign(spec.x) * 0.25, -0.45, 0);
      lowerLeg.rotation.z = -Math.sign(spec.x) * Math.PI * 0.35;
      legRoot.add(lowerLeg);

      this.group.add(legRoot);
      this.legJoints.push(legRoot);
    });
  }

  public update(delta: number, playerPos: THREE.Vector3, lod: EcosystemLODState) {
    this.animTime += delta;
    if (this.isDead) return;

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (dist <= this.stats.aggroRadius) {
      this.setState('hunting');
    }

    if (this.state === 'hunting') {
      if (dist > 2.4) {
        toPlayer.normalize();
        this.group.position.addScaledVector(toPlayer, this.stats.speed * delta);
        this.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

        // Rapid scuttling crawl gait
        const crawl = Math.sin(this.animTime * 18);
        this.legJoints.forEach((leg, idx) => {
          leg.rotation.x = (idx % 2 === 0 ? crawl : -crawl) * 0.5;
        });

        // Undulating spine motion
        this.spineSegments.forEach((seg, idx) => {
          seg.position.x = Math.sin(this.animTime * 12 + idx * 0.8) * 0.06;
        });
      } else {
        // Ambush pounce strike
        this.pounceTimer += delta * 4;
        this.group.position.y = Math.abs(Math.sin(this.pounceTimer)) * 0.6;
        const snap = Math.sin(this.pounceTimer * 4) * 0.4;
        if (this.mandibles[0]) this.mandibles[0].rotation.y = snap;
        if (this.mandibles[1]) this.mandibles[1].rotation.y = -snap;
      }
    } else {
      // Idle: hunkered low, breathing pulse
      this.group.position.y = 0;
      const breath = Math.sin(this.animTime * 2.0) * 0.03;
      this.spineSegments[0].scale.set(1 + breath, 1 + breath, 1);
    }
  }
}

// ============================================================================
// 5. COMMON ENEMY: MAWLING (Malformed aberration with cavernous jaws & bile sac)
// ============================================================================
export class Mawling extends BaseAbaddonCreature {
  private upperMaw: THREE.Group;
  private lowerMaw: THREE.Group;
  private bileSac: THREE.Mesh;
  private stubbyLegs: THREE.Group[] = [];

  constructor(id: string, pos: THREE.Vector3) {
    super(id, 'Abaddon Mawling', 'common', {
      health: 110,
      maxHealth: 110,
      damage: 26,
      speed: 3.4,
      aggroRadius: 15.0,
      feedingRate: 12.0,
      hungerLevel: 100,
      fearLevel: 10,
      emberReward: 95,
    });

    this.group.position.copy(pos);

    // Materials
    const bileSkinMat = new THREE.MeshStandardMaterial({
      color: 0x4a1418,
      roughness: 0.4,
      metalness: 0.25,
    });

    const bileSacMat = new THREE.MeshStandardMaterial({
      color: 0x2e4a0e,
      emissive: 0x84cc16,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.4,
    });

    const toothMat = new THREE.MeshStandardMaterial({ color: 0x544738, roughness: 0.4 });
    this.materials.push(bileSkinMat, bileSacMat, toothMat);

    // Body Root (1.1m tall, dominated by jaws)
    const mawRoot = new THREE.Group();
    mawRoot.position.y = 0.55;

    // Upper Jaws
    this.upperMaw = new THREE.Group();
    const upperCraniumGeom = new THREE.SphereGeometry(0.38, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
    upperCraniumGeom.computeVertexNormals();
    const upperCranium = new THREE.Mesh(upperCraniumGeom, bileSkinMat);
    upperCranium.castShadow = true;
    this.upperMaw.add(upperCranium);

    // Upper Teeth row
    for (let t = 0; t < 8; t++) {
      const ang = (t / 8) * Math.PI;
      const toothGeom = new THREE.ConeGeometry(0.04, 0.22, 4);
      toothGeom.computeVertexNormals();
      const tooth = new THREE.Mesh(toothGeom, toothMat);
      tooth.position.set(Math.cos(ang) * 0.35, -0.05, Math.sin(ang) * 0.35);
      tooth.rotation.x = Math.PI;
      this.upperMaw.add(tooth);
    }
    this.upperMaw.position.set(0, 0.25, 0.1);
    mawRoot.add(this.upperMaw);

    // Lower Jaws
    this.lowerMaw = new THREE.Group();
    const lowerGeom = new THREE.ConeGeometry(0.38, 0.55, 8);
    lowerGeom.computeVertexNormals();
    const lowerMesh = new THREE.Mesh(lowerGeom, bileSkinMat);
    lowerMesh.rotation.x = Math.PI * 0.6;
    this.lowerMaw.add(lowerMesh);

    // Lower Teeth row
    for (let t = 0; t < 8; t++) {
      const ang = (t / 8) * Math.PI;
      const toothGeom = new THREE.ConeGeometry(0.04, 0.22, 4);
      toothGeom.computeVertexNormals();
      const tooth = new THREE.Mesh(toothGeom, toothMat);
      tooth.position.set(Math.cos(ang) * 0.35, 0.15, Math.sin(ang) * 0.35);
      this.lowerMaw.add(tooth);
    }
    this.lowerMaw.position.set(0, -0.15, 0.1);
    mawRoot.add(this.lowerMaw);

    // Pulsing Glowing Bile Sac beneath throat
    const sacGeom = new THREE.SphereGeometry(0.26, 12, 10);
    sacGeom.scale(1.0, 1.25, 1.1);
    sacGeom.computeVertexNormals();
    this.bileSac = new THREE.Mesh(sacGeom, bileSacMat);
    this.bileSac.position.set(0, -0.22, -0.2);
    mawRoot.add(this.bileSac);

    this.group.add(mawRoot);

    // Two stubby digitigrade legs
    for (const side of [-1, 1] as const) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.28, 0.35, -0.15);
      const limbMesh = new THREE.Mesh(createAnatomicalLimb(0.08, 0.065, 0.05, 0.42), bileSkinMat);
      leg.add(limbMesh);
      this.group.add(leg);
      this.stubbyLegs.push(leg);
    }
  }

  public update(delta: number, playerPos: THREE.Vector3, lod: EcosystemLODState) {
    this.animTime += delta;
    if (this.isDead) return;

    // Bile sac pulsating breathing
    const sacPulse = 1.0 + Math.sin(this.animTime * 5.0) * 0.15;
    this.bileSac.scale.set(sacPulse, sacPulse, sacPulse);

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (dist <= this.stats.aggroRadius) {
      this.setState('hunting');
    }

    if (this.state === 'hunting') {
      if (dist > 1.8) {
        toPlayer.normalize();
        this.group.position.addScaledVector(toPlayer, this.stats.speed * delta);
        this.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

        // Waddling hop gait
        const hop = Math.abs(Math.sin(this.animTime * 10)) * 0.18;
        this.group.position.y = hop;
        this.stubbyLegs[0].rotation.x = Math.sin(this.animTime * 10) * 0.5;
        this.stubbyLegs[1].rotation.x = -Math.sin(this.animTime * 10) * 0.5;

        // Snapping jaws in anticipation
        const snap = Math.abs(Math.sin(this.animTime * 8)) * 0.25;
        this.upperMaw.rotation.x = -snap;
        this.lowerMaw.rotation.x = snap;
      } else {
        // Gaping lunging bite
        const lungeSnap = Math.abs(Math.sin(this.animTime * 16)) * 0.55;
        this.upperMaw.rotation.x = -lungeSnap;
        this.lowerMaw.rotation.x = lungeSnap;
      }
    } else {
      // Idle: wobbling jaw clicks
      this.group.position.y = 0;
      const click = Math.abs(Math.sin(this.animTime * 2)) * 0.1;
      this.upperMaw.rotation.x = -click;
      this.lowerMaw.rotation.x = click;
    }
  }
}

// ============================================================================
// 6. ELITE ENEMY: GUT REAVER (Heavily built territorial hunter with bone cleaver)
// ============================================================================
export class GutReaver extends BaseAbaddonCreature {
  private cleaverArm: THREE.Group;
  private hookArm: THREE.Group;
  private legs: THREE.Group[] = [];
  private torsoGroup: THREE.Group;

  constructor(id: string, pos: THREE.Vector3) {
    super(id, 'Gut Reaver', 'elite', {
      health: 420,
      maxHealth: 420,
      damage: 52,
      speed: 2.8,
      aggroRadius: 16.0,
      feedingRate: 18.0,
      hungerLevel: 88,
      fearLevel: 0,
      emberReward: 260,
    });

    this.group.position.copy(pos);
    this.group.scale.set(1.35, 1.35, 1.35);

    // PBR Materials
    const boneArmorMat = new THREE.MeshStandardMaterial({
      color: 0x473c30,
      roughness: 0.55,
      metalness: 0.35,
    });

    const muscleFiberMat = new THREE.MeshStandardMaterial({
      color: 0x3d1216,
      emissive: 0x6e1b24,
      emissiveIntensity: 0.25,
      roughness: 0.6,
      metalness: 0.15,
    });

    const rustIronMat = new THREE.MeshStandardMaterial({
      color: 0x2b2622,
      roughness: 0.45,
      metalness: 0.8,
    });
    this.materials.push(boneArmorMat, muscleFiberMat, rustIronMat);

    // 1. Massive Asymmetrical Torso with Bone Cuirass (2.5m tall)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = 1.35;

    const torsoSlices: LoftedSlice[] = [
      { y: -0.5, rx: 0.36, rz: 0.28 },
      { y: -0.15, rx: 0.38, rz: 0.30, bulgeZFront: 0.08 },
      { y: 0.25, rx: 0.52, rz: 0.38, bulgeZFront: 0.16, bulgeXSide: 0.08 }, // Broad hypertrophied lats
      { y: 0.58, rx: 0.42, rz: 0.32 },
    ];
    const torsoGeom = createLoftedBodyGeometry(torsoSlices, 18, true, true);
    const torsoMesh = new THREE.Mesh(torsoGeom, muscleFiberMat);
    torsoMesh.castShadow = true;
    this.torsoGroup.add(torsoMesh);

    // Calcified bone plate cuirass
    const cuirassGeom = new THREE.CylinderGeometry(0.54, 0.42, 0.75, 12);
    cuirassGeom.computeVertexNormals();
    const cuirass = new THREE.Mesh(cuirassGeom, boneArmorMat);
    cuirass.position.set(0, 0.1, 0.04);
    cuirass.castShadow = true;
    this.torsoGroup.add(cuirass);

    // Spiked bone pauldron on right arm
    const pauldronGeom = new THREE.SphereGeometry(0.35, 10, 8);
    pauldronGeom.computeVertexNormals();
    const pauldron = new THREE.Mesh(pauldronGeom, boneArmorMat);
    pauldron.position.set(-0.55, 0.45, 0);
    this.torsoGroup.add(pauldron);

    // Horned Skull Mask with red eye slit
    const skullHead = new THREE.Group();
    skullHead.position.set(0, 0.65, 0.15);
    const skullGeom = new THREE.BoxGeometry(0.34, 0.42, 0.36);
    skullGeom.computeVertexNormals();
    const skullMesh = new THREE.Mesh(skullGeom, boneArmorMat);
    skullHead.add(skullMesh);

    const eyeSlitGeom = new THREE.BoxGeometry(0.22, 0.04, 0.06);
    const eyeSlit = new THREE.Mesh(eyeSlitGeom, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    eyeSlit.position.set(0, 0.05, 0.19);
    skullHead.add(eyeSlit);
    this.torsoGroup.add(skullHead);

    // 2. Right Arm with Heavy Serrated Bone Cleaver
    this.cleaverArm = new THREE.Group();
    this.cleaverArm.position.set(-0.58, 0.35, 0);
    this.cleaverArm.add(new THREE.Mesh(createAnatomicalLimb(0.18, 0.16, 0.13, 0.75), muscleFiberMat));

    // Heavy Cleaver Weapon
    const cleaverGroup = new THREE.Group();
    const shaftGeom = new THREE.CylinderGeometry(0.045, 0.04, 1.9, 8);
    shaftGeom.computeVertexNormals();
    const shaft = new THREE.Mesh(shaftGeom, rustIronMat);
    cleaverGroup.add(shaft);

    const bladeGeom = new THREE.BoxGeometry(0.42, 1.4, 0.08);
    bladeGeom.computeVertexNormals();
    const blade = new THREE.Mesh(bladeGeom, boneArmorMat);
    blade.position.set(0.18, 0.55, 0);
    blade.castShadow = true;
    cleaverGroup.add(blade);

    cleaverGroup.position.set(0, -0.65, 0.25);
    cleaverGroup.rotation.x = Math.PI / 2.2;
    this.cleaverArm.add(cleaverGroup);
    this.torsoGroup.add(this.cleaverArm);

    // 3. Left Arm with Cruel Meat-Hook Claw
    this.hookArm = new THREE.Group();
    this.hookArm.position.set(0.58, 0.35, 0);
    this.hookArm.add(new THREE.Mesh(createAnatomicalLimb(0.16, 0.14, 0.12, 0.75), muscleFiberMat));

    const hookGeom = new THREE.TorusGeometry(0.22, 0.045, 6, 12, Math.PI * 0.75);
    hookGeom.computeVertexNormals();
    const hook = new THREE.Mesh(hookGeom, rustIronMat);
    hook.position.set(0, -0.85, 0.15);
    hook.rotation.z = Math.PI * 0.25;
    this.hookArm.add(hook);
    this.torsoGroup.add(this.hookArm);

    this.group.add(this.torsoGroup);

    // 4. Thick Digitigrade Legs
    for (const side of [-1, 1] as const) {
      const legGroup = new THREE.Group();
      legGroup.position.set(side * 0.28, 0.85, 0);
      legGroup.add(new THREE.Mesh(createAnatomicalLimb(0.18, 0.15, 0.12, 0.85), muscleFiberMat));
      this.group.add(legGroup);
      this.legs.push(legGroup);
    }
  }

  public update(delta: number, playerPos: THREE.Vector3, lod: EcosystemLODState) {
    this.animTime += delta;
    if (this.isDead) return;

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (dist <= this.stats.aggroRadius) {
      this.setState('hunting');
    }

    if (this.state === 'hunting') {
      if (dist > 2.8) {
        toPlayer.normalize();
        this.group.position.addScaledVector(toPlayer, this.stats.speed * delta);
        this.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

        // Stomping patrol walk & dragging cleaver
        const walk = Math.sin(this.animTime * 6.5);
        this.legs[0].rotation.x = walk * 0.45;
        this.legs[1].rotation.x = -walk * 0.45;
        this.cleaverArm.rotation.x = 0.35 + Math.sin(this.animTime * 3) * 0.1;
      } else {
        // Wide executioner cleaver sweep
        const sweep = Math.sin(this.animTime * 5) * 0.9;
        this.cleaverArm.rotation.x = -0.5 + sweep;
        this.torsoGroup.rotation.y = sweep * 0.4;
      }
    } else {
      // Idle: intimidating combat stance
      const flex = Math.sin(this.animTime * 1.8) * 0.05;
      this.torsoGroup.position.y = 1.35 + flex;
    }
  }
}

// ============================================================================
// 7. ELITE ENEMY: FLESHBOUND BRUTE (Enormous armored organic monolith)
// ============================================================================
export class FleshboundBrute extends BaseAbaddonCreature {
  private leftFist: THREE.Group;
  private rightFist: THREE.Group;
  private bileVents: THREE.Mesh[] = [];
  private torso: THREE.Group;

  constructor(id: string, pos: THREE.Vector3) {
    super(id, 'Fleshbound Brute', 'elite', {
      health: 650,
      maxHealth: 650,
      damage: 60,
      speed: 2.2,
      aggroRadius: 18.0,
      feedingRate: 30.0,
      hungerLevel: 94,
      fearLevel: 0,
      emberReward: 380,
    });

    this.group.position.copy(pos);
    this.group.scale.set(1.75, 1.75, 1.75);

    // Hardened Basalt & Muscle Striation Materials
    const basaltArmorMat = new THREE.MeshStandardMaterial({
      color: 0x221a1a,
      roughness: 0.7,
      metalness: 0.35,
    });

    const crimsonStriationMat = new THREE.MeshStandardMaterial({
      color: 0x470c10,
      emissive: 0x8a1c22,
      emissiveIntensity: 0.35,
      roughness: 0.5,
      metalness: 0.2,
    });

    const ventGlowMat = new THREE.MeshStandardMaterial({
      color: 0x2e4a0e,
      emissive: 0x84cc16,
      emissiveIntensity: 0.85,
      roughness: 0.3,
    });
    this.materials.push(basaltArmorMat, crimsonStriationMat, ventGlowMat);

    // 1. Immense Boulder-Like Torso (3.4m tall, 2.4m wide)
    this.torso = new THREE.Group();
    this.torso.position.y = 1.45;

    const bruteSlices: LoftedSlice[] = [
      { y: -0.6, rx: 0.55, rz: 0.45 },
      { y: 0.0, rx: 0.75, rz: 0.58, bulgeZFront: 0.25 },
      { y: 0.65, rx: 0.95, rz: 0.75, bulgeZFront: 0.35, bulgeXSide: 0.2 }, // Enormous boulder chest
      { y: 1.1, rx: 0.75, rz: 0.62 }, // Hunched hump
    ];
    const bruteGeom = createLoftedBodyGeometry(bruteSlices, 20, true, true);
    const bruteMesh = new THREE.Mesh(bruteGeom, crimsonStriationMat);
    bruteMesh.castShadow = true;
    this.torso.add(bruteMesh);

    // Overlapping bone carapace plates over shoulders & chest
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.45), basaltArmorMat);
    chestPlate.position.set(0, 0.45, 0.55);
    chestPlate.castShadow = true;
    this.torso.add(chestPlate);

    // Two acid exhaust vents on upper back
    for (const side of [-1, 1] as const) {
      const ventGeom = new THREE.CylinderGeometry(0.12, 0.16, 0.45, 8);
      ventGeom.computeVertexNormals();
      const vent = new THREE.Mesh(ventGeom, ventGlowMat);
      vent.position.set(side * 0.45, 0.95, -0.45);
      vent.rotation.x = -Math.PI * 0.25;
      this.torso.add(vent);
      this.bileVents.push(vent);
    }

    // Heavy Battering Ram Skull embedded into shoulder hump
    const skull = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.75, 6), basaltArmorMat);
    skull.position.set(0, 0.85, 0.65);
    skull.rotation.x = Math.PI * 0.45;
    this.torso.add(skull);

    // 2. Colossal Stone Spiked Fists
    this.leftFist = new THREE.Group();
    this.leftFist.position.set(0.95, 0.45, 0);
    this.leftFist.add(new THREE.Mesh(createAnatomicalLimb(0.28, 0.25, 0.22, 0.95), crimsonStriationMat));
    const fistMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), basaltArmorMat);
    fistMeshL.position.y = -1.15;
    this.leftFist.add(fistMeshL);
    this.torso.add(this.leftFist);

    this.rightFist = new THREE.Group();
    this.rightFist.position.set(-0.95, 0.45, 0);
    this.rightFist.add(new THREE.Mesh(createAnatomicalLimb(0.28, 0.25, 0.22, 0.95), crimsonStriationMat));
    const fistMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), basaltArmorMat);
    fistMeshR.position.y = -1.15;
    this.rightFist.add(fistMeshR);
    this.torso.add(this.rightFist);

    this.group.add(this.torso);

    // 3. Massive Pillar Legs
    for (const side of [-1, 1] as const) {
      const leg = new THREE.Mesh(createAnatomicalLimb(0.28, 0.24, 0.22, 0.95), basaltArmorMat);
      leg.position.set(side * 0.45, 0.95, 0);
      leg.castShadow = true;
      this.group.add(leg);
    }
  }

  public update(delta: number, playerPos: THREE.Vector3, lod: EcosystemLODState) {
    this.animTime += delta;
    if (this.isDead) return;

    // Vent pulsation
    const ventPulse = 0.85 + Math.sin(this.animTime * 6) * 0.35;
    (this.materials[2] as THREE.MeshStandardMaterial).emissiveIntensity = ventPulse;

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (dist <= this.stats.aggroRadius) {
      this.setState('hunting');
    }

    if (this.state === 'hunting') {
      if (dist > 3.2) {
        toPlayer.normalize();
        this.group.position.addScaledVector(toPlayer, this.stats.speed * delta);
        this.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

        // Heavy lumbering stride
        const stride = Math.sin(this.animTime * 4.5);
        this.torso.position.y = 1.45 + Math.abs(stride) * 0.12;
        this.leftFist.rotation.x = stride * 0.4;
        this.rightFist.rotation.x = -stride * 0.4;
      } else {
        // Ground-pounding double-fist earthquake slam
        const slam = Math.sin(this.animTime * 4);
        this.leftFist.rotation.x = slam;
        this.rightFist.rotation.x = slam;
      }
    } else {
      // Idle: heavy heaving breath
      const heaving = Math.sin(this.animTime * 1.5) * 0.06;
      this.torso.scale.set(1 + heaving, 1 + heaving, 1 + heaving);
    }
  }
}

// ============================================================================
// 8. MINI-BOSS: DEVOURING MATRIARCH (Multi-jawed apex broodmother)
// ============================================================================
export class DevouringMatriarch extends BaseAbaddonCreature {
  private broodCallTimer: number = 14.0;
  public pendingBroodSummons: boolean = false;
  private headMaws: THREE.Group[] = [];

  constructor(id: string, pos: THREE.Vector3) {
    super(id, 'Devouring Matriarch', 'miniboss', {
      health: 1250,
      maxHealth: 1250,
      damage: 68,
      speed: 2.6,
      aggroRadius: 24.0,
      feedingRate: 45.0,
      hungerLevel: 100,
      fearLevel: 0,
      emberReward: 850,
    });

    this.group.position.copy(pos);
    this.group.scale.set(2.35, 2.35, 2.35);

    // Materials
    const broodMat = new THREE.MeshStandardMaterial({
      color: 0x450a10,
      emissive: 0x8a1c22,
      emissiveIntensity: 0.4,
      roughness: 0.45,
      metalness: 0.35,
    });

    const hornMat = new THREE.MeshStandardMaterial({ color: 0x42382b, roughness: 0.5 });
    this.materials.push(broodMat, hornMat);

    // Multi-jawed bloated brood body
    const bodyGeom = new THREE.SphereGeometry(1.1, 16, 16);
    bodyGeom.scale(1.2, 1.5, 1.3);
    bodyGeom.computeVertexNormals();
    const body = new THREE.Mesh(bodyGeom, broodMat);
    body.position.y = 1.65;
    body.castShadow = true;
    this.group.add(body);

    // Crown of curved brood horns
    for (let h = 0; h < 6; h++) {
      const ang = (h / 6) * Math.PI * 2;
      const hornGeom = createCurvedHorn(0.14, 1.25, new THREE.Vector3(Math.cos(ang) * 0.5, 0.5, Math.sin(ang) * 0.5), 12, 16);
      const horn = new THREE.Mesh(hornGeom, hornMat);
      horn.position.set(Math.cos(ang) * 0.8, 2.8, Math.sin(ang) * 0.8);
      this.group.add(horn);
    }
  }

  public update(delta: number, playerPos: THREE.Vector3, lod: EcosystemLODState) {
    this.animTime += delta;
    if (this.isDead) return;

    this.broodCallTimer -= delta;
    if (this.broodCallTimer <= 0) {
      this.broodCallTimer = 18.0;
      this.pendingBroodSummons = true;
    }

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (dist <= this.stats.aggroRadius) {
      this.setState('hunting');
      if (dist > 3.8) {
        toPlayer.normalize();
        this.group.position.addScaledVector(toPlayer, this.stats.speed * delta);
        this.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
      }
    }
  }
}
