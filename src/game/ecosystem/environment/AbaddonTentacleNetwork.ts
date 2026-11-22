/**
 * The Seven Hellgates - Realm II: Abaddon
 * Advanced Environmental Tentacle Network
 *
 * Coherent biological infrastructure:
 * - Large stationary tentacles emerging from structures and gothic arches
 * - Smaller independently animated tentacles with phase-desynchronized kinematics
 * - Writhing tentacles emerging from feeding pits and bile pools
 * - Wall-crawling tendrils and organic surface roots
 * - Dynamic proximity reaction when Azrael approaches (defensive coiling & rearing)
 * - Retraction mechanics when damaged or struck by player attacks
 * - Occasional telegraphed environmental tentacle whip hazards
 */

import * as THREE from 'three';

export interface EnvironmentalTentacle {
  id: string;
  group: THREE.Group;
  type: 'colossal_structural' | 'pit_feeder' | 'surface_crawler' | 'ambush_hazard';
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
  baseScale: THREE.Vector3;
  segments: THREE.Mesh[];
  joints: THREE.Group[];
  phaseOffset: number;
  frequency: number;
  amplitude: number;
  reach: number;
  sensitivityRadius: number;
  
  // Interactive state
  isRetracted: boolean;
  retractionProgress: number; // 0 = fully extended, 1 = fully retracted
  retractTimer: number;
  health: number;
  maxHealth: number;

  // Hazard properties
  isAttacking: boolean;
  attackTimer: number;
  attackCooldown: number;
}

export class AbaddonTentacleNetwork {
  public group: THREE.Group;
  public tentacles: EnvironmentalTentacle[] = [];
  
  private fleshMat: THREE.MeshStandardMaterial;
  private suckerMat: THREE.MeshStandardMaterial;
  private thornMat: THREE.MeshStandardMaterial;
  private bileGlowMat: THREE.MeshStandardMaterial;
  
  private time: number = 0;
  private excitementLevel: number = 0;
  public isSovereignDefeated: boolean = false;
  private wiltFactor: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // High-fidelity PBR Materials for Organic Network
    this.fleshMat = new THREE.MeshStandardMaterial({
      color: 0x421014,
      emissive: 0x8a1c22,
      emissiveIntensity: 0.28,
      roughness: 0.38,
      metalness: 0.15,
    });

    this.suckerMat = new THREE.MeshStandardMaterial({
      color: 0x6e1b24,
      roughness: 0.25,
      metalness: 0.3,
    });

    this.thornMat = new THREE.MeshStandardMaterial({
      color: 0x3d3429,
      roughness: 0.6,
      metalness: 0.2,
    });

    this.bileGlowMat = new THREE.MeshStandardMaterial({
      color: 0x22380d,
      emissive: 0x84cc16,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.4,
    });
  }

  /**
   * Initializes the full environmental tentacle network across Abaddon
   */
  public initializeNetwork() {
    // 1. Colossal Structural Tentacles emerging from arches and perimeter monoliths
    const structuralPositions = [
      { pos: new THREE.Vector3(-18, 0, -14), rot: new THREE.Euler(0.2, 0.4, -0.15), scale: 2.2 },
      { pos: new THREE.Vector3(18, 0, -14), rot: new THREE.Euler(0.15, -0.6, 0.2), scale: 2.0 },
      { pos: new THREE.Vector3(-22, 0, 4), rot: new THREE.Euler(-0.1, 1.2, -0.2), scale: 2.4 },
      { pos: new THREE.Vector3(22, 0, 6), rot: new THREE.Euler(-0.2, -1.1, 0.25), scale: 2.3 },
      { pos: new THREE.Vector3(-14, 2.5, -20), rot: new THREE.Euler(0.4, 0.2, 0), scale: 2.5 },
      { pos: new THREE.Vector3(14, 2.5, -20), rot: new THREE.Euler(0.4, -0.2, 0), scale: 2.5 },
      { pos: new THREE.Vector3(0, 0, 24), rot: new THREE.Euler(-0.35, Math.PI, 0), scale: 2.6 },
    ];

    structuralPositions.forEach((spec, idx) => {
      this.createTentacle(`structural_${idx}`, 'colossal_structural', spec.pos, spec.rot, spec.scale, 7);
    });

    // 2. Feeding Pit Tentacles (writhing directly inside the 3 major bile basins)
    const pitSpecs = [
      // The Great Gullet (-12, 0, -6)
      { pos: new THREE.Vector3(-12.5, 0.1, -5.8), rot: new THREE.Euler(0, 0.5, 0.2), scale: 1.4 },
      { pos: new THREE.Vector3(-11.4, 0.1, -6.6), rot: new THREE.Euler(0, -0.8, -0.25), scale: 1.2 },
      { pos: new THREE.Vector3(-13.2, 0.1, -6.2), rot: new THREE.Euler(0, 2.1, 0.15), scale: 1.5 },

      // The Ossuary Gorge (14, 0, -8)
      { pos: new THREE.Vector3(14.6, 0.1, -7.8), rot: new THREE.Euler(0, -0.4, -0.2), scale: 1.3 },
      { pos: new THREE.Vector3(13.4, 0.1, -8.6), rot: new THREE.Euler(0, 1.4, 0.3), scale: 1.4 },
      { pos: new THREE.Vector3(14.2, 0.1, -7.2), rot: new THREE.Euler(0, -2.2, -0.15), scale: 1.1 },

      // The Maw Trench (0, 0, 16)
      { pos: new THREE.Vector3(-1.4, 0.1, 16.4), rot: new THREE.Euler(0, 0.7, 0.3), scale: 1.6 },
      { pos: new THREE.Vector3(1.5, 0.1, 15.8), rot: new THREE.Euler(0, -0.9, -0.3), scale: 1.5 },
      { pos: new THREE.Vector3(0.0, 0.1, 17.2), rot: new THREE.Euler(0, 3.0, 0.2), scale: 1.7 },
    ];

    pitSpecs.forEach((spec, idx) => {
      this.createTentacle(`pit_tentacle_${idx}`, 'pit_feeder', spec.pos, spec.rot, spec.scale, 6);
    });

    // 3. Wall-Crawling Tendrils winding around arena borders and bone arches
    const crawlerPositions = [
      new THREE.Vector3(-16, 0, -2),
      new THREE.Vector3(-17, 0, 10),
      new THREE.Vector3(16, 0, -2),
      new THREE.Vector3(17, 0, 10),
      new THREE.Vector3(-8, 0, -16),
      new THREE.Vector3(8, 0, -16),
      new THREE.Vector3(-10, 0, 20),
      new THREE.Vector3(10, 0, 20),
    ];

    crawlerPositions.forEach((pos, idx) => {
      const rot = new THREE.Euler((Math.random() - 0.5) * 0.3, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3);
      this.createTentacle(`crawler_${idx}`, 'surface_crawler', pos, rot, 0.95 + Math.random() * 0.4, 5);
    });

    // 4. Ambush Whiplash Hazards
    const hazardPositions = [
      new THREE.Vector3(-7, 0, -4),
      new THREE.Vector3(7, 0, -4),
      new THREE.Vector3(-5, 0, 8),
      new THREE.Vector3(5, 0, 8),
    ];

    hazardPositions.forEach((pos, idx) => {
      this.createTentacle(`ambush_${idx}`, 'ambush_hazard', pos, new THREE.Euler(0, Math.random() * Math.PI, 0), 1.25, 6);
    });
  }

  /**
   * Constructs an articulated multi-segment procedural tentacle with suction cups and chitinous thorns
   */
  private createTentacle(
    id: string,
    type: EnvironmentalTentacle['type'],
    pos: THREE.Vector3,
    rot: THREE.Euler,
    scale: number,
    segmentCount: number
  ) {
    const tentacleRoot = new THREE.Group();
    tentacleRoot.position.copy(pos);
    tentacleRoot.rotation.copy(rot);
    tentacleRoot.scale.set(scale, scale, scale);

    const segments: THREE.Mesh[] = [];
    const joints: THREE.Group[] = [];

    let currentParent: THREE.Group = tentacleRoot;
    const baseRadius = type === 'colossal_structural' ? 0.38 : (type === 'ambush_hazard' ? 0.22 : 0.18);
    const segLength = type === 'colossal_structural' ? 0.85 : 0.65;

    for (let i = 0; i < segmentCount; i++) {
      const progress = i / segmentCount;
      const rTop = Math.max(0.04, baseRadius * (1 - (i + 1) * 0.12));
      const rBottom = baseRadius * (1 - i * 0.12);

      // Articulated joint pivot
      const joint = new THREE.Group();
      if (i > 0) {
        joint.position.y = segLength;
      }
      currentParent.add(joint);
      joints.push(joint);

      // Segment geometry with smooth computed vertex normals
      const segGeom = new THREE.CylinderGeometry(rTop, rBottom, segLength, 12, 1);
      segGeom.computeVertexNormals();
      const segMesh = new THREE.Mesh(segGeom, this.fleshMat);
      segMesh.position.y = segLength * 0.5;
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      joint.add(segMesh);
      segments.push(segMesh);

      // Add double row of suction cups along the inner front face
      for (const side of [-1, 1] as const) {
        const cupGeom = new THREE.TorusGeometry(rBottom * 0.28, rBottom * 0.1, 6, 10);
        cupGeom.computeVertexNormals();
        const cup = new THREE.Mesh(cupGeom, this.suckerMat);
        cup.position.set(side * rBottom * 0.32, segLength * 0.5, rBottom * 0.85);
        cup.rotation.x = Math.PI * 0.45;
        joint.add(cup);
      }

      // Add chitinous thorns along the spine side on alternating segments
      if (i % 2 === 1) {
        const thornGeom = new THREE.ConeGeometry(rBottom * 0.22, segLength * 0.45, 5);
        thornGeom.computeVertexNormals();
        const thorn = new THREE.Mesh(thornGeom, this.thornMat);
        thorn.position.set(0, segLength * 0.6, -rBottom * 0.9);
        thorn.rotation.x = -Math.PI * 0.65;
        joint.add(thorn);
      }

      currentParent = joint;
    }

    // Terminal tip: glowing sensory bile organ
    const tipGeom = new THREE.SphereGeometry(baseRadius * 0.25, 8, 8);
    tipGeom.computeVertexNormals();
    const tipMesh = new THREE.Mesh(tipGeom, this.bileGlowMat);
    tipMesh.position.y = segLength;
    currentParent.add(tipMesh);

    this.group.add(tentacleRoot);

    this.tentacles.push({
      id,
      group: tentacleRoot,
      type,
      basePosition: pos.clone(),
      baseRotation: rot.clone(),
      baseScale: new THREE.Vector3(scale, scale, scale),
      segments,
      joints,
      phaseOffset: Math.random() * Math.PI * 2,
      frequency: 0.65 + Math.random() * 0.9,
      amplitude: 0.14 + Math.random() * 0.12,
      reach: segLength * segmentCount * scale,
      sensitivityRadius: type === 'ambush_hazard' ? 4.2 : 3.8,
      isRetracted: false,
      retractionProgress: 0,
      retractTimer: 0,
      health: 80,
      maxHealth: 80,
      isAttacking: false,
      attackTimer: 0,
      attackCooldown: 6.0 + Math.random() * 5.0,
    });
  }

  /**
   * Triggers retraction on a tentacle when damaged or stepped upon
   */
  public triggerDamageRetraction(tentacleId: string, damage: number = 35): boolean {
    const tentacle = this.tentacles.find(t => t.id === tentacleId);
    if (!tentacle || tentacle.isRetracted) return false;

    tentacle.health -= damage;
    tentacle.isRetracted = true;
    tentacle.retractTimer = 4.0; // Stay retracted for 4 seconds before slowly re-emerging
    this.excitementLevel = Math.min(2.0, this.excitementLevel + 0.4);
    return true;
  }

  /**
   * Checks player attack collisions against nearby tentacles
   */
  public checkAttackHits(hitPosition: THREE.Vector3, radius: number): boolean {
    let hitAny = false;
    for (const tentacle of this.tentacles) {
      if (tentacle.isRetracted) continue;
      const dist = tentacle.basePosition.distanceTo(hitPosition);
      if (dist <= radius + tentacle.reach * 0.45) {
        this.triggerDamageRetraction(tentacle.id, 45);
        hitAny = true;
      }
    }
    return hitAny;
  }

  public notifyCombatNoise(pos: THREE.Vector3, intensity: number = 1.0) {
    this.excitementLevel = Math.min(2.5, this.excitementLevel + intensity * 0.6);
  }

  /**
   * Main Per-Frame Update Loop
   */
  public update(delta: number, playerPos: THREE.Vector3): { attackDamage: number; attackPos?: THREE.Vector3 } {
    this.time += delta;
    let environmentalDamage = 0;
    let attackImpactPos: THREE.Vector3 | undefined;

    // Decay global agitation
    if (this.excitementLevel > 0) {
      this.excitementLevel = Math.max(0, this.excitementLevel - delta * 0.5);
    }

    const pulse = 0.28 + this.excitementLevel * 0.2 + Math.sin(this.time * 2.4) * 0.1;
    this.fleshMat.emissiveIntensity = pulse;
    this.bileGlowMat.emissiveIntensity = 0.7 + Math.sin(this.time * 3.5) * 0.35;

    for (const tentacle of this.tentacles) {
      // 1. Handle Retraction & Re-emergence Kinetics
      if (tentacle.isRetracted) {
        tentacle.retractionProgress = Math.min(1.0, tentacle.retractionProgress + delta * 3.5);
        tentacle.retractTimer -= delta;

        if (tentacle.retractTimer <= 0) {
          // Re-emerge slowly
          tentacle.retractionProgress = Math.max(0.0, tentacle.retractionProgress - delta * 1.2);
          if (tentacle.retractionProgress <= 0) {
            tentacle.isRetracted = false;
            tentacle.health = tentacle.maxHealth;
          }
        }

        // Curl and shrink downward into burrow
        const currentScaleY = THREE.MathUtils.lerp(tentacle.baseScale.y, 0.12, tentacle.retractionProgress);
        const currentScaleXZ = THREE.MathUtils.lerp(tentacle.baseScale.x, 0.4, tentacle.retractionProgress);
        tentacle.group.scale.set(currentScaleXZ, currentScaleY, currentScaleXZ);

        // Coiling curl rotation
        tentacle.joints.forEach((joint, jIdx) => {
          joint.rotation.z = THREE.MathUtils.lerp(joint.rotation.z, 0.45, delta * 8.0);
          joint.rotation.x = THREE.MathUtils.lerp(joint.rotation.x, 0.35, delta * 8.0);
        });

        continue;
      } else if (tentacle.retractionProgress > 0) {
        tentacle.retractionProgress = Math.max(0.0, tentacle.retractionProgress - delta * 2.0);
        const curY = THREE.MathUtils.lerp(tentacle.baseScale.y, 0.12, tentacle.retractionProgress);
        const curXZ = THREE.MathUtils.lerp(tentacle.baseScale.x, 0.4, tentacle.retractionProgress);
        tentacle.group.scale.set(curXZ, curY, curXZ);
      }

      // 2. Post-Sovereign Environmental Decay (Wilting & Collapse)
      if (this.isSovereignDefeated) {
        tentacle.joints.forEach((joint, idx) => {
          joint.rotation.x = THREE.MathUtils.lerp(joint.rotation.x, 1.35, delta * 1.8);
          joint.rotation.z = THREE.MathUtils.lerp(joint.rotation.z, 0.35 * (idx % 2 === 0 ? 1 : -1), delta * 1.8);
        });
        continue;
      }

      // 3. Proximity Detection with Azrael
      const distToPlayer = tentacle.basePosition.distanceTo(playerPos);
      const isPlayerNear = distToPlayer <= tentacle.sensitivityRadius;

      // 3. Ambush Hazard Attack Logic
      if (tentacle.type === 'ambush_hazard') {
        if (tentacle.attackCooldown > 0) {
          tentacle.attackCooldown -= delta;
        }

        if (tentacle.isAttacking) {
          tentacle.attackTimer += delta * 2.8;
          const p = tentacle.attackTimer;

          if (p < 0.4) {
            // Telegraphed windup: coils backward and trembles
            const windup = p / 0.4;
            tentacle.joints.forEach((j, idx) => {
              j.rotation.x = -0.35 * windup * (idx + 1) * 0.4;
              j.rotation.z = Math.sin(this.time * 25) * 0.08 * windup;
            });
          } else if (p < 0.7) {
            // Explosive whip strike forward
            const strikeProgress = (p - 0.4) / 0.3;
            tentacle.joints.forEach((j, idx) => {
              j.rotation.x = THREE.MathUtils.lerp(-0.35 * (idx + 1) * 0.4, 0.75 * (idx + 1) * 0.35, strikeProgress);
            });

            if (p >= 0.5 && p - delta * 2.8 < 0.5 && distToPlayer <= 3.2) {
              environmentalDamage = 16;
              attackImpactPos = tentacle.basePosition.clone().add(new THREE.Vector3(0, 0.2, 1.2));
            }
          } else {
            // Recovery
            const rec = (p - 0.7) / 0.3;
            tentacle.joints.forEach((j, idx) => {
              j.rotation.x = THREE.MathUtils.lerp(0.75 * (idx + 1) * 0.35, 0, rec);
            });
          }

          if (p >= 1.0) {
            tentacle.isAttacking = false;
            tentacle.attackTimer = 0;
            tentacle.attackCooldown = 7.0 + Math.random() * 4.0;
          }
          continue;
        } else if (isPlayerNear && tentacle.attackCooldown <= 0 && Math.random() < 0.35) {
          tentacle.isAttacking = true;
          tentacle.attackTimer = 0;
          continue;
        }
      }

      // 4. Autonomous Biological Kinematics (Wave propagation along spine joints)
      const agitationMult = isPlayerNear ? 2.4 : (1.0 + this.excitementLevel * 0.8);
      const effectiveFreq = tentacle.frequency * agitationMult;
      const effectiveAmp = tentacle.amplitude * (isPlayerNear ? 1.8 : 1.0);

      // Facing reaction: rear up or bend slightly toward/away from player
      let targetBendX = 0;
      let targetBendZ = 0;
      if (isPlayerNear && distToPlayer > 0.01) {
        const toPlayer = new THREE.Vector3().subVectors(playerPos, tentacle.basePosition).normalize();
        targetBendX = toPlayer.z * 0.18;
        targetBendZ = -toPlayer.x * 0.18;
      }

      tentacle.joints.forEach((joint, idx) => {
        const jointDelay = idx * 0.35;
        const waveX = Math.sin(this.time * effectiveFreq + tentacle.phaseOffset + jointDelay) * effectiveAmp;
        const waveZ = Math.cos(this.time * (effectiveFreq * 0.85) + tentacle.phaseOffset + jointDelay) * (effectiveAmp * 0.8);

        joint.rotation.x = waveX + targetBendX * (idx * 0.3);
        joint.rotation.z = waveZ + targetBendZ * (idx * 0.3);
      });
    }

    return { attackDamage: environmentalDamage, attackPos: attackImpactPos };
  }

  public onSovereignDefeated() {
    this.isSovereignDefeated = true;
    this.fleshMat.color.setHex(0x1a1111);
    this.fleshMat.emissiveIntensity = 0.04;
    this.bileGlowMat.emissiveIntensity = 0.06;
    this.suckerMat.color.setHex(0x241212);
  }

  public dispose() {
    this.fleshMat.dispose();
    this.suckerMat.dispose();
    this.thornMat.dispose();
    this.bileGlowMat.dispose();

    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
    this.tentacles = [];
  }
}
