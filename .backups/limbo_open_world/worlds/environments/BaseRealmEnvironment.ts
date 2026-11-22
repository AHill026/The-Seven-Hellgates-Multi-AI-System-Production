import * as THREE from 'three';
import {
  EnvironmentCylinderCollider,
  EnvironmentGraphicsPreset,
  RealmEnvironment,
} from './types';

export interface SkyDomeConfig {
  zenithColor: number;
  midColor: number;
  horizonColor: number;
  cloudColor: number;
  glowColor: number;
  glowDirection: THREE.Vector3;
  glowSize?: number;
  cloudDensity?: number;
  cloudSpeed?: number;
  starIntensity?: number;
  voidSwirl?: number;
}

export interface AmbientParticleLayerConfig {
  countUltra: number;
  countBalanced: number;
  countLow: number;
  colorPrimary: number;
  colorSecondary: number;
  size: number;
  radius: number;
  minY: number;
  maxY: number;
  speedY: [number, number];
  windX: number;
  windZ: number;
  swirl: number;
  opacity: number;
  additive?: boolean;
  streakAspect?: number;
}

interface ManagedParticleLayer {
  config: AmbientParticleLayerConfig;
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  positions: Float32Array;
  velocities: Float32Array;
  phases: Float32Array;
  maxCount: number;
  activeCount: number;
}

export interface LiquidStreamConfig {
  colorDeep: number;
  colorMid: number;
  colorBright: number;
  flowSpeed: number;
  emissiveBoost?: number;
  opacity?: number;
  scaleX?: number;
  scaleY?: number;
}

// Module-scope scratch variables to avoid per-frame allocations in update loops
const _vDir = new THREE.Vector3();

export abstract class BaseRealmEnvironment implements RealmEnvironment {
  public abstract readonly realmId: number;
  public abstract readonly realmName: string;
  public readonly group: THREE.Group;

  protected scene: THREE.Scene | null = null;
  protected preset: EnvironmentGraphicsPreset = 'ultra';
  protected elapsed: number = 0;

  protected skyUniforms: {
    uTime: { value: number };
    uZenith: { value: THREE.Color };
    uMid: { value: THREE.Color };
    uHorizon: { value: THREE.Color };
    uCloud: { value: THREE.Color };
    uGlowColor: { value: THREE.Color };
    uGlowDir: { value: THREE.Vector3 };
    uGlowSize: { value: number };
    uCloudDensity: { value: number };
    uCloudSpeed: { value: number };
    uStarIntensity: { value: number };
    uVoidSwirl: { value: number };
    uLightning: { value: number };
  } | null = null;

  protected liquidUniformsList: Array<{ uTime: { value: number } }> = [];
  protected particleLayers: ManagedParticleLayer[] = [];
  protected colliders: EnvironmentCylinderCollider[] = [];
  protected highDetailObjects: THREE.Object3D[] = [];
  protected mediumDetailObjects: THREE.Object3D[] = [];

  private trackedGeometries: THREE.BufferGeometry[] = [];
  private trackedMaterials: THREE.Material[] = [];
  private trackedTextures: THREE.Texture[] = [];

  constructor() {
    this.group = new THREE.Group();
  }

  public createEnvironment(scene: THREE.Scene, preset: EnvironmentGraphicsPreset): void {
    this.scene = scene;
    this.preset = preset;
    this.elapsed = 0;
    this.colliders = [];
    this.highDetailObjects = [];
    this.mediumDetailObjects = [];
    this.particleLayers = [];
    this.liquidUniformsList = [];

    this.buildBaseAtmosphere(scene);
    this.buildTerrainAndArchitecture();
    this.createBossArena();
    this.buildEnvironmentalEffects();
    this.applyPresetVisibility();
  }

  protected abstract buildBaseAtmosphere(scene: THREE.Scene): void;
  protected abstract buildTerrainAndArchitecture(): void;
  public abstract createBossArena(): void;
  protected abstract buildEnvironmentalEffects(): void;

  public update(delta: number, playerPos?: THREE.Vector3): void {
    this.elapsed += delta;
    if (this.skyUniforms) {
      this.skyUniforms.uTime.value = this.elapsed;
    }
    for (let i = 0; i < this.liquidUniformsList.length; i++) {
      this.liquidUniformsList[i].uTime.value = this.elapsed;
    }
    this.updateParticleLayers(delta, playerPos);
    this.updateRealmAnimations(delta, playerPos);
  }

  protected updateRealmAnimations(_delta: number, _playerPos?: THREE.Vector3): void {
    // Subclasses override for realm-specific motions (chains, lightning, portals, tendrils, etc.)
  }

  public resolveCollision(position: THREE.Vector3, entityRadius: number = 0.7): void {
    for (let i = 0; i < this.colliders.length; i++) {
      const col = this.colliders[i];
      const dx = position.x - col.x;
      const dz = position.z - col.z;
      const minDist = col.radius + entityRadius;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDist * minDist) {
        if (distSq > 0.00001) {
          const dist = Math.sqrt(distSq);
          const push = minDist / dist;
          position.x = col.x + dx * push;
          position.z = col.z + dz * push;
        } else {
          position.z = col.z + minDist;
        }
      }
    }
  }

  public setGraphicsPreset(preset: EnvironmentGraphicsPreset): void {
    this.preset = preset;
    this.applyPresetVisibility();
  }

  protected applyPresetVisibility(): void {
    const showHigh = this.preset === 'ultra';
    const showMedium = this.preset === 'ultra' || this.preset === 'balanced';

    for (let i = 0; i < this.highDetailObjects.length; i++) {
      this.highDetailObjects[i].visible = showHigh;
    }
    for (let i = 0; i < this.mediumDetailObjects.length; i++) {
      this.mediumDetailObjects[i].visible = showMedium;
    }

    for (let i = 0; i < this.particleLayers.length; i++) {
      const layer = this.particleLayers[i];
      const targetCount =
        this.preset === 'ultra'
          ? layer.config.countUltra
          : this.preset === 'balanced'
          ? layer.config.countBalanced
          : layer.config.countLow;
      layer.activeCount = Math.min(layer.maxCount, Math.max(0, targetCount));
      layer.geometry.setDrawRange(0, layer.activeCount);
    }
  }

  protected addCollider(x: number, z: number, radius: number): void {
    this.colliders.push({ x, z, radius });
  }

  protected registerDetailObject(obj: THREE.Object3D, tier: 'high' | 'medium'): void {
    if (tier === 'high') {
      this.highDetailObjects.push(obj);
    } else {
      this.mediumDetailObjects.push(obj);
    }
  }

  protected trackGeometry<T extends THREE.BufferGeometry>(geom: T): T {
    this.trackedGeometries.push(geom);
    return geom;
  }

  protected trackMaterial<T extends THREE.Material>(mat: T): T {
    this.trackedMaterials.push(mat);
    return mat;
  }

  protected trackTexture<T extends THREE.Texture>(tex: T): T {
    this.trackedTextures.push(tex);
    return tex;
  }

  protected createSkyDome(config: SkyDomeConfig): THREE.Mesh {
    const geom = this.trackGeometry(new THREE.SphereGeometry(175, 32, 20));
    const uniforms = {
      uTime: { value: 0 },
      uZenith: { value: new THREE.Color(config.zenithColor) },
      uMid: { value: new THREE.Color(config.midColor) },
      uHorizon: { value: new THREE.Color(config.horizonColor) },
      uCloud: { value: new THREE.Color(config.cloudColor) },
      uGlowColor: { value: new THREE.Color(config.glowColor) },
      uGlowDir: { value: config.glowDirection.clone().normalize() },
      uGlowSize: { value: config.glowSize ?? 0.22 },
      uCloudDensity: { value: config.cloudDensity ?? 0.55 },
      uCloudSpeed: { value: config.cloudSpeed ?? 0.03 },
      uStarIntensity: { value: config.starIntensity ?? 0.0 },
      uVoidSwirl: { value: config.voidSwirl ?? 0.0 },
      uLightning: { value: 0.0 },
    };
    this.skyUniforms = uniforms;

    const mat = this.trackMaterial(
      new THREE.ShaderMaterial({
        uniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: `
          varying vec3 vWorldDir;
          void main() {
            vWorldDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uZenith;
          uniform vec3 uMid;
          uniform vec3 uHorizon;
          uniform vec3 uCloud;
          uniform vec3 uGlowColor;
          uniform vec3 uGlowDir;
          uniform float uGlowSize;
          uniform float uCloudDensity;
          uniform float uCloudSpeed;
          uniform float uStarIntensity;
          uniform float uVoidSwirl;
          uniform float uLightning;
          varying vec3 vWorldDir;

          float hash21(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            float a = hash21(i);
            float b = hash21(i + vec2(1.0, 0.0));
            float c = hash21(i + vec2(0.0, 1.0));
            float d = hash21(i + vec2(1.0, 1.0));
            return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
          }

          float fbm(vec2 p) {
            float v = 0.0;
            float amp = 0.5;
            for (int i = 0; i < 4; i++) {
              v += amp * noise(p);
              p = p * 2.05 + vec2(17.1, 31.7);
              amp *= 0.5;
            }
            return v;
          }

          void main() {
            vec3 dir = normalize(vWorldDir);
            float h = clamp(dir.y, -0.25, 1.0);
            float hPos = clamp(h, 0.0, 1.0);

            vec3 skyCol = mix(uHorizon, uMid, smoothstep(0.0, 0.34, hPos));
            skyCol = mix(skyCol, uZenith, smoothstep(0.28, 0.92, hPos));

            // Celestial or abyssal horizon glow disc
            float sunDot = max(dot(dir, normalize(uGlowDir)), 0.0);
            float halo = pow(sunDot, 10.0) * 0.65 + smoothstep(1.0 - uGlowSize, 1.0, sunDot) * 0.85;
            skyCol += uGlowColor * halo;

            // Storm clouds mapped on dome projection
            vec2 cloudUv = dir.xz / (abs(dir.y) + 0.32);
            if (uVoidSwirl > 0.01) {
              float ang = length(cloudUv) * 1.4 - uTime * 0.06;
              float ca = cos(ang * uVoidSwirl);
              float sa = sin(ang * uVoidSwirl);
              cloudUv = mat2(ca, -sa, sa, ca) * cloudUv;
            }
            float n1 = fbm(cloudUv * 1.35 + vec2(uTime * uCloudSpeed, uTime * uCloudSpeed * 0.45));
            float n2 = fbm(cloudUv * 2.9 - vec2(uTime * uCloudSpeed * 0.7, 0.0));
            float clouds = smoothstep(1.0 - uCloudDensity, 1.0, n1 * 0.65 + n2 * 0.35);
            float cloudMask = smoothstep(-0.08, 0.22, dir.y);
            skyCol = mix(skyCol, uCloud, clouds * 0.72 * cloudMask);

            // Faint high-altitude stars (Limbo, Heresy, Sovereign)
            if (uStarIntensity > 0.01) {
              vec2 starGrid = floor(dir.xz * 120.0 / (abs(dir.y) + 0.4));
              float st = step(0.992, hash21(starGrid));
              float twinkle = 0.6 + 0.4 * sin(uTime * 2.5 + hash21(starGrid + 9.1) * 6.28);
              skyCol += vec3(0.85, 0.9, 1.0) * st * twinkle * uStarIntensity * smoothstep(0.15, 0.75, dir.y) * (1.0 - clouds * 0.75);
            }

            // Lightning illumination
            skyCol += mix(uGlowColor, vec3(0.85, 0.92, 1.0), 0.5) * uLightning * (0.35 + clouds * 0.85);

            gl_FragColor = vec4(skyCol, 1.0);
          }
        `,
      })
    );

    const mesh = new THREE.Mesh(geom, mat);
    mesh.renderOrder = -10;
    this.group.add(mesh);
    return mesh;
  }

  protected createLiquidMaterial(config: LiquidStreamConfig): THREE.ShaderMaterial {
    const uniforms = {
      uTime: { value: 0 },
      uColorDeep: { value: new THREE.Color(config.colorDeep) },
      uColorMid: { value: new THREE.Color(config.colorMid) },
      uColorBright: { value: new THREE.Color(config.colorBright) },
      uSpeed: { value: config.flowSpeed },
      uEmissiveBoost: { value: config.emissiveBoost ?? 1.0 },
      uOpacity: { value: config.opacity ?? 0.94 },
      uScale: { value: new THREE.Vector2(config.scaleX ?? 3.5, config.scaleY ?? 5.5) },
    };
    this.liquidUniformsList.push(uniforms);

    return this.trackMaterial(
      new THREE.ShaderMaterial({
        uniforms,
        transparent: (config.opacity ?? 0.94) < 0.99,
        side: THREE.DoubleSide,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColorDeep;
          uniform vec3 uColorMid;
          uniform vec3 uColorBright;
          uniform float uSpeed;
          uniform float uEmissiveBoost;
          uniform float uOpacity;
          uniform vec2 uScale;
          varying vec2 vUv;

          void main() {
            vec2 p = vUv * uScale;
            float t = uTime * uSpeed;
            float w1 = sin(p.x * 3.1 + sin(p.y * 2.2 - t * 1.4) * 1.6);
            float w2 = cos(p.y * 4.5 - t * 2.6 + sin(p.x * 5.0 + t * 0.9));
            float vein = smoothstep(0.25, 0.95, (w1 * 0.5 + w2 * 0.5) * 0.5 + 0.5);
            float crest = smoothstep(0.76, 0.98, vein);

            vec3 col = mix(uColorDeep, uColorMid, vein);
            col = mix(col, uColorBright * uEmissiveBoost, crest);
            gl_FragColor = vec4(col, uOpacity);
          }
        `,
      })
    );
  }

  protected createParticleLayer(config: AmbientParticleLayerConfig): THREE.Points {
    const maxCount = Math.max(config.countUltra, config.countBalanced, config.countLow);
    const positions = new Float32Array(maxCount * 3);
    const colors = new Float32Array(maxCount * 3);
    const velocities = new Float32Array(maxCount * 3);
    const phases = new Float32Array(maxCount);

    const c1 = new THREE.Color(config.colorPrimary);
    const c2 = new THREE.Color(config.colorSecondary);
    const tmpCol = new THREE.Color();

    for (let i = 0; i < maxCount; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * config.radius;
      positions[i3] = Math.cos(angle) * dist;
      positions[i3 + 1] = config.minY + Math.random() * (config.maxY - config.minY);
      positions[i3 + 2] = Math.sin(angle) * dist;

      phases[i] = Math.random() * Math.PI * 2;

      tmpCol.copy(c1).lerp(c2, Math.random());
      colors[i3] = tmpCol.r;
      colors[i3 + 1] = tmpCol.g;
      colors[i3 + 2] = tmpCol.b;

      velocities[i3] = (Math.random() - 0.5) * 0.45 + config.windX;
      velocities[i3 + 1] =
        config.speedY[0] + Math.random() * (config.speedY[1] - config.speedY[0]);
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.45 + config.windZ;
    }

    const geometry = this.trackGeometry(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const spriteTex = this.createSoftParticleTexture(config.streakAspect ?? 1);
    const material = this.trackMaterial(
      new THREE.PointsMaterial({
        size: config.size,
        vertexColors: true,
        transparent: true,
        opacity: config.opacity,
        blending: config.additive !== false ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
        map: spriteTex,
      })
    );

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    this.group.add(points);

    const activeCount =
      this.preset === 'ultra'
        ? config.countUltra
        : this.preset === 'balanced'
        ? config.countBalanced
        : config.countLow;
    geometry.setDrawRange(0, activeCount);

    this.particleLayers.push({
      config,
      points,
      geometry,
      material,
      positions,
      velocities,
      phases,
      maxCount,
      activeCount,
    });

    return points;
  }

  private updateParticleLayers(delta: number, playerPos?: THREE.Vector3): void {
    const px = playerPos ? playerPos.x : 0;
    const pz = playerPos ? playerPos.z : 0;

    for (let l = 0; l < this.particleLayers.length; l++) {
      const layer = this.particleLayers[l];
      const count = layer.activeCount;
      if (count <= 0) continue;

      const { positions, velocities, phases, config } = layer;
      const r = config.radius;
      const minY = config.minY;
      const maxY = config.maxY;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const ph = phases[i];
        const swirlX = Math.sin(this.elapsed * 1.4 + ph) * config.swirl;
        const swirlZ = Math.cos(this.elapsed * 1.2 + ph) * config.swirl;

        positions[i3] += (velocities[i3] + swirlX) * delta;
        positions[i3 + 1] += velocities[i3 + 1] * delta;
        positions[i3 + 2] += (velocities[i3 + 2] + swirlZ) * delta;

        const dx = positions[i3] - px;
        if (dx > r) positions[i3] -= r * 2;
        else if (dx < -r) positions[i3] += r * 2;

        const dz = positions[i3 + 2] - pz;
        if (dz > r) positions[i3 + 2] -= r * 2;
        else if (dz < -r) positions[i3 + 2] += r * 2;

        if (positions[i3 + 1] > maxY) {
          positions[i3 + 1] = minY + Math.random() * 0.5;
        } else if (positions[i3 + 1] < minY) {
          positions[i3 + 1] = maxY - Math.random() * 0.5;
        }
      }

      (layer.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  protected createSoftParticleTexture(streakAspect: number = 1): THREE.CanvasTexture {
    const w = 64;
    const h = Math.max(64, Math.round(64 * streakAspect));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);
      ctx.scale(1, streakAspect);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.28, 'rgba(255,255,255,0.85)');
      grad.addColorStop(0.65, 'rgba(255,255,255,0.2)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const tex = new THREE.CanvasTexture(canvas);
    this.trackTexture(tex);
    return tex;
  }

  protected createMistTexture(r: number, g: number, b: number): THREE.CanvasTexture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.48)`);
      grad.addColorStop(0.45, `rgba(${r},${g},${b},0.22)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.trackTexture(tex);
    return tex;
  }

  /**
   * Builds a modular Gothic Pointed Archway structure (reusable across Limbo, Greed, Heresy, Sovereign)
   */
  protected buildGothicArchway(
    width: number,
    height: number,
    depth: number,
    stoneMat: THREE.Material,
    trimMat?: THREE.Material
  ): THREE.Group {
    const archGroup = new THREE.Group();
    const pierW = width * 0.22;
    const pierGeom = this.trackGeometry(new THREE.BoxGeometry(pierW, height * 0.72, depth));
    const leftPier = new THREE.Mesh(pierGeom, stoneMat);
    leftPier.position.set(-width * 0.5 + pierW * 0.5, height * 0.36, 0);
    leftPier.castShadow = true;
    leftPier.receiveShadow = true;
    archGroup.add(leftPier);

    const rightPier = new THREE.Mesh(pierGeom, stoneMat);
    rightPier.position.set(width * 0.5 - pierW * 0.5, height * 0.36, 0);
    rightPier.castShadow = true;
    rightPier.receiveShadow = true;
    archGroup.add(rightPier);

    // Pointed gothic rib segments meeting at peak
    const ribGeom = this.trackGeometry(new THREE.BoxGeometry(width * 0.56, pierW * 0.85, depth * 0.92));
    const ribL = new THREE.Mesh(ribGeom, trimMat || stoneMat);
    ribL.position.set(-width * 0.22, height * 0.83, 0);
    ribL.rotation.z = 0.62;
    ribL.castShadow = true;
    archGroup.add(ribL);

    const ribR = new THREE.Mesh(ribGeom, trimMat || stoneMat);
    ribR.position.set(width * 0.22, height * 0.83, 0);
    ribR.rotation.z = -0.62;
    ribR.castShadow = true;
    archGroup.add(ribR);

    return archGroup;
  }

  /**
   * Builds a gothic spire cluster silhouette for distant cathedrals / palaces
   */
  protected buildCathedralSilhouette(
    bodyWidth: number,
    bodyHeight: number,
    bodyDepth: number,
    spireCount: number,
    stoneMat: THREE.Material,
    windowMat?: THREE.Material
  ): THREE.Group {
    const g = new THREE.Group();
    const naveGeom = this.trackGeometry(new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth));
    const nave = new THREE.Mesh(naveGeom, stoneMat);
    nave.position.y = bodyHeight * 0.5;
    g.add(nave);

    const centralSpireH = bodyHeight * 1.15;
    const spireGeom = this.trackGeometry(new THREE.ConeGeometry(bodyWidth * 0.18, centralSpireH, 4));
    const mainSpire = new THREE.Mesh(spireGeom, stoneMat);
    mainSpire.position.set(0, bodyHeight + centralSpireH * 0.5, 0);
    mainSpire.rotation.y = Math.PI * 0.25;
    g.add(mainSpire);

    const subTowerGeom = this.trackGeometry(
      new THREE.BoxGeometry(bodyWidth * 0.2, bodyHeight * 1.25, bodyDepth * 0.28)
    );
    const subSpireGeom = this.trackGeometry(new THREE.ConeGeometry(bodyWidth * 0.13, bodyHeight * 0.65, 4));

    const sidePairs = Math.max(1, Math.floor(spireCount / 2));
    for (let s = 1; s <= sidePairs; s++) {
      const frac = s / (sidePairs + 0.35);
      const scale = 1 - frac * 0.28;
      for (const side of [-1, 1]) {
        const tower = new THREE.Mesh(subTowerGeom, stoneMat);
        tower.scale.setScalar(scale);
        tower.position.set(side * bodyWidth * 0.48 * frac, bodyHeight * 0.62 * scale, bodyDepth * 0.2);
        g.add(tower);

        const cap = new THREE.Mesh(subSpireGeom, stoneMat);
        cap.scale.setScalar(scale);
        cap.rotation.y = Math.PI * 0.25;
        cap.position.set(
          tower.position.x,
          bodyHeight * 1.24 * scale + bodyHeight * 0.32 * scale,
          tower.position.z
        );
        g.add(cap);
      }
    }

    if (windowMat) {
      const roseGeom = this.trackGeometry(new THREE.CircleGeometry(bodyWidth * 0.14, 16));
      const rose = new THREE.Mesh(roseGeom, windowMat);
      rose.position.set(0, bodyHeight * 0.62, bodyDepth * 0.51);
      g.add(rose);

      const lancetGeom = this.trackGeometry(new THREE.PlaneGeometry(bodyWidth * 0.08, bodyHeight * 0.38));
      for (const lx of [-0.26, 0.26]) {
        const lancet = new THREE.Mesh(lancetGeom, windowMat);
        lancet.position.set(lx * bodyWidth, bodyHeight * 0.44, bodyDepth * 0.51);
        g.add(lancet);
      }
    }

    return g;
  }

  protected setGlowDirection(dir: THREE.Vector3): void {
    if (this.skyUniforms) {
      _vDir.copy(dir).normalize();
      this.skyUniforms.uGlowDir.value.copy(_vDir);
    }
  }

  public dispose(): void {
    this.particleLayers = [];
    this.liquidUniformsList = [];
    this.colliders = [];
    this.highDetailObjects = [];
    this.mediumDetailObjects = [];
    this.skyUniforms = null;

    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }

    for (let i = 0; i < this.trackedGeometries.length; i++) {
      this.trackedGeometries[i].dispose();
    }
    for (let i = 0; i < this.trackedMaterials.length; i++) {
      this.trackedMaterials[i].dispose();
    }
    for (let i = 0; i < this.trackedTextures.length; i++) {
      this.trackedTextures[i].dispose();
    }
    this.trackedGeometries = [];
    this.trackedMaterials = [];
    this.trackedTextures = [];
    this.scene = null;
  }
}
