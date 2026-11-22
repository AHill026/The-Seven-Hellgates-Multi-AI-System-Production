/**
 * The Seven Hellgates - Realm World & Architecture Generator
 * Distinct procedural environments, lighting, fog, and Hellgate portals for all 7 realms.
 */

import * as THREE from 'three';
import { RealmDefinition } from '../types';
import { materialFactory } from '../vfx/MaterialFactory';

export const REALM_DEFINITIONS: RealmDefinition[] = [
  {
    id: 1,
    name: 'Limbo',
    subtitle: 'The Kingdom of the Lost',
    description: 'A shattered medieval realm smothered in cold ash, forgotten gravestones, and pale-blue witchflames.',
    bossName: 'The Hollow King',
    bossTitle: 'Ruler of the Lost Monarchs',
    skyColor: 0x07090e,
    fogColor: 0x0d121c,
    fogDensity: 0.022,
    groundColor: 0x181a20,
    accentColor: 0x38bdf8,
    loreTitle: 'Fragment I: The Sovereign Knight',
    loreFragment: 'You were not born a creature of the Abyss. You once stood in radiant black plate at the gates of the Silver Citadel before the sky fractured...',
  },
  {
    id: 2,
    name: 'Gluttony',
    subtitle: 'Abaddon — The Endless Maw',
    description: 'A pulsating biome of calcified ribs, pools of dark corrupted blood, and weeping flesh monoliths.',
    bossName: 'The Maw of Endless Hunger',
    bossTitle: 'Sovereign of Gluttony',
    skyColor: 0x0c0709,
    fogColor: 0x170f14,
    fogDensity: 0.025,
    groundColor: 0x241419,
    accentColor: 0x84cc16,
    loreTitle: 'Fragment II: The Broken Oath',
    loreFragment: 'The seven seals were not forged by demons. They were forged by men who feared what they could not conquer...',
  },
  {
    id: 3,
    name: 'Greed',
    subtitle: 'The Gilded Abyss',
    description: 'Crumbling golden vaults and melted treasure canals reflecting a dead, gilded sun.',
    bossName: 'The Gilded Tyrant',
    bossTitle: 'Emperor of Molten Slag',
    skyColor: 0x120e06,
    fogColor: 0x1e170d,
    fogDensity: 0.02,
    groundColor: 0x282012,
    accentColor: 0xf59e0b,
    loreTitle: 'Fragment III: The Price of Divinity',
    loreFragment: 'Every gate took a king. The first sold his crown for eternity, and inherited a prison of ash.',
  },
  {
    id: 4,
    name: 'Wrath',
    subtitle: 'The Burning Dominion',
    description: 'Basalt jagged cliffs, rivers of molten magma, and towering iron war bastions under a burning crimson sky.',
    bossName: 'The Red Calamity',
    bossTitle: 'The Molten Scourge',
    skyColor: 0x150505,
    fogColor: 0x240a0a,
    fogDensity: 0.024,
    groundColor: 0x1c0f0f,
    accentColor: 0xef4444,
    loreTitle: 'Fragment IV: The Flame that Remembers',
    loreFragment: 'You did not fall into the Hellgates, Azrael. You breached them from the outside with an army that no longer breathes.',
  },
  {
    id: 5,
    name: 'Heresy',
    subtitle: 'The Cathedral of the Damned',
    description: 'Inverted gothic spires, ash-covered high altars, and cold black supernatural fire suspended in air.',
    bossName: 'The Saint of Ash',
    bossTitle: 'High Inquisitor of the Hollowed Choir',
    skyColor: 0x0a0b12,
    fogColor: 0x121421,
    fogDensity: 0.02,
    groundColor: 0x181a24,
    accentColor: 0x818cf8,
    loreTitle: 'Fragment V: The Inverted Prayers',
    loreFragment: 'The gods did not abandon this world. They fled from something older than prayer.',
  },
  {
    id: 6,
    name: 'Violence',
    subtitle: 'The Bloodfields',
    description: 'A sea of shattered halberds, splintered siege engines, and war-torn blood trenches.',
    bossName: 'The Butcher of Ruin',
    bossTitle: 'General of the Blood Titan',
    skyColor: 0x130404,
    fogColor: 0x220808,
    fogDensity: 0.022,
    groundColor: 0x1f0e0e,
    accentColor: 0xb91c1c,
    loreTitle: 'Fragment VI: The Great Betrayal',
    loreFragment: 'You were their champion. They sealed the Seventh Gate behind you and wept while you bled.',
  },
  {
    id: 7,
    name: 'Sovereign',
    subtitle: 'The Throne Beyond Creation',
    description: 'Impossible floating geometric monoliths hovering over an endless abyss beneath blinding celestial voids.',
    bossName: 'The Sovereign of Desire',
    bossTitle: 'Guardian of the Threshold',
    skyColor: 0x040406,
    fogColor: 0x08080d,
    fogDensity: 0.018,
    groundColor: 0x0e0e14,
    accentColor: 0xffffff,
    loreTitle: 'Fragment VII: The Threshold',
    loreFragment: 'Beyond the Seventh Gate is neither heaven nor hell. There is only the Watcher who waits for your awakening.',
  },
];

export class RealmWorld {
  public group: THREE.Group;
  public hellgatePortal: THREE.Group;
  public currentRealmDef: RealmDefinition = REALM_DEFINITIONS[0];
  private portalVortexMesh: THREE.Mesh;
  private portalRings: THREE.Mesh[] = [];
  private portalBeams: THREE.Mesh[] = [];
  private portalLight: THREE.PointLight;
  private animTime: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.hellgatePortal = new THREE.Group();
    this.group.add(this.hellgatePortal);

    // Initial dummy portal meshes
    const portalGeom = new THREE.CircleGeometry(3.5, 32);
    const portalMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    this.portalVortexMesh = new THREE.Mesh(portalGeom, portalMat);
    this.portalLight = new THREE.PointLight(0x38bdf8, 3, 20);
  }

  public buildRealm(realmId: number, scene: THREE.Scene): RealmDefinition {
    // Clear old props
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    const def = REALM_DEFINITIONS.find(r => r.id === realmId) || REALM_DEFINITIONS[0];
    this.currentRealmDef = def;

    // Configure Scene Fog & Background
    scene.background = new THREE.Color(def.skyColor);
    scene.fog = new THREE.FogExp2(def.fogColor, def.fogDensity);

    // 1. Procedural Arena Ground
    const groundGeom = new THREE.PlaneGeometry(160, 160, 48, 48);
    // Displace vertices subtly for rugged terrain
    const pos = groundGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const distFromCenter = Math.sqrt(vx * vx + vy * vy);
      // Keep playable arena floor (radius <= 28m) flat at height 0 to prevent sinking into terrain.
      // Rise perimeter cliff walls outside the playable arena (radius > 28m).
      const height = distFromCenter > 28
        ? (distFromCenter - 28) * 0.55 + Math.sin(vx * 0.2) * Math.cos(vy * 0.2) * 1.5
        : 0;
      pos.setZ(i, height);
    }
    groundGeom.computeVertexNormals();

    const groundMat = materialFactory.createBasaltStone(def.groundColor);
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    // 2. Ruined Gothic Pillars & Monoliths around arena
    const pillarMat = materialFactory.createBasaltStone(0x1e212b);

    const pillarGeom = new THREE.CylinderGeometry(0.8, 1.1, 7.5, 8);
    const brokenPillarGeom = new THREE.CylinderGeometry(0.8, 1.1, 4.0, 8);

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const radius = 24 + Math.sin(i * 3) * 3;
      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;

      const isBroken = i % 3 === 0;
      const pillar = new THREE.Mesh(isBroken ? brokenPillarGeom : pillarGeom, pillarMat);
      pillar.position.set(px, isBroken ? 2.0 : 3.75, pz);
      pillar.rotation.y = Math.random() * Math.PI;
      pillar.rotation.z = (Math.random() - 0.5) * 0.1;
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.group.add(pillar);

      // Pale-blue / Realm-accent torch brazier atop every alternate pillar
      if (i % 2 === 0) {
        const torch = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 6), new THREE.MeshBasicMaterial({ color: def.accentColor }));
        torch.position.set(px, isBroken ? 4.3 : 7.8, pz);
        this.group.add(torch);

        const torchLight = new THREE.PointLight(def.accentColor, 1.2, 10);
        torchLight.position.copy(torch.position);
        this.group.add(torchLight);
      }
    }

    // 3. Crumbling Ruin Arches & Broken Gravestones (Blender Basalt PBR)
    const stoneMat = materialFactory.createBasaltStone(0x4b5163);
    for (let i = 0; i < 20; i++) {
      const stone = new THREE.Mesh(
        new THREE.BoxGeometry(0.6 + Math.random() * 0.5, 1.4 + Math.random() * 0.8, 0.4),
        stoneMat
      );
      const r = 12 + Math.random() * 15;
      const a = Math.random() * Math.PI * 2;
      stone.position.set(Math.cos(a) * r, 0.7, Math.sin(a) * r);
      stone.rotation.y = Math.random() * Math.PI;
      stone.rotation.z = (Math.random() - 0.5) * 0.3;
      stone.castShadow = true;
      stone.receiveShadow = true;
      this.group.add(stone);
    }

    // Specific atmospheric structures for Realm 2 (Abaddon)
    if (def.id === 2) {
      const boneMat = materialFactory.createCalcifiedBone();
      // Giant calcified ribcage archways spanning across the arena approach
      for (let rib = -2; rib <= 2; rib++) {
        const arch = new THREE.Group();
        arch.position.set(0, 0, rib * 6 - 4);
        for (const side of [-1, 1] as const) {
          const ribGeom = new THREE.TorusGeometry(8.5, 0.4, 8, 24, Math.PI * 0.42);
          ribGeom.computeVertexNormals();
          const ribMesh = new THREE.Mesh(ribGeom, boneMat);
          ribMesh.rotation.y = (side * Math.PI) / 2;
          ribMesh.rotation.z = Math.PI * 0.15;
          ribMesh.position.set(side * 8, 1.8, 0);
          ribMesh.castShadow = true;
          arch.add(ribMesh);
        }
        this.group.add(arch);
      }
    }

    // 4. Build THE HELLGATE PORTAL at the northern perimeter
    this.buildHellgatePortal(def);

    return def;
  }

  private buildHellgatePortal(def: RealmDefinition) {
    this.hellgatePortal = new THREE.Group();
    this.hellgatePortal.position.set(0, 0, -22);

    const stoneMat = materialFactory.createBasaltStone(0x464d61);

    // Giant Gothic Monolith Arch Columns
    const colLeft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 12, 1.8), stoneMat);
    colLeft.position.set(-4.5, 6, 0);
    colLeft.castShadow = true;
    this.hellgatePortal.add(colLeft);

    const colRight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 12, 1.8), stoneMat);
    colRight.position.set(4.5, 6, 0);
    colRight.castShadow = true;
    this.hellgatePortal.add(colRight);

    // Archway Crown lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(11, 2.2, 2.2), stoneMat);
    lintel.position.set(0, 11.5, 0);
    lintel.castShadow = true;
    this.hellgatePortal.add(lintel);

    // Gothic spires
    const spireL = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.5, 4), stoneMat);
    spireL.position.set(-4.5, 14, 0);
    this.hellgatePortal.add(spireL);

    const spireR = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.5, 4), stoneMat);
    spireR.position.set(4.5, 14, 0);
    this.hellgatePortal.add(spireR);

    // Swirling Portal Vortex
    const vortexGeom = new THREE.CircleGeometry(3.6, 32);
    const vortexMat = new THREE.MeshBasicMaterial({
      color: def.accentColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    this.portalVortexMesh = new THREE.Mesh(vortexGeom, vortexMat);
    this.portalVortexMesh.position.set(0, 5.5, 0);
    this.hellgatePortal.add(this.portalVortexMesh);

    // Concentric swirling energy rings
    this.portalRings = [];
    for (let i = 0; i < 4; i++) {
      const ringGeom = new THREE.RingGeometry(1.2 + i * 0.65, 1.4 + i * 0.65, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: def.accentColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(0, 5.5, 0.05 + i * 0.04);
      this.hellgatePortal.add(ring);
      this.portalRings.push(ring);
    }

    this.portalLight = new THREE.PointLight(def.accentColor, 4, 18);
    this.portalLight.position.set(0, 5.5, 1.5);
    this.hellgatePortal.add(this.portalLight);

    // Volumetric UE5 Godray Light Shafts emanating from Hellgate Portal
    this.portalBeams = [];
    for (let b = 0; b < 6; b++) {
      const beamGeom = new THREE.CylinderGeometry(0.35, 3.2, 22, 12, 1, true);
      beamGeom.translate(0, 11, 0);
      beamGeom.rotateX(Math.PI / 2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: def.accentColor,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const beam = new THREE.Mesh(beamGeom, beamMat);
      beam.position.set(0, 5.5, 0.2);
      beam.rotation.y = (b / 6) * Math.PI * 0.45 - 0.22;
      beam.rotation.x = 0.08 * Math.sin(b * 1.5);
      this.hellgatePortal.add(beam);
      this.portalBeams.push(beam);
    }

    this.group.add(this.hellgatePortal);
  }

  public update(delta: number) {
    this.animTime += delta;
    if (this.portalVortexMesh) {
      this.portalVortexMesh.rotation.z += delta * 0.6;
    }
    this.portalRings.forEach((r, idx) => {
      r.rotation.z += delta * (idx % 2 === 0 ? 0.9 : -0.8);
      const scale = 1 + Math.sin(this.animTime * 3 + idx) * 0.06;
      r.scale.set(scale, scale, 1);
    });

    // Animate volumetric godray shafts
    this.portalBeams.forEach((beam, idx) => {
      beam.rotation.z += delta * 0.12 * (idx % 2 === 0 ? 1 : -1);
      (beam.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(this.animTime * 2.2 + idx) * 0.05;
    });

    if (this.portalLight) {
      this.portalLight.intensity = 3.5 + Math.sin(this.animTime * 4) * 0.8;
    }
  }
}
