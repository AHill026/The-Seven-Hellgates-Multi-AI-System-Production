/**
 * The Seven Hellgates - Greed: The Pit of Destruction
 * The Forgotten Souls — GildedWardenController
 *
 * Enormous imperial executioner brute encased in ornate blackened bronze & tarnished gold armor:
 * - 3D visual model strictly faithful to official character reference image
 * - Spiked golden halo behind helmet with 10 radiating ornate spikes
 * - Swirling chest soul vortex with trapped souls
 * - Chains and padlocks wrapped across chest and legs
 * - Left mechanical cannon arm feeding chain to ornate flail sphere
 * - Right heavy clawed gauntlet wreathed in golden flame
 * - Leg-mounted soul lantern cage containing glowing trapped skeleton
 * - Modular Forgotten Souls integration (whispers, soul-locks, spectral VFX, death sequence)
 * - 5 Signature Attacks:
 *   1. Imperial Hammer (Devastating overhead flail slam + golden shockwave)
 *   2. Chain Sweep (Wide 180-degree sweep with hanging chains)
 *   3. Soulflare (Radial golden spectral eruption)
 *   4. Prisoner's Grasp (Chains extend toward player)
 *   5. Treasury's Wrath (Enraged state at low health)
 */

import * as THREE from 'three';
import { EnemyInstance } from '../EnemyModels';
import {
  createAnatomicalLimb,
  createCurvedHorn,
  createLoftedBodyGeometry,
  LoftedSlice,
} from '../CharacterGeometry';
import { ForgottenSoulsManager } from './ForgottenSoulsManager';
import { DEFAULT_WARDEN_CONFIG, GildedWardenConfig } from './ForgottenSoulsConfiguration';
import { voiceManager } from '../../audio/VoiceManager';

export type WardenAttackType =
  | 'idle'
  | 'imperial_hammer'
  | 'chain_sweep'
  | 'soulflare'
  | 'prisoners_grasp';

export class GildedWardenController extends EnemyInstance {
  public soulsManager: ForgottenSoulsManager;
  private wardenConfig: GildedWardenConfig;

  // Visual Rig Elements
  private haloGroup!: THREE.Group;
  private chestVortexMesh!: THREE.Mesh;
  private lanternLight!: THREE.PointLight;
  private lanternSkeleton!: THREE.Mesh;
  private flailGroup!: THREE.Group;
  private flailAuraMesh!: THREE.Mesh;
  private flailLight!: THREE.PointLight;
  private armorCracks: THREE.Mesh[] = [];
  private rightClaw!: THREE.Group;
  private cannonArm!: THREE.Group;
  private hangingChains: THREE.Group[] = [];

  // Combat State
  public currentWardenAttack: WardenAttackType = 'idle';
  private attackStateTimer: number = 0;
  private attackCooldown: number = 2.0;
  private shockwaveDealt: boolean = false;
  private attackCycle: number = 0;

  // Stagger & Poise
  public poise: number = 160;
  public maxPoise: number = 160;

  constructor(
    position: THREE.Vector3,
    config: GildedWardenConfig = DEFAULT_WARDEN_CONFIG,
    idPrefix: string = 'gilded_warden'
  ) {
    // Initialize EnemyInstance with 'hellbrute' base type for compatibility
    super('hellbrute', position, idPrefix);

    this.wardenConfig = config;
    this.stats.name = 'The Gilded Warden';
    this.stats.maxHealth = config.maxHealth;
    this.currentHealth = config.maxHealth;
    this.stats.damage = config.baseDamage;
    this.stats.speed = config.speed;
    this.stats.attackRange = config.attackRange;
    this.stats.emberReward = 450;
    this.poise = config.poise;
    this.maxPoise = config.poise;

    // Scale to enormous executioner brute
    this.group.scale.set(config.scale, config.scale, config.scale);

    // Initialize the Forgotten Souls Manager
    this.soulsManager = new ForgottenSoulsManager(config);

    // Rebuild 3D model according to authoritative reference image
    this.buildAuthoritativeWardenModel();

    // Register rig components with souls manager
    this.soulsManager.spectralEffects.registerRigElements({
      haloGroup: this.haloGroup,
      chestVortex: this.chestVortexMesh,
      lanternLight: this.lanternLight,
      lanternSkeleton: this.lanternSkeleton,
      flailAura: this.flailAuraMesh,
      flailLight: this.flailLight,
      cracks: this.armorCracks,
    });

    // Register soul-lock target meshes
    this.registerLockTargets();

    // Register death sequence
    this.soulsManager.initDeathSequence(this.group, this.flailGroup);

    // Add spectral effects group to warden group
    this.group.add(this.soulsManager.spectralEffects.group);
  }

  /**
   * Builds the complete, ornate 3D character model matching the reference image
   */
  private buildAuthoritativeWardenModel() {
    // Clear the placeholder geometry created by base EnemyInstance constructor
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }

    // PBR Materials matching reference art:
    // Blackened bronze with baroque tarnished gold scrollwork
    const blackenedBronzeMat = new THREE.MeshStandardMaterial({
      color: 0x1f1a16,
      roughness: 0.42,
      metalness: 0.88,
    });

    const tarnishedGoldMat = new THREE.MeshStandardMaterial({
      color: 0xb8860b,
      emissive: 0x785304,
      emissiveIntensity: 0.25,
      roughness: 0.28,
      metalness: 0.94,
    });

    const chainRustMat = new THREE.MeshStandardMaterial({
      color: 0x36302a,
      roughness: 0.55,
      metalness: 0.82,
    });

    const goldenSoulFireMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.95,
    });

    const glowingEyeMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });

    const root = new THREE.Group();
    this.group.add(root);

    // 1. Torso & Ornate Cuirass
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 1.35;
    root.add(torsoGroup);

    const torsoSlices: LoftedSlice[] = [
      { y: -0.65, rx: 0.44, rz: 0.35 }, // Lower belt
      { y: -0.25, rx: 0.46, rz: 0.38, bulgeZFront: 0.08 }, // Abdomen
      { y: 0.25, rx: 0.62, rz: 0.48, bulgeZFront: 0.22, bulgeXSide: 0.1 }, // Broad imperial chest
      { y: 0.65, rx: 0.50, rz: 0.40 }, // Collar / gorget
    ];
    const torsoGeom = createLoftedBodyGeometry(torsoSlices, 20, true, true);
    const torsoMesh = new THREE.Mesh(torsoGeom, blackenedBronzeMat);
    torsoMesh.castShadow = true;
    torsoGroup.add(torsoMesh);

    // Gold filigree breastplate trim
    const trimGeom = new THREE.TorusGeometry(0.55, 0.06, 8, 24);
    trimGeom.computeVertexNormals();
    const trimMesh = new THREE.Mesh(trimGeom, tarnishedGoldMat);
    trimMesh.position.set(0, 0.22, 0.36);
    torsoGroup.add(trimMesh);

    // 2. Central Chest Soul Vortex (Swirling portal of trapped souls)
    const vortexRingGeom = new THREE.TorusGeometry(0.32, 0.05, 8, 20);
    const vortexRing = new THREE.Mesh(vortexRingGeom, tarnishedGoldMat);
    vortexRing.position.set(0, 0.25, 0.42);
    torsoGroup.add(vortexRing);

    const vortexDiscGeom = new THREE.CircleGeometry(0.3, 16);
    this.chestVortexMesh = new THREE.Mesh(vortexDiscGeom, goldenSoulFireMat);
    this.chestVortexMesh.position.set(0, 0.25, 0.43);
    torsoGroup.add(this.chestVortexMesh);

    // Trapped soul faces inside vortex
    for (let f = 0; f < 3; f++) {
      const ang = (f / 3) * Math.PI * 2;
      const faceMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.75 })
      );
      faceMesh.position.set(Math.cos(ang) * 0.16, Math.sin(ang) * 0.16, 0.02);
      this.chestVortexMesh.add(faceMesh);
    }

    // Heavy chains wrapping across chest and padlocks
    const chestChainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.55, 0.45, 0.2),
      new THREE.Vector3(-0.15, 0.22, 0.48),
      new THREE.Vector3(0.15, 0.22, 0.48),
      new THREE.Vector3(0.55, -0.15, 0.25),
    ]);
    const chestChainMesh = new THREE.Mesh(
      new THREE.TubeGeometry(chestChainCurve, 16, 0.035, 6, false),
      chainRustMat
    );
    torsoGroup.add(chestChainMesh);

    // Chest Padlock sealing the vortex
    const chestLockGroup = new THREE.Group();
    chestLockGroup.position.set(0, 0.22, 0.48);
    const padlockBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.06), tarnishedGoldMat);
    chestLockGroup.add(padlockBody);
    const padlockShackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.02, 6, 12, Math.PI),
      chainRustMat
    );
    padlockShackle.position.y = 0.09;
    chestLockGroup.add(padlockShackle);
    torsoGroup.add(chestLockGroup);

    // 3. Spiked Pauldrons with Filigree & Upward Horns
    for (const [side, isRight] of [[1, true], [-1, false]] as const) {
      const pauldron = new THREE.Group();
      pauldron.position.set(side * 0.72, 0.55, 0);

      const domeGeom = new THREE.SphereGeometry(0.38, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6);
      domeGeom.computeVertexNormals();
      const dome = new THREE.Mesh(domeGeom, blackenedBronzeMat);
      dome.castShadow = true;
      pauldron.add(dome);

      // Gold baroque rim
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 6, 16), tarnishedGoldMat);
      rim.position.y = -0.12;
      pauldron.add(rim);

      // Pauldron Spikes
      for (let sp = 0; sp < 3; sp++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 5), tarnishedGoldMat);
        spike.position.set((sp - 1) * 0.16, 0.32, 0);
        spike.rotation.z = -side * 0.25 * (sp + 1);
        pauldron.add(spike);
      }
      torsoGroup.add(pauldron);
    }

    // 4. Helmet with Slit Visor & Spiked Golden Halo
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.75, 0.15);

    // Heavy imperial knight executioner helm
    const helmGeom = new THREE.CylinderGeometry(0.24, 0.26, 0.52, 12);
    helmGeom.computeVertexNormals();
    const helmMesh = new THREE.Mesh(helmGeom, blackenedBronzeMat);
    helmMesh.castShadow = true;
    headGroup.add(helmMesh);

    // Gold brow crown band
    const browBand = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.27, 0.12, 12), tarnishedGoldMat);
    browBand.position.y = 0.12;
    headGroup.add(browBand);

    // Fiery eye visor slit
    const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.08), glowingEyeMat);
    eyeSlit.position.set(0, 0.04, 0.24);
    headGroup.add(eyeSlit);

    // Spiked Golden Halo (10 radiant ornate spikes mounted grandly behind helm)
    this.haloGroup = new THREE.Group();
    this.haloGroup.position.set(0, 0.25, -0.22);

    const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.05, 8, 32), tarnishedGoldMat);
    this.haloGroup.add(haloRing);

    for (let s = 0; s < 10; s++) {
      const ang = (s / 10) * Math.PI * 2;
      const spikeLen = s % 2 === 0 ? 0.45 : 0.32;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, spikeLen, 6), tarnishedGoldMat);
      spike.position.set(Math.cos(ang) * 0.75, Math.sin(ang) * 0.75, 0);
      spike.rotation.z = ang - Math.PI / 2;
      this.haloGroup.add(spike);
    }
    headGroup.add(this.haloGroup);
    torsoGroup.add(headGroup);

    // 5. Right Arm: Hypertrophied Gauntlet & Heavy Claw Talons
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.75, 0.45, 0);
    const armBicepR = new THREE.Mesh(createAnatomicalLimb(0.2, 0.18, 0.15, 0.65), blackenedBronzeMat);
    rightArmGroup.add(armBicepR);

    this.rightClaw = new THREE.Group();
    this.rightClaw.position.set(0, -0.65, 0);
    const forearmR = new THREE.Mesh(createAnatomicalLimb(0.18, 0.16, 0.14, 0.55), blackenedBronzeMat);
    this.rightClaw.add(forearmR);

    // Gold claw gauntlet plates & curved talons
    for (let c = 0; c < 4; c++) {
      const talon = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.45, 5), tarnishedGoldMat);
      talon.position.set((c - 1.5) * 0.08, -0.65, 0.12);
      talon.rotation.x = Math.PI * 0.35;
      this.rightClaw.add(talon);
    }

    // Right arm shackle lock
    const rightLockGroup = new THREE.Group();
    rightLockGroup.position.set(0.18, -0.3, 0);
    const rLockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.08), tarnishedGoldMat);
    rightLockGroup.add(rLockMesh);
    this.rightClaw.add(rightLockGroup);

    rightArmGroup.add(this.rightClaw);
    torsoGroup.add(rightArmGroup);

    // 6. Left Arm: Mechanical Cannon Forearm & Ornate Chain Flail
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.75, 0.45, 0);
    const armBicepL = new THREE.Mesh(createAnatomicalLimb(0.2, 0.18, 0.15, 0.65), blackenedBronzeMat);
    leftArmGroup.add(armBicepL);

    this.cannonArm = new THREE.Group();
    this.cannonArm.position.set(0, -0.65, 0);

    // Cannon Barrel Cylinder
    const cannonGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.85, 12);
    cannonGeom.computeVertexNormals();
    const cannon = new THREE.Mesh(cannonGeom, blackenedBronzeMat);
    this.cannonArm.add(cannon);

    const cannonMuzzle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 16), tarnishedGoldMat);
    cannonMuzzle.position.y = -0.42;
    cannonMuzzle.rotation.x = Math.PI / 2;
    this.cannonArm.add(cannonMuzzle);

    // Wrist chain lock
    const wristLockGroup = new THREE.Group();
    wristLockGroup.position.set(-0.16, -0.15, 0);
    const wLockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.08), tarnishedGoldMat);
    wristLockGroup.add(wLockMesh);
    this.cannonArm.add(wristLockGroup);

    // Heavy Chain flowing from muzzle
    const flailChainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.42, 0),
      new THREE.Vector3(0, -1.0, 0.2),
      new THREE.Vector3(0.2, -1.5, 0.4),
      new THREE.Vector3(0.1, -1.8, 0.6),
    ]);
    const flailChain = new THREE.Mesh(
      new THREE.TubeGeometry(flailChainCurve, 12, 0.04, 6, false),
      chainRustMat
    );
    this.cannonArm.add(flailChain);

    // Ornate Flail Sphere (Heavy spiked mace head surrounded by golden spectral fire)
    this.flailGroup = new THREE.Group();
    this.flailGroup.position.set(0.1, -1.85, 0.6);

    const flailSphereGeom = new THREE.DodecahedronGeometry(0.35, 1);
    flailSphereGeom.computeVertexNormals();
    const flailSphere = new THREE.Mesh(flailSphereGeom, blackenedBronzeMat);
    flailSphere.castShadow = true;
    this.flailGroup.add(flailSphere);

    // Golden filigree ribbing on flail
    for (let r = 0; r < 3; r++) {
      const flailRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 6, 16), tarnishedGoldMat);
      flailRing.rotation.y = (r / 3) * Math.PI;
      this.flailGroup.add(flailRing);
    }

    // Flail spikes
    for (let sp = 0; sp < 8; sp++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.25, 4), tarnishedGoldMat);
      const ang = (sp / 8) * Math.PI * 2;
      spike.position.set(Math.cos(ang) * 0.35, Math.sin(ang) * 0.35, 0);
      spike.rotation.z = ang - Math.PI / 2;
      this.flailGroup.add(spike);
    }

    // Glowing Spectral Aura around Flail
    const auraGeom = new THREE.SphereGeometry(0.48, 12, 10);
    this.flailAuraMesh = new THREE.Mesh(auraGeom, goldenSoulFireMat);
    this.flailGroup.add(this.flailAuraMesh);

    this.flailLight = new THREE.PointLight(0xf59e0b, 1.8, 4.5);
    this.flailGroup.add(this.flailLight);

    this.cannonArm.add(this.flailGroup);
    leftArmGroup.add(this.cannonArm);
    torsoGroup.add(leftArmGroup);

    // 7. Legs & Leg-Mounted Soul Lantern Cage
    for (const [side, isLeft] of [[1, true], [-1, false]] as const) {
      const legGroup = new THREE.Group();
      legGroup.position.set(side * 0.32, 0.75, 0);

      const legLimb = new THREE.Mesh(createAnatomicalLimb(0.24, 0.2, 0.17, 0.95), blackenedBronzeMat);
      legGroup.add(legLimb);

      const greaveTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.45, 10), tarnishedGoldMat);
      greaveTrim.position.y = -0.45;
      legGroup.add(greaveTrim);

      // Barred Soul Lantern Cage on left leg
      if (isLeft) {
        const lanternGroup = new THREE.Group();
        lanternGroup.position.set(0.28, -0.35, 0.15);

        // Cage bars
        const cageGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.45, 8, 1, true);
        cageGeom.computeVertexNormals();
        const cage = new THREE.Mesh(cageGeom, chainRustMat);
        lanternGroup.add(cage);

        const capTop = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.12, 8), tarnishedGoldMat);
        capTop.position.y = 0.25;
        lanternGroup.add(capTop);

        // Imprisoned trapped glowing skeleton
        const skelGeom = new THREE.BoxGeometry(0.12, 0.28, 0.08);
        this.lanternSkeleton = new THREE.Mesh(
          skelGeom,
          new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.85 })
        );
        lanternGroup.add(this.lanternSkeleton);

        // Internal lantern light
        this.lanternLight = new THREE.PointLight(0xf59e0b, 2.5, 3.5);
        lanternGroup.add(this.lanternLight);

        legGroup.add(lanternGroup);
      }

      root.add(legGroup);
    }
  }

  private registerLockTargets() {
    this.soulsManager.lockSystem.registerLockMeshes('chest_lock', this.group, this.chestVortexMesh);
    this.soulsManager.lockSystem.registerLockMeshes('wrist_chain', this.cannonArm, null);
    this.soulsManager.lockSystem.registerLockMeshes('right_arm_lock', this.rightClaw, null);
    this.soulsManager.lockSystem.registerLockMeshes('leg_lantern', this.group, this.lanternSkeleton);
  }

  /**
   * Override takeDamage to integrate soul-locks, threshold crossing, and audio whispers
   */
  public override takeDamage(amount: number) {
    if (this.isDead) return;

    // Apply soul-lock damage resistance modifier
    const effectiveDamage = Math.round(amount * (1.0 / this.soulsManager.lockSystem.damageResistanceModifier));
    this.currentHealth = Math.max(0, this.currentHealth - effectiveDamage);

    // Poise damage & stagger
    this.poise = Math.max(0, this.poise - (effectiveDamage > 40 ? 40 : 15));
    if (this.poise <= 0) {
      this.isStaggered = true;
      this.staggerTime = 1.6;
      this.poise = this.maxPoise;
      this.soulsManager.audioCtrl.playRandomWhisper('distressed', this.group.position, this.group.position);
    }

    // Notify Forgotten Souls Manager of health change
    const wasEnraged = this.soulsManager.isEnraged;
    this.soulsManager.onHealthChanged(
      this.currentHealth,
      this.stats.maxHealth,
      this.group.position,
      this.group.position
    );
    if (!wasEnraged && this.soulsManager.isEnraged && !this.hasSpokenEnraged) {
      this.hasSpokenEnraged = true;
      voiceManager.playMiniBossBark('gilded_warden', 'enraged', this.group.position, this.group.position);
    }

    // On defeat: initiate cinematic death sequence
    if (this.currentHealth <= 0 && !this.isDead) {
      this.isDead = true;
      this.isAttacking = false;
      this.soulsManager.triggerDeathSequence();
    }
  }

  /**
   * Main per-frame update loop
   */
  public override update(delta: number, playerPos: THREE.Vector3): { wantsToAttack: boolean; damageDealt: number } {
    // 1. If in Death Sequence, delegate entirely to cinematic sequence
    if (this.isDead) {
      this.soulsManager.update(delta, 0, this.stats.maxHealth, this.group.position, playerPos);
      return { wantsToAttack: false, damageDealt: 0 };
    }

    // 2. Stagger state
    if (this.isStaggered) {
      this.staggerTime -= delta;
      this.group.rotation.x = 0.25;
      if (this.staggerTime <= 0) {
        this.isStaggered = false;
        this.group.rotation.x = 0;
      }
      this.soulsManager.update(delta, this.currentHealth, this.stats.maxHealth, this.group.position, playerPos);
      return { wantsToAttack: false, damageDealt: 0 };
    }

    // 3. Update Forgotten Souls Manager
    this.soulsManager.update(delta, this.currentHealth, this.stats.maxHealth, this.group.position, playerPos);

    // 4. Attack cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // Vector to player
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    if (distance < 13.0 && !this.hasSpokenAggro) {
      this.hasSpokenAggro = true;
      voiceManager.playMiniBossBark('gilded_warden', 'aggro', this.group.position, playerPos);
    }

    // Turn toward player
    if (distance > 0.001 && this.currentWardenAttack === 'idle') {
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, targetAngle, 4.5, delta);
    }

    // 5. Active Attack Execution
    if (this.currentWardenAttack !== 'idle') {
      this.attackStateTimer += delta * (this.soulsManager.isEnraged ? 2.4 : 1.8);
      const p = this.attackStateTimer;
      let damage = 0;

      switch (this.currentWardenAttack) {
        // --- ATTACK 1: IMPERIAL HAMMER (Devastating overhead flail slam) ---
        case 'imperial_hammer': {
          if (p < 0.45) {
            // Windup: raises flail high overhead
            this.cannonArm.rotation.x = -Math.PI * 0.8 * (p / 0.45);
            this.flailGroup.position.y = THREE.MathUtils.lerp(-1.85, 0.5, p / 0.45);
          } else if (p < 0.75) {
            // Slam down into earth
            const t = (p - 0.45) / 0.3;
            this.cannonArm.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.8, 0.85, t);
            this.flailGroup.position.y = THREE.MathUtils.lerp(0.5, -2.1, t);

            if (p >= 0.55 && !this.shockwaveDealt) {
              this.shockwaveDealt = true;
              if (distance <= this.stats.attackRange * 1.35) {
                damage = Math.round(this.stats.damage * (this.soulsManager.isEnraged ? 1.35 : 1.0));
              }
              // Spawn ground soul burst
              this.soulsManager.spectralEffects.spawnLockBreakBurst(
                this.group.position.clone().add(new THREE.Vector3(0, 0, 2.2))
              );
            }
          } else {
            // Recovery
            const t = (p - 0.75) / 0.25;
            this.cannonArm.rotation.x = THREE.MathUtils.lerp(0.85, 0, t);
            this.flailGroup.position.y = THREE.MathUtils.lerp(-2.1, -1.85, t);
          }

          if (p >= 1.0) {
            this.currentWardenAttack = 'idle';
            this.attackStateTimer = 0;
            this.attackCooldown = 2.4;
          }
          break;
        }

        // --- ATTACK 2: CHAIN SWEEP (Wide 180-degree sweep) ---
        case 'chain_sweep': {
          this.group.rotation.y += delta * 6.5;
          this.cannonArm.rotation.z = Math.sin(p * Math.PI) * 0.7;

          if (p >= 0.45 && !this.shockwaveDealt) {
            this.shockwaveDealt = true;
            if (distance <= this.stats.attackRange * 1.5) {
              damage = Math.round(this.stats.damage * 0.75);
            }
          }

          if (p >= 1.0) {
            this.currentWardenAttack = 'idle';
            this.attackStateTimer = 0;
            this.attackCooldown = 2.8 * this.soulsManager.lockSystem.chainSweepCooldownModifier;
          }
          break;
        }

        // --- ATTACK 3: SOULFLARE (Golden spectral eruption) ---
        case 'soulflare': {
          if (p < 0.5) {
            // Charge: halo blazes, chest vortex expands
            this.chestVortexMesh.scale.multiplyScalar(1.02);
          } else if (!this.shockwaveDealt) {
            this.shockwaveDealt = true;
            this.soulsManager.spectralEffects.spawnLockBreakBurst(this.group.position.clone().add(new THREE.Vector3(0, 1.4, 0)));
            if (distance <= 6.5) {
              damage = Math.round(this.stats.damage * 0.9);
            }
          }

          if (p >= 1.0) {
            this.currentWardenAttack = 'idle';
            this.attackStateTimer = 0;
            this.attackCooldown = 4.2;
          }
          break;
        }

        // --- ATTACK 4: PRISONER'S GRASP (Chains reach forward) ---
        case 'prisoners_grasp': {
          this.rightClaw.rotation.x = -Math.PI * 0.6;
          if (p >= 0.5 && !this.shockwaveDealt) {
            this.shockwaveDealt = true;
            if (distance <= 5.5) {
              damage = Math.round(this.stats.damage * 0.6);
            }
          }
          if (p >= 1.0) {
            this.rightClaw.rotation.x = 0;
            this.currentWardenAttack = 'idle';
            this.attackStateTimer = 0;
            this.attackCooldown = 3.5;
          }
          break;
        }
      }

      return { wantsToAttack: true, damageDealt: damage };
    }

    // 6. AI Movement & Attack Trigger
    const effectiveSpeed = this.stats.speed * this.soulsManager.lockSystem.speedModifier * (this.soulsManager.isEnraged ? 1.3 : 1.0);

    if (distance > this.stats.attackRange) {
      // Advance toward player
      toPlayer.normalize();
      this.group.position.addScaledVector(toPlayer, effectiveSpeed * delta);

      // Heavy lumbering walk cycle
      const walk = Math.sin(Date.now() * 0.005);
      this.group.position.y = Math.abs(walk) * 0.08;
      this.cannonArm.rotation.x = walk * 0.25;
      this.rightClaw.rotation.x = -walk * 0.25;
    } else if (this.attackCooldown <= 0) {
      // Pick attack
      this.attackCycle++;
      this.shockwaveDealt = false;
      this.attackStateTimer = 0;

      if (this.soulsManager.isEnraged && Math.random() < 0.4) {
        this.currentWardenAttack = 'soulflare';
      } else if (this.attackCycle % 3 === 0) {
        this.currentWardenAttack = 'chain_sweep';
      } else if (this.attackCycle % 3 === 1) {
        this.currentWardenAttack = 'imperial_hammer';
      } else {
        this.currentWardenAttack = 'prisoners_grasp';
      }
    }

    return { wantsToAttack: false, damageDealt: 0 };
  }

  public dispose() {
    this.soulsManager.dispose();
  }
}
