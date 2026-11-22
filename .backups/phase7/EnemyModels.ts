/**
 * The Seven Hellgates - Demonic Enemy 3D Models & Rigs
 * Unique silhouettes, armor, weapons, and glowing demonic eyes for each class.
 */

import * as THREE from 'three';
import { EnemyType, EnemyStats } from '../types';
import {
  createDemonicBeastTorso,
  createDigitigradeDemonLeg,
  createDemonicSkull,
  createAnatomicalLimb,
  createLoftedBodyGeometry,
} from './CharacterGeometry';

export class EnemyInstance {
  public id: string;
  public type: EnemyType;
  public group: THREE.Group;
  public stats: EnemyStats;
  public currentHealth: number;
  public isDead: boolean = false;
  public isStaggered: boolean = false;
  public staggerTime: number = 0;
  public attackCooldownTimer: number = 0;
  public isAttacking: boolean = false;
  public attackProgress: number = 0;
  public deathProgress: number = 0;

  // Rig components for animation
  private torso: THREE.Group;
  private head: THREE.Group;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private weaponMesh: THREE.Group | null = null;
  private eyeGlows: THREE.Mesh[] = [];

  constructor(type: EnemyType, position: THREE.Vector3, idPrefix: string = 'enemy') {
    this.id = `${idPrefix}_${Math.random().toString(36).substring(2, 7)}`;
    this.type = type;
    this.group = new THREE.Group();
    this.group.position.copy(position);

    // Default stats per archetype
    this.stats = this.getDefaultStats(type);
    this.currentHealth = this.stats.maxHealth;

    // Build unique model
    const rig = this.buildModel(type);
    this.torso = rig.torso;
    this.head = rig.head;
    this.leftArm = rig.leftArm;
    this.rightArm = rig.rightArm;
    this.leftLeg = rig.leftLeg;
    this.rightLeg = rig.rightLeg;
    this.weaponMesh = rig.weapon;
  }

  private getDefaultStats(type: EnemyType): EnemyStats {
    switch (type) {
      case 'hellbrute':
        return {
          name: 'Hellbrute Mauler',
          type,
          maxHealth: 280,
          health: 280,
          damage: 32,
          speed: 3.2,
          attackRange: 2.6,
          attackCooldown: 2.4,
          staggerResistance: 3,
          emberReward: 80,
        };
      case 'shade':
        return {
          name: 'Abyssal Shade',
          type,
          maxHealth: 110,
          health: 110,
          damage: 18,
          speed: 6.2,
          attackRange: 1.8,
          attackCooldown: 1.2,
          staggerResistance: 1,
          emberReward: 45,
        };
      case 'devourer':
        return {
          name: 'Flesh Devourer',
          type,
          maxHealth: 350,
          health: 350,
          damage: 40,
          speed: 3.8,
          attackRange: 3.0,
          attackCooldown: 2.8,
          staggerResistance: 4,
          emberReward: 120,
        };
      case 'heretic':
        return {
          name: 'Ashen Heretic',
          type,
          maxHealth: 130,
          health: 130,
          damage: 26,
          speed: 4.0,
          attackRange: 7.0,
          attackCooldown: 2.2,
          staggerResistance: 1,
          emberReward: 65,
        };
      case 'sovereign_knight':
        return {
          name: 'Sovereign Void Knight',
          type,
          maxHealth: 420,
          health: 420,
          damage: 48,
          speed: 4.8,
          attackRange: 2.8,
          attackCooldown: 1.8,
          staggerResistance: 5,
          emberReward: 200,
        };
      case 'hellspawn':
      default:
        return {
          name: 'Hellspawn Fiend',
          type: 'hellspawn',
          maxHealth: 140,
          health: 140,
          damage: 20,
          speed: 4.4,
          attackRange: 2.0,
          attackCooldown: 1.6,
          staggerResistance: 1,
          emberReward: 35,
        };
    }
  }

  private buildModel(type: EnemyType) {
    const crimsonEyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const violetEyeMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const amberEyeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    const darkBoneMat = new THREE.MeshStandardMaterial({
      color: 0x3a332d,
      roughness: 0.7,
      metalness: 0.2,
    });

    const ironArmorMat = new THREE.MeshStandardMaterial({
      color: 0x1f222e,
      roughness: 0.4,
      metalness: 0.8,
    });

    const bloodFleshMat = new THREE.MeshStandardMaterial({
      color: 0x5a1818,
      roughness: 0.6,
      metalness: 0.1,
    });

    const root = new THREE.Group();
    this.group.add(root);

    const torso = new THREE.Group();
    root.add(torso);

    const head = new THREE.Group();
    torso.add(head);

    const leftArm = new THREE.Group();
    const rightArm = new THREE.Group();
    torso.add(leftArm);
    torso.add(rightArm);

    const leftLeg = new THREE.Group();
    const rightLeg = new THREE.Group();
    root.add(leftLeg);
    root.add(rightLeg);

    let weapon: THREE.Group | null = null;

    if (type === 'hellbrute') {
      // Bulky hulking infernal berserker
      torso.position.y = 1.25;
      const bruteChest = new THREE.Mesh(createDemonicBeastTorso(true), bloodFleshMat);
      bruteChest.castShadow = true;
      torso.add(bruteChest);

      // Heavy Chitinous Iron Carapace & Spiked Mantle
      const carapacePlate = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.7, 5), ironArmorMat);
      carapacePlate.rotation.x = -Math.PI * 0.75;
      carapacePlate.position.set(0, 0.45, 0.08);
      carapacePlate.castShadow = true;
      torso.add(carapacePlate);

      // Spiked shoulder armor
      for (let s = -1; s <= 1; s += 2) {
        const shoulderSpike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 5), darkBoneMat);
        shoulderSpike.position.set(s * 0.65, 0.55, -0.05);
        shoulderSpike.rotation.z = -s * 0.55;
        shoulderSpike.castShadow = true;
        torso.add(shoulderSpike);
      }

      // Demonic Horned Skull with Underbite Tusks
      head.position.set(0, 0.72, 0.28);
      const skull = createDemonicSkull({ bone: darkBoneMat, eye: amberEyeMat });
      skull.scale.set(1.4, 1.3, 1.4);
      head.add(skull);

      // Massive Muscular Arms & Iron Bracers
      leftArm.position.set(0.68, 0.45, 0);
      const bicepL = new THREE.Mesh(createAnatomicalLimb(0.22, 0.20, 0.16, 0.45, 0.04), bloodFleshMat);
      bicepL.castShadow = true;
      leftArm.add(bicepL);

      const forearmL = new THREE.Mesh(createAnatomicalLimb(0.18, 0.16, 0.14, 0.45, 0.03), ironArmorMat);
      forearmL.position.y = -0.45;
      forearmL.castShadow = true;
      leftArm.add(forearmL);

      rightArm.position.set(-0.68, 0.45, 0);
      const bicepR = new THREE.Mesh(createAnatomicalLimb(0.22, 0.20, 0.16, 0.45, 0.04), bloodFleshMat);
      bicepR.castShadow = true;
      rightArm.add(bicepR);

      const forearmR = new THREE.Mesh(createAnatomicalLimb(0.18, 0.16, 0.14, 0.45, 0.03), ironArmorMat);
      forearmR.position.y = -0.45;
      forearmR.castShadow = true;
      rightArm.add(forearmR);

      // Heavy Spiked Basalt War Club
      weapon = new THREE.Group();
      const clubShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 1.8), darkBoneMat);
      weapon.add(clubShaft);

      const clubHead = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.85, 6), ironArmorMat);
      clubHead.position.y = 0.55;
      clubHead.castShadow = true;
      weapon.add(clubHead);

      // Basalt spikes
      for (let i = 0; i < 6; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 4), darkBoneMat);
        spike.rotation.z = Math.PI / 2;
        spike.rotation.y = (i / 6) * Math.PI * 2;
        spike.position.set(Math.cos((i / 6) * Math.PI * 2) * 0.24, 0.55, Math.sin((i / 6) * Math.PI * 2) * 0.24);
        weapon.add(spike);
      }
      weapon.position.set(0, -0.65, 0.35);
      weapon.rotation.x = Math.PI / 2;
      rightArm.add(weapon);

      // Heavy Muscular Legs with Iron Plates
      leftLeg.position.set(0.35, 0.65, 0);
      const legL = new THREE.Mesh(createAnatomicalLimb(0.24, 0.20, 0.16, 0.75, 0.04), bloodFleshMat);
      legL.castShadow = true;
      leftLeg.add(legL);

      const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.35), ironArmorMat);
      bootL.position.set(0, -0.75, 0.06);
      bootL.castShadow = true;
      leftLeg.add(bootL);

      rightLeg.position.set(-0.35, 0.65, 0);
      const legR = new THREE.Mesh(createAnatomicalLimb(0.24, 0.20, 0.16, 0.75, 0.04), bloodFleshMat);
      legR.castShadow = true;
      rightLeg.add(legR);

      const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.35), ironArmorMat);
      bootR.position.set(0, -0.75, 0.06);
      bootR.castShadow = true;
      rightLeg.add(bootR);

    } else if (type === 'shade') {
      // Floating agile shadow wraith with ethereal spectral core & scythe
      torso.position.y = 1.3;

      // Ethereal glowing soul core inside chest
      const soulCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.85 })
      );
      torso.add(soulCore);

      // Skeletal spectral ribcage
      for (let r = 0; r < 4; r++) {
        const rib = new THREE.Mesh(
          new THREE.TorusGeometry(0.22 - r * 0.02, 0.02, 6, 12, Math.PI * 1.3),
          darkBoneMat
        );
        rib.rotation.x = Math.PI / 2;
        rib.position.y = 0.15 - r * 0.09;
        torso.add(rib);
      }

      // Billowing spectral shroud that fades into mist
      const shroudSlices = [
        { y: 0.35, rx: 0.24, rz: 0.18 },
        { y: 0.0, rx: 0.30, rz: 0.22 },
        { y: -0.4, rx: 0.38, rz: 0.28 },
        { y: -0.9, rx: 0.48, rz: 0.36 },
      ];
      const shroudGeom = createLoftedBodyGeometry(shroudSlices, 16, true, false);
      const shroud = new THREE.Mesh(
        shroudGeom,
        new THREE.MeshStandardMaterial({
          color: 0x090a10,
          roughness: 0.9,
          transparent: true,
          opacity: 0.88,
        })
      );
      shroud.castShadow = true;
      torso.add(shroud);

      // Horned Void Cowl
      head.position.set(0, 0.5, 0.05);
      const cowlMesh = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 6), darkBoneMat);
      cowlMesh.rotation.x = -0.25;
      cowlMesh.castShadow = true;
      head.add(cowlMesh);

      // Spectral eyes
      for (let s = -1; s <= 1; s += 2) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), violetEyeMat);
        eye.position.set(s * 0.075, -0.05, 0.16);
        head.add(eye);
      }

      // Skeletal clawed arms
      leftArm.position.set(0.38, 0.15, 0);
      const armL = new THREE.Mesh(createAnatomicalLimb(0.06, 0.05, 0.035, 0.65), darkBoneMat);
      armL.castShadow = true;
      leftArm.add(armL);

      rightArm.position.set(-0.38, 0.15, 0);
      const armR = new THREE.Mesh(createAnatomicalLimb(0.06, 0.05, 0.035, 0.65), darkBoneMat);
      armR.castShadow = true;
      rightArm.add(armR);

      // Large Curved Soul-Reaper Scythe
      weapon = new THREE.Group();
      const scythePole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 2.1), darkBoneMat);
      weapon.add(scythePole);

      const scytheBlade = new THREE.Mesh(
        new THREE.RingGeometry(0.65, 0.85, 16, 1, 0, Math.PI * 0.6),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.9 })
      );
      scytheBlade.position.set(0.4, 0.95, 0);
      scytheBlade.rotation.z = Math.PI * 0.25;
      weapon.add(scytheBlade);

      weapon.position.set(0, -0.4, 0.25);
      weapon.rotation.x = Math.PI / 2.2;
      rightArm.add(weapon);

    } else {
      // Default: Hellspawn Feral Predatory Demon (Digitigrade anatomy + fanged skull)
      torso.position.y = 1.05;

      // Sinewy hunched demonic torso
      const demonTorso = new THREE.Mesh(createDemonicBeastTorso(false), bloodFleshMat);
      demonTorso.castShadow = true;
      torso.add(demonTorso);

      // Exposed spinal thorns
      for (let sp = 0; sp < 5; sp++) {
        const spineThorn = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 4), darkBoneMat);
        spineThorn.rotation.x = -Math.PI / 2.5;
        spineThorn.position.set(0, 0.25 - sp * 0.09, -0.14);
        torso.add(spineThorn);
      }

      // Demonic Skull with fanged jaw & sweeping horns
      head.position.set(0, 0.45, 0.15);
      const skull = createDemonicSkull({ bone: darkBoneMat, eye: crimsonEyeMat });
      skull.scale.set(1.0, 1.0, 1.0);
      head.add(skull);

      // Muscular Arms with Forearm Bone Scythe Blades
      leftArm.position.set(0.35, 0.22, 0);
      const armL = new THREE.Mesh(createAnatomicalLimb(0.09, 0.08, 0.065, 0.58), bloodFleshMat);
      armL.castShadow = true;
      leftArm.add(armL);

      const scytheL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.42, 4), darkBoneMat);
      scytheL.rotation.x = Math.PI * 0.8;
      scytheL.position.set(0.06, -0.32, -0.08);
      scytheL.castShadow = true;
      leftArm.add(scytheL);

      rightArm.position.set(-0.35, 0.22, 0);
      const armR = new THREE.Mesh(createAnatomicalLimb(0.09, 0.08, 0.065, 0.58), bloodFleshMat);
      armR.castShadow = true;
      rightArm.add(armR);

      const scytheR = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.42, 4), darkBoneMat);
      scytheR.rotation.x = Math.PI * 0.8;
      scytheR.position.set(-0.06, -0.32, -0.08);
      scytheR.castShadow = true;
      rightArm.add(scytheR);

      // Serrated Jagged Cleaver in right hand
      weapon = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.05, 0.035), ironArmorMat);
      blade.position.y = 0.52;
      blade.castShadow = true;
      weapon.add(blade);
      weapon.position.set(0, -0.45, 0.15);
      weapon.rotation.x = Math.PI / 2;
      rightArm.add(weapon);

      // Digitigrade Demon Legs with backwards hocks & talons
      leftLeg.position.set(0.18, 0.55, 0);
      const dLegL = createDigitigradeDemonLeg({ flesh: bloodFleshMat, bone: darkBoneMat, claw: ironArmorMat });
      leftLeg.add(dLegL);

      rightLeg.position.set(-0.18, 0.55, 0);
      const dLegR = createDigitigradeDemonLeg({ flesh: bloodFleshMat, bone: darkBoneMat, claw: ironArmorMat });
      rightLeg.add(dLegR);
    }

    return { torso, head, leftArm, rightArm, leftLeg, rightLeg, weapon };
  }

  public takeDamage(amount: number) {
    if (this.isDead) return;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.isStaggered = true;
    this.staggerTime = 0.28; // Stagger freeze

    if (this.currentHealth <= 0) {
      this.isDead = true;
      this.isAttacking = false;
    }
  }

  public update(delta: number, playerPos: THREE.Vector3): { wantsToAttack: boolean; damageDealt: number } {
    if (this.isDead) {
      this.deathProgress += delta * 1.6;
      this.group.position.y = Math.max(-1.5, this.group.position.y - delta * 0.8);
      this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, -Math.PI / 2, delta * 5);
      this.torso.rotation.z = Math.sin(this.deathProgress * 4) * 0.2;
      return { wantsToAttack: false, damageDealt: 0 };
    }

    // Stagger reaction
    if (this.isStaggered) {
      this.staggerTime -= delta;
      this.torso.rotation.x = -0.35;
      this.torso.position.z = -0.15;
      if (this.staggerTime <= 0) {
        this.isStaggered = false;
        this.torso.rotation.x = 0;
        this.torso.position.z = 0;
      }
      return { wantsToAttack: false, damageDealt: 0 };
    }

    // Cooldown management
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= delta;
    }

    // Face player
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    if (distance > 0.001) {
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      this.group.rotation.y = THREE.MathUtils.damp(this.group.rotation.y, targetAngle, 8, delta);
    }

    // Attack sequence
    if (this.isAttacking) {
      this.attackProgress += delta * 2.5;
      const p = this.attackProgress;
      let damage = 0;

      if (p < 0.4) {
        // Windup
        this.rightArm.rotation.x = -Math.PI * 0.8 * (p / 0.4);
      } else if (p < 0.7) {
        // Strike active window
        const t = (p - 0.4) / 0.3;
        this.rightArm.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.8, 0.7, t);
        if (p >= 0.5 && p - delta * 2.5 < 0.5 && distance <= this.stats.attackRange * 1.25) {
          damage = this.stats.damage;
        }
      } else {
        // Recovery
        this.rightArm.rotation.x = THREE.MathUtils.lerp(0.7, 0, (p - 0.7) / 0.3);
      }

      if (p >= 1) {
        this.isAttacking = false;
        this.attackProgress = 0;
        this.attackCooldownTimer = this.stats.attackCooldown;
      }

      return { wantsToAttack: true, damageDealt: damage };
    }

    // AI movement & engagement
    if (distance > this.stats.attackRange) {
      // Chase player
      toPlayer.normalize();
      this.group.position.addScaledVector(toPlayer, this.stats.speed * delta);

      // Walk cycle
      const walkFreq = Date.now() * 0.008;
      this.leftLeg.rotation.x = Math.sin(walkFreq) * 0.4;
      this.rightLeg.rotation.x = -Math.sin(walkFreq) * 0.4;
      this.torso.position.y = (this.type === 'hellbrute' ? 1.3 : 1.0) + Math.abs(Math.sin(walkFreq * 2)) * 0.05;
    } else {
      // In range: initiate attack if off cooldown
      if (this.attackCooldownTimer <= 0) {
        this.isAttacking = true;
        this.attackProgress = 0;
      }
    }

    return { wantsToAttack: false, damageDealt: 0 };
  }
}
