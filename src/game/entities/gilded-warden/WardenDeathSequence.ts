/**
 * The Seven Hellgates - Greed: The Pit of Destruction
 * The Forgotten Souls — WardenDeathSequence
 *
 * Major cinematic storytelling moment:
 * Phase 1 — Collapse: drops to knees, weapon falls, halo flickers, chains fall, combat audio fades
 * Phase 2 — Containment Failure: chest lock cracks, soul lantern intensifies, golden energy escapes
 * Phase 3 — The Release: fragile exhausted spectral figures emerge, slowly rising and dissolving
 * Phase 4 — Final Whispers:
 *   - Soul One: "I… remember…"
 *   - Soul Two: "Tell them… we were here…"
 *   - Soul Three: "We had names…"
 *   - Final Whisper: "Azrael…"
 * Phase 5 — Silence: halo extinguishes, armor becomes lifeless, normal gameplay restored
 */

import * as THREE from 'three';
import { SoulWhisperAudioController } from './SoulWhisperAudioController';
import { WardenSpectralEffects } from './WardenSpectralEffects';
import { FORGOTTEN_SOULS_DIALOGUE_LIBRARY } from './ForgottenSoulsConfiguration';

export type DeathSequencePhase =
  | 'idle'
  | 'collapse'
  | 'containment_failure'
  | 'the_release'
  | 'final_whispers'
  | 'silence'
  | 'completed';

export interface EmergingSoulFigure {
  group: THREE.Group;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  soulIndex: number;
}

export class WardenDeathSequence {
  public phase: DeathSequencePhase = 'idle';
  private phaseTimer: number = 0;
  private totalElapsed: number = 0;

  private wardenGroup: THREE.Group;
  private weaponMesh: THREE.Group | null = null;
  private audioCtrl: SoulWhisperAudioController;
  private spectralEffects: WardenSpectralEffects;

  // Emerging ethereal figures
  private soulFigures: EmergingSoulFigure[] = [];
  private soulFigureMat: THREE.MeshStandardMaterial;

  // Final whispers step tracker
  private whisperStep: number = 0;
  private whisperStepTimer: number = 0;

  constructor(
    wardenGroup: THREE.Group,
    weaponMesh: THREE.Group | null,
    audioCtrl: SoulWhisperAudioController,
    spectralEffects: WardenSpectralEffects
  ) {
    this.wardenGroup = wardenGroup;
    this.weaponMesh = weaponMesh;
    this.audioCtrl = audioCtrl;
    this.spectralEffects = spectralEffects;

    this.soulFigureMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88,
    });
  }

  public start() {
    if (this.phase !== 'idle') return;
    this.phase = 'collapse';
    this.phaseTimer = 2.4;
    this.totalElapsed = 0;
    this.whisperStep = 0;
    this.whisperStepTimer = 0;
  }

  public isComplete(): boolean {
    return this.phase === 'completed';
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    if (this.phase === 'idle' || this.phase === 'completed') return;

    this.totalElapsed += delta;
    this.phaseTimer -= delta;

    switch (this.phase) {
      // ----------------------------------------------------------------------
      // PHASE 1 — COLLAPSE (2.4s)
      // ----------------------------------------------------------------------
      case 'collapse': {
        // Drop to knees
        this.wardenGroup.position.y = THREE.MathUtils.lerp(this.wardenGroup.position.y, -0.65, delta * 3.5);
        this.wardenGroup.rotation.x = THREE.MathUtils.lerp(this.wardenGroup.rotation.x, 0.45, delta * 2.5);

        // Weapon falls to ground
        if (this.weaponMesh) {
          this.weaponMesh.position.y = THREE.MathUtils.lerp(this.weaponMesh.position.y, -1.2, delta * 5.0);
          this.weaponMesh.rotation.x = THREE.MathUtils.lerp(this.weaponMesh.rotation.x, Math.PI * 0.45, delta * 4.0);
        }

        if (this.phaseTimer <= 0) {
          this.phase = 'containment_failure';
          this.phaseTimer = 2.8;
          // Spawn big golden fracture burst
          this.spectralEffects.spawnLockBreakBurst(this.wardenGroup.position.clone().add(new THREE.Vector3(0, 1.4, 0.3)));
        }
        break;
      }

      // ----------------------------------------------------------------------
      // PHASE 2 — CONTAINMENT FAILURE (2.8s)
      // ----------------------------------------------------------------------
      case 'containment_failure': {
        // Chest padlock cracks open, golden energy surges
        this.spectralEffects.spawnSoulWisp(this.wardenGroup.position.clone().add(new THREE.Vector3(0, 1.4, 0.4)), 3);

        // Trembling vibration
        this.wardenGroup.position.x += (Math.random() - 0.5) * 0.04;
        this.wardenGroup.position.z += (Math.random() - 0.5) * 0.04;

        if (this.phaseTimer <= 0) {
          this.phase = 'the_release';
          this.phaseTimer = 3.5;
          this.spawnEmergingSoulFigures();
        }
        break;
      }

      // ----------------------------------------------------------------------
      // PHASE 3 — THE RELEASE (3.5s)
      // ----------------------------------------------------------------------
      case 'the_release': {
        // Multiple fragile exhausted spectral figures slowly rise from armor
        this.updateSoulFigures(delta);

        if (this.phaseTimer <= 0) {
          this.phase = 'final_whispers';
          this.phaseTimer = 11.5;
          this.whisperStep = 0;
          this.whisperStepTimer = 0.5;
        }
        break;
      }

      // ----------------------------------------------------------------------
      // PHASE 4 — FINAL WHISPERS (Controlled Sequential Storytelling)
      // ----------------------------------------------------------------------
      case 'final_whispers': {
        this.updateSoulFigures(delta);
        this.whisperStepTimer -= delta;

        if (this.whisperStepTimer <= 0 && this.whisperStep < 4) {
          const deathDialogues = FORGOTTEN_SOULS_DIALOGUE_LIBRARY.filter(d => d.category === 'death_sequence');
          const currentDialogue = deathDialogues[this.whisperStep];

          if (currentDialogue) {
            this.audioCtrl.playSpecificWhisper(currentDialogue, this.wardenGroup.position, playerPos);
            // Spawn spectral burst on each spoken memory
            this.spectralEffects.spawnSoulWisp(this.wardenGroup.position.clone().add(new THREE.Vector3(0, 1.8, 0)), 2);
          }

          this.whisperStep++;
          // Interval between soul whispers
          this.whisperStepTimer = (this.whisperStep === 3) ? 3.2 : 2.5; // Final "Azrael..." pause
        }

        if (this.phaseTimer <= 0) {
          this.phase = 'silence';
          this.phaseTimer = 2.0;
        }
        break;
      }

      // ----------------------------------------------------------------------
      // PHASE 5 — SILENCE (2.0s)
      // ----------------------------------------------------------------------
      case 'silence': {
        this.updateSoulFigures(delta);

        // Armor becomes lifeless, dark and cold
        this.wardenGroup.scale.multiplyScalar(Math.max(0.95, 1 - delta * 0.08));

        if (this.phaseTimer <= 0) {
          this.phase = 'completed';
        }
        break;
      }
    }
  }

  /**
   * Spawns visible fragile exhausted spectral figures that emerge from the broken armor
   */
  private spawnEmergingSoulFigures() {
    const soulOffsets = [
      new THREE.Vector3(0, 1.5, 0.4),
      new THREE.Vector3(-0.4, 1.7, 0.2),
      new THREE.Vector3(0.4, 1.7, 0.2),
      new THREE.Vector3(0, 2.1, 0.1),
    ];

    soulOffsets.forEach((off, idx) => {
      const figureGroup = new THREE.Group();
      figureGroup.position.copy(this.wardenGroup.position).add(off);

      // Slender ethereal torso & head
      const torsoGeom = new THREE.CylinderGeometry(0.08, 0.04, 0.65, 8);
      torsoGeom.computeVertexNormals();
      const torsoMesh = new THREE.Mesh(torsoGeom, this.soulFigureMat);
      figureGroup.add(torsoMesh);

      const headGeom = new THREE.SphereGeometry(0.09, 8, 8);
      const headMesh = new THREE.Mesh(headGeom, this.soulFigureMat);
      headMesh.position.y = 0.42;
      figureGroup.add(headMesh);

      // Trailing gossamer shroud
      const shroudGeom = new THREE.ConeGeometry(0.16, 0.9, 6);
      shroudGeom.computeVertexNormals();
      const shroud = new THREE.Mesh(shroudGeom, this.soulFigureMat);
      shroud.position.y = -0.45;
      figureGroup.add(shroud);

      this.wardenGroup.parent?.add(figureGroup);

      this.soulFigures.push({
        group: figureGroup,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.35,
          0.85 + idx * 0.2,
          (Math.random() - 0.5) * 0.35
        ),
        life: 0,
        maxLife: 8.5 + idx * 1.2,
        soulIndex: idx,
      });
    });
  }

  private updateSoulFigures(delta: number) {
    for (let i = this.soulFigures.length - 1; i >= 0; i--) {
      const fig = this.soulFigures[i];
      fig.life += delta;

      // Slowly rise and gently sway
      fig.group.position.addScaledVector(fig.velocity, delta);
      fig.group.position.x += Math.sin(this.totalElapsed * 1.5 + fig.soulIndex) * 0.012;

      // Dissolve into darkness as life expires
      const progress = fig.life / fig.maxLife;
      const opacity = Math.max(0, 0.88 * (1 - progress));
      (fig.group.children[0] as THREE.Mesh).scale.set(1 - progress * 0.3, 1 - progress * 0.3, 1 - progress * 0.3);

      if (progress >= 1.0) {
        fig.group.parent?.remove(fig.group);
        this.soulFigures.splice(i, 1);
      }
    }
  }

  public dispose() {
    this.soulFigures.forEach(fig => {
      fig.group.parent?.remove(fig.group);
    });
    this.soulFigures = [];
    this.soulFigureMat.dispose();
  }
}
