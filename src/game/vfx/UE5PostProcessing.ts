import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { EnvironmentGraphicsPreset } from '../worlds/environments/types';

export interface UE5RealmLightingProfile {
  exposure: number;
  envIntensity: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  contrast: number;
  saturation: number;
  vignette: number;
  shadowTint: number;
  highlightTint: number;
  keyColor: number;
  keyIntensity: number;
  rimColor: number;
  rimIntensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
}

const DEFAULT_UE5_PROFILE: UE5RealmLightingProfile = {
  exposure: 1.10,
  envIntensity: 0.72,
  bloomStrength: 0.74,
  bloomRadius: 0.54,
  bloomThreshold: 0.82,
  contrast: 1.13,
  saturation: 1.04,
  vignette: 0.32,
  shadowTint: 0x070d1a,
  highlightTint: 0xdbeafe,
  keyColor: 0xf7ebd9,
  keyIntensity: 1.92,
  rimColor: 0x7dd3fc,
  rimIntensity: 1.32,
  hemiSky: 0x26354d,
  hemiGround: 0x0a0e18,
  hemiIntensity: 0.64,
};

const REALM_UE5_PROFILES: Record<number, UE5RealmLightingProfile> = {
  // I. Limbo — Cold Moonlit Silver & Shadowed Cyan Ash
  1: {
    exposure: 1.10,
    envIntensity: 0.72,
    bloomStrength: 0.74,
    bloomRadius: 0.54,
    bloomThreshold: 0.83,
    contrast: 1.14,
    saturation: 1.01,
    vignette: 0.34,
    shadowTint: 0x070e1d,
    highlightTint: 0xdbeafe,
    keyColor: 0xdce7fa,
    keyIntensity: 1.92,
    rimColor: 0x38bdf8,
    rimIntensity: 1.38,
    hemiSky: 0x23344f,
    hemiGround: 0x070b14,
    hemiIntensity: 0.64,
  },
  // II. Gluttony — Visceral Crimson & Deep Necrotic Shadow
  2: {
    exposure: 1.08,
    envIntensity: 0.68,
    bloomStrength: 0.78,
    bloomRadius: 0.52,
    bloomThreshold: 0.80,
    contrast: 1.15,
    saturation: 1.08,
    vignette: 0.36,
    shadowTint: 0x170409,
    highlightTint: 0xfecaca,
    keyColor: 0xf7cfc2,
    keyIntensity: 1.88,
    rimColor: 0xef4444,
    rimIntensity: 1.35,
    hemiSky: 0x38101a,
    hemiGround: 0x0f0407,
    hemiIntensity: 0.60,
  },
  // III. Greed — Burnished Ancient Gold & Deep Obsidian Shadows
  3: {
    exposure: 1.11,
    envIntensity: 0.78,
    bloomStrength: 0.80,
    bloomRadius: 0.56,
    bloomThreshold: 0.84,
    contrast: 1.14,
    saturation: 1.08,
    vignette: 0.31,
    shadowTint: 0x160e04,
    highlightTint: 0xfef08a,
    keyColor: 0xf5e2b5,
    keyIntensity: 2.02,
    rimColor: 0xfbbf24,
    rimIntensity: 1.40,
    hemiSky: 0x422a0c,
    hemiGround: 0x120c05,
    hemiIntensity: 0.62,
  },
  // IV. Wrath — Volcanic Embers, Magma Incandescence & Scorched Iron
  4: {
    exposure: 1.10,
    envIntensity: 0.72,
    bloomStrength: 0.86,
    bloomRadius: 0.58,
    bloomThreshold: 0.80,
    contrast: 1.16,
    saturation: 1.10,
    vignette: 0.34,
    shadowTint: 0x1a0504,
    highlightTint: 0xfdba74,
    keyColor: 0xf7c5a6,
    keyIntensity: 1.96,
    rimColor: 0xf97316,
    rimIntensity: 1.42,
    hemiSky: 0x3e120a,
    hemiGround: 0x100504,
    hemiIntensity: 0.60,
  },
  // V. Heresy — Stained-Glass Crimson, Ash Marble & Amethyst Dusk
  5: {
    exposure: 1.09,
    envIntensity: 0.72,
    bloomStrength: 0.74,
    bloomRadius: 0.54,
    bloomThreshold: 0.82,
    contrast: 1.14,
    saturation: 1.05,
    vignette: 0.34,
    shadowTint: 0x11071c,
    highlightTint: 0xfbcfe8,
    keyColor: 0xeed9fa,
    keyIntensity: 1.88,
    rimColor: 0xf43f5e,
    rimIntensity: 1.34,
    hemiSky: 0x2b1438,
    hemiGround: 0x0b0510,
    hemiIntensity: 0.62,
  },
  // VI. Violence — Storm Steel, Lightning Blue & Blood Trench Contrast
  6: {
    exposure: 1.09,
    envIntensity: 0.74,
    bloomStrength: 0.72,
    bloomRadius: 0.50,
    bloomThreshold: 0.83,
    contrast: 1.17,
    saturation: 1.04,
    vignette: 0.36,
    shadowTint: 0x090d17,
    highlightTint: 0xbfdbfe,
    keyColor: 0xd4e2fa,
    keyIntensity: 1.92,
    rimColor: 0xdc2626,
    rimIntensity: 1.35,
    hemiSky: 0x1c2638,
    hemiGround: 0x0d0507,
    hemiIntensity: 0.60,
  },
  // VII. Sovereign — Weathered Astral Marble, Celestial Violet & Chiaroscuro Contrast
  7: {
    exposure: 1.12,
    envIntensity: 0.76,
    bloomStrength: 0.80,
    bloomRadius: 0.60,
    bloomThreshold: 0.85,
    contrast: 1.13,
    saturation: 1.04,
    vignette: 0.30,
    shadowTint: 0x0e0724,
    highlightTint: 0xf3e8ff,
    keyColor: 0xf0ebfa,
    keyIntensity: 2.00,
    rimColor: 0xc084fc,
    rimIntensity: 1.44,
    hemiSky: 0x2a1c4c,
    hemiGround: 0x0b0817,
    hemiIntensity: 0.66,
  },
};

export function getUE5RealmProfile(realmId: number): UE5RealmLightingProfile {
  return REALM_UE5_PROFILES[realmId] || DEFAULT_UE5_PROFILE;
}

export function detectSoftwareWebGL(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

const UE5FilmicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uContrast: { value: 1.08 },
    uSaturation: { value: 1.06 },
    uVignette: { value: 0.28 },
    uChromatic: { value: 0.0012 },
    uGrain: { value: 0.016 },
    uTime: { value: 0.0 },
    uShadowTint: { value: new THREE.Color(0x091326) },
    uHighlightTint: { value: new THREE.Color(0xdbeafe) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uVignette;
    uniform float uChromatic;
    uniform float uGrain;
    uniform float uTime;
    uniform vec3 uShadowTint;
    uniform vec3 uHighlightTint;
    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      float radial = length(centered);
      vec2 caOffset = centered * uChromatic * radial * 2.2;

      float r = texture2D(tDiffuse, clamp(vUv - caOffset, 0.001, 0.999)).r;
      vec4 base = texture2D(tDiffuse, vUv);
      float b = texture2D(tDiffuse, clamp(vUv + caOffset, 0.001, 0.999)).b;
      vec3 col = vec3(r, base.g, b);

      // Filmic S-curve contrast around mid-pivot
      col = max(col, vec3(0.0));
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, uSaturation);
      col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 4.0);

      // Subtle split-tone lift/gain grading inspired by UE5 PostProcessVolume LUTs
      float shadowWeight = (1.0 - smoothstep(0.0, 0.42, luma)) * 0.16;
      float hiWeight = smoothstep(0.55, 1.15, luma) * 0.08;
      col = mix(col, col * (0.75 + uShadowTint * 1.4), shadowWeight);
      col = mix(col, col * (0.92 + uHighlightTint * 0.18), hiWeight);

      // Cinematic edge vignette
      float vig = 1.0 - smoothstep(0.42, 0.96, radial) * uVignette;
      col *= vig;

      // Fine filmic dither to prevent dark gradient banding
      float n = (hash12(vUv * 1024.0 + fract(uTime * 13.7)) - 0.5) * uGrain;
      col += n;

      gl_FragColor = vec4(max(col, vec3(0.0)), base.a);
    }
  `,
};

export class UE5PostProcessingPipeline {
  public readonly composer: EffectComposer;
  public readonly renderPass: RenderPass;
  public readonly bloomPass: UnrealBloomPass;
  public readonly filmicPass: ShaderPass;
  public readonly outputPass: OutputPass;
  public readonly fxaaPass: ShaderPass;
  public readonly isSoftwareGl: boolean;

  private activeProfile: UE5RealmLightingProfile = DEFAULT_UE5_PROFILE;
  private currentPreset: EnvironmentGraphicsPreset = 'ultra';
  private baseChromatic: number = 0.0009;
  private boostChromatic: number = 0;
  private cinematicVignetteDelta: number = 0;
  private cinematicContrastDelta: number = 0;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number,
    isSoftwareGl: boolean
  ) {
    this.isSoftwareGl = isSoftwareGl;
    this.composer = new EffectComposer(renderer);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(Math.max(1, width), Math.max(1, height)),
      DEFAULT_UE5_PROFILE.bloomStrength,
      DEFAULT_UE5_PROFILE.bloomRadius,
      DEFAULT_UE5_PROFILE.bloomThreshold
    );
    this.composer.addPass(this.bloomPass);

    this.filmicPass = new ShaderPass(UE5FilmicShader);
    this.composer.addPass(this.filmicPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    this.fxaaPass = new ShaderPass(FXAAShader);
    this.composer.addPass(this.fxaaPass);

    this.resize(width, height, renderer.getPixelRatio());
    this.applyPreset('ultra');
  }

  public applyRealmProfile(realmId: number): UE5RealmLightingProfile {
    const profile = getUE5RealmProfile(realmId);
    this.activeProfile = profile;
    this.filmicPass.uniforms.uContrast.value = profile.contrast;
    this.filmicPass.uniforms.uSaturation.value = profile.saturation;
    this.filmicPass.uniforms.uVignette.value = profile.vignette;
    this.filmicPass.uniforms.uShadowTint.value.setHex(profile.shadowTint);
    this.filmicPass.uniforms.uHighlightTint.value.setHex(profile.highlightTint);
    this.syncBloomForPreset();
    return profile;
  }

  public applyPreset(preset: EnvironmentGraphicsPreset): void {
    this.currentPreset = preset;
    if (this.isSoftwareGl || preset === 'low') {
      this.bloomPass.enabled = false;
      this.filmicPass.enabled = false;
      this.fxaaPass.enabled = false;
      return;
    }

    if (preset === 'ultra') {
      this.bloomPass.enabled = true;
      this.filmicPass.enabled = true;
      this.fxaaPass.enabled = true;
      this.filmicPass.uniforms.uGrain.value = 0.015;
    } else {
      // Balanced: Bloom + light Filmic grading, FXAA off for throughput
      this.bloomPass.enabled = true;
      this.filmicPass.enabled = true;
      this.fxaaPass.enabled = false;
      this.filmicPass.uniforms.uGrain.value = 0.0;
    }
    this.syncBloomForPreset();
  }

  private syncBloomForPreset(): void {
    if (this.currentPreset === 'ultra') {
      this.bloomPass.strength = this.activeProfile.bloomStrength;
      this.bloomPass.radius = this.activeProfile.bloomRadius;
      this.bloomPass.threshold = this.activeProfile.bloomThreshold;
    } else if (this.currentPreset === 'balanced') {
      this.bloomPass.strength = this.activeProfile.bloomStrength * 0.72;
      this.bloomPass.radius = this.activeProfile.bloomRadius * 0.72;
      this.bloomPass.threshold = Math.min(0.94, this.activeProfile.bloomThreshold + 0.08);
    }
  }

  public pulseChromaticAberration(amount: number): void {
    this.boostChromatic = Math.max(this.boostChromatic, amount);
  }

  public setCinematicOffsets(vignetteDelta: number, contrastDelta: number): void {
    this.cinematicVignetteDelta = vignetteDelta;
    this.cinematicContrastDelta = contrastDelta;
  }

  public applyWeatherOffsets(bloomDelta: number, vignetteDelta: number, contrastDelta: number): void {
    const baseStrength =
      this.currentPreset === 'ultra'
        ? this.activeProfile.bloomStrength
        : this.currentPreset === 'balanced'
        ? this.activeProfile.bloomStrength * 0.72
        : 0;
    if (this.bloomPass.enabled) {
      this.bloomPass.strength = Math.max(0.2, baseStrength + bloomDelta);
    }
    this.filmicPass.uniforms.uVignette.value = THREE.MathUtils.clamp(
      this.activeProfile.vignette + vignetteDelta + this.cinematicVignetteDelta,
      0.1,
      0.72
    );
    this.filmicPass.uniforms.uContrast.value = THREE.MathUtils.clamp(
      this.activeProfile.contrast + contrastDelta + this.cinematicContrastDelta,
      0.9,
      1.38
    );
  }

  public update(delta: number, elapsed: number, wrathActive: boolean): void {
    this.filmicPass.uniforms.uTime.value = elapsed;
    this.boostChromatic = Math.max(0, this.boostChromatic - delta * 0.012);
    const wrathCA = wrathActive ? 0.0022 : 0;
    const targetCA = this.baseChromatic + wrathCA + this.boostChromatic;
    this.filmicPass.uniforms.uChromatic.value = THREE.MathUtils.lerp(
      this.filmicPass.uniforms.uChromatic.value,
      targetCA,
      Math.min(1, delta * 10)
    );
  }

  public shouldUseComposer(): boolean {
    return !this.isSoftwareGl && this.currentPreset !== 'low';
  }

  public resize(width: number, height: number, pixelRatio: number): void {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    this.composer.setSize(w, h);
    this.bloomPass.resolution.set(w, h);
    const effW = Math.max(1, w * pixelRatio);
    const effH = Math.max(1, h * pixelRatio);
    if (this.fxaaPass.material.uniforms.resolution) {
      this.fxaaPass.material.uniforms.resolution.value.set(1 / effW, 1 / effH);
    }
  }

  public dispose(): void {
    this.composer.dispose();
  }
}
