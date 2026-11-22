/**
 * The Seven Hellgates - Particle & Combat VFX System
 */

import * as THREE from 'three';
import { AmbientAtmosphere } from './AmbientAtmosphere';
import { WeatherParticleParams } from './WeatherSystem';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
}

interface SlashArc {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  baseScale: number;
}

interface Shockwave {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  maxRadius: number;
}

export class ParticleSystem {
  public group: THREE.Group;
  public ambientAtmosphere: AmbientAtmosphere;
  private particles: Particle[] = [];
  private slashArcs: SlashArc[] = [];
  private shockwaves: Shockwave[] = [];

  private pointsGeometry: THREE.BufferGeometry;
  private pointsMaterial: THREE.PointsMaterial;
  private pointsMesh: THREE.Points;
  private maxParticles = 1200;

  private positionsArray: Float32Array;
  private colorsArray: Float32Array;

  constructor() {
    this.group = new THREE.Group();

    // Ambient floating embers & falling ash for dark-fantasy atmosphere
    this.ambientAtmosphere = new AmbientAtmosphere();
    this.group.add(this.ambientAtmosphere.group);

    // Reusable Points Particle System
    this.positionsArray = new Float32Array(this.maxParticles * 3);
    this.colorsArray = new Float32Array(this.maxParticles * 3);

    this.pointsGeometry = new THREE.BufferGeometry();
    this.pointsGeometry.setAttribute('position', new THREE.BufferAttribute(this.positionsArray, 3));
    this.pointsGeometry.setAttribute('color', new THREE.BufferAttribute(this.colorsArray, 3));

    // Create soft particle dot texture procedurally
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
      grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    this.pointsMaterial = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: particleTexture,
    });

    this.pointsMesh = new THREE.Points(this.pointsGeometry, this.pointsMaterial);
    this.pointsMesh.frustumCulled = false;
    this.group.add(this.pointsMesh);
  }

  public spawnSparks(origin: THREE.Vector3, count: number = 20, colorHex: number = 0x38bdf8) {
    const c = new THREE.Color(colorHex);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 6 + 1.5,
        (Math.random() - 0.5) * 8
      );
      this.particles.push({
        position: origin.clone(),
        velocity: vel,
        color: c.clone().multiplyScalar(1.2),
        size: 0.25 + Math.random() * 0.25,
        alpha: 1,
        maxLife: 0.35 + Math.random() * 0.3,
        life: 0,
      });
    }
  }

  public spawnStaggerBurst(origin: THREE.Vector3, colorHex: number = 0xfbbf24) {
    // 1. Dual radiating ground shockwaves (golden posture break)
    this.spawnGroundShockwave(origin, 5.5, colorHex);
    setTimeout(() => {
      this.spawnGroundShockwave(origin, 7.5, 0xffffff);
    }, 90);

    // 2. High-intensity golden & brilliant white critical sparks
    const gold = new THREE.Color(colorHex);
    const white = new THREE.Color(0xffffff);
    for (let i = 0; i < 55; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.random() * 8 + 3,
        Math.sin(angle) * speed
      );
      this.particles.push({
        position: origin.clone().add(new THREE.Vector3(0, 1.2, 0)),
        velocity: vel,
        color: (i % 2 === 0 ? gold : white).clone().multiplyScalar(1.6),
        size: 0.45 + Math.random() * 0.35,
        alpha: 1,
        maxLife: 0.65 + Math.random() * 0.45,
        life: 0,
      });
    }
  }

  public spawnBlood(origin: THREE.Vector3, count: number = 18) {
    const crimson = new THREE.Color(0x880000);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4
      );
      this.particles.push({
        position: origin.clone(),
        velocity: vel,
        color: crimson,
        size: 0.3 + Math.random() * 0.2,
        alpha: 1,
        maxLife: 0.5 + Math.random() * 0.3,
        life: 0,
      });
    }
  }

  public spawnEmbers(origin: THREE.Vector3, colorHex: number = 0x38bdf8, count: number = 5) {
    const c = new THREE.Color(colorHex);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        position: origin.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 1.5,
          (Math.random() - 0.5) * 2
        )),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          Math.random() * 1.2 + 0.4,
          (Math.random() - 0.5) * 0.8
        ),
        color: c,
        size: 0.2 + Math.random() * 0.15,
        alpha: 0.9,
        maxLife: 1.0 + Math.random() * 0.8,
        life: 0,
      });
    }
  }

  public spawnSlashArc(position: THREE.Vector3, rotation: THREE.Euler, colorHex: number = 0x38bdf8, isHeavy: boolean = false) {
    const radius = isHeavy ? 2.8 : 2.2;
    const arcAngle = isHeavy ? Math.PI * 1.1 : Math.PI * 0.85;
    const geometry = new THREE.RingGeometry(radius * 0.65, radius, 32, 1, 0, arcAngle);
    
    const material = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position).add(new THREE.Vector3(0, 1.2, 0));
    mesh.rotation.copy(rotation);
    mesh.rotateX(Math.PI / 2 + (Math.random() - 0.5) * 0.3);
    mesh.rotateZ((Math.random() - 0.5) * 0.4);

    this.group.add(mesh);
    this.slashArcs.push({
      mesh,
      life: 0,
      maxLife: isHeavy ? 0.32 : 0.22,
      baseScale: 1.0,
    });
  }

  public spawnGroundShockwave(position: THREE.Vector3, maxRadius: number = 4.5, colorHex: number = 0x38bdf8) {
    const geometry = new THREE.RingGeometry(0.1, 0.4, 32);
    const material = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(position);
    mesh.position.y += 0.05; // avoid Z-fight with floor

    this.group.add(mesh);
    this.shockwaves.push({
      mesh,
      life: 0,
      maxLife: 0.45,
      maxRadius,
    });
  }

  public update(
    delta: number,
    playerPos?: THREE.Vector3,
    realmAccentColor?: number,
    getGroundY?: (x: number, z: number) => number,
    weather?: WeatherParticleParams
  ) {
    // 0. Update ambient atmospheric floating embers & ash
    this.ambientAtmosphere.update(delta, playerPos, realmAccentColor, weather);

    // 1. Update point particles
    const posAttr = this.pointsGeometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.pointsGeometry.attributes.color as THREE.BufferAttribute;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Gravity and movement
      p.velocity.y -= 12 * delta;
      p.position.addScaledVector(p.velocity, delta);

      // Bounce lightly on local ground elevation
      const floorY = (getGroundY ? getGroundY(p.position.x, p.position.z) : 0) + 0.05;
      if (p.position.y < floorY) {
        p.position.y = floorY;
        p.velocity.y *= -0.3;
        p.velocity.x *= 0.6;
        p.velocity.z *= 0.6;
      }
    }

    // Populate buffers
    const count = this.particles.length;
    for (let i = 0; i < this.maxParticles; i++) {
      const i3 = i * 3;
      if (i < count) {
        const p = this.particles[i];
        const fade = 1 - (p.life / p.maxLife);
        this.positionsArray[i3] = p.position.x;
        this.positionsArray[i3 + 1] = p.position.y;
        this.positionsArray[i3 + 2] = p.position.z;

        this.colorsArray[i3] = p.color.r * fade;
        this.colorsArray[i3 + 1] = p.color.g * fade;
        this.colorsArray[i3 + 2] = p.color.b * fade;
      } else {
        this.positionsArray[i3] = 0;
        this.positionsArray[i3 + 1] = -9999;
        this.positionsArray[i3 + 2] = 0;
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // 2. Update slash arcs
    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      const arc = this.slashArcs[i];
      arc.life += delta;
      const progress = arc.life / arc.maxLife;
      if (progress >= 1) {
        this.group.remove(arc.mesh);
        arc.mesh.geometry.dispose();
        (arc.mesh.material as THREE.Material).dispose();
        this.slashArcs.splice(i, 1);
        continue;
      }

      const mat = arc.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - progress) * 0.9;
      const s = 1 + progress * 0.4;
      arc.mesh.scale.set(s, s, s);
    }

    // 3. Update ground shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const wave = this.shockwaves[i];
      wave.life += delta;
      const progress = wave.life / wave.maxLife;
      if (progress >= 1) {
        this.group.remove(wave.mesh);
        wave.mesh.geometry.dispose();
        (wave.mesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }

      const currentRadius = 0.5 + progress * (wave.maxRadius - 0.5);
      wave.mesh.scale.set(currentRadius, currentRadius, 1);
      const mat = wave.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - progress) * 0.85;
    }
  }

  public dispose() {
    this.ambientAtmosphere.dispose();
    this.pointsGeometry.dispose();
    this.pointsMaterial.dispose();
    this.slashArcs.forEach(a => {
      a.mesh.geometry.dispose();
      (a.mesh.material as THREE.Material).dispose();
    });
    this.shockwaves.forEach(w => {
      w.mesh.geometry.dispose();
      (w.mesh.material as THREE.Material).dispose();
    });
  }
}
