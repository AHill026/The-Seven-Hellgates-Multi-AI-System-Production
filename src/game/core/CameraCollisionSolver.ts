/**
 * The Seven Hellgates - Zero-Allocation Analytical Camera Collision Solver
 * Prevents camera clipping through pillars, walls, arches, and terrain floors
 * using BaseRealmEnvironment cylinder/box colliders and terrain height resolution.
 */

import * as THREE from 'three';
import {
  EnvironmentBoxCollider,
  EnvironmentCylinderCollider,
} from '../worlds/environments/types';

export class CameraCollisionSolver {
  private readonly camMarginRadius = 0.42;
  private readonly minGroundClearance = 0.65;
  private readonly minPullFraction = 0.24;

  private smoothedFraction: number = 1.0;

  public reset(): void {
    this.smoothedFraction = 1.0;
  }

  /**
   * Solves sightline obstruction between `pivot` and `desiredCamPos`, writing the
   * collision-safe world position directly into `outCamPos` with zero heap allocations.
   */
  public solve(
    pivot: THREE.Vector3,
    desiredCamPos: THREE.Vector3,
    outCamPos: THREE.Vector3,
    delta: number,
    getGroundHeightAt?: (x: number, z: number) => number,
    cylinders?: readonly EnvironmentCylinderCollider[],
    boxes?: readonly EnvironmentBoxCollider[],
    bypassObstructionPullIn: boolean = false
  ): void {
    const dx = desiredCamPos.x - pivot.x;
    const dy = desiredCamPos.y - pivot.y;
    const dz = desiredCamPos.z - pivot.z;

    let minT = 1.0;

    if (!bypassObstructionPullIn) {
      const segLenSq2D = dx * dx + dz * dz;

      // 1. Segment vs expanded vertical cylinder colliders (pillars, columns, monoliths)
      if (cylinders && cylinders.length > 0 && segLenSq2D > 1e-6) {
        for (let i = 0; i < cylinders.length; i++) {
          const col = cylinders[i];
          const r = col.radius + this.camMarginRadius;
          const fx = pivot.x - col.x;
          const fz = pivot.z - col.z;

          const a = segLenSq2D;
          const b = 2 * (fx * dx + fz * dz);
          const c = fx * fx + fz * fz - r * r;

          const disc = b * b - 4 * a * c;
          if (disc < 0) continue;

          const sqrtDisc = Math.sqrt(disc);
          const inv2a = 0.5 / a;
          const t0 = (-b - sqrtDisc) * inv2a;
          const t1 = (-b + sqrtDisc) * inv2a;

          // Ignore if pivot itself starts well inside or intersection is behind/beyond segment
          let hitT = -1;
          if (t0 >= 0 && t0 <= 1) {
            hitT = t0;
          } else if (t0 < 0 && t1 > 0 && t1 <= 1) {
            // Pivot is already touching/inside margin; hold close pull
            hitT = this.minPullFraction;
          }

          if (hitT >= 0 && hitT < minT) {
            const hitY = pivot.y + dy * hitT;
            if (col.minY !== undefined && hitY < col.minY - this.camMarginRadius) continue;
            if (col.maxY !== undefined && hitY > col.maxY + this.camMarginRadius) continue;
            minT = Math.max(this.minPullFraction, hitT);
          }
        }
      }

      // 2. Segment vs expanded AABB colliders (arch piers, fortress walls, tombs)
      if (boxes && boxes.length > 0) {
        for (let i = 0; i < boxes.length; i++) {
          const box = boxes[i];
          const minX = box.minX - this.camMarginRadius;
          const maxX = box.maxX + this.camMarginRadius;
          const minZ = box.minZ - this.camMarginRadius;
          const maxZ = box.maxZ + this.camMarginRadius;
          const minY = box.minY !== undefined ? box.minY - this.camMarginRadius : -1000;
          const maxY = box.maxY !== undefined ? box.maxY + this.camMarginRadius : 1000;

          const hitT = this.intersectSegmentAABB(
            pivot.x,
            pivot.y,
            pivot.z,
            dx,
            dy,
            dz,
            minX,
            minY,
            minZ,
            maxX,
            maxY,
            maxZ
          );
          if (hitT >= 0 && hitT < minT) {
            minT = Math.max(this.minPullFraction, hitT);
          }
        }
      }
    }

    // Asymmetric damping: rapid pull-in on obstruction, smooth spring-out on clear sightline
    const dt = Math.max(0, Math.min(0.1, delta));
    const lerpSpeed = minT < this.smoothedFraction ? 22.0 : 7.0;
    this.smoothedFraction = THREE.MathUtils.damp(
      this.smoothedFraction,
      minT,
      lerpSpeed,
      dt
    );

    const t = bypassObstructionPullIn ? 1.0 : this.smoothedFraction;
    outCamPos.set(pivot.x + dx * t, pivot.y + dy * t, pivot.z + dz * t);

    // 3. Universal terrain/arena floor clearance clamp
    if (getGroundHeightAt) {
      const floorAtCam = getGroundHeightAt(outCamPos.x, outCamPos.z);
      const minCamY = floorAtCam + this.minGroundClearance;
      if (outCamPos.y < minCamY) {
        outCamPos.y = minCamY;
      }
    }
  }

  private intersectSegmentAABB(
    ox: number,
    oy: number,
    oz: number,
    dx: number,
    dy: number,
    dz: number,
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number
  ): number {
    let tmin = 0.0;
    let tmax = 1.0;

    // X slab
    if (Math.abs(dx) < 1e-7) {
      if (ox < minX || ox > maxX) return -1;
    } else {
      const invD = 1 / dx;
      let t1 = (minX - ox) * invD;
      let t2 = (maxX - ox) * invD;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return -1;
    }

    // Y slab
    if (Math.abs(dy) < 1e-7) {
      if (oy < minY || oy > maxY) return -1;
    } else {
      const invD = 1 / dy;
      let t1 = (minY - oy) * invD;
      let t2 = (maxY - oy) * invD;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return -1;
    }

    // Z slab
    if (Math.abs(dz) < 1e-7) {
      if (oz < minZ || oz > maxZ) return -1;
    } else {
      const invD = 1 / dz;
      let t1 = (minZ - oz) * invD;
      let t2 = (maxZ - oz) * invD;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return -1;
    }

    return tmin > 0 ? tmin : this.minPullFraction;
  }
}
