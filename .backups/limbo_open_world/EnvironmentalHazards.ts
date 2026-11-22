/**
 * The Seven Hellgates - Realm Environmental Hazards
 * Interactive floor spike traps and burning braziers that deal damage to both Azrael and demonic foes.
 * Players can kite enemies into traps to dispatch them tactically.
 */

import * as THREE from 'three';
import { soundEngine } from '../audio/SoundEngine';
import { ParticleSystem } from '../vfx/ParticleSystem';
import { AzraelModel } from './AzraelModel';
import { EnemyInstance } from './EnemyModels';
import { BossInstance } from './BossModels';
import { CombatSystem } from '../combat/CombatSystem';

export class FloorSpikeTrap {
  public group: THREE.Group;
  private spikesGroup: THREE.Group;
  private state: 'retracted' | 'arming' | 'extended' = 'retracted';
  private timer: number = 0;
  private damageCooldown: number = 0;
  private readonly cycleRetracted: number = 2.6;
  private readonly cycleArming: number = 0.5;
  private readonly cycleExtended: number = 1.3;
  private readonly trapRadius: number = 1.45;
  private readonly damageAmount: number = 28;

  constructor(position: THREE.Vector3) {
    this.group = new THREE.Group();
    this.group.position.copy(position);
    this.group.position.y = 0.05; // Ground level

    // Iron floor grate plate
    const plateGeom = new THREE.BoxGeometry(2.6, 0.1, 2.6);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.7,
      metalness: 0.6,
    });
    const plate = new THREE.Mesh(plateGeom, plateMat);
    plate.receiveShadow = true;
    this.group.add(plate);

    // Grid holes
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const rim = new THREE.Mesh(
          new THREE.RingGeometry(0.1, 0.16, 8),
          new THREE.MeshStandardMaterial({ color: 0x0f1217, roughness: 0.9 })
        );
        rim.rotation.x = -Math.PI / 2;
        rim.position.set(x * 0.75, 0.055, z * 0.75);
        this.group.add(rim);
      }
    }

    // Retractable Spikes Group
    this.spikesGroup = new THREE.Group();
    this.spikesGroup.position.y = -0.45; // Start retracted
    this.group.add(this.spikesGroup);

    const spikeGeom = new THREE.ConeGeometry(0.09, 0.9, 5);
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.85,
    });

    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const spike = new THREE.Mesh(spikeGeom, spikeMat);
        spike.position.set(x * 0.75, 0.45, z * 0.75);
        spike.castShadow = true;
        this.spikesGroup.add(spike);
      }
    }

    // Stagger starting timer randomly so all traps don't trigger in unison
    this.timer = Math.random() * this.cycleRetracted;
  }

  public update(
    delta: number,
    azrael: AzraelModel,
    combat: CombatSystem,
    enemies: EnemyInstance[],
    boss: BossInstance | null,
    particles: ParticleSystem
  ) {
    this.timer += delta;
    if (this.damageCooldown > 0) this.damageCooldown -= delta;

    if (this.state === 'retracted') {
      if (this.timer >= this.cycleRetracted) {
        this.state = 'arming';
        this.timer = 0;
        soundEngine.playTrapWarning();
      }
    } else if (this.state === 'arming') {
      // Subtle metallic vibration / arming cue
      this.spikesGroup.position.y = -0.45 + Math.sin(this.timer * 30) * 0.04;
      if (this.timer >= this.cycleArming) {
        this.state = 'extended';
        this.timer = 0;
        this.spikesGroup.position.y = 0.45;
        soundEngine.playTrapSnap();
        particles.spawnSparks(this.group.position.clone().add(new THREE.Vector3(0, 0.3, 0)), 18, 0x94a3b8);
      }
    } else if (this.state === 'extended') {
      this.spikesGroup.position.y = 0.45;

      // Deal damage to anyone standing on the trap
      if (this.damageCooldown <= 0) {
        this.damageCooldown = 0.5; // Tick every 0.5s while extended

        // 1. Check Azrael
        const azraelDist = new THREE.Vector2(
          azrael.group.position.x - this.group.position.x,
          azrael.group.position.z - this.group.position.z
        ).length();

        if (azraelDist <= this.trapRadius && !azrael.isDead && !combat.iFramesActive) {
          combat.takePlayerDamage(this.damageAmount, particles, azrael.group.position);
          particles.spawnBlood(azrael.group.position, 15);
        }

        // 2. Check Enemies (Kiting reward!)
        for (const enemy of enemies) {
          if (enemy.isDead) continue;
          const eDist = new THREE.Vector2(
            enemy.group.position.x - this.group.position.x,
            enemy.group.position.z - this.group.position.z
          ).length();

          if (eDist <= this.trapRadius) {
            enemy.takeDamage(this.damageAmount * 1.5); // 1.5x trap damage to demons
            particles.spawnBlood(enemy.group.position, 16);
            particles.spawnSparks(enemy.group.position, 12, 0xef4444);
            soundEngine.playHitImpact(false);
          }
        }

        // 3. Check Boss
        if (boss && !boss.isDead) {
          const bDist = new THREE.Vector2(
            boss.group.position.x - this.group.position.x,
            boss.group.position.z - this.group.position.z
          ).length();
          if (bDist <= this.trapRadius + 1.0) {
            boss.takeDamage(this.damageAmount);
            particles.spawnSparks(boss.group.position, 16, 0xef4444);
          }
        }
      }

      if (this.timer >= this.cycleExtended) {
        this.state = 'retracted';
        this.timer = 0;
        this.spikesGroup.position.y = -0.45;
      }
    }
  }

  public dispose() {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
  }
}

export class BurningBrazierHazard {
  public group: THREE.Group;
  private flameLight: THREE.PointLight;
  private flameMesh: THREE.Mesh;
  private animTime: number = Math.random() * 10;
  private readonly burnRadius: number = 2.1;
  private readonly burnDps: number = 20;

  constructor(position: THREE.Vector3) {
    this.group = new THREE.Group();
    this.group.position.copy(position);

    // Gothic Pedestal
    const baseGeom = new THREE.CylinderGeometry(0.85, 1.05, 1.4, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.75,
      metalness: 0.3,
    });
    const pedestal = new THREE.Mesh(baseGeom, baseMat);
    pedestal.position.y = 0.7;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    this.group.add(pedestal);

    // Basin bowl
    const bowlGeom = new THREE.ConeGeometry(1.15, 0.6, 8);
    bowlGeom.rotateX(Math.PI);
    const bowlMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.6,
      metalness: 0.7,
    });
    const bowl = new THREE.Mesh(bowlGeom, bowlMat);
    bowl.position.y = 1.4;
    bowl.castShadow = true;
    this.group.add(bowl);

    // Roaring Hellfire Mesh
    const flameGeom = new THREE.ConeGeometry(0.8, 1.6, 7);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });
    this.flameMesh = new THREE.Mesh(flameGeom, flameMat);
    this.flameMesh.position.y = 2.2;
    this.group.add(this.flameMesh);

    // Flame Point Light
    this.flameLight = new THREE.PointLight(0xf97316, 2.6, 9.0);
    this.flameLight.position.set(0, 2.4, 0);
    this.group.add(this.flameLight);

    // Ground scorched ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 2.2, 16),
      new THREE.MeshBasicMaterial({
        color: 0x451a03,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.group.add(ring);
  }

  public update(
    delta: number,
    azrael: AzraelModel,
    combat: CombatSystem,
    enemies: EnemyInstance[],
    boss: BossInstance | null,
    particles: ParticleSystem
  ) {
    this.animTime += delta;

    // Flame flicker
    const flicker = 1.0 + Math.sin(this.animTime * 14) * 0.15 + Math.cos(this.animTime * 22) * 0.08;
    this.flameMesh.scale.set(flicker, 1.0 + Math.sin(this.animTime * 10) * 0.18, flicker);
    this.flameLight.intensity = 2.4 * flicker;

    // Ambient floating embers around the brazier
    if (Math.random() < delta * 8) {
      particles.spawnEmbers(this.group.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 0xf97316, 2);
    }

    // 1. Burn Azrael if within aura
    const azraelDist = new THREE.Vector2(
      azrael.group.position.x - this.group.position.x,
      azrael.group.position.z - this.group.position.z
    ).length();

    if (azraelDist <= this.burnRadius && !azrael.isDead && !combat.iFramesActive) {
      const burnDmg = this.burnDps * delta;
      combat.health = Math.max(0, combat.health - burnDmg);
      combat.resetDamageTimer();
      if (Math.random() < 0.2) {
        soundEngine.playBrazierHiss();
        particles.spawnSparks(azrael.group.position, 6, 0xf97316);
      }
      if (combat.health <= 0) {
        azrael.isDead = true;
      }
    }

    // 2. Burn Enemies (Kiting into brazier!)
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const eDist = new THREE.Vector2(
        enemy.group.position.x - this.group.position.x,
        enemy.group.position.z - this.group.position.z
      ).length();

      if (eDist <= this.burnRadius) {
        enemy.takeDamage(this.burnDps * 1.8 * delta); // Extra burn damage against demons
        if (Math.random() < 0.25) {
          particles.spawnSparks(enemy.group.position, 8, 0xf97316);
          particles.spawnEmbers(enemy.group.position, 0xef4444, 2);
        }
      }
    }

    // 3. Burn Boss
    if (boss && !boss.isDead) {
      const bDist = new THREE.Vector2(
        boss.group.position.x - this.group.position.x,
        boss.group.position.z - this.group.position.z
      ).length();
      if (bDist <= this.burnRadius + 1.2) {
        boss.takeDamage(this.burnDps * delta);
      }
    }
  }

  public dispose() {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
  }
}
