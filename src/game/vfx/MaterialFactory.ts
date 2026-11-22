/**
 * The Seven Hellgates - Advanced PBR Material & Texture Factory
 * Generates procedural high-resolution normal maps, roughness maps, emissive maps,
 * and PBR materials for Azrael's gothic armor, skin, hair, and distinct demon archetypes.
 * 100% code-driven with zero 404 image dependencies; optimized for mobile Safari & desktop WebGL.
 */

import * as THREE from 'three';

class MaterialFactory {
  // Shared Procedural Textures
  private steelNormalMap: THREE.CanvasTexture | null = null;
  private steelRoughnessMap: THREE.CanvasTexture | null = null;
  private steelColorMap: THREE.CanvasTexture | null = null;
  private armorRuneEmissiveMap: THREE.CanvasTexture | null = null;

  private ruinicSteelColorMap: THREE.CanvasTexture | null = null;
  private ruinicSteelNormalMap: THREE.CanvasTexture | null = null;
  private ruinicSteelRoughnessMap: THREE.CanvasTexture | null = null;
  private ruinicSteelMetalnessMap: THREE.CanvasTexture | null = null;
  private ruinicCrimsonEmissiveMap: THREE.CanvasTexture | null = null;

  private leatherNormalMap: THREE.CanvasTexture | null = null;
  private leatherColorMap: THREE.CanvasTexture | null = null;

  private skinColorMap: THREE.CanvasTexture | null = null;
  private skinNormalMap: THREE.CanvasTexture | null = null;
  private skinRoughnessMap: THREE.CanvasTexture | null = null;
  private hairColorMap: THREE.CanvasTexture | null = null;
  private hairNormalMap: THREE.CanvasTexture | null = null;
  private hairRoughnessMap: THREE.CanvasTexture | null = null;
  private blueEyeColorMap: THREE.CanvasTexture | null = null;
  private blueEyeEmissiveMap: THREE.CanvasTexture | null = null;

  private clothColorMap: THREE.CanvasTexture | null = null;
  private crimsonClothColorMap: THREE.CanvasTexture | null = null;
  private clothNormalMap: THREE.CanvasTexture | null = null;
  private clothRoughnessMap: THREE.CanvasTexture | null = null;
  private runeGlowMap: THREE.CanvasTexture | null = null;
  private stoneColorMap: THREE.CanvasTexture | null = null;
  private stoneNormalMap: THREE.CanvasTexture | null = null;
  private stoneRoughnessMap: THREE.CanvasTexture | null = null;
  private boneColorMap: THREE.CanvasTexture | null = null;
  private boneNormalMap: THREE.CanvasTexture | null = null;
  private boneRoughnessMap: THREE.CanvasTexture | null = null;

  private hollowSteelColorMap: THREE.CanvasTexture | null = null;
  private hollowSteelNormalMap: THREE.CanvasTexture | null = null;
  private hollowSteelRoughnessMap: THREE.CanvasTexture | null = null;
  private hollowSteelRuneEmissiveMap: THREE.CanvasTexture | null = null;

  // Demon Textures
  private hellspawnFleshMap: THREE.CanvasTexture | null = null;
  private hellspawnNormalMap: THREE.CanvasTexture | null = null;

  private volcanicArmorMap: THREE.CanvasTexture | null = null;
  private volcanicEmissiveMap: THREE.CanvasTexture | null = null;
  private volcanicNormalMap: THREE.CanvasTexture | null = null;

  private spectralShroudMap: THREE.CanvasTexture | null = null;
  private spectralNormalMap: THREE.CanvasTexture | null = null;

  constructor() {
    this.generateAllTextures();
  }

  private generateAllTextures() {
    // 1. Azrael Gothic Steel & Sovereign Ruinic Damascus Armor Textures
    const steel = this.createDamascusSteelTextures(512, 512);
    this.steelNormalMap = steel.normal;
    this.steelRoughnessMap = steel.roughness;
    this.steelColorMap = steel.color;
    this.armorRuneEmissiveMap = this.createArmorRuneEmissiveTexture(256, 512);

    const ruinicSteel = this.createRuinicDamascusTextures(1024, 1024);
    this.ruinicSteelColorMap = ruinicSteel.color;
    this.ruinicSteelNormalMap = ruinicSteel.normal;
    this.ruinicSteelRoughnessMap = ruinicSteel.roughness;
    this.ruinicSteelMetalnessMap = ruinicSteel.metalness;
    this.ruinicCrimsonEmissiveMap = this.createRuinicCrimsonEmissiveTexture(1024, 1024);

    // 2. Weathered Battled Leather Textures
    const leather = this.createLeatherTextures(512, 512);
    this.leatherNormalMap = leather.normal;
    this.leatherColorMap = leather.color;

    // 3. Natural Skin, Elden Ring Anisotropic Hair & Blue Iris Eye Textures
    const skin = this.createSkinTextures(512, 512);
    this.skinColorMap = skin.color;
    this.skinNormalMap = skin.normal;
    this.skinRoughnessMap = skin.roughness;

    const hair = this.createHairStrandTextures(512, 512);
    this.hairColorMap = hair.color;
    this.hairNormalMap = hair.normal;
    this.hairRoughnessMap = hair.roughness;

    const blueEye = this.createBlueEyeTextures(256);
    this.blueEyeColorMap = blueEye.color;
    this.blueEyeEmissiveMap = blueEye.emissive;

    // 4. Blender Woven Cloth, Runes, Basalt Stone & Calcified Bone
    const darkCloth = this.createClothPBRTextures(512, 512, [16, 18, 25]);
    this.clothColorMap = darkCloth.color;
    this.clothNormalMap = darkCloth.normal;
    this.clothRoughnessMap = darkCloth.roughness;
    this.crimsonClothColorMap = this.createClothPBRTextures(512, 512, [112, 24, 34]).color;

    this.runeGlowMap = this.createRuneGlowTexture(256, 1024);

    const stone = this.createStonePBRTextures(512, 512);
    this.stoneColorMap = stone.color;
    this.stoneNormalMap = stone.normal;
    this.stoneRoughnessMap = stone.roughness;

    const bone = this.createBonePBRTextures(512, 512);
    this.boneColorMap = bone.color;
    this.boneNormalMap = bone.normal;
    this.boneRoughnessMap = bone.roughness;

    const hollowSteel = this.createHollowMonarchDamascusTextures(512, 512);
    this.hollowSteelColorMap = hollowSteel.color;
    this.hollowSteelNormalMap = hollowSteel.normal;
    this.hollowSteelRoughnessMap = hollowSteel.roughness;
    this.hollowSteelRuneEmissiveMap = this.createHollowMonarchRuneEmissiveTexture(512, 512);

    // 5. Demon Textures (Hellspawn, Hellbrute, Shade)
    const hellspawn = this.createHellspawnTextures(512, 512);
    this.hellspawnFleshMap = hellspawn.color;
    this.hellspawnNormalMap = hellspawn.normal;

    const volcanic = this.createVolcanicCrackedTextures(512, 512);
    this.volcanicArmorMap = volcanic.color;
    this.volcanicEmissiveMap = volcanic.emissive;
    this.volcanicNormalMap = volcanic.normal;

    const spectral = this.createSpectralSmokeTextures(512, 512);
    this.spectralShroudMap = spectral.color;
    this.spectralNormalMap = spectral.normal;
  }

  // =========================================================================
  // 1. AZRAEL DAMASCUS GOTHIC STEEL PROCEDURAL TEXTURES
  // =========================================================================

  private createDamascusSteelTextures(width: number, height: number): {
    color: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = width; canvasC.height = height;
    const ctxC = canvasC.getContext('2d')!;

    const canvasN = document.createElement('canvas');
    canvasN.width = width; canvasN.height = height;
    const ctxN = canvasN.getContext('2d')!;

    const canvasR = document.createElement('canvas');
    canvasR.width = width; canvasR.height = height;
    const ctxR = canvasR.getContext('2d')!;

    const imgC = ctxC.createImageData(width, height);
    const dataC = imgC.data;

    const imgN = ctxN.createImageData(width, height);
    const dataN = imgN.data;

    const imgR = ctxR.createImageData(width, height);
    const dataR = imgR.data;

    const heights = new Float32Array(width * height);

    // Generate heightmap with Damascus folds, micro-scratches, and hammered pits
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        // Folded steel wave pattern
        const fold1 = Math.sin(x * 0.08 + Math.cos(y * 0.05) * 3.0);
        const fold2 = Math.sin(y * 0.06 + Math.sin(x * 0.04) * 2.5) * 0.5;
        // Fine brushed striations
        const striation = Math.sin(x * 1.5) * 0.08;
        // Battle scratches
        const scratch = Math.sin(x * 0.2 + y * 0.3) > 0.94 ? 0.35 : 0;
        const pit = (Math.random() - 0.5) * 0.06;

        heights[i] = 0.5 + fold1 * 0.15 + fold2 * 0.1 + striation + scratch + pit;

        // Base Color: Blackened Damascus steel (#12151e) with silver edge highlights (#7d879c)
        const isEdgeOrScratch = scratch > 0 || Math.abs(fold1) > 0.92;
        const rBase = isEdgeOrScratch ? 85 : 18;
        const gBase = isEdgeOrScratch ? 95 : 21;
        const bBase = isEdgeOrScratch ? 115 : 28;

        const idx = i * 4;
        dataC[idx] = Math.min(255, rBase + Math.floor((Math.random() - 0.5) * 6));
        dataC[idx + 1] = Math.min(255, gBase + Math.floor((Math.random() - 0.5) * 6));
        dataC[idx + 2] = Math.min(255, bBase + Math.floor((Math.random() - 0.5) * 6));
        dataC[idx + 3] = 255;

        // Roughness: Polished flats (~0.25), Damascus grain (~0.35), scratches (~0.55)
        const roughVal = isEdgeOrScratch ? 140 : Math.floor(65 + Math.abs(fold1) * 35);
        dataR[idx] = roughVal;
        dataR[idx + 1] = roughVal;
        dataR[idx + 2] = roughVal;
        dataR[idx + 3] = 255;
      }
    }

    // Sobel normal map
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const dx = (heights[y * width + (x + 1)] - heights[y * width + (x - 1)]) * 2.8;
        const dy = (heights[(y + 1) * width + x] - heights[(y - 1) * width + x]) * 2.8;
        const dz = 1.0;

        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        dataN[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
        dataN[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
        dataN[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
        dataN[idx + 3] = 255;
      }
    }

    ctxC.putImageData(imgC, 0, 0);
    ctxN.putImageData(imgN, 0, 0);
    ctxR.putImageData(imgR, 0, 0);

    const texC = new THREE.CanvasTexture(canvasC);
    texC.colorSpace = THREE.SRGBColorSpace;
    texC.wrapS = THREE.RepeatWrapping; texC.wrapT = THREE.RepeatWrapping;
    texC.repeat.set(2, 2);

    const texN = new THREE.CanvasTexture(canvasN);
    texN.wrapS = THREE.RepeatWrapping; texN.wrapT = THREE.RepeatWrapping;
    texN.repeat.set(2, 2);

    const texR = new THREE.CanvasTexture(canvasR);
    texR.wrapS = THREE.RepeatWrapping; texR.wrapT = THREE.RepeatWrapping;
    texR.repeat.set(2, 2);

    return { color: texC, normal: texN, roughness: texR };
  }

  /**
   * Subtle Icy-Blue Emissive Runic Armor Inlays
   */
  private createArmorRuneEmissiveTexture(width: number, height: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 8;

    // Draw intricate runes running along the armor ridges
    for (let y = 30; y < height - 30; y += 65) {
      ctx.beginPath();
      ctx.moveTo(width * 0.5, y);
      ctx.lineTo(width * 0.5 + 20, y + 20);
      ctx.lineTo(width * 0.5 - 20, y + 35);
      ctx.lineTo(width * 0.5, y + 50);
      ctx.stroke();

      // Flanking occult dots
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(width * 0.5 + 28, y + 25, 2.5, 0, Math.PI * 2);
      ctx.arc(width * 0.5 - 28, y + 25, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * High-Resolution (1024px) Sovereign-Forged Ruinic Damascus Steel Texture Set
   * Combines blackened gunmetal base, multi-octave flowing silver Damascus grain,
   * engraved border filigree, forged surface roughness variance, and bevel metalness highlights.
   */
  private createRuinicDamascusTextures(width: number, height: number): {
    color: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
    metalness: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = width; canvasC.height = height;
    const ctxC = canvasC.getContext('2d')!;

    const canvasN = document.createElement('canvas');
    canvasN.width = width; canvasN.height = height;
    const ctxN = canvasN.getContext('2d')!;

    const canvasR = document.createElement('canvas');
    canvasR.width = width; canvasR.height = height;
    const ctxR = canvasR.getContext('2d')!;

    const canvasM = document.createElement('canvas');
    canvasM.width = width; canvasM.height = height;
    const ctxM = canvasM.getContext('2d')!;

    const imgC = ctxC.createImageData(width, height);
    const dataC = imgC.data;
    const imgN = ctxN.createImageData(width, height);
    const dataN = imgN.data;
    const imgR = ctxR.createImageData(width, height);
    const dataR = imgR.data;
    const imgM = ctxM.createImageData(width, height);
    const dataM = imgM.data;

    const heights = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      const ny = y / height;
      // Subtle engraved filigree framing lines along horizontal armor seams
      const seamBand = Math.abs((ny * 4) % 1 - 0.5);
      const isEngravedBorder = seamBand > 0.455 && seamBand < 0.472;

      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const i = y * width + x;

        // Multi-octave domain-warped Damascus steel grain
        const warpX = Math.sin(nx * 14.0 + Math.cos(ny * 10.0) * 2.4) * 0.45
          + Math.sin(ny * 22.0 - nx * 8.0) * 0.22;
        const warpY = Math.cos(ny * 16.0 + Math.sin(nx * 12.0) * 2.1) * 0.45
          + Math.cos(nx * 26.0 + ny * 9.0) * 0.20;
        const wave = Math.sin((nx * 36.0 + warpX * 6.5) + (ny * 28.0 + warpY * 5.8));
        const fineRipple = Math.sin((nx * 96.0 + warpY * 10.0) - (ny * 84.0 + warpX * 9.0)) * 0.35;
        const damascusVal = (wave * 0.72 + fineRipple * 0.28) * 0.5 + 0.5;

        // Sharp forged silver band crests inside blackened gunmetal troughs
        const silverCrest = damascusVal > 0.62
          ? Math.min(1.0, (damascusVal - 0.62) / 0.24)
          : 0.0;

        // Fine directional forge brushing & diagonal combat nicks
        const brush = Math.sin(x * 1.15 + y * 0.12) * 0.035;
        const nickCheck = Math.sin(x * 0.095 + y * 0.145 + warpX * 3.0);
        const isNick = nickCheck > 0.985;

        // Geometric Gothic diamond filigree along engraved bands
        const zig = Math.abs(((nx * 24.0) % 1.0) - 0.5) * 2.0;
        const isFiligree = isEngravedBorder || (seamBand > 0.42 && seamBand < 0.455 && Math.abs(zig - (seamBand - 0.42) / 0.035) < 0.18);

        let h = 0.52 + damascusVal * 0.18 + silverCrest * 0.12 + brush;
        if (isFiligree) h -= 0.28;
        if (isNick) h -= 0.20;
        heights[i] = h;

        const idx = i * 4;
        // Blackened Gunmetal Base (#10141c) -> Flowing Silver Damascus Crest (#8a96ad)
        let rC = 17 + silverCrest * 116 + damascusVal * 16;
        let gC = 20 + silverCrest * 124 + damascusVal * 18;
        let bC = 28 + silverCrest * 138 + damascusVal * 22;

        if (isNick) {
          rC = 148; gC = 158; bC = 176; // Exposed bright steel battle nick
        } else if (isFiligree) {
          rC *= 0.42; gC *= 0.42; bC *= 0.46; // Dark recessed engraving
        }

        dataC[idx] = Math.max(0, Math.min(255, Math.round(rC)));
        dataC[idx + 1] = Math.max(0, Math.min(255, Math.round(gC)));
        dataC[idx + 2] = Math.max(0, Math.min(255, Math.round(bC)));
        dataC[idx + 3] = 255;

        // Forged satin/matte roughness variation: satin silver crests (0.58), blackened gunmetal flats (0.80), recessed engravings (0.92)
        const roughFloat = isFiligree
          ? 0.92
          : isNick
          ? 0.48
          : 0.82 - silverCrest * 0.22 - damascusVal * 0.06;
        const rVal = Math.max(115, Math.min(242, Math.round(roughFloat * 255)));
        dataR[idx] = rVal;
        dataR[idx + 1] = rVal;
        dataR[idx + 2] = rVal;
        dataR[idx + 3] = 255;

        // Metalness variation: bright metal on silver crests/bevels (0.95), dark gunmetal (0.84), engraved crevices (0.48)
        const metalFloat = isFiligree ? 0.48 : isNick ? 0.96 : 0.82 + silverCrest * 0.14;
        const mVal = Math.max(90, Math.min(255, Math.round(metalFloat * 255)));
        dataM[idx] = mVal;
        dataM[idx + 1] = mVal;
        dataM[idx + 2] = mVal;
        dataM[idx + 3] = 255;
      }
    }

    // Crisp Sobel normal map for close-camera engraved relief
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const dx = (heights[y * width + (x + 1)] - heights[y * width + (x - 1)]) * 3.4;
        const dy = (heights[(y + 1) * width + x] - heights[(y - 1) * width + x]) * 3.4;
        const dz = 1.0;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

        dataN[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
        dataN[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
        dataN[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
        dataN[idx + 3] = 255;
      }
    }

    ctxC.putImageData(imgC, 0, 0);
    ctxN.putImageData(imgN, 0, 0);
    ctxR.putImageData(imgR, 0, 0);
    ctxM.putImageData(imgM, 0, 0);

    const configure = (canvas: HTMLCanvasElement, isColor: boolean) => {
      const tex = new THREE.CanvasTexture(canvas);
      if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      tex.anisotropy = 8;
      return tex;
    };

    return {
      color: configure(canvasC, true),
      normal: configure(canvasN, false),
      roughness: configure(canvasR, false),
      metalness: configure(canvasM, false),
    };
  }

  /**
   * Subtle Sovereign Crimson Runic Engraving Emissive Texture (1024px)
   * Inscribes angular Gothic glyphs and hairline runic veins into the blackened Damascus armor.
   */
  private createRuinicCrimsonEmissiveTexture(width: number, height: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const drawGlyphBand = (cx: number, cy: number, scale: number, variant: number) => {
      // Soft outer ember halo
      ctx.strokeStyle = 'rgba(153, 27, 27, 0.45)';
      ctx.lineWidth = 4.5 * scale;
      ctx.beginPath();
      this.traceSovereignRune(ctx, cx, cy, scale, variant);
      ctx.stroke();

      // Crisp inner crimson rune core
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.8 * scale;
      ctx.beginPath();
      this.traceSovereignRune(ctx, cx, cy, scale, variant);
      ctx.stroke();
    };

    // Subtle hairline runic channels framing armor borders
    ctx.strokeStyle = 'rgba(185, 28, 28, 0.55)';
    ctx.lineWidth = 2.0;
    for (const bandY of [height * 0.125, height * 0.375, height * 0.625, height * 0.875]) {
      ctx.beginPath();
      ctx.moveTo(0, bandY);
      ctx.lineTo(width, bandY);
      ctx.stroke();
    }

    // Spaced Sovereign runes embedded along armor panels
    const cols = 6;
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = ((c + 0.5) / cols) * width;
        const cy = ((r + 0.5) / rows) * height;
        drawGlyphBand(cx, cy, 1.0, (r * 3 + c) % 4);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.anisotropy = 8;
    return tex;
  }

  private traceSovereignRune(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale: number,
    variant: number
  ) {
    const h = 24 * scale;
    const w = 13 * scale;
    // Vertical executioner spine
    ctx.moveTo(cx, cy - h);
    ctx.lineTo(cx, cy + h);

    if (variant === 0) {
      // Sovereign diamond seal
      ctx.moveTo(cx, cy - h * 0.72);
      ctx.lineTo(cx + w, cy);
      ctx.lineTo(cx, cy + h * 0.72);
      ctx.lineTo(cx - w, cy);
      ctx.closePath();
    } else if (variant === 1) {
      // Twin inverted thorns
      ctx.moveTo(cx - w, cy - h * 0.45);
      ctx.lineTo(cx, cy - h * 0.1);
      ctx.lineTo(cx + w, cy - h * 0.45);
      ctx.moveTo(cx - w * 0.85, cy + h * 0.48);
      ctx.lineTo(cx, cy + h * 0.12);
      ctx.lineTo(cx + w * 0.85, cy + h * 0.48);
    } else if (variant === 2) {
      // Crossed executioner sigil
      ctx.moveTo(cx - w, cy - h * 0.55);
      ctx.lineTo(cx + w, cy + h * 0.25);
      ctx.moveTo(cx + w, cy - h * 0.55);
      ctx.lineTo(cx - w, cy + h * 0.25);
      ctx.moveTo(cx - w * 0.65, cy + h * 0.68);
      ctx.lineTo(cx + w * 0.65, cy + h * 0.68);
    } else {
      // Gothic crown chevron
      ctx.moveTo(cx - w, cy + h * 0.3);
      ctx.lineTo(cx, cy - h * 0.65);
      ctx.lineTo(cx + w, cy + h * 0.3);
      ctx.moveTo(cx - w * 0.7, cy - h * 0.1);
      ctx.lineTo(cx + w * 0.7, cy - h * 0.1);
    }
  }

  // =========================================================================
  // 2. WEATHERED LEATHER PROCEDURAL TEXTURES
  // =========================================================================

  private createLeatherTextures(width: number, height: number): {
    color: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = width; canvasC.height = height;
    const ctxC = canvasC.getContext('2d')!;

    const canvasN = document.createElement('canvas');
    canvasN.width = width; canvasN.height = height;
    const ctxN = canvasN.getContext('2d')!;

    const imgC = ctxC.createImageData(width, height);
    const dataC = imgC.data;

    const imgN = ctxN.createImageData(width, height);
    const dataN = imgN.data;

    const heights = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        // Pebbled leather cellular pattern
        const cell = Math.sin(x * 0.25) * Math.cos(y * 0.25);
        const fine = (Math.random() - 0.5) * 0.15;
        heights[i] = 0.5 + cell * 0.35 + fine;

        const idx = i * 4;
        // Deep worn brown-black leather (#281d18)
        const tone = Math.floor(cell * 15);
        dataC[idx] = Math.max(20, 36 + tone);
        dataC[idx + 1] = Math.max(15, 26 + tone);
        dataC[idx + 2] = Math.max(10, 20 + tone);
        dataC[idx + 3] = 255;
      }
    }

    // Normal map
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const dx = (heights[y * width + (x + 1)] - heights[y * width + (x - 1)]) * 3.0;
        const dy = (heights[(y + 1) * width + x] - heights[(y - 1) * width + x]) * 3.0;
        const dz = 1.0;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

        dataN[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
        dataN[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
        dataN[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
        dataN[idx + 3] = 255;
      }
    }

    ctxC.putImageData(imgC, 0, 0);
    ctxN.putImageData(imgN, 0, 0);

    const texC = new THREE.CanvasTexture(canvasC);
    texC.colorSpace = THREE.SRGBColorSpace;
    texC.wrapS = THREE.RepeatWrapping; texC.wrapT = THREE.RepeatWrapping;
    texC.repeat.set(3, 3);

    const texN = new THREE.CanvasTexture(canvasN);
    texN.wrapS = THREE.RepeatWrapping; texN.wrapT = THREE.RepeatWrapping;
    texN.repeat.set(3, 3);

    return { color: texC, normal: texN };
  }

  // =========================================================================
  // 3. NATURAL SKIN & HAIR PROCEDURAL TEXTURES
  // =========================================================================

  private createSkinTextures(width: number, height: number): {
    color: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = width; canvasC.height = height;
    const ctxC = canvasC.getContext('2d')!;

    const canvasN = document.createElement('canvas');
    canvasN.width = width; canvasN.height = height;
    const ctxN = canvasN.getContext('2d')!;

    const canvasR = document.createElement('canvas');
    canvasR.width = width; canvasR.height = height;
    const ctxR = canvasR.getContext('2d')!;

    const imgC = ctxC.createImageData(width, height);
    const dataC = imgC.data;

    const imgN = ctxN.createImageData(width, height);
    const dataN = imgN.data;

    const imgR = ctxR.createImageData(width, height);
    const dataR = imgR.data;

    const heights = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const pore = Math.sin(x * 1.4) * Math.cos(y * 1.4) * 0.08;
        const grain = Math.sin(x * 0.11 + Math.cos(y * 0.09) * 1.8) * 0.05;
        const noise = (Math.random() - 0.5) * 0.05;
        heights[i] = 0.5 + pore + grain + noise;

        const idx = i * 4;
        // Pale weathered dark-fantasy skin undertone with subtle micro-mottling
        const tone = pore * 18 + grain * 24 + (Math.random() - 0.5) * 6;
        dataC[idx] = Math.max(0, Math.min(255, Math.round(186 + tone)));
        dataC[idx + 1] = Math.max(0, Math.min(255, Math.round(154 + tone * 0.88)));
        dataC[idx + 2] = Math.max(0, Math.min(255, Math.round(138 + tone * 0.82)));
        dataC[idx + 3] = 255;

        // Skin Roughness: soft matte skin (0.68 to 0.78), zero plastic shine
        const rVal = Math.floor(178 + pore * 42);
        dataR[idx] = rVal;
        dataR[idx + 1] = rVal;
        dataR[idx + 2] = rVal;
        dataR[idx + 3] = 255;
      }
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const dx = (heights[y * width + (x + 1)] - heights[y * width + (x - 1)]) * 1.9;
        const dy = (heights[(y + 1) * width + x] - heights[(y - 1) * width + x]) * 1.9;
        const dz = 1.0;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

        dataN[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
        dataN[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
        dataN[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
        dataN[idx + 3] = 255;
      }
    }

    ctxC.putImageData(imgC, 0, 0);
    ctxN.putImageData(imgN, 0, 0);
    ctxR.putImageData(imgR, 0, 0);

    const texC = new THREE.CanvasTexture(canvasC);
    texC.colorSpace = THREE.SRGBColorSpace;
    texC.wrapS = THREE.RepeatWrapping; texC.wrapT = THREE.RepeatWrapping;
    texC.repeat.set(3, 3);

    const texN = new THREE.CanvasTexture(canvasN);
    texN.wrapS = THREE.RepeatWrapping; texN.wrapT = THREE.RepeatWrapping;
    texN.repeat.set(4, 4);

    const texR = new THREE.CanvasTexture(canvasR);
    texR.wrapS = THREE.RepeatWrapping; texR.wrapT = THREE.RepeatWrapping;
    texR.repeat.set(4, 4);

    return { color: texC, normal: texN, roughness: texR };
  }

  /**
   * Blender Anisotropic Hair Strand PBR Texture Set (Albedo + Normal + Roughness)
   * Longitudinal silky strands, dark charcoal-raven roots, and cool ash-slate highlights
   */
  private createHairStrandTextures(width: number, height: number): {
    color: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = width; canvasC.height = height;
    const ctxC = canvasC.getContext('2d')!;

    const canvasN = document.createElement('canvas');
    canvasN.width = width; canvasN.height = height;
    const ctxN = canvasN.getContext('2d')!;

    const canvasR = document.createElement('canvas');
    canvasR.width = width; canvasR.height = height;
    const ctxR = canvasR.getContext('2d')!;

    const imgC = ctxC.createImageData(width, height);
    const dataC = imgC.data;
    const imgN = ctxN.createImageData(width, height);
    const dataN = imgN.data;
    const imgR = ctxR.createImageData(width, height);
    const dataR = imgR.data;

    const heights = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      const v = y / height;
      // Subtle anisotropic highlight band mid-shaft + darker root & crisp tips
      const sheenBand = Math.exp(-Math.pow((v - 0.42) * 3.4, 2)) * 18;
      const rootDarken = Math.min(1, 0.55 + v * 0.75);

      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const u = x / width;
        // Multi-frequency longitudinal hair fibers with gentle natural wave
        const waveOffset = Math.sin(v * Math.PI * 3.0 + u * 6.0) * 5.0;
        const xf = x + waveOffset;
        const macroClump = Math.sin(xf * 0.14) * 0.45;
        const microStrand = Math.sin(xf * 0.95) * 0.35 + Math.cos(xf * 2.1) * 0.2;
        const h = 0.5 + macroClump * 0.28 + microStrand * 0.22;
        heights[i] = h;

        const idx = i * 4;
        // Raven-obsidian base (#14161e) with subtle cool slate strand glint (#303647)
        const strandShade = Math.max(0, macroClump * 0.5 + microStrand * 0.5 + 0.35);
        const lum = (16 + strandShade * 28 + sheenBand) * rootDarken;
        dataC[idx] = Math.max(8, Math.min(255, Math.round(lum * 0.92)));
        dataC[idx + 1] = Math.max(9, Math.min(255, Math.round(lum * 0.96)));
        dataC[idx + 2] = Math.max(12, Math.min(255, Math.round(lum * 1.12)));
        dataC[idx + 3] = 255;

        // Anisotropic roughness (0.38 along sheen band, 0.72 in deep crevices)
        const rVal = Math.max(85, Math.min(220, Math.round(178 - strandShade * 55 - sheenBand * 1.4)));
        dataR[idx] = rVal;
        dataR[idx + 1] = rVal;
        dataR[idx + 2] = rVal;
        dataR[idx + 3] = 255;
      }
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const dx = (heights[y * width + (x + 1)] - heights[y * width + (x - 1)]) * 3.6;
        const dy = (heights[(y + 1) * width + x] - heights[(y - 1) * width + x]) * 1.1;
        const dz = 1.0;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

        dataN[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
        dataN[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
        dataN[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
        dataN[idx + 3] = 255;
      }
    }

    ctxC.putImageData(imgC, 0, 0);
    ctxN.putImageData(imgN, 0, 0);
    ctxR.putImageData(imgR, 0, 0);

    const texC = new THREE.CanvasTexture(canvasC);
    texC.colorSpace = THREE.SRGBColorSpace;
    texC.wrapS = THREE.RepeatWrapping; texC.wrapT = THREE.ClampToEdgeWrapping;

    const texN = new THREE.CanvasTexture(canvasN);
    texN.wrapS = THREE.RepeatWrapping; texN.wrapT = THREE.ClampToEdgeWrapping;

    const texR = new THREE.CanvasTexture(canvasR);
    texR.wrapS = THREE.RepeatWrapping; texR.wrapT = THREE.ClampToEdgeWrapping;

    return { color: texC, normal: texN, roughness: texR };
  }

  /**
   * Blender Procedural Blue Iris Eye Texture (Albedo + Emissive)
   * Renders dark sclera rim, cobalt limbal ring, radial pale-ice blue iris fibers, and deep pupil
   */
  private createBlueEyeTextures(size: number): {
    color: THREE.CanvasTexture;
    emissive: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = size; canvasC.height = size;
    const ctxC = canvasC.getContext('2d')!;

    const canvasE = document.createElement('canvas');
    canvasE.width = size; canvasE.height = size;
    const ctxE = canvasE.getContext('2d')!;

    // Dark smoky sclera background
    ctxC.fillStyle = '#0f172a';
    ctxC.fillRect(0, 0, size, size);
    ctxE.fillStyle = '#000000';
    ctxE.fillRect(0, 0, size, size);

    const cx = size * 0.5;
    const cy = size * 0.5;
    const irisRadius = size * 0.34;
    const pupilRadius = size * 0.13;

    // Outer shadow sclera ring
    const scleraGrad = ctxC.createRadialGradient(cx, cy, irisRadius * 0.85, cx, cy, size * 0.49);
    scleraGrad.addColorStop(0, '#1e293b');
    scleraGrad.addColorStop(0.55, '#cbd5e1');
    scleraGrad.addColorStop(1, '#334155');
    ctxC.fillStyle = scleraGrad;
    ctxC.beginPath();
    ctxC.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
    ctxC.fill();

    // Rich sapphire-cyan iris disc
    const irisGrad = ctxC.createRadialGradient(cx, cy, pupilRadius, cx, cy, irisRadius);
    irisGrad.addColorStop(0, '#7dd3fc');
    irisGrad.addColorStop(0.45, '#0ea5e9');
    irisGrad.addColorStop(0.82, '#1d4ed8');
    irisGrad.addColorStop(1, '#0c1b4d');
    ctxC.fillStyle = irisGrad;
    ctxC.beginPath();
    ctxC.arc(cx, cy, irisRadius, 0, Math.PI * 2);
    ctxC.fill();

    // Emissive iris glow ring
    const emGrad = ctxE.createRadialGradient(cx, cy, pupilRadius * 0.9, cx, cy, irisRadius);
    emGrad.addColorStop(0, '#bae6fd');
    emGrad.addColorStop(0.55, '#38bdf8');
    emGrad.addColorStop(0.88, '#1d4ed8');
    emGrad.addColorStop(1, '#000000');
    ctxE.fillStyle = emGrad;
    ctxE.beginPath();
    ctxE.arc(cx, cy, irisRadius, 0, Math.PI * 2);
    ctxE.fill();

    // Radial iris muscle striations
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const rIn = pupilRadius * 1.05;
      const rOut = irisRadius * (0.88 + (i % 3) * 0.03);
      ctxC.strokeStyle = i % 2 === 0 ? 'rgba(186, 230, 253, 0.55)' : 'rgba(15, 23, 42, 0.35)';
      ctxC.lineWidth = 1.6;
      ctxC.beginPath();
      ctxC.moveTo(cx + Math.cos(a) * rIn, cy + Math.sin(a) * rIn);
      ctxC.lineTo(cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut);
      ctxC.stroke();

      ctxE.strokeStyle = i % 2 === 0 ? 'rgba(125, 211, 252, 0.65)' : 'rgba(2, 132, 199, 0.25)';
      ctxE.lineWidth = 1.4;
      ctxE.beginPath();
      ctxE.moveTo(cx + Math.cos(a) * rIn, cy + Math.sin(a) * rIn);
      ctxE.lineTo(cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut);
      ctxE.stroke();
    }

    // Crisp dark pupil center
    ctxC.fillStyle = '#020617';
    ctxC.beginPath();
    ctxC.arc(cx, cy, pupilRadius, 0, Math.PI * 2);
    ctxC.fill();

    ctxE.fillStyle = '#030712';
    ctxE.beginPath();
    ctxE.arc(cx, cy, pupilRadius * 0.85, 0, Math.PI * 2);
    ctxE.fill();

    // Specular corneal catchlight dot
    ctxC.fillStyle = '#e0f2fe';
    ctxC.beginPath();
    ctxC.arc(cx - pupilRadius * 0.7, cy - pupilRadius * 0.7, pupilRadius * 0.32, 0, Math.PI * 2);
    ctxC.fill();

    const texC = new THREE.CanvasTexture(canvasC);
    texC.colorSpace = THREE.SRGBColorSpace;
    const texE = new THREE.CanvasTexture(canvasE);
    texE.colorSpace = THREE.SRGBColorSpace;
    return { color: texC, emissive: texE };
  }

  // =========================================================================
  // 4. DEMON PROCEDURAL TEXTURES (HELLSPAWN, HELLBRUTE, SHADE)
  // =========================================================================

  /**
   * Hellspawn: Ash-Gray & Dark Crimson Damaged Flesh
   */
  private createHellspawnTextures(width: number, height: number): {
    color: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = width; canvasC.height = height;
    const ctxC = canvasC.getContext('2d')!;

    const canvasN = document.createElement('canvas');
    canvasN.width = width; canvasN.height = height;
    const ctxN = canvasN.getContext('2d')!;

    const imgC = ctxC.createImageData(width, height);
    const dataC = imgC.data;

    const imgN = ctxN.createImageData(width, height);
    const dataN = imgN.data;

    const heights = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        // Sinewy organic muscle striations
        const sinew = Math.sin(x * 0.12 + Math.cos(y * 0.08) * 2.0);
        const lesion = Math.sin(x * 0.35 + y * 0.25) > 0.65 ? 0.4 : 0;
        heights[i] = 0.5 + sinew * 0.25 + lesion;

        const idx = i * 4;
        // Mottled ash-gray (#423d3d) with deep crimson muscle tears (#781414)
        if (lesion > 0) {
          dataC[idx] = 135;
          dataC[idx + 1] = 22;
          dataC[idx + 2] = 22;
        } else {
          const ash = Math.floor(55 + sinew * 20);
          dataC[idx] = ash + 12;
          dataC[idx + 1] = ash;
          dataC[idx + 2] = ash;
        }
        dataC[idx + 3] = 255;
      }
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const dx = (heights[y * width + (x + 1)] - heights[y * width + (x - 1)]) * 3.5;
        const dy = (heights[(y + 1) * width + x] - heights[(y - 1) * width + x]) * 3.5;
        const dz = 1.0;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

        dataN[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
        dataN[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
        dataN[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
        dataN[idx + 3] = 255;
      }
    }

    ctxC.putImageData(imgC, 0, 0);
    ctxN.putImageData(imgN, 0, 0);

    const texC = new THREE.CanvasTexture(canvasC);
    texC.colorSpace = THREE.SRGBColorSpace;
    texC.wrapS = THREE.RepeatWrapping; texC.wrapT = THREE.RepeatWrapping;
    texC.repeat.set(2, 2);

    const texN = new THREE.CanvasTexture(canvasN);
    texN.wrapS = THREE.RepeatWrapping; texN.wrapT = THREE.RepeatWrapping;
    texN.repeat.set(2, 2);

    return { color: texC, normal: texN };
  }

  /**
   * Hellbrute: Thick Dark Hide & Volcanic Cracked Armor with Glowing Fissures
   */
  private createVolcanicCrackedTextures(width: number, height: number): {
    color: THREE.CanvasTexture;
    emissive: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = width; canvasC.height = height;
    const ctxC = canvasC.getContext('2d')!;

    const canvasE = document.createElement('canvas');
    canvasE.width = width; canvasE.height = height;
    const ctxE = canvasE.getContext('2d')!;

    const canvasN = document.createElement('canvas');
    canvasN.width = width; canvasN.height = height;
    const ctxN = canvasN.getContext('2d')!;

    const imgC = ctxC.createImageData(width, height);
    const dataC = imgC.data;

    const imgE = ctxE.createImageData(width, height);
    const dataE = imgE.data;

    const imgN = ctxN.createImageData(width, height);
    const dataN = imgN.data;

    const heights = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        // Voronoi-like volcanic crack network
        const n1 = Math.abs(Math.sin(x * 0.08 + Math.cos(y * 0.07) * 2.0));
        const n2 = Math.abs(Math.cos(y * 0.08 + Math.sin(x * 0.07) * 2.0));
        const crack = Math.min(n1, n2);
        const isFissure = crack < 0.12;

        heights[i] = isFissure ? 0.2 : 0.7;

        const idx = i * 4;
        if (isFissure) {
          // Glowing magma vein (#f97316 / #ea580c)
          dataC[idx] = 245;
          dataC[idx + 1] = 115;
          dataC[idx + 2] = 22;

          dataE[idx] = 255;
          dataE[idx + 1] = 95;
          dataE[idx + 2] = 15;
        } else {
          // Thick dark charcoal basalt hide (#1a1819)
          const rock = Math.floor(22 + (Math.random() - 0.5) * 8);
          dataC[idx] = rock;
          dataC[idx + 1] = rock;
          dataC[idx + 2] = rock + 2;

          dataE[idx] = 0;
          dataE[idx + 1] = 0;
          dataE[idx + 2] = 0;
        }
        dataC[idx + 3] = 255;
        dataE[idx + 3] = 255;
      }
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const dx = (heights[y * width + (x + 1)] - heights[y * width + (x - 1)]) * 4.0;
        const dy = (heights[(y + 1) * width + x] - heights[(y - 1) * width + x]) * 4.0;
        const dz = 1.0;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

        dataN[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
        dataN[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
        dataN[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
        dataN[idx + 3] = 255;
      }
    }

    ctxC.putImageData(imgC, 0, 0);
    ctxE.putImageData(imgE, 0, 0);
    ctxN.putImageData(imgN, 0, 0);

    const texC = new THREE.CanvasTexture(canvasC);
    texC.colorSpace = THREE.SRGBColorSpace;
    texC.wrapS = THREE.RepeatWrapping; texC.wrapT = THREE.RepeatWrapping;
    texC.repeat.set(2, 2);

    const texE = new THREE.CanvasTexture(canvasE);
    texE.colorSpace = THREE.SRGBColorSpace;
    texE.wrapS = THREE.RepeatWrapping; texE.wrapT = THREE.RepeatWrapping;
    texE.repeat.set(2, 2);

    const texN = new THREE.CanvasTexture(canvasN);
    texN.wrapS = THREE.RepeatWrapping; texN.wrapT = THREE.RepeatWrapping;
    texN.repeat.set(2, 2);

    return { color: texC, emissive: texE, normal: texN };
  }

  /**
   * Shade: Nearly Black Supernatural Skin & Smoky Translucent Shroud
   */
  private createSpectralSmokeTextures(width: number, height: number): {
    color: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = width; canvasC.height = height;
    const ctxC = canvasC.getContext('2d')!;

    const canvasN = document.createElement('canvas');
    canvasN.width = width; canvasN.height = height;
    const ctxN = canvasN.getContext('2d')!;

    const imgC = ctxC.createImageData(width, height);
    const dataC = imgC.data;

    const imgN = ctxN.createImageData(width, height);
    const dataN = imgN.data;

    const heights = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        // Smoky wisps
        const wisp1 = Math.sin(x * 0.05 + y * 0.04 + Math.sin(y * 0.08) * 1.5);
        const wisp2 = Math.cos(x * 0.04 - y * 0.06) * 0.5;
        const total = (wisp1 + wisp2) * 0.5 + 0.5;
        heights[i] = total;

        const idx = i * 4;
        // Void black with subtle spectral violet smoke edges
        dataC[idx] = Math.floor(10 + total * 25);
        dataC[idx + 1] = Math.floor(8 + total * 15);
        dataC[idx + 2] = Math.floor(20 + total * 45);
        dataC[idx + 3] = 255;
      }
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const dx = (heights[y * width + (x + 1)] - heights[y * width + (x - 1)]) * 2.0;
        const dy = (heights[(y + 1) * width + x] - heights[(y - 1) * width + x]) * 2.0;
        const dz = 1.0;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

        dataN[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
        dataN[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
        dataN[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
        dataN[idx + 3] = 255;
      }
    }

    ctxC.putImageData(imgC, 0, 0);
    ctxN.putImageData(imgN, 0, 0);

    const texC = new THREE.CanvasTexture(canvasC);
    texC.colorSpace = THREE.SRGBColorSpace;
    texC.wrapS = THREE.RepeatWrapping; texC.wrapT = THREE.RepeatWrapping;
    texC.repeat.set(2, 2);

    const texN = new THREE.CanvasTexture(canvasN);
    texN.wrapS = THREE.RepeatWrapping; texN.wrapT = THREE.RepeatWrapping;
    texN.repeat.set(2, 2);

    return { color: texC, normal: texN };
  }

  // =========================================================================
  // 5. FABRIC & RUNIC UTILITY TEXTURES
  // =========================================================================

  private createClothPBRTextures(
    width: number,
    height: number,
    baseRgb: [number, number, number]
  ): {
    color: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = width; canvasC.height = height;
    const ctxC = canvasC.getContext('2d')!;

    const canvasN = document.createElement('canvas');
    canvasN.width = width; canvasN.height = height;
    const ctxN = canvasN.getContext('2d')!;

    const canvasR = document.createElement('canvas');
    canvasR.width = width; canvasR.height = height;
    const ctxR = canvasR.getContext('2d')!;

    const imgC = ctxC.createImageData(width, height);
    const imgN = ctxN.createImageData(width, height);
    const imgR = ctxR.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const warp = Math.sin(x * 0.85);
        const weft = Math.sin(y * 0.85);
        const weave = (warp * weft) * 0.5 + 0.5;
        const soot = Math.sin(x * 0.03 + Math.cos(y * 0.04) * 2.0) * 0.18;
        const fray = (Math.random() - 0.5) * 0.08;

        const shade = Math.max(0.55, Math.min(1.28, 0.82 + weave * 0.25 + soot + fray));
        imgC.data[idx] = Math.min(255, Math.round(baseRgb[0] * shade));
        imgC.data[idx + 1] = Math.min(255, Math.round(baseRgb[1] * shade));
        imgC.data[idx + 2] = Math.min(255, Math.round(baseRgb[2] * shade));
        imgC.data[idx + 3] = 255;

        imgN.data[idx] = Math.round((warp * 0.35 * 0.5 + 0.5) * 255);
        imgN.data[idx + 1] = Math.round((weft * 0.35 * 0.5 + 0.5) * 255);
        imgN.data[idx + 2] = 232;
        imgN.data[idx + 3] = 255;

        const rVal = Math.min(250, Math.max(185, Math.round(220 - weave * 20)));
        imgR.data[idx] = rVal;
        imgR.data[idx + 1] = rVal;
        imgR.data[idx + 2] = rVal;
        imgR.data[idx + 3] = 255;
      }
    }
    ctxC.putImageData(imgC, 0, 0);
    ctxN.putImageData(imgN, 0, 0);
    ctxR.putImageData(imgR, 0, 0);

    const texC = new THREE.CanvasTexture(canvasC);
    texC.colorSpace = THREE.SRGBColorSpace;
    texC.wrapS = THREE.RepeatWrapping; texC.wrapT = THREE.RepeatWrapping;
    texC.repeat.set(3, 3);

    const texN = new THREE.CanvasTexture(canvasN);
    texN.wrapS = THREE.RepeatWrapping; texN.wrapT = THREE.RepeatWrapping;
    texN.repeat.set(4, 4);

    const texR = new THREE.CanvasTexture(canvasR);
    texR.wrapS = THREE.RepeatWrapping; texR.wrapT = THREE.RepeatWrapping;
    texR.repeat.set(4, 4);

    return { color: texC, normal: texN, roughness: texR };
  }

  private createRuneGlowTexture(width: number, height: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;

    for (let y = 40; y < height - 40; y += 80) {
      ctx.beginPath();
      ctx.moveTo(width / 2, y);
      ctx.lineTo(width / 2 + (y % 160 === 0 ? 18 : -18), y + 25);
      ctx.lineTo(width / 2 + (y % 160 === 0 ? -18 : 18), y + 48);
      ctx.lineTo(width / 2, y + 70);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private createStonePBRTextures(width: number, height: number): {
    color: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = width; canvasC.height = height;
    const ctxC = canvasC.getContext('2d')!;

    const canvasN = document.createElement('canvas');
    canvasN.width = width; canvasN.height = height;
    const ctxN = canvasN.getContext('2d')!;

    const canvasR = document.createElement('canvas');
    canvasR.width = width; canvasR.height = height;
    const ctxR = canvasR.getContext('2d')!;

    const imgC = ctxC.createImageData(width, height);
    const imgN = ctxN.createImageData(width, height);
    const imgR = ctxR.createImageData(width, height);
    const heights = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const n1 = Math.sin(x * 0.04) * Math.cos(y * 0.04);
        const n2 = Math.sin(x * 0.14 + 1.2) * Math.cos(y * 0.14 + 0.8) * 0.45;
        const crack = Math.abs(Math.sin(x * 0.06 + Math.cos(y * 0.05) * 2.5)) < 0.08 ? -0.35 : 0;
        const grit = (Math.random() - 0.5) * 0.12;
        const h = 0.55 + n1 * 0.25 + n2 * 0.2 + crack + grit;
        heights[i] = h;

        const idx = i * 4;
        const lum = Math.max(18, Math.min(125, Math.round(58 + h * 36 + crack * 45)));
        imgC.data[idx] = lum;
        imgC.data[idx + 1] = lum + 2;
        imgC.data[idx + 2] = lum + 8;
        imgC.data[idx + 3] = 255;

        const rVal = Math.max(155, Math.min(245, Math.round(212 - crack * 40 + grit * 40)));
        imgR.data[idx] = rVal;
        imgR.data[idx + 1] = rVal;
        imgR.data[idx + 2] = rVal;
        imgR.data[idx + 3] = 255;
      }
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const dx = (heights[y * width + (x + 1)] - heights[y * width + (x - 1)]) * 4.2;
        const dy = (heights[(y + 1) * width + x] - heights[(y - 1) * width + x]) * 4.2;
        const dz = 1.0;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

        imgN.data[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
        imgN.data[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
        imgN.data[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
        imgN.data[idx + 3] = 255;
      }
    }
    ctxC.putImageData(imgC, 0, 0);
    ctxN.putImageData(imgN, 0, 0);
    ctxR.putImageData(imgR, 0, 0);

    const texC = new THREE.CanvasTexture(canvasC);
    texC.colorSpace = THREE.SRGBColorSpace;
    texC.wrapS = THREE.RepeatWrapping; texC.wrapT = THREE.RepeatWrapping;
    texC.repeat.set(6, 6);

    const texN = new THREE.CanvasTexture(canvasN);
    texN.wrapS = THREE.RepeatWrapping; texN.wrapT = THREE.RepeatWrapping;
    texN.repeat.set(6, 6);

    const texR = new THREE.CanvasTexture(canvasR);
    texR.wrapS = THREE.RepeatWrapping; texR.wrapT = THREE.RepeatWrapping;
    texR.repeat.set(6, 6);

    return { color: texC, normal: texN, roughness: texR };
  }

  private createBonePBRTextures(width: number, height: number): {
    color: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = width; canvasC.height = height;
    const ctxC = canvasC.getContext('2d')!;

    const canvasN = document.createElement('canvas');
    canvasN.width = width; canvasN.height = height;
    const ctxN = canvasN.getContext('2d')!;

    const canvasR = document.createElement('canvas');
    canvasR.width = width; canvasR.height = height;
    const ctxR = canvasR.getContext('2d')!;

    const imgC = ctxC.createImageData(width, height);
    const imgN = ctxN.createImageData(width, height);
    const imgR = ctxR.createImageData(width, height);
    const heights = new Float32Array(width * height);

    const hash2 = (x: number, y: number) => {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
      return s - Math.floor(s);
    };

    const valueNoise = (x: number, y: number) => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = x - ix;
      const fy = y - iy;
      const ux = fx * fx * (3 - 2 * fx);
      const uy = fy * fy * (3 - 2 * fy);
      const a = hash2(ix, iy);
      const b = hash2(ix + 1, iy);
      const c = hash2(ix, iy + 1);
      const d = hash2(ix + 1, iy + 1);
      return (a + (b - a) * ux) + ((c - a) + (a - b - c + d) * ux) * uy;
    };

    // Build irregular hairline cortical cracks on an offscreen float buffer for organic bone fissures
    const crackMask = new Float32Array(width * height);
    const crackPaths = 22;
    for (let p = 0; p < crackPaths; p++) {
      let cx = hash2(p, 13.7) * width;
      let cy = hash2(p, 47.3) * height;
      let ang = hash2(p, 91.1) * Math.PI * 2;
      const steps = 42 + Math.floor(hash2(p, 7.2) * 58);
      for (let s = 0; s < steps; s++) {
        ang += (hash2(p * 19 + s, 3.1) - 0.5) * 0.65;
        cx = (cx + Math.cos(ang) * 2.1 + width) % width;
        cy = (cy + Math.sin(ang) * 2.1 + height) % height;
        const ix = Math.floor(cx);
        const iy = Math.floor(cy);
        const taper = Math.sin((s / steps) * Math.PI);
        const strength = 0.55 + taper * 0.45;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const px = (ix + ox + width) % width;
            const py = (iy + oy + height) % height;
            const falloff = ox === 0 && oy === 0 ? 1.0 : 0.42;
            const cur = crackMask[py * width + px];
            crackMask[py * width + px] = Math.max(cur, strength * falloff);
          }
        }
      }
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const u = x / width;
        const v = y / height;

        const nVal = hash2(x, y);
        const macroWeather = valueNoise(u * 6.0 + 1.3, v * 6.0 + 2.7);
        const midWeather = valueNoise(u * 16.0 + 5.1, v * 16.0 + 3.4);
        const fiber = Math.sin(u * 52.0 + macroWeather * 2.4) * 0.032 + Math.sin(u * 116.0) * 0.015;

        // Soot & mineral patina pooling (cold ash mottling without geometric stripes)
        const patina = (macroWeather - 0.5) * 0.24 + (midWeather - 0.5) * 0.14;

        // Trabecular micro-pores + hairline cracks
        const pore = nVal > 0.935 ? -0.22 : (nVal - 0.5) * 0.055;
        const crackVal = crackMask[i];
        const crackDepth = -crackVal * 0.34;

        heights[i] = Math.max(0, Math.min(1, 0.58 + fiber + pore + patina * 0.09 + crackDepth));

        const idx = i * 4;
        const crackShade = 1.0 - crackVal * 0.62;
        const poreShade = nVal > 0.935 ? 0.66 : 1.0;
        const tone = (0.90 + patina * 0.22 + fiber * 0.35) * crackShade * poreShade;

        // Cold moonlit ivory palette (desaturated cool bone alabaster with ash-slate recessed crevices)
        const r = Math.max(16, Math.min(255, Math.round(188 * tone + (nVal - 0.5) * 6)));
        const g = Math.max(16, Math.min(255, Math.round(184 * tone + (nVal - 0.5) * 6)));
        const b = Math.max(16, Math.min(255, Math.round(176 * tone + (nVal - 0.5) * 6)));

        imgC.data[idx] = r;
        imgC.data[idx + 1] = g;
        imgC.data[idx + 2] = b;
        imgC.data[idx + 3] = 255;

        // Matte bone roughness: worn ivory crests (~0.78), weathered bone (~0.87), cracks & pores (~0.96)
        const rough = crackVal > 0.2
          ? Math.min(250, Math.round(234 + crackVal * 16))
          : nVal > 0.935
            ? 238
            : Math.max(186, Math.min(244, Math.round(212 - patina * 34 - fiber * 55)));
        imgR.data[idx] = rough;
        imgR.data[idx + 1] = rough;
        imgR.data[idx + 2] = rough;
        imgR.data[idx + 3] = 255;
      }
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const dx = (heights[y * width + (x + 1)] - heights[y * width + (x - 1)]) * 3.8;
        const dy = (heights[(y + 1) * width + x] - heights[(y - 1) * width + x]) * 3.4;
        const dz = 1.0;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        imgN.data[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
        imgN.data[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
        imgN.data[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
        imgN.data[idx + 3] = 255;
      }
    }

    ctxC.putImageData(imgC, 0, 0);
    ctxN.putImageData(imgN, 0, 0);
    ctxR.putImageData(imgR, 0, 0);

    const texC = new THREE.CanvasTexture(canvasC);
    texC.colorSpace = THREE.SRGBColorSpace;
    texC.wrapS = THREE.RepeatWrapping; texC.wrapT = THREE.RepeatWrapping;
    texC.repeat.set(3, 3);
    texC.anisotropy = 8;

    const texN = new THREE.CanvasTexture(canvasN);
    texN.wrapS = THREE.RepeatWrapping; texN.wrapT = THREE.RepeatWrapping;
    texN.repeat.set(3, 3);
    texN.anisotropy = 8;

    const texR = new THREE.CanvasTexture(canvasR);
    texR.wrapS = THREE.RepeatWrapping; texR.wrapT = THREE.RepeatWrapping;
    texR.repeat.set(3, 3);
    texR.anisotropy = 8;

    return { color: texC, normal: texN, roughness: texR };
  }

  /**
   * Dark Iron Damascus Steel Texture Set tailored for The Hollow King's plates, pauldrons, crown fittings & greatsword
   * Deep soot-quenched charcoal iron base with subtle flowing silver-slate Damascus waves, battle edge wear, and zero plastic glare.
   */
  private createHollowMonarchDamascusTextures(width: number, height: number): {
    color: THREE.CanvasTexture;
    normal: THREE.CanvasTexture;
    roughness: THREE.CanvasTexture;
  } {
    const canvasC = document.createElement('canvas');
    canvasC.width = width; canvasC.height = height;
    const ctxC = canvasC.getContext('2d')!;

    const canvasN = document.createElement('canvas');
    canvasN.width = width; canvasN.height = height;
    const ctxN = canvasN.getContext('2d')!;

    const canvasR = document.createElement('canvas');
    canvasR.width = width; canvasR.height = height;
    const ctxR = canvasR.getContext('2d')!;

    const imgC = ctxC.createImageData(width, height);
    const imgN = ctxN.createImageData(width, height);
    const imgR = ctxR.createImageData(width, height);
    const heights = new Float32Array(width * height);

    const hash2 = (x: number, y: number) => {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
      return s - Math.floor(s);
    };

    for (let y = 0; y < height; y++) {
      const ny = y / height;
      const borderBand = Math.abs((ny * 4) % 1 - 0.5);
      const isEngravedRim = borderBand > 0.462 && borderBand < 0.482;

      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const i = y * width + x;

        const warpX = Math.sin(nx * 12.0 + Math.cos(ny * 9.0) * 2.2) * 0.42;
        const warpY = Math.cos(ny * 14.0 + Math.sin(nx * 11.0) * 2.0) * 0.42;
        const fold = Math.sin((nx * 30.0 + warpX * 5.6) + (ny * 24.0 + warpY * 5.0));
        const microFold = Math.sin((nx * 78.0 + warpY * 8.0) - (ny * 68.0 + warpX * 7.5)) * 0.3;
        const wave = (fold * 0.72 + microFold * 0.28) * 0.5 + 0.5;
        const crest = wave > 0.64 ? Math.min(1.0, (wave - 0.64) / 0.26) : 0.0;

        const nick = Math.sin(x * 0.082 + y * 0.132 + warpX * 2.8) > 0.986;
        const pit = (hash2(x, y) - 0.5) * 0.07;

        let h = 0.52 + wave * 0.16 + crest * 0.10 + pit;
        if (isEngravedRim) h -= 0.26;
        if (nick) h -= 0.16;
        heights[i] = h;

        const idx = i * 4;
        let r = 24 + crest * 64 + wave * 12;
        let g = 28 + crest * 72 + wave * 14;
        let b = 36 + crest * 84 + wave * 18;

        if (nick) {
          r = 122; g = 132; b = 148;
        } else if (isEngravedRim) {
          r *= 0.48; g *= 0.52; b *= 0.62;
        }

        imgC.data[idx] = Math.max(0, Math.min(255, Math.round(r)));
        imgC.data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
        imgC.data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
        imgC.data[idx + 3] = 255;

        // Realistic dark forged iron roughness: satin wear edges (~0.46), brushed Damascus (~0.66), dark soot flats (~0.84)
        const roughFloat = isEngravedRim
          ? 0.90
          : nick
          ? 0.44
          : 0.80 - crest * 0.20 - wave * 0.06;
        const rVal = Math.max(108, Math.min(240, Math.round(roughFloat * 255)));
        imgR.data[idx] = rVal;
        imgR.data[idx + 1] = rVal;
        imgR.data[idx + 2] = rVal;
        imgR.data[idx + 3] = 255;
      }
    }

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const dx = (heights[y * width + (x + 1)] - heights[y * width + (x - 1)]) * 3.1;
        const dy = (heights[(y + 1) * width + x] - heights[(y - 1) * width + x]) * 3.1;
        const dz = 1.0;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        imgN.data[idx] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
        imgN.data[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
        imgN.data[idx + 2] = Math.round(((dz / len) * 0.5 + 0.5) * 255);
        imgN.data[idx + 3] = 255;
      }
    }

    ctxC.putImageData(imgC, 0, 0);
    ctxN.putImageData(imgN, 0, 0);
    ctxR.putImageData(imgR, 0, 0);

    const configure = (canvas: HTMLCanvasElement, isColor: boolean) => {
      const tex = new THREE.CanvasTexture(canvas);
      if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      tex.anisotropy = 8;
      return tex;
    };

    return {
      color: configure(canvasC, true),
      normal: configure(canvasN, false),
      roughness: configure(canvasR, false),
    };
  }

  /**
   * Restrained Cold Cerulean Runic Etching Map for Hollow King Dark Iron Armor
   */
  private createHollowMonarchRuneEmissiveTexture(width: number, height: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(29, 78, 128, 0.52)';
    ctx.lineWidth = 1.6;
    for (const bandY of [height * 0.14, height * 0.5, height * 0.86]) {
      ctx.beginPath();
      ctx.moveTo(0, bandY);
      ctx.lineTo(width, bandY);
      ctx.stroke();
    }

    const drawSealRune = (cx: number, cy: number, variant: number) => {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const h = 15;
      const w = 9;
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx, cy + h);
      if (variant === 0) {
        ctx.moveTo(cx, cy - h * 0.7);
        ctx.lineTo(cx + w, cy);
        ctx.lineTo(cx, cy + h * 0.7);
        ctx.lineTo(cx - w, cy);
        ctx.closePath();
      } else if (variant === 1) {
        ctx.moveTo(cx - w, cy - h * 0.4);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + w, cy - h * 0.4);
        ctx.moveTo(cx - w * 0.7, cy + h * 0.5);
        ctx.lineTo(cx + w * 0.7, cy + h * 0.5);
      } else {
        ctx.moveTo(cx - w, cy + h * 0.35);
        ctx.lineTo(cx, cy - h * 0.65);
        ctx.lineTo(cx + w, cy + h * 0.35);
      }
      ctx.stroke();
    };

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        drawSealRune(((c + 0.5) / 4) * width, ((r + 0.5) / 4) * height, (r + c) % 3);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    tex.anisotropy = 8;
    return tex;
  }

  // =========================================================================
  // PUBLIC MATERIAL FACTORY METHODS
  // =========================================================================

  /**
   * Primary Sovereign-Forged Ruinic Damascus Steel (Cuirass, Pauldrons, Core Plate)
   * Matte/satin blackened gunmetal + flowing silver Damascus grain + restrained edge sheen + subtle crimson runes
   */
  public createRuinicDamascusSteel(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: 0x9aa4b8,
      map: this.ruinicSteelColorMap,
      normalMap: this.ruinicSteelNormalMap,
      normalScale: new THREE.Vector2(1.05, 1.05),
      roughnessMap: this.ruinicSteelRoughnessMap,
      roughness: 0.84,
      metalnessMap: this.ruinicSteelMetalnessMap,
      metalness: 0.72,
      clearcoat: 0.06,
      clearcoatRoughness: 0.58,
      specularIntensity: 0.42,
      specularColor: new THREE.Color(0x94a3b8),
      envMapIntensity: 0.65,
      emissive: 0x991b1b,
      emissiveMap: this.ruinicCrimsonEmissiveMap,
      emissiveIntensity: 0.36,
    });
  }

  /**
   * Sovereign-Forged Beveled Ridge & Engraved Edge Trim (Pauldron Lames, Spikes, Spine Plates, Borders)
   */
  public createRuinicDamascusTrim(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: 0xb0bac9,
      map: this.ruinicSteelColorMap,
      normalMap: this.ruinicSteelNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: this.ruinicSteelRoughnessMap,
      roughness: 0.72,
      metalness: 0.78,
      clearcoat: 0.10,
      clearcoatRoughness: 0.48,
      specularIntensity: 0.52,
      specularColor: new THREE.Color(0xcbd5e1),
      envMapIntensity: 0.78,
      emissive: 0xb91c1c,
      emissiveMap: this.ruinicCrimsonEmissiveMap,
      emissiveIntensity: 0.28,
    });
  }

  /**
   * Blackened Damascus Gothic Steel (Azrael's Cuirass & Primary Armor)
   * Upgraded to Sovereign Ruinic Damascus Physical PBR with subtle crimson runes
   */
  public createDamascusSteel(): THREE.MeshPhysicalMaterial {
    return this.createRuinicDamascusSteel();
  }

  /**
   * Gothic Limb Plates (Vambraces, Greaves, Faulds, Rerebraces) - forged Ruinic Damascus steel
   */
  public createGothicLimbPlate(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: 0x8f99ad,
      map: this.ruinicSteelColorMap,
      normalMap: this.ruinicSteelNormalMap,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughnessMap: this.ruinicSteelRoughnessMap,
      roughness: 0.86,
      metalnessMap: this.ruinicSteelMetalnessMap,
      metalness: 0.70,
      clearcoat: 0.05,
      clearcoatRoughness: 0.60,
      specularIntensity: 0.38,
      specularColor: new THREE.Color(0x94a3b8),
      envMapIntensity: 0.62,
      emissive: 0x7f1d1d,
      emissiveMap: this.ruinicCrimsonEmissiveMap,
      emissiveIntensity: 0.28,
    });
  }

  /**
   * Gothic Silver Filigree & Bevel Edges (Spine clasp, belt buckle, poleyn points, spike finials)
   */
  public createGothicSilver(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: 0x949eb0,
      map: this.steelColorMap,
      normalMap: this.ruinicSteelNormalMap,
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: this.ruinicSteelRoughnessMap,
      roughness: 0.68,
      metalness: 0.80,
      clearcoat: 0.08,
      clearcoatRoughness: 0.50,
      specularIntensity: 0.50,
      envMapIntensity: 0.75,
    });
  }

  /**
   * Gothic Pauldron Ruinic Damascus Steel (Expanded Shoulder Dome & Overlapping Lames)
   */
  public createPauldronBlackenedSteel(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: 0x96a0b4,
      map: this.ruinicSteelColorMap,
      normalMap: this.ruinicSteelNormalMap,
      normalScale: new THREE.Vector2(1.05, 1.05),
      roughnessMap: this.ruinicSteelRoughnessMap,
      roughness: 0.86,
      metalnessMap: this.ruinicSteelMetalnessMap,
      metalness: 0.70,
      clearcoat: 0.06,
      clearcoatRoughness: 0.58,
      specularIntensity: 0.40,
      specularColor: new THREE.Color(0x94a3b8),
      envMapIntensity: 0.65,
      emissive: 0x991b1b,
      emissiveMap: this.ruinicCrimsonEmissiveMap,
      emissiveIntensity: 0.34,
    });
  }

  /**
   * Gothic Pauldron Beveled Edge & Crest Steel (Gardbrace Fin, Outer Lames, and Ridge Spikes)
   */
  public createPauldronWornTrim(): THREE.MeshPhysicalMaterial {
    return this.createRuinicDamascusTrim();
  }

  /**
   * Restrained Supernatural Blue Energy Accent Material
   * Used for recessed rune channels and Sovereign energy inlays across arms, couters, and gauntlets
   */
  public createArmorBlueEnergyAccent(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      map: this.ruinicSteelColorMap,
      normalMap: this.ruinicSteelNormalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.42,
      metalness: 0.65,
      emissive: 0x38bdf8,
      emissiveMap: this.armorRuneEmissiveMap,
      emissiveIntensity: 0.65,
    });
  }

  /**
   * Weathered Battled Leather Harness Straps & Under-Padding
   */
  public createWeatheredLeather(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x30221c,
      map: this.leatherColorMap,
      normalMap: this.leatherNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.80,
      metalness: 0.05,
    });
  }

  /**
   * Natural Athletic Male Skin Material (Blender epidermal albedo, pores, zero plastic shine)
   */
  public createAzraelSkin(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: this.skinColorMap,
      normalMap: this.skinNormalMap,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughnessMap: this.skinRoughnessMap,
      roughness: 0.74,
      metalness: 0.01,
    });
  }

  /**
   * Battle Scar Material (fibrous keloid cicatricial tissue across eye and cheek)
   */
  public createBattleScar(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x5c1919,
      roughness: 0.86,
      metalness: 0.02,
      normalMap: this.skinNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
    });
  }

  /**
   * Elden Ring Style Shoulder-Length Hair Material
   * Blender anisotropic strand albedo, normal, and roughness maps
   */
  public createDarkHair(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xd8dce6,
      map: this.hairColorMap,
      normalMap: this.hairNormalMap,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughnessMap: this.hairRoughnessMap,
      roughness: 0.68,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Two Luminous Blue Eyes Material (Blender procedural iris albedo + emissive cyan-blue iris fibers)
   */
  public createGlowingEyes(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: this.blueEyeColorMap,
      emissive: 0x38bdf8,
      emissiveMap: this.blueEyeEmissiveMap,
      emissiveIntensity: 1.45,
      roughness: 0.08,
      metalness: 0.05,
    });
  }

  /**
   * Dark Eyelid / Orbital Rim Framing Material
   */
  public createEyelidRim(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x2a1e1b,
      roughness: 0.78,
      metalness: 0.02,
      normalMap: this.skinNormalMap,
      normalScale: new THREE.Vector2(0.3, 0.3),
    });
  }

  /**
   * Crimson/Wine-Red Battle Tabard / Hanging Sash (Blender woven fabric PBR)
   */
  public createCrimsonSash(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: this.crimsonClothColorMap,
      normalMap: this.clothNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: this.clothRoughnessMap,
      metalness: 0.03,
      roughness: 0.88,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Tattered Cowl & Black Battle Cape (Blender woven soot-linen PBR)
   */
  public createTatteredCloth(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: this.clothColorMap,
      normalMap: this.clothNormalMap,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughnessMap: this.clothRoughnessMap,
      metalness: 0.03,
      roughness: 0.92,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Executioner Greatsword Blade Steel
   */
  public createSwordBladeSteel(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x181c26,
      map: this.steelColorMap,
      normalMap: this.steelNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.26,
      metalness: 0.88,
    });
  }

  /**
   * Glowing Supernatural Runic Channel (Executioner Greatsword Fuller)
   */
  public createRunicGlowMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.1,
      emissiveMap: this.runeGlowMap,
      map: this.runeGlowMap,
      metalness: 0.75,
      roughness: 0.22,
    });
  }

  // --- DEMON MATERIALS ---

  /**
   * Hellspawn: Ash-Gray & Dark Crimson Flesh
   */
  public createHellspawnFlesh(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x4a2424,
      map: this.hellspawnFleshMap,
      normalMap: this.hellspawnNormalMap,
      normalScale: new THREE.Vector2(1.2, 1.2),
      roughness: 0.68,
      metalness: 0.08,
    });
  }

  /**
   * Hellspawn Bone Scythes & Spikes
   */
  public createHellspawnBone(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x2e2824,
      normalMap: this.steelNormalMap,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughness: 0.55,
      metalness: 0.25,
    });
  }

  /**
   * Hellspawn Glowing Crimson Eyes
   */
  public createDemonCrimsonEyes(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xff1e1e,
      emissiveIntensity: 2.6,
      roughness: 0.15,
    });
  }

  /**
   * Hellbrute: Thick Dark Hide
   */
  public createHellbruteHide(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x241d1a,
      map: this.leatherColorMap,
      normalMap: this.leatherNormalMap,
      normalScale: new THREE.Vector2(1.4, 1.4),
      roughness: 0.84,
      metalness: 0.05,
    });
  }

  /**
   * Hellbrute: Cracked Volcanic Armor Carapace with Glowing Magma Fissures
   */
  public createVolcanicArmor(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x1f1a18,
      map: this.volcanicArmorMap,
      emissive: 0xea580c,
      emissiveMap: this.volcanicEmissiveMap,
      emissiveIntensity: 1.8,
      normalMap: this.volcanicNormalMap,
      normalScale: new THREE.Vector2(1.5, 1.5),
      roughness: 0.82,
      metalness: 0.35,
    });
  }

  /**
   * Hellbrute Glowing Amber Eyes
   */
  public createDemonAmberEyes(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xfbbf24,
      emissiveIntensity: 2.4,
      roughness: 0.15,
    });
  }

  /**
   * Shade: Nearly Black Supernatural Skin
   */
  public createShadeVoidSkin(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x050608,
      roughness: 0.94,
      metalness: 0.02,
      normalMap: this.spectralNormalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
    });
  }

  /**
   * Shade: Smoky Translucent Shroud
   */
  public createShadeSpectralShroud(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x080912,
      map: this.spectralShroudMap,
      normalMap: this.spectralNormalMap,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughness: 0.90,
      metalness: 0.05,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Shade Glowing Pale Violet Eyes
   */
  public createShadeVioletEyes(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0xc084fc,
      emissiveIntensity: 2.6,
      roughness: 0.1,
    });
  }

  /**
   * Ancient Chiseled Arena Basalt Stone (Blender Masonry PBR)
   */
  public createBasaltStone(colorHex: number = 0x5c6478): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: colorHex,
      map: this.stoneColorMap,
      normalMap: this.stoneNormalMap,
      normalScale: new THREE.Vector2(1.25, 1.25),
      roughnessMap: this.stoneRoughnessMap,
      metalness: 0.12,
      roughness: 0.88,
    });
  }

  /**
   * Weathered Calcified Leviathan Bone Material (Realm 2 Rib Archways & Relics)
   */
  public createCalcifiedBone(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xb8aa98,
      map: this.boneColorMap,
      normalMap: this.boneNormalMap,
      normalScale: new THREE.Vector2(1.05, 1.05),
      roughnessMap: this.boneRoughnessMap,
      roughness: 0.78,
      metalness: 0.06,
    });
  }

  /**
   * Ancient Sovereign Skeletal Bone PBR (Hollow King cranium, integrated bone crown, ribs, spine, skeletal limbs)
   * Cold moonlit ivory with darkened fractures/crevices and matte mineral roughness variation (zero plastic gloss)
   */
  public createAncientMonarchBone(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xcbc7bd,
      map: this.boneColorMap,
      normalMap: this.boneNormalMap,
      normalScale: new THREE.Vector2(1.72, 1.72),
      bumpMap: this.boneNormalMap,
      bumpScale: 0.022,
      roughnessMap: this.boneRoughnessMap,
      roughness: 0.90,
      metalness: 0.01,
      envMapIntensity: 0.34,
    });
  }

  /**
   * Tarnished Marrow & Joint Condyle Bone PBR (knuckles, phalanx joints, carpal arches, ankle/elbow condyles)
   * Provides crisp anatomical joint separation under dark moonlight
   */
  public createHollowKingJointBone(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0x7a746c,
      map: this.boneColorMap,
      normalMap: this.boneNormalMap,
      normalScale: new THREE.Vector2(1.65, 1.65),
      bumpMap: this.boneNormalMap,
      bumpScale: 0.020,
      roughnessMap: this.boneRoughnessMap,
      roughness: 0.93,
      metalness: 0.01,
      envMapIntensity: 0.28,
    });
  }

  /**
   * Weathered Dark Iron & Damascus Steel with restrained engraved cerulean runes
   * for Hollow King pauldrons, crown fittings, hip tassets, sabatons, and Prison Seal Blade
   */
  public createHollowMonarchSteel(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: 0x6c7788,
      map: this.hollowSteelColorMap,
      normalMap: this.hollowSteelNormalMap,
      normalScale: new THREE.Vector2(1.25, 1.25),
      roughnessMap: this.hollowSteelRoughnessMap,
      roughness: 0.62,
      metalness: 0.84,
      clearcoat: 0.04,
      clearcoatRoughness: 0.64,
      specularIntensity: 0.42,
      specularColor: new THREE.Color(0x9cb3cc),
      envMapIntensity: 0.72,
      emissive: 0x1e6fa5,
      emissiveMap: this.hollowSteelRuneEmissiveMap,
      emissiveIntensity: 0.16,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Burnished Dark Iron Edge Trim for Hollow King pauldron lames, crown circlet, and hilt quillons
   */
  public createHollowMonarchSteelTrim(): THREE.MeshPhysicalMaterial {
    return new THREE.MeshPhysicalMaterial({
      color: 0x8692a6,
      map: this.hollowSteelColorMap,
      normalMap: this.hollowSteelNormalMap,
      normalScale: new THREE.Vector2(1.05, 1.05),
      roughnessMap: this.hollowSteelRoughnessMap,
      roughness: 0.54,
      metalness: 0.86,
      clearcoat: 0.05,
      clearcoatRoughness: 0.56,
      specularIntensity: 0.46,
      specularColor: new THREE.Color(0xb6cde3),
      envMapIntensity: 0.78,
      emissive: 0x257fb8,
      emissiveMap: this.hollowSteelRuneEmissiveMap,
      emissiveIntensity: 0.14,
      side: THREE.DoubleSide,
    });
  }
}

export const materialFactory = new MaterialFactory();
