/**
 * Project Sevenfold - Procedural 3D Legendary Seal Weapon Factory
 * Generates clean, self-contained PBR & spectral-manifestation meshes
 * for all 7 Seal Weapons without external asset dependencies.
 */

import * as THREE from 'three';
import { WeaponId } from '../types';
import { createBeveledPrisonBlade, createExecutionerGreatsword, createCurvedHorn } from '../entities/CharacterGeometry';
import { materialFactory } from '../vfx/MaterialFactory';
import { WEAPON_BY_ID } from './WeaponRegistry';

export interface BuiltWeaponRig {
  mainGroup: THREE.Group;
  offhandGroup: THREE.Group | null; // Used by The Oathbreaker paired swords
  runeLight: THREE.PointLight | null;
  emissiveMaterials: THREE.MeshStandardMaterial[];
}

function makeSpectralMaterial(colorHex: number, opacity: number = 0.78): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 2.2,
    roughness: 0.15,
    metalness: 0.65,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
  });
}

function makeSolidMetal(colorHex: number, roughness = 0.34, metalness = 0.88): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness,
    metalness,
  });
}

function makeGlowAccent(colorHex: number, intensity = 1.4): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: intensity,
    roughness: 0.2,
    metalness: 0.5,
  });
}

/**
 * Builds any of Azrael's 7 Seal Weapons cleanly with optional spectral manifestation mode.
 */
export function buildSevenfoldWeapon(
  weaponId: WeaponId,
  isSpectral: boolean = false
): BuiltWeaponRig {
  const def = WEAPON_BY_ID[weaponId] || WEAPON_BY_ID.kings_remnant;
  const emissiveMaterials: THREE.MeshStandardMaterial[] = [];

  if (weaponId === 'kings_remnant') {
    if (!isSpectral) {
      const swordBladeMat = materialFactory.createSwordBladeSteel();
      const runeGlowMat = materialFactory.createRunicGlowMaterial();
      const silverMat = materialFactory.createGothicSilver();
      const leatherMat = materialFactory.createWeatheredLeather();
      const res = createExecutionerGreatsword(swordBladeMat, runeGlowMat, silverMat, leatherMat);
      emissiveMaterials.push(runeGlowMat);
      return {
        mainGroup: res.swordGroup,
        offhandGroup: null,
        runeLight: res.runeLight,
        emissiveMaterials,
      };
    } else {
      const specBody = makeSpectralMaterial(def.primaryColorHex, 0.72);
      const specGlow = makeSpectralMaterial(def.secondaryColorHex, 0.92);
      emissiveMaterials.push(specBody, specGlow);
      const res = createBeveledPrisonBlade(specBody, specGlow, specGlow, specBody);
      res.swordGroup.scale.set(0.55, 0.55, 0.55);
      return {
        mainGroup: res.swordGroup,
        offhandGroup: null,
        runeLight: null,
        emissiveMaterials,
      };
    }
  }

  const primaryMat = isSpectral
    ? makeSpectralMaterial(def.primaryColorHex, 0.78)
    : makeSolidMetal(0x1b1d24, 0.36, 0.88);
  const trimMat = isSpectral
    ? makeSpectralMaterial(def.secondaryColorHex, 0.9)
    : makeSolidMetal(def.secondaryColorHex, 0.28, 0.9);
  const glowMat = isSpectral
    ? makeSpectralMaterial(def.primaryColorHex, 0.95)
    : makeGlowAccent(def.primaryColorHex, 1.5);
  emissiveMaterials.push(glowMat);
  if (isSpectral) emissiveMaterials.push(primaryMat, trimMat);

  const mainGroup = new THREE.Group();
  let offhandGroup: THREE.Group | null = null;
  let runeLight: THREE.PointLight | null = null;

  if (!isSpectral) {
    runeLight = new THREE.PointLight(def.primaryColorHex, 0.8, 3.2);
    runeLight.position.set(0, 1.0, 0.1);
    mainGroup.add(runeLight);
  }

  switch (weaponId) {
    case 'last_course': {
      // Colossal Hooked Glaive (Gluttony)
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 2.05, 12), primaryMat);
      shaft.position.y = 0.65;
      shaft.castShadow = !isSpectral;
      mainGroup.add(shaft);

      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.02, 8, 16), glowMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = 1.52;
      mainGroup.add(collar);

      // Hooked crescent glaive blade
      const bladeShape = new THREE.Shape();
      bladeShape.moveTo(0, 0);
      bladeShape.quadraticCurveTo(0.24, 0.28, 0.14, 0.88);
      bladeShape.quadraticCurveTo(0.02, 0.98, -0.09, 0.76);
      bladeShape.quadraticCurveTo(0.04, 0.42, -0.04, 0);
      bladeShape.closePath();

      const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
        depth: 0.028,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.008,
        bevelThickness: 0.01,
      });
      bladeGeom.computeVertexNormals();
      const glaiveBlade = new THREE.Mesh(bladeGeom, glowMat);
      glaiveBlade.position.set(0, 1.5, -0.014);
      glaiveBlade.castShadow = !isSpectral;
      mainGroup.add(glaiveBlade);

      // Back bone-spur hook
      const hook = new THREE.Mesh(
        createCurvedHorn(0.035, 0.28, new THREE.Vector3(-0.18, 0.08, 0), 10, 12),
        trimMat
      );
      hook.position.set(-0.03, 1.65, 0);
      hook.rotation.z = 0.9;
      mainGroup.add(hook);
      break;
    }

    case 'imperial_decree': {
      // Chained War-Mace (Greed)
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.04, 1.55, 12), primaryMat);
      shaft.position.y = 0.48;
      shaft.castShadow = !isSpectral;
      mainGroup.add(shaft);

      // Ornate gold mace head
      const headCore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.21, 0), trimMat);
      headCore.position.y = 1.32;
      headCore.castShadow = !isSpectral;
      mainGroup.add(headCore);

      // 6 flanged blades around the mace head
      for (let i = 0; i < 6; i++) {
        const flange = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.34, 0.16), glowMat);
        const ang = (i / 6) * Math.PI * 2;
        flange.position.set(Math.cos(ang) * 0.16, 1.32, Math.sin(ang) * 0.16);
        flange.rotation.y = -ang;
        mainGroup.add(flange);
      }

      // Spectral lock chain ring orbiting head
      const chainRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 8, 24), glowMat);
      chainRing.position.y = 1.32;
      chainRing.rotation.x = Math.PI / 3;
      mainGroup.add(chainRing);
      break;
    }

    case 'worldrender': {
      // Colossal Two-Handed Executioner's Axe (Wrath)
      const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 1.95, 12), primaryMat);
      haft.position.y = 0.62;
      haft.castShadow = !isSpectral;
      mainGroup.add(haft);

      // Double-bitted molten executioner axe head
      const axeShape = new THREE.Shape();
      axeShape.moveTo(-0.08, -0.25);
      axeShape.lineTo(0.46, -0.45);
      axeShape.quadraticCurveTo(0.58, 0, 0.44, 0.48);
      axeShape.lineTo(-0.08, 0.25);
      axeShape.lineTo(-0.46, 0.42);
      axeShape.quadraticCurveTo(-0.56, 0, -0.46, -0.42);
      axeShape.closePath();

      const axeGeom = new THREE.ExtrudeGeometry(axeShape, {
        depth: 0.055,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.014,
        bevelThickness: 0.016,
      });
      axeGeom.center();
      axeGeom.computeVertexNormals();
      const axeHead = new THREE.Mesh(axeGeom, primaryMat);
      axeHead.position.set(0, 1.44, 0);
      axeHead.castShadow = !isSpectral;
      mainGroup.add(axeHead);

      const magmaCore = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 0.075), glowMat);
      magmaCore.position.set(0, 1.44, 0);
      mainGroup.add(magmaCore);
      break;
    }

    case 'false_scripture': {
      // Ritual Spear with Chained Reliquary (Heresy)
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 2.2, 12), primaryMat);
      pole.position.y = 0.72;
      pole.castShadow = !isSpectral;
      mainGroup.add(pole);

      const spearTip = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.58, 4), glowMat);
      spearTip.position.y = 2.02;
      spearTip.castShadow = !isSpectral;
      mainGroup.add(spearTip);

      // Halo crossbar & hanging arcane reliquary
      const cross = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.04), trimMat);
      cross.position.y = 1.66;
      mainGroup.add(cross);

      const reliquary = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), glowMat);
      reliquary.position.set(0.16, 1.46, 0);
      mainGroup.add(reliquary);

      const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 8, 20), glowMat);
      haloRing.position.y = 1.66;
      mainGroup.add(haloRing);
      break;
    }

    case 'torturers_grace': {
      // Executioner's Poleaxe with Chain Hook (Violence)
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 2.0, 12), primaryMat);
      shaft.position.y = 0.65;
      shaft.castShadow = !isSpectral;
      mainGroup.add(shaft);

      const halberdHead = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.52, 0.05), primaryMat);
      halberdHead.position.set(0.14, 1.52, 0);
      halberdHead.castShadow = !isSpectral;
      mainGroup.add(halberdHead);

      const bloodEdge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.54, 0.056), glowMat);
      bloodEdge.position.set(0.29, 1.52, 0);
      mainGroup.add(bloodEdge);

      const topSpike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.42, 4), trimMat);
      topSpike.position.y = 1.94;
      mainGroup.add(topSpike);

      const rearHook = new THREE.Mesh(
        createCurvedHorn(0.032, 0.34, new THREE.Vector3(-0.22, -0.05, 0), 10, 12),
        glowMat
      );
      rearHook.position.set(-0.04, 1.54, 0);
      rearHook.rotation.z = Math.PI * 0.55;
      mainGroup.add(rearHook);
      break;
    }

    case 'oathbreaker': {
      // Paired Mirrored Swords (Treachery)
      const buildSingleMirroredBlade = (mirrorSign: number) => {
        const g = new THREE.Group();
        const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.34, 10), primaryMat);
        hilt.position.y = 0.02;
        g.add(hilt);

        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.045), trimMat);
        guard.position.y = 0.18;
        guard.rotation.z = mirrorSign * 0.18;
        g.add(guard);

        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.075, 1.25, 0.022), trimMat);
        blade.position.y = 0.82;
        blade.castShadow = !isSpectral;
        g.add(blade);

        const edgeCore = new THREE.Mesh(new THREE.BoxGeometry(0.024, 1.18, 0.028), glowMat);
        edgeCore.position.y = 0.82;
        g.add(edgeCore);

        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.22, 4), glowMat);
        tip.position.y = 1.54;
        tip.rotation.y = Math.PI / 4;
        g.add(tip);

        return g;
      };

      const mainBlade = buildSingleMirroredBlade(1);
      mainGroup.add(mainBlade);
      offhandGroup = buildSingleMirroredBlade(-1);
      break;
    }
  }

  return {
    mainGroup,
    offhandGroup,
    runeLight,
    emissiveMaterials,
  };
}
