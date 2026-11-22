/**
 * THE SEVEN HELLGATES — Seven-Realm Dynamic Weather System
 * Toggles smoothly across 'Ash Storm', 'Ember Mist', and 'Void Silence',
 * updating scene fog, 3-point + hemisphere ambient lighting, UE5 grading,
 * and particle drift/turbulence throughout all seven realms.
 */

import * as THREE from 'three';
import { UE5RealmLightingProfile } from './UE5PostProcessing';

export type WeatherState = 'ash_storm' | 'ember_mist' | 'void_silence';

export interface WeatherParticleParams {
  windX: number;
  windZ: number;
  speedScale: number;
  emberBoost: number;
  ashBoost: number;
  opacityScale: number;
  pointSize: number;
}

export interface WeatherDescriptor {
  id: WeatherState;
  label: string;
  shortLabel: string;
  description: string;
  accentHex: string;
  fogDensityMult: number;
  fogTintHex: number;
  fogTintWeight: number;
  dirIntensityMult: number;
  hemiIntensityMult: number;
  rimIntensityMult: number;
  envIntensityMult: number;
  bloomDelta: number;
  vignetteDelta: number;
  contrastDelta: number;
  particles: WeatherParticleParams;
}

export const WEATHER_ORDER: WeatherState[] = ['ash_storm', 'ember_mist', 'void_silence'];

export const WEATHER_DESCRIPTORS: Record<WeatherState, WeatherDescriptor> = {
  ash_storm: {
    id: 'ash_storm',
    label: 'Ash Storm',
    shortLabel: 'Ash Storm',
    description: 'Crosswinds whip swirling soot and stormlight across the realm.',
    accentHex: '#94a3b8',
    fogDensityMult: 1.24,
    fogTintHex: 0x161d29,
    fogTintWeight: 0.30,
    dirIntensityMult: 0.88,
    hemiIntensityMult: 0.86,
    rimIntensityMult: 1.18,
    envIntensityMult: 0.86,
    bloomDelta: -0.04,
    vignetteDelta: 0.04,
    contrastDelta: 0.03,
    particles: {
      windX: 2.35,
      windZ: 0.95,
      speedScale: 1.55,
      emberBoost: 0.85,
      ashBoost: 1.65,
      opacityScale: 1.0,
      pointSize: 0.36,
    },
  },
  ember_mist: {
    id: 'ember_mist',
    label: 'Ember Mist',
    shortLabel: 'Ember Mist',
    description: 'Luminous cinders rise through dense furnace haze and warm twilight.',
    accentHex: '#f59e0b',
    fogDensityMult: 1.42,
    fogTintHex: 0x2e130b,
    fogTintWeight: 0.34,
    dirIntensityMult: 0.96,
    hemiIntensityMult: 0.88,
    rimIntensityMult: 1.22,
    envIntensityMult: 0.90,
    bloomDelta: 0.12,
    vignetteDelta: 0.0,
    contrastDelta: 0.02,
    particles: {
      windX: 0.45,
      windZ: 0.32,
      speedScale: 0.9,
      emberBoost: 1.65,
      ashBoost: 0.72,
      opacityScale: 1.0,
      pointSize: 0.4,
    },
  },
  void_silence: {
    id: 'void_silence',
    label: 'Void Silence',
    shortLabel: 'Void Silence',
    description: 'Air stills to a cold abyssal hush beneath sharp silhouette rimlight.',
    accentHex: '#818cf8',
    fogDensityMult: 0.78,
    fogTintHex: 0x05060b,
    fogTintWeight: 0.44,
    dirIntensityMult: 0.80,
    hemiIntensityMult: 0.62,
    rimIntensityMult: 1.38,
    envIntensityMult: 0.74,
    bloomDelta: -0.10,
    vignetteDelta: 0.08,
    contrastDelta: 0.06,
    particles: {
      windX: 0.04,
      windZ: 0.02,
      speedScale: 0.22,
      emberBoost: 0.45,
      ashBoost: 0.5,
      opacityScale: 0.48,
      pointSize: 0.26,
    },
  },
};

const _baseFogColor = new THREE.Color();
const _tintColor = new THREE.Color();

export class WeatherSystem {
  private static readonly STORAGE_KEY = 'seven_hellgates_weather_state';

  public state: WeatherState = 'ash_storm';

  private baseFogColorHex: number = 0x0d121c;
  private baseFogDensity: number = 0.022;
  private baseBgColorHex: number = 0x07090e;
  private baseEnvIntensity: number = 1.0;

  // Smoothed runtime multipliers (zero-GC)
  private curFogDensityMult: number = 1.24;
  private curFogTintWeight: number = 0.28;
  private curDirMult: number = 0.88;
  private curHemiMult: number = 0.96;
  private curRimMult: number = 1.18;
  private curEnvMult: number = 0.94;
  private curBloomDelta: number = -0.05;
  private curVignetteDelta: number = 0.04;
  private curContrastDelta: number = 0.03;

  public readonly particleParams: WeatherParticleParams = {
    ...WEATHER_DESCRIPTORS.ash_storm.particles,
  };

  constructor() {
    try {
      const saved = localStorage.getItem(WeatherSystem.STORAGE_KEY);
      if (saved === 'ash_storm' || saved === 'ember_mist' || saved === 'void_silence') {
        this.state = saved;
        const d = WEATHER_DESCRIPTORS[this.state];
        this.curFogDensityMult = d.fogDensityMult;
        this.curFogTintWeight = d.fogTintWeight;
        this.curDirMult = d.dirIntensityMult;
        this.curHemiMult = d.hemiIntensityMult;
        this.curRimMult = d.rimIntensityMult;
        this.curEnvMult = d.envIntensityMult;
        this.curBloomDelta = d.bloomDelta;
        this.curVignetteDelta = d.vignetteDelta;
        this.curContrastDelta = d.contrastDelta;
        Object.assign(this.particleParams, d.particles);
      }
    } catch {
      // Ignore storage access restrictions
    }
  }

  public captureRealmBaseline(scene: THREE.Scene, baseEnvIntensity: number): void {
    this.baseEnvIntensity = baseEnvIntensity;
    if (scene.fog instanceof THREE.FogExp2) {
      this.baseFogColorHex = scene.fog.color.getHex();
      this.baseFogDensity = scene.fog.density;
    }
    if (scene.background instanceof THREE.Color) {
      this.baseBgColorHex = scene.background.getHex();
    }
  }

  public setBaseEnvIntensity(baseEnvIntensity: number): void {
    this.baseEnvIntensity = baseEnvIntensity;
  }

  public setState(next: WeatherState): void {
    this.state = next;
    try {
      localStorage.setItem(WeatherSystem.STORAGE_KEY, next);
    } catch {}
  }

  public cycleState(): WeatherState {
    const idx = WEATHER_ORDER.indexOf(this.state);
    const next = WEATHER_ORDER[(idx + 1) % WEATHER_ORDER.length];
    this.setState(next);
    return next;
  }

  public getDescriptor(): WeatherDescriptor {
    return WEATHER_DESCRIPTORS[this.state];
  }

  public update(
    delta: number,
    scene: THREE.Scene,
    profile: UE5RealmLightingProfile,
    dirLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight,
    rimLight: THREE.DirectionalLight,
    skipLightingOverride: boolean = false
  ): { bloomDelta: number; vignetteDelta: number; contrastDelta: number } {
    const target = WEATHER_DESCRIPTORS[this.state];
    const k = 4.2;

    this.curFogDensityMult = THREE.MathUtils.damp(this.curFogDensityMult, target.fogDensityMult, k, delta);
    this.curFogTintWeight = THREE.MathUtils.damp(this.curFogTintWeight, target.fogTintWeight, k, delta);
    this.curDirMult = THREE.MathUtils.damp(this.curDirMult, target.dirIntensityMult, k, delta);
    this.curHemiMult = THREE.MathUtils.damp(this.curHemiMult, target.hemiIntensityMult, k, delta);
    this.curRimMult = THREE.MathUtils.damp(this.curRimMult, target.rimIntensityMult, k, delta);
    this.curEnvMult = THREE.MathUtils.damp(this.curEnvMult, target.envIntensityMult, k, delta);
    this.curBloomDelta = THREE.MathUtils.damp(this.curBloomDelta, target.bloomDelta, k, delta);
    this.curVignetteDelta = THREE.MathUtils.damp(this.curVignetteDelta, target.vignetteDelta, k, delta);
    this.curContrastDelta = THREE.MathUtils.damp(this.curContrastDelta, target.contrastDelta, k, delta);

    this.particleParams.windX = THREE.MathUtils.damp(this.particleParams.windX, target.particles.windX, k, delta);
    this.particleParams.windZ = THREE.MathUtils.damp(this.particleParams.windZ, target.particles.windZ, k, delta);
    this.particleParams.speedScale = THREE.MathUtils.damp(this.particleParams.speedScale, target.particles.speedScale, k, delta);
    this.particleParams.emberBoost = THREE.MathUtils.damp(this.particleParams.emberBoost, target.particles.emberBoost, k, delta);
    this.particleParams.ashBoost = THREE.MathUtils.damp(this.particleParams.ashBoost, target.particles.ashBoost, k, delta);
    this.particleParams.opacityScale = THREE.MathUtils.damp(this.particleParams.opacityScale, target.particles.opacityScale, k, delta);
    this.particleParams.pointSize = THREE.MathUtils.damp(this.particleParams.pointSize, target.particles.pointSize, k, delta);

    if (!skipLightingOverride) {
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.density = this.baseFogDensity * this.curFogDensityMult;
        _baseFogColor.setHex(this.baseFogColorHex);
        _tintColor.setHex(target.fogTintHex);
        _baseFogColor.lerp(_tintColor, this.curFogTintWeight);
        scene.fog.color.copy(_baseFogColor);
      }
      if (scene.background instanceof THREE.Color) {
        _baseFogColor.setHex(this.baseBgColorHex);
        _tintColor.setHex(target.fogTintHex);
        _baseFogColor.lerp(_tintColor, this.curFogTintWeight * 0.75);
        scene.background.copy(_baseFogColor);
      }

      dirLight.intensity = profile.keyIntensity * this.curDirMult;
      hemiLight.intensity = profile.hemiIntensity * this.curHemiMult;
      rimLight.intensity = profile.rimIntensity * this.curRimMult;
      scene.environmentIntensity = this.baseEnvIntensity * this.curEnvMult;
    }

    return {
      bloomDelta: this.curBloomDelta,
      vignetteDelta: this.curVignetteDelta,
      contrastDelta: this.curContrastDelta,
    };
  }
}
