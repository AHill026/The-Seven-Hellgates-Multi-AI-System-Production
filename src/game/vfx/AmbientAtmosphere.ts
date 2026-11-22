/**
 * The Seven Hellgates - Ambient Atmospheric Embers & Ash Particle System
 * High-performance, GPU-efficient environmental particle system for dark-fantasy atmosphere.
 * Features toroidal wrapping around the player, wind turbulence, and realm-reactive embers.
 */

import * as THREE from 'three';

export class AmbientAtmosphere {
  public group: THREE.Group;
  private particleCount: number = 650;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private velocities: Float32Array;
  private baseColors: Float32Array;
  private phases: Float32Array;
  private isEmber: Uint8Array;

  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private time: number = 0;

  private readonly boundsRadius = 22.0;
  private readonly boundsHeight = 10.0;
  private readonly minHeight = 0.15;

  constructor() {
    this.group = new THREE.Group();

    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.baseColors = new Float32Array(this.particleCount * 3);
    this.phases = new Float32Array(this.particleCount);
    this.isEmber = new Uint8Array(this.particleCount);

    // Procedural soft-edge particle sprite
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.25)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);

    // Initialize particles: ~55% glowing floating embers, ~45% drifting charcoal ash flakes
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      // Random position in cylinder around origin
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * this.boundsRadius;
      this.positions[i3] = Math.cos(angle) * dist;
      this.positions[i3 + 1] = this.minHeight + Math.random() * this.boundsHeight;
      this.positions[i3 + 2] = Math.sin(angle) * dist;

      this.phases[i] = Math.random() * Math.PI * 2;

      // Classify as Ember (1) or Ash Flake (0)
      if (i < 360) {
        // Floating Ember: glowing warm orange / pale-blue spiritual ember
        this.isEmber[i] = 1;
        // Ember base: warm molten gold (#f59e0b) to pale celestial cyan (#38bdf8)
        const isCyan = Math.random() > 0.45;
        if (isCyan) {
          this.baseColors[i3] = 0.22;
          this.baseColors[i3 + 1] = 0.74;
          this.baseColors[i3 + 2] = 0.98;
        } else {
          this.baseColors[i3] = 0.98;
          this.baseColors[i3 + 1] = 0.58;
          this.baseColors[i3 + 2] = 0.12;
        }

        this.colors[i3] = this.baseColors[i3];
        this.colors[i3 + 1] = this.baseColors[i3 + 1];
        this.colors[i3 + 2] = this.baseColors[i3 + 2];

        this.sizes[i] = 0.18 + Math.random() * 0.18;

        // Upward floating velocity with gentle lateral drift
        this.velocities[i3] = (Math.random() - 0.5) * 0.4;
        this.velocities[i3 + 1] = 0.35 + Math.random() * 0.55;
        this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.4;
      } else {
        // Ash Flake: dark charcoal / slate gray drifting flake
        this.isEmber[i] = 0;
        const shade = 0.18 + Math.random() * 0.15;
        this.baseColors[i3] = shade;
        this.baseColors[i3 + 1] = shade * 1.05;
        this.baseColors[i3 + 2] = shade * 1.15;

        this.colors[i3] = this.baseColors[i3];
        this.colors[i3 + 1] = this.baseColors[i3 + 1];
        this.colors[i3 + 2] = this.baseColors[i3 + 2];

        this.sizes[i] = 0.14 + Math.random() * 0.14;

        // Gentle downward or hovering descent
        this.velocities[i3] = (Math.random() - 0.5) * 0.3;
        this.velocities[i3 + 1] = -(0.15 + Math.random() * 0.3);
        this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;
      }
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.32,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: texture,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.group.add(this.points);
  }

  /**
   * Updates ambient ember and ash motion relative to player position.
   * Particles dynamically wrap within the volume around the player.
   */
  public update(
    delta: number,
    playerPos?: THREE.Vector3,
    _realmAccentColor?: number,
    weather?: {
      windX: number;
      windZ: number;
      speedScale: number;
      emberBoost: number;
      ashBoost: number;
      opacityScale: number;
      pointSize: number;
    }
  ) {
    this.time += delta;
    const px = playerPos ? playerPos.x : 0;
    const py = playerPos ? playerPos.y : 0;
    const pz = playerPos ? playerPos.z : 0;

    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.geometry.attributes.color as THREE.BufferAttribute;

    const speedScale = weather ? weather.speedScale : 1.0;
    const emberBoost = weather ? weather.emberBoost : 1.0;
    const ashBoost = weather ? weather.ashBoost : 1.0;
    if (weather) {
      this.material.opacity = 0.88 * weather.opacityScale;
      this.material.size = weather.pointSize;
    }

    // Atmospheric wind turbulence + directional weather wind
    const windX = Math.sin(this.time * 0.4) * 0.25 + (weather ? weather.windX : 0);
    const windZ = Math.cos(this.time * 0.35) * 0.2 + (weather ? weather.windZ : 0);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const phase = this.phases[i];

      // Update positions with velocities + wind oscillation
      if (this.isEmber[i] === 1) {
        // Floating Ember: ascends, swirls lightly with convection current
        const swirl = Math.sin(this.time * 1.8 + phase) * 0.35 * speedScale;
        this.positions[i3] += (this.velocities[i3] * speedScale + windX + swirl) * delta;
        this.positions[i3 + 1] += this.velocities[i3 + 1] * speedScale * delta;
        this.positions[i3 + 2] += (this.velocities[i3 + 2] * speedScale + windZ + Math.cos(this.time * 1.5 + phase) * 0.3 * speedScale) * delta;

        // Flicker brightness modulated by weather emberBoost
        const flicker = (0.8 + Math.sin(this.time * 4.5 + phase) * 0.25) * emberBoost;
        this.colors[i3] = this.baseColors[i3] * flicker;
        this.colors[i3 + 1] = this.baseColors[i3 + 1] * flicker;
        this.colors[i3 + 2] = this.baseColors[i3 + 2] * flicker;
      } else {
        // Ash Flake: sways down gently like cold snow or falling soot
        const flutter = Math.sin(this.time * 1.2 + phase) * 0.25 * speedScale;
        this.positions[i3] += (this.velocities[i3] * speedScale + windX + flutter) * delta;
        this.positions[i3 + 1] += this.velocities[i3 + 1] * speedScale * delta;
        this.positions[i3 + 2] += (this.velocities[i3 + 2] * speedScale + windZ + flutter * 0.8) * delta;

        // Ash brightness scaled cleanly by weather ashBoost
        this.colors[i3] = this.baseColors[i3] * ashBoost;
        this.colors[i3 + 1] = this.baseColors[i3 + 1] * ashBoost;
        this.colors[i3 + 2] = this.baseColors[i3 + 2] * ashBoost;
      }

      // Toroidal Volume Wrapping around the player
      // X axis wrap
      const dx = this.positions[i3] - px;
      if (dx > this.boundsRadius) {
        this.positions[i3] -= this.boundsRadius * 2;
      } else if (dx < -this.boundsRadius) {
        this.positions[i3] += this.boundsRadius * 2;
      }

      // Z axis wrap
      const dz = this.positions[i3 + 2] - pz;
      if (dz > this.boundsRadius) {
        this.positions[i3 + 2] -= this.boundsRadius * 2;
      } else if (dz < -this.boundsRadius) {
        this.positions[i3 + 2] += this.boundsRadius * 2;
      }

      // Y axis wrap
      if (this.isEmber[i] === 1) {
        // Embers that rise too high re-spawn near the ground
        if (this.positions[i3 + 1] > py + this.boundsHeight) {
          this.positions[i3 + 1] = py + this.minHeight + Math.random() * 0.8;
          // Scatter slightly
          this.positions[i3] = px + (Math.random() - 0.5) * this.boundsRadius * 1.5;
          this.positions[i3 + 2] = pz + (Math.random() - 0.5) * this.boundsRadius * 1.5;
        }
      } else {
        // Ash flakes that fall below ground re-spawn near the top of the canopy
        if (this.positions[i3 + 1] < py + this.minHeight) {
          this.positions[i3 + 1] = py + this.boundsHeight - Math.random() * 0.8;
          this.positions[i3] = px + (Math.random() - 0.5) * this.boundsRadius * 1.5;
          this.positions[i3 + 2] = pz + (Math.random() - 0.5) * this.boundsRadius * 1.5;
        }
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
