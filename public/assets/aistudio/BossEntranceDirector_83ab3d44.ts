/**
 * The Seven Hellgates - Cinematic Boss Entrance Director
 * Orchestrates 4-shot multi-cut camera sequences, boss arrival choreography,
 * dynamic realm lighting swells, particle shockwaves, and smooth exit handoffs
 * for all 7 Realm Sovereigns.
 */

import * as THREE from 'three';
import { BossInstance } from '../entities/BossModels';
import { RealmDefinition } from '../types';
import { CameraController } from '../core/CameraController';
import { ParticleSystem } from './ParticleSystem';
import { soundEngine } from '../audio/SoundEngine';
import { voiceManager } from '../audio/VoiceManager';

export interface BossEntranceState {
  isActive: boolean;
  realmId: number;
  gateLabel: string;
  realmName: string;
  bossName: string;
  bossTitle: string;
  accentHex: string;
  progress: number;
  shotIndex: number;
  titleVisible: boolean;
}

interface BossShotSpec {
  duration: number;
  startCamLocal: [number, number, number]; // [right, up, forwardFromBoss]
  endCamLocal: [number, number, number];
  startLookLocal: [number, number, number]; // [right, up, forwardFromBoss]
  endLookLocal: [number, number, number];
  startFov: number;
  endFov: number;
  rollRad: number;
  shakeOnEnter?: number;
  shockwaveRadius?: number;
  sparksCount?: number;
}

interface BossChoreographyProfile {
  gateRoman: string;
  accentCss: string;
  accentHexNum: number;
  baseBodyY: number;
  riseOffsetY: number;
  armSpreadAngle: number;
  auraPeak: number;
  shots: BossShotSpec[];
}

const ROMAN_GATES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

const PROFILES: Record<number, BossChoreographyProfile> = {
  1: {
    // Gate I — Limbo: The Hollow King (Rises from shrouded kneel, cerulean blade & spectral crown reveal)
    gateRoman: 'I',
    accentCss: '#38bdf8',
    accentHexNum: 0x38bdf8,
    baseBodyY: 1.8,
    riseOffsetY: -0.95,
    armSpreadAngle: 0.72,
    auraPeak: 5.5,
    shots: [
      {
        duration: 1.35,
        startCamLocal: [-5.5, 2.6, 13.5],
        endCamLocal: [-1.8, 2.2, 10.2],
        startLookLocal: [0, 2.8, -1.5],
        endLookLocal: [0, 2.5, 0],
        startFov: 68,
        endFov: 60,
        rollRad: 0.0,
        shakeOnEnter: 0.65,
        shockwaveRadius: 6.5,
        sparksCount: 28,
      },
      {
        duration: 1.75,
        startCamLocal: [2.4, 0.85, 5.2],
        endCamLocal: [1.6, 2.9, 4.4],
        startLookLocal: [0, 1.9, 0],
        endLookLocal: [0, 3.8, 0],
        startFov: 56,
        endFov: 48,
        rollRad: 0.045,
        shakeOnEnter: 0.45,
        sparksCount: 24,
      },
      {
        duration: 1.7,
        startCamLocal: [-2.1, 4.6, 3.6],
        endCamLocal: [1.7, 4.9, 3.1],
        startLookLocal: [0.3, 4.6, 0.2],
        endLookLocal: [0, 4.7, 0.1],
        startFov: 42,
        endFov: 38,
        rollRad: -0.055,
        shakeOnEnter: 0.85,
        shockwaveRadius: 7.5,
        sparksCount: 36,
      },
      {
        duration: 1.1,
        startCamLocal: [1.4, 2.6, 9.0],
        endCamLocal: [0.0, 2.45, 26.8],
        startLookLocal: [0, 2.9, 0],
        endLookLocal: [0, 2.0, 10.0],
        startFov: 48,
        endFov: 60,
        rollRad: 0.0,
      },
    ],
  },
  2: {
    // Gate II — Gluttony: The Maw of Endless Hunger (Hunched roar, chest rib-maw expansion & bile eruption)
    gateRoman: 'II',
    accentCss: '#84cc16',
    accentHexNum: 0x84cc16,
    baseBodyY: 1.95,
    riseOffsetY: -0.75,
    armSpreadAngle: 0.92,
    auraPeak: 6.2,
    shots: [
      {
        duration: 1.35,
        startCamLocal: [6.0, 2.3, 12.0],
        endCamLocal: [2.2, 1.9, 8.8],
        startLookLocal: [0, 2.7, -1.0],
        endLookLocal: [0, 2.8, 0],
        startFov: 70,
        endFov: 62,
        rollRad: -0.02,
        shakeOnEnter: 0.75,
        shockwaveRadius: 6.0,
        sparksCount: 26,
      },
      {
        duration: 1.75,
        startCamLocal: [-2.6, 0.9, 5.0],
        endCamLocal: [-1.4, 2.8, 4.0],
        startLookLocal: [0, 2.2, 0.3],
        endLookLocal: [0, 3.2, 0.4],
        startFov: 58,
        endFov: 48,
        rollRad: -0.05,
        shakeOnEnter: 0.6,
        sparksCount: 28,
      },
      {
        duration: 1.7,
        startCamLocal: [2.0, 3.2, 3.4],
        endCamLocal: [-1.5, 4.7, 3.2],
        startLookLocal: [0, 3.1, 0.4],
        endLookLocal: [0, 4.6, 0.3],
        startFov: 44,
        endFov: 39,
        rollRad: 0.06,
        shakeOnEnter: 0.95,
        shockwaveRadius: 7.0,
        sparksCount: 38,
      },
      {
        duration: 1.1,
        startCamLocal: [-1.5, 2.7, 9.2],
        endCamLocal: [0.0, 2.45, 26.8],
        startLookLocal: [0, 2.9, 0],
        endLookLocal: [0, 2.0, 10.0],
        startFov: 49,
        endFov: 60,
        rollRad: 0.0,
      },
    ],
  },
  3: {
    // Gate III — Greed: The Gilded Tyrant (Descending colossus war-hammer slam & golden shockwave)
    gateRoman: 'III',
    accentCss: '#f59e0b',
    accentHexNum: 0xf59e0b,
    baseBodyY: 1.9,
    riseOffsetY: 1.35, // Descends downward in molten dominance
    armSpreadAngle: 0.64,
    auraPeak: 6.0,
    shots: [
      {
        duration: 1.3,
        startCamLocal: [-4.8, 3.5, 13.0],
        endCamLocal: [0.8, 2.4, 9.5],
        startLookLocal: [0, 3.8, 0],
        endLookLocal: [0, 3.0, 0],
        startFov: 66,
        endFov: 58,
        rollRad: 0.0,
        shakeOnEnter: 0.5,
      },
      {
        duration: 1.75,
        startCamLocal: [2.8, 0.75, 5.4],
        endCamLocal: [1.9, 2.5, 4.3],
        startLookLocal: [0, 2.1, 0],
        endLookLocal: [0, 3.6, 0],
        startFov: 55,
        endFov: 47,
        rollRad: 0.04,
        shakeOnEnter: 0.9,
        shockwaveRadius: 8.0,
        sparksCount: 36,
      },
      {
        duration: 1.7,
        startCamLocal: [-1.8, 4.2, 3.6],
        endCamLocal: [1.8, 4.8, 3.2],
        startLookLocal: [-0.4, 3.9, 0.2],
        endLookLocal: [0, 4.7, 0.1],
        startFov: 41,
        endFov: 38,
        rollRad: -0.05,
        shakeOnEnter: 0.7,
        sparksCount: 30,
      },
      {
        duration: 1.1,
        startCamLocal: [1.3, 2.6, 9.5],
        endCamLocal: [0.0, 2.45, 26.8],
        startLookLocal: [0, 2.8, 0],
        endLookLocal: [0, 2.0, 10.0],
        startFov: 48,
        endFov: 60,
        rollRad: 0.0,
      },
    ],
  },
  4: {
    // Gate IV — Wrath: The Red Calamity (Volcanic hellfire surge, magma fissure flare)
    gateRoman: 'IV',
    accentCss: '#ef4444',
    accentHexNum: 0xef4444,
    baseBodyY: 2.0,
    riseOffsetY: -1.1,
    armSpreadAngle: 0.95,
    auraPeak: 6.8,
    shots: [
      {
        duration: 1.3,
        startCamLocal: [5.4, 1.8, 12.6],
        endCamLocal: [-2.0, 2.1, 9.2],
        startLookLocal: [0, 2.8, 0],
        endLookLocal: [0, 3.0, 0],
        startFov: 68,
        endFov: 60,
        rollRad: 0.025,
        shakeOnEnter: 0.85,
        shockwaveRadius: 7.2,
        sparksCount: 34,
      },
      {
        duration: 1.75,
        startCamLocal: [-2.3, 0.8, 5.0],
        endCamLocal: [1.8, 2.9, 4.1],
        startLookLocal: [0, 2.1, 0],
        endLookLocal: [0, 3.9, 0],
        startFov: 56,
        endFov: 46,
        rollRad: -0.06,
        shakeOnEnter: 0.7,
        sparksCount: 32,
      },
      {
        duration: 1.7,
        startCamLocal: [2.2, 4.9, 3.3],
        endCamLocal: [-1.7, 5.1, 3.0],
        startLookLocal: [0, 4.7, 0.2],
        endLookLocal: [0, 4.9, 0.1],
        startFov: 42,
        endFov: 37,
        rollRad: 0.065,
        shakeOnEnter: 1.0,
        shockwaveRadius: 8.5,
        sparksCount: 42,
      },
      {
        duration: 1.1,
        startCamLocal: [-1.2, 2.5, 9.0],
        endCamLocal: [0.0, 2.45, 26.8],
        startLookLocal: [0, 2.9, 0],
        endLookLocal: [0, 2.0, 10.0],
        startFov: 47,
        endFov: 60,
        rollRad: 0.0,
      },
    ],
  },
  5: {
    // Gate V — Heresy: The Saint of Ash (Levitation descent, inverted wings & violet choir fire)
    gateRoman: 'V',
    accentCss: '#818cf8',
    accentHexNum: 0x818cf8,
    baseBodyY: 2.1,
    riseOffsetY: 1.8, // Descends majestically from floating altitude
    armSpreadAngle: 0.88,
    auraPeak: 5.8,
    shots: [
      {
        duration: 1.4,
        startCamLocal: [-4.6, 4.2, 13.5],
        endCamLocal: [1.6, 2.9, 9.8],
        startLookLocal: [0, 4.5, 0],
        endLookLocal: [0, 3.4, 0],
        startFov: 66,
        endFov: 58,
        rollRad: -0.02,
      },
      {
        duration: 1.75,
        startCamLocal: [2.5, 0.9, 5.2],
        endCamLocal: [-1.7, 3.0, 4.3],
        startLookLocal: [0, 2.8, 0],
        endLookLocal: [0, 4.1, 0],
        startFov: 54,
        endFov: 46,
        rollRad: 0.05,
        shakeOnEnter: 0.45,
        shockwaveRadius: 6.5,
        sparksCount: 28,
      },
      {
        duration: 1.7,
        startCamLocal: [-1.9, 4.9, 3.4],
        endCamLocal: [1.5, 5.1, 3.0],
        startLookLocal: [0, 4.7, 0],
        endLookLocal: [0, 4.9, 0.1],
        startFov: 41,
        endFov: 38,
        rollRad: -0.05,
        shakeOnEnter: 0.6,
        sparksCount: 34,
      },
      {
        duration: 1.1,
        startCamLocal: [1.2, 2.7, 9.4],
        endCamLocal: [0.0, 2.45, 26.8],
        startLookLocal: [0, 3.0, 0],
        endLookLocal: [0, 2.0, 10.0],
        startFov: 48,
        endFov: 60,
        rollRad: 0.0,
      },
    ],
  },
  6: {
    // Gate VI — Violence: The Butcher of Ruin (Colossal cleaver ground-drag, crimson sparks & heavy threat pose)
    gateRoman: 'VI',
    accentCss: '#dc2626',
    accentHexNum: 0xb91c1c,
    baseBodyY: 1.95,
    riseOffsetY: -0.85,
    armSpreadAngle: 0.78,
    auraPeak: 6.4,
    shots: [
      {
        duration: 1.3,
        startCamLocal: [-5.8, 1.4, 12.2],
        endCamLocal: [-2.1, 1.7, 8.6],
        startLookLocal: [0.4, 2.4, 0],
        endLookLocal: [0, 2.7, 0],
        startFov: 70,
        endFov: 60,
        rollRad: 0.035,
        shakeOnEnter: 0.85,
        shockwaveRadius: 6.5,
        sparksCount: 34,
      },
      {
        duration: 1.75,
        startCamLocal: [2.4, 0.7, 4.9],
        endCamLocal: [1.7, 2.6, 3.9],
        startLookLocal: [-0.5, 1.5, 0.4],
        endLookLocal: [0, 3.7, 0.1],
        startFov: 56,
        endFov: 47,
        rollRad: -0.065,
        shakeOnEnter: 0.75,
        sparksCount: 36,
      },
      {
        duration: 1.7,
        startCamLocal: [-2.0, 4.4, 3.2],
        endCamLocal: [1.8, 4.8, 2.9],
        startLookLocal: [-0.3, 4.2, 0.2],
        endLookLocal: [0, 4.7, 0.1],
        startFov: 42,
        endFov: 38,
        rollRad: 0.06,
        shakeOnEnter: 0.95,
        shockwaveRadius: 7.5,
        sparksCount: 40,
      },
      {
        duration: 1.1,
        startCamLocal: [1.3, 2.5, 8.8],
        endCamLocal: [0.0, 2.45, 26.8],
        startLookLocal: [0, 2.9, 0],
        endLookLocal: [0, 2.0, 10.0],
        startFov: 48,
        endFov: 60,
        rollRad: 0.0,
      },
    ],
  },
  7: {
    // Gate VII — Sovereign: The Sovereign of Desire (Astrolabe void descent, blinding white crown flare)
    gateRoman: 'VII',
    accentCss: '#f8fafc',
    accentHexNum: 0xf8fafc,
    baseBodyY: 2.05,
    riseOffsetY: 2.1,
    armSpreadAngle: 0.98,
    auraPeak: 7.5,
    shots: [
      {
        duration: 1.45,
        startCamLocal: [4.5, 5.0, 14.5],
        endCamLocal: [-1.4, 3.0, 10.2],
        startLookLocal: [0, 4.8, 0],
        endLookLocal: [0, 3.6, 0],
        startFov: 68,
        endFov: 58,
        rollRad: 0.0,
        shakeOnEnter: 0.55,
      },
      {
        duration: 1.8,
        startCamLocal: [-2.2, 0.9, 5.4],
        endCamLocal: [1.8, 3.2, 4.4],
        startLookLocal: [0, 3.0, 0],
        endLookLocal: [0, 4.4, 0],
        startFov: 54,
        endFov: 45,
        rollRad: 0.045,
        shakeOnEnter: 0.7,
        shockwaveRadius: 8.5,
        sparksCount: 40,
      },
      {
        duration: 1.75,
        startCamLocal: [1.9, 5.0, 3.3],
        endCamLocal: [-1.6, 5.2, 3.0],
        startLookLocal: [0, 4.9, 0],
        endLookLocal: [0, 5.0, 0],
        startFov: 40,
        endFov: 36,
        rollRad: -0.055,
        shakeOnEnter: 1.0,
        shockwaveRadius: 9.0,
        sparksCount: 48,
      },
      {
        duration: 1.15,
        startCamLocal: [-1.2, 2.7, 9.6],
        endCamLocal: [0.0, 2.45, 26.8],
        startLookLocal: [0, 3.0, 0],
        endLookLocal: [0, 2.0, 10.0],
        startFov: 47,
        endFov: 60,
        rollRad: 0.0,
      },
    ],
  },
};

export class BossEntranceDirector {
  public isActive: boolean = false;

  private boss: BossInstance | null = null;
  private realmDef: RealmDefinition | null = null;
  private profile: BossChoreographyProfile = PROFILES[1];
  private cameraCtrl!: CameraController;
  private particles!: ParticleSystem;
  private dirLight: THREE.DirectionalLight | null = null;
  private rimLight: THREE.DirectionalLight | null = null;
  private playerPos = new THREE.Vector3();
  private bossPos = new THREE.Vector3();
  private onCompleteCallback: (() => void) | null = null;

  private elapsed: number = 0;
  private totalDuration: number = 5.9;
  private lastShotIdx: number = -1;
  private reducedMotion: boolean = false;

  private savedDirIntensity: number = 2.0;
  private savedRimIntensity: number = 1.2;
  private savedAuraIntensity: number = 2.5;

  // Orthonormal arena frame anchored at bossPos pointing toward Azrael
  private axisRight = new THREE.Vector3(1, 0, 0);
  private axisForward = new THREE.Vector3(0, 0, 1);

  private tmpCamPos = new THREE.Vector3();
  private tmpLookPos = new THREE.Vector3();
  private tmpStart = new THREE.Vector3();
  private tmpEnd = new THREE.Vector3();

  public startEntrance(
    boss: BossInstance,
    realmDef: RealmDefinition,
    playerPos: THREE.Vector3,
    cameraCtrl: CameraController,
    particles: ParticleSystem,
    dirLight: THREE.DirectionalLight | null,
    rimLight: THREE.DirectionalLight | null,
    onComplete?: () => void
  ) {
    this.boss = boss;
    this.realmDef = realmDef;
    this.profile = PROFILES[realmDef.id] || PROFILES[1];
    this.cameraCtrl = cameraCtrl;
    this.particles = particles;
    this.dirLight = dirLight;
    this.rimLight = rimLight;
    this.onCompleteCallback = onComplete || null;

    this.playerPos.copy(playerPos);
    this.bossPos.copy(boss.group.position);

    this.axisForward.subVectors(this.playerPos, this.bossPos).setY(0);
    if (this.axisForward.lengthSq() < 0.01) {
      this.axisForward.set(0, 0, 1);
    } else {
      this.axisForward.normalize();
    }
    this.axisRight.crossVectors(new THREE.Vector3(0, 1, 0), this.axisForward).normalize();

    this.reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.elapsed = 0;
    this.lastShotIdx = -1;
    this.totalDuration = this.profile.shots.reduce((sum, s) => sum + s.duration, 0);
    this.isActive = true;

    this.savedDirIntensity = dirLight ? dirLight.intensity : 2.0;
    this.savedRimIntensity = rimLight ? rimLight.intensity : 1.2;
    this.savedAuraIntensity = boss.auraLight ? boss.auraLight.intensity : 2.5;

    // Face boss toward Azrael and place into initial theatrical dormant/entry stance
    boss.group.rotation.y = Math.atan2(this.axisForward.x, this.axisForward.z);
    boss.mainBody.position.y = this.profile.baseBodyY + this.profile.riseOffsetY;

    soundEngine.playBossEntranceSwell(realmDef.id);
    voiceManager.playBossIntroDialogue(realmDef.id);
    this.applyFrame(0);
  }

  public update(delta: number) {
    if (!this.isActive || !this.boss) return;

    this.elapsed += delta;
    if (this.elapsed >= this.totalDuration) {
      this.finish(false);
      return;
    }

    this.applyFrame(this.elapsed);
  }

  public skip() {
    if (!this.isActive) return;
    this.finish(true);
  }

  private finish(wasSkipped: boolean) {
    if (!this.isActive) return;
    this.isActive = false;

    if (wasSkipped) {
      soundEngine.stopBossEntranceSwell();
      voiceManager.stopAll();
    }

    // Restore boss rig transforms to neutral combat-ready pose
    if (this.boss) {
      this.boss.mainBody.position.y = this.profile.baseBodyY;
      this.boss.mainBody.rotation.set(0, 0, 0);
      this.boss.head.rotation.set(0, 0, 0);
      this.boss.leftArm.rotation.set(0, 0, 0);
      this.boss.rightArm.rotation.set(0, 0, 0);
      this.boss.auraLight.intensity = this.savedAuraIntensity;
    }

    if (this.dirLight) this.dirLight.intensity = this.savedDirIntensity;
    if (this.rimLight) this.rimLight.intensity = this.savedRimIntensity;

    this.cameraCtrl.releaseCutscene(this.playerPos, this.bossPos);
    const cb = this.onCompleteCallback;
    this.onCompleteCallback = null;
    cb?.();
  }

  private localToWorld(local: [number, number, number], out: THREE.Vector3): THREE.Vector3 {
    out.copy(this.bossPos);
    out.addScaledVector(this.axisRight, local[0]);
    out.y += local[1];
    out.addScaledVector(this.axisForward, local[2]);
    return out;
  }

  private easeInOutCubic(t: number): number {
    const c = Math.max(0, Math.min(1, t));
    return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
  }

  private applyFrame(time: number) {
    if (!this.boss) return;

    // Resolve current shot
    let acc = 0;
    let shotIdx = 0;
    let shotLocalT = 0;
    for (let i = 0; i < this.profile.shots.length; i++) {
      const s = this.profile.shots[i];
      if (time <= acc + s.duration || i === this.profile.shots.length - 1) {
        shotIdx = i;
        shotLocalT = Math.max(0, Math.min(1, (time - acc) / s.duration));
        break;
      }
      acc += s.duration;
    }

    const shot = this.profile.shots[shotIdx];
    const eased = this.easeInOutCubic(shotLocalT);
    const globalProgress = Math.max(0, Math.min(1, time / this.totalDuration));

    // Trigger one-shot VFX cues upon entering a new camera cut
    if (shotIdx !== this.lastShotIdx) {
      this.lastShotIdx = shotIdx;
      if (shot.shakeOnEnter && !this.reducedMotion) {
        this.cameraCtrl.addScreenShake(shot.shakeOnEnter);
      }
      if (shot.shockwaveRadius) {
        this.particles.spawnGroundShockwave(this.bossPos, shot.shockwaveRadius, this.profile.accentHexNum);
      }
      if (shot.sparksCount) {
        this.particles.spawnSparks(
          this.bossPos.clone().add(new THREE.Vector3(0, 2.8, 0)),
          shot.sparksCount,
          this.profile.accentHexNum
        );
      }
    }

    // 1. Camera Position, LookAt, FOV & Dutch Roll
    this.localToWorld(shot.startCamLocal, this.tmpStart);
    this.localToWorld(shot.endCamLocal, this.tmpEnd);
    this.tmpCamPos.lerpVectors(this.tmpStart, this.tmpEnd, eased);

    this.localToWorld(shot.startLookLocal, this.tmpStart);
    this.localToWorld(shot.endLookLocal, this.tmpEnd);
    this.tmpLookPos.lerpVectors(this.tmpStart, this.tmpEnd, eased);

    const fov = this.reducedMotion
      ? THREE.MathUtils.lerp(58, 60, globalProgress)
      : THREE.MathUtils.lerp(shot.startFov, shot.endFov, eased);

    const roll = this.reducedMotion ? 0 : shot.rollRad * Math.sin(shotLocalT * Math.PI);

    this.cameraCtrl.setCutsceneFrame(this.tmpCamPos, this.tmpLookPos, fov, roll);

    // 2. Boss Entrance Animation Choreography (Shot 0 crouch/hover -> Shot 1-2 monumental unfold -> Shot 3 duel stance)
    const riseBlend = THREE.MathUtils.smoothstep(globalProgress, 0.16, 0.62);
    const settleBlend = THREE.MathUtils.smoothstep(globalProgress, 0.72, 0.96);

    const currentBodyY = THREE.MathUtils.lerp(
      this.profile.baseBodyY + this.profile.riseOffsetY,
      this.profile.baseBodyY,
      riseBlend
    );
    this.boss.mainBody.position.y = currentBodyY + Math.sin(time * 2.4) * 0.06;

    // Dramatic upward roar / chest-open flare during Shot 1 & Shot 2, settling in Shot 3
    const roarEnvelope = Math.sin(Math.min(1, Math.max(0, (globalProgress - 0.22) / 0.52)) * Math.PI);
    const armOut = this.profile.armSpreadAngle * roarEnvelope * (1 - settleBlend);
    this.boss.mainBody.rotation.x = THREE.MathUtils.lerp(0.18, -0.18, roarEnvelope) * (1 - settleBlend);
    this.boss.head.rotation.x = THREE.MathUtils.lerp(0.28, -0.24, roarEnvelope) * (1 - settleBlend);
    this.boss.leftArm.rotation.set(-0.35 * roarEnvelope, 0, armOut);
    this.boss.rightArm.rotation.set(-0.55 * roarEnvelope, 0, -armOut);

    // Update Sovereign visual rig custom animated nodes (halos, maws, wings, emissives)
    this.boss.visualRig?.update(time, 0.016, 1);

    // 3. Dramatic Rim Contrast & Boss Aura Surge
    const surge = Math.sin(Math.min(1, Math.max(0, (globalProgress - 0.1) / 0.75)) * Math.PI);
    this.boss.auraLight.intensity = THREE.MathUtils.lerp(this.savedAuraIntensity, this.profile.auraPeak, surge);
    if (this.dirLight) {
      this.dirLight.intensity = this.savedDirIntensity * THREE.MathUtils.lerp(0.72, 1.15, surge);
    }
    if (this.rimLight) {
      this.rimLight.intensity = this.savedRimIntensity * THREE.MathUtils.lerp(1.2, 2.25, surge);
    }
  }

  public getUIState(): BossEntranceState | null {
    if (!this.isActive || !this.realmDef || !this.boss) return null;
    const progress = Math.max(0, Math.min(1, this.elapsed / this.totalDuration));
    const titleVisible = progress >= 0.14 && progress <= 0.94;
    const gateRoman = ROMAN_GATES[this.realmDef.id - 1] || String(this.realmDef.id);

    return {
      isActive: true,
      realmId: this.realmDef.id,
      gateLabel: `Gate ${gateRoman}`,
      realmName: this.realmDef.name,
      bossName: this.boss.name,
      bossTitle: this.realmDef.bossTitle,
      accentHex: this.profile.accentCss,
      progress,
      shotIndex: Math.max(0, this.lastShotIdx),
      titleVisible,
    };
  }
}
