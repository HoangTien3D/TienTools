/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColorStop, NoiseType, PBRConfig, TerrainConfig, WaterConfig } from '../types';

// Improved Perlin Noise implementation (Classic 2D/3D Perlin)
export class PerlinNoise {
  private p: Uint8Array;

  constructor(seed: number = 12345) {
    this.p = new Uint8Array(512);
    // Simple LCG generator to seed permutation
    const lcg = (s: number) => {
      let current = s;
      return () => {
        current = (current * 1664525 + 1013904223) % 4294967296;
        return current / 4294967296;
      };
    };

    const random = lcg(seed);
    const src = Array.from({ length: 256 }, (_, i) => i);
    
    // Shuffle
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const temp = src[i];
      src[i] = src[j];
      src[j] = temp;
    }

    for (let i = 0; i < 256; i++) {
      this.p[i] = src[i];
      this.p[i + 256] = src[i];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }

  public noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));

    return this.lerp(v, x1, x2);
  }
}

// Global noise instance
const prn = new PerlinNoise(42);

/**
 * Procedural elevation generator for terrain.
 * Returns a value between 0.0 and 1.0 representing height at (u, v).
 */
export function getElevation(u: number, v: number, config: TerrainConfig): number {
  const x = u * config.frequency * 100;
  const y = v * config.frequency * 100;

  let value = 0;
  let amplitude = 1.0;
  let frequency = 1.0;
  let maxPossibleVal = 0;

  // Generate fractal octaves depending on noise type
  for (let i = 0; i < config.octaves; i++) {
    const nx = x * frequency;
    const ny = y * frequency;
    
    let noiseVal = prn.noise(nx, ny); // returns approximately -1 to 1

    switch (config.noiseType) {
      case 'simplex': // Standard Perlin
        value += noiseVal * amplitude;
        break;
      case 'fbm': // Fractional Brownian Motion
        value += noiseVal * amplitude;
        break;
      case 'ridged': // Ridged Multifractal: sharp mountain peaks
        value += (1.0 - Math.abs(noiseVal)) * amplitude;
        break;
      case 'billow': // Billow: cushiony hills
        value += Math.abs(noiseVal) * amplitude;
        break;
    }

    maxPossibleVal += amplitude;
    amplitude *= config.persistence;
    frequency *= config.lacunarity;
  }

  // Normalize
  value = value / maxPossibleVal;
  // Map back to 0..1 range safely
  if (config.noiseType === 'simplex' || config.noiseType === 'fbm') {
    value = (value + 1.0) / 2.0;
  }
  value = Math.max(0, Math.min(1, value));

  // Apply exponent to shape hills (sharpen peaks / flatten valleys)
  value = Math.pow(value, config.exponent);

  // Apply step-like plateaus if threshold is set > 0
  if (config.plateauThreshold > 0) {
    const steps = Math.round(value * 8) / 8;
    value = Math.max(0, Math.min(1, value * (1 - config.plateauThreshold) + steps * config.plateauThreshold));
  }

  // Meteor Crater shaping: subtract/carve central bowl
  if (config.craterDepth > 0) {
    // Distance to center (0.5, 0.5)
    const dx = u - 0.5;
    const dy = v - 0.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Smooth impact bowl structure
    const craterR = config.craterScale;
    if (dist < craterR) {
      const normalizedDist = dist / craterR; // 0 (center) to 1 (rim)
      // Rim is raised, center is deep
      const bowl = Math.pow(normalizedDist, 2) * 1.3 - 0.8;
      // Interpolate with terrain
      const influence = Math.cos(normalizedDist * Math.PI * 0.5); // 1 at center, 0 at rim
      value = value * (1 - influence * config.craterDepth) + (bowl * config.craterDepth * 0.4 + 0.3) * influence;
    } else if (dist < craterR * 1.3) {
      // Gentle slope outside of crater rim
      const influence = (1.3 * craterR - dist) / (0.3 * craterR); // 1 at rim, 0 at outer boundary
      const rimRaised = 0.25 * Math.sin(influence * Math.PI * 0.5);
      value += rimRaised * config.craterDepth * 0.5;
    }
  }

  return Math.max(0, Math.min(1, value));
}

/**
 * Gets color based on elevation and slope gradients
 */
export function getTerrainColor(elevation: number, steepness: number, colorStops: ColorStop[]): string {
  // Sort color stops by elevation
  const sorted = [...colorStops].sort((a, b) => a.elevation - b.elevation);

  // Default color if list is empty
  if (sorted.length === 0) return '#888888';

  // Find surrounding color stops
  let lower = sorted[0];
  let upper = sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (elevation >= sorted[i].elevation && elevation <= sorted[i + 1].elevation) {
      lower = sorted[i];
      upper = sorted[i + 1];
      break;
    }
  }

  if (lower === upper) return lower.color;

  // Interpolate elevation colors
  const range = upper.elevation - lower.elevation;
  const factor = range === 0 ? 0 : (elevation - lower.elevation) / range;
  const c1 = hexToRgb(lower.color);
  const c2 = hexToRgb(upper.color);

  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));

  // Blend with rocky steepness if steepness is high (add rocky gray tint to high cliffs)
  if (steepness > 0.4) {
    const steepFactor = Math.min(1, (steepness - 0.4) * 2.0); // scale up steepness
    // Rock color is typically dark gray
    const rockR = 100, rockG = 95, rockB = 90;
    const finalR = Math.round(r * (1 - steepFactor) + rockR * steepFactor);
    const finalG = Math.round(g * (1 - steepFactor) + rockG * steepFactor);
    const finalB = Math.round(b * (1 - steepFactor) + rockB * steepFactor);
    return rgbToHex(finalR, finalG, finalB);
  }

  return rgbToHex(r, g, b);
}

// Helpers for color interpolation
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return '#' + ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1);
}

/**
 * Generates the full set of PBR Textures on a set of canvases
 * Outputs Albedo, Normal, Roughness, AO, and Height maps
 */
export function generatePBRCanvases(
  terrain: TerrainConfig,
  pbr: PBRConfig,
  resolution: number = 256
): {
  albedo: HTMLCanvasElement;
  normal: HTMLCanvasElement;
  roughness: HTMLCanvasElement;
  ao: HTMLCanvasElement;
  height: HTMLCanvasElement;
} {
  const createBlankCanvas = () => {
    const c = document.createElement('canvas');
    c.width = resolution;
    c.height = resolution;
    return c;
  };

  const albedo = createBlankCanvas();
  const normal = createBlankCanvas();
  const roughness = createBlankCanvas();
  const ao = createBlankCanvas();
  const heightCanvas = createBlankCanvas();

  const ctxA = albedo.getContext('2d')!;
  const ctxN = normal.getContext('2d')!;
  const ctxR = roughness.getContext('2d')!;
  const ctxO = ao.getContext('2d')!;
  const ctxH = heightCanvas.getContext('2d')!;

  const imgDataA = ctxA.createImageData(resolution, resolution);
  const imgDataN = ctxN.createImageData(resolution, resolution);
  const imgDataR = ctxR.createImageData(resolution, resolution);
  const imgDataO = ctxO.createImageData(resolution, resolution);
  const imgDataH = ctxH.createImageData(resolution, resolution);

  const primaryRGB = hexToRgb(pbr.primaryColor);
  const secondaryRGB = hexToRgb(pbr.secondaryColor);

  // First pass: generate elevation and texture-pattern data
  const heightBuffer = new Float32Array(resolution * resolution);
  const steepnessBuffer = new Float32Array(resolution * resolution);

  // Grid step
  const step = 1 / resolution;

  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const u = x * step;
      const v = y * step;
      const index = y * resolution + x;

      // Base terrain height
      const hVal = getElevation(u, v, terrain);
      heightBuffer[index] = hVal;
    }
  }

  // Second pass: Calculate steepness (slope) using Sobel filter on the terrain heights
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const index = y * resolution + x;

      // Surrounding coordinates
      const xm = Math.max(0, x - 1);
      const xp = Math.min(resolution - 1, x + 1);
      const ym = Math.max(0, y - 1);
      const yp = Math.min(resolution - 1, y + 1);

      const h_L = heightBuffer[y * resolution + xm];
      const h_R = heightBuffer[y * resolution + xp];
      const h_D = heightBuffer[ym * resolution + x];
      const h_U = heightBuffer[yp * resolution + x];

      // Slope calculation
      const dx = (h_R - h_L) * 2.0;
      const dy = (h_U - h_D) * 2.0;
      steepnessBuffer[index] = Math.sqrt(dx * dx + dy * dy) * 4.0;
    }
  }

  // Third pass: Draw patterns (Texturize.app style) + compute PBR maps
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const u = x * step;
      const v = y * step;
      const index = y * resolution + x;
      const pixelIndex = index * 4;

      const elevation = heightBuffer[index];
      const steepness = steepnessBuffer[index];

      // Generate pattern noise
      const px = u * pbr.noiseScale;
      const py = v * pbr.noiseScale;
      let patternNoise = (prn.noise(px, py) + 1.0) / 2.0;

      // Add high frequency micro-bumpiness
      const bx = u * pbr.noiseScale * 8;
      const by = v * pbr.noiseScale * 8;
      const microBump = prn.noise(bx, by) * pbr.bumpiness * 0.15;

      // Add variety depending on pattern type
      let bumpHeight = elevation + microBump;
      let patternFactor = patternNoise;

      if (pbr.patternType === 'cracked') {
        // High lacunarity cellular ridges
        patternFactor = Math.pow(Math.abs(prn.noise(px * 2, py * 2)), 0.3);
        bumpHeight += (1 - patternFactor) * pbr.bumpiness * 0.25;
      } else if (pbr.patternType === 'rocks' || pbr.patternType === 'lichen') {
        patternFactor = Math.pow(patternNoise, 2.0);
        bumpHeight += patternFactor * pbr.bumpiness * 0.3;
      } else if (pbr.patternType === 'wood') {
        // Rings pattern
        const distToCenter = Math.sqrt((u - 0.5) * (u - 0.5) + (v - 0.5) * (v - 0.5));
        const rings = Math.sin(distToCenter * 60 + patternNoise * 5);
        patternFactor = (rings + 1.0) / 2.0;
        bumpHeight += rings * pbr.bumpiness * 0.08;
      }

      // Heightmap pixel (Gray)
      const heightColorVal = Math.max(0, Math.min(255, Math.round(bumpHeight * 255)));
      imgDataH.data[pixelIndex] = heightColorVal;
      imgDataH.data[pixelIndex + 1] = heightColorVal;
      imgDataH.data[pixelIndex + 2] = heightColorVal;
      imgDataH.data[pixelIndex + 3] = 255;

      // Albedo Color Calculation
      // Start with the terrain elevation color
      const baseHex = getTerrainColor(elevation, steepness, terrain.colorStops);
      const baseRGB = hexToRgb(baseHex);

      // Blend with PBR colors based on pattern
      const pbrR = Math.round(primaryRGB.r * (1 - patternFactor) + secondaryRGB.r * patternFactor);
      const pbrG = Math.round(primaryRGB.g * (1 - patternFactor) + secondaryRGB.g * patternFactor);
      const pbrB = Math.round(primaryRGB.b * (1 - patternFactor) + secondaryRGB.b * patternFactor);

      // Final Albedo blends the terrain gradient + the PBR micro-texture colors
      // High elevation snowy areas are less affected by dirt patterns, sand areas are highly textured
      let blendFactor = 0.5;
      if (elevation > 0.85) blendFactor = 0.15; // snowy peaks stay white
      if (elevation < terrain.waterLevel / 100) blendFactor = 0.8;  // sandy beaches take full PBR texture

      const finalR = Math.round(baseRGB.r * (1 - blendFactor) + pbrR * blendFactor);
      const finalG = Math.round(baseRGB.g * (1 - blendFactor) + pbrG * blendFactor);
      const finalB = Math.round(baseRGB.b * (1 - blendFactor) + pbrB * blendFactor);

      imgDataA.data[pixelIndex] = finalR;
      imgDataA.data[pixelIndex + 1] = finalG;
      imgDataA.data[pixelIndex + 2] = finalB;
      imgDataA.data[pixelIndex + 3] = 255;

      // Roughness Map (Grey)
      // Steeper slopes are usually rocks -> higher roughness
      // Valleys are grass/moss/water -> lower roughness
      // Water level is perfectly smooth (or reflective)
      let rVal = pbr.roughness;
      if (steepness > 0.3) {
        rVal = Math.min(1.0, rVal + 0.25);
      }
      if (elevation < terrain.waterLevel / 100) {
        rVal = 0.1; // water body or shore is extremely glossy
      }
      // Add pattern variety to roughness
      rVal = Math.max(0.05, Math.min(0.98, rVal + (patternNoise - 0.5) * 0.15));
      const roughColor = Math.round(rVal * 255);
      imgDataR.data[pixelIndex] = roughColor;
      imgDataR.data[pixelIndex + 1] = roughColor;
      imgDataR.data[pixelIndex + 2] = roughColor;
      imgDataR.data[pixelIndex + 3] = 255;

      // Ambient Occlusion Map (Grey)
      // High frequency dips (valleys of patterns) are shadowed
      let aoVal = 1.0 - (patternNoise < 0.45 ? (0.45 - patternNoise) * pbr.aoStrength * 1.5 : 0);
      if (steepness > 0.5) aoVal *= 0.85; // crevices on steep cliffs
      const aoColor = Math.max(0, Math.min(255, Math.round(aoVal * 255)));
      imgDataO.data[pixelIndex] = aoColor;
      imgDataO.data[pixelIndex + 1] = aoColor;
      imgDataO.data[pixelIndex + 2] = aoColor;
      imgDataO.data[pixelIndex + 3] = 255;
    }
  }

  // Fourth pass: Calculate Normals from the height/displacement map using Sobel Filter (NormalMap-Online style)
  const strength = pbr.normalStrength * 2.0;
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const index = y * resolution + x;
      const pixelIndex = index * 4;

      const xm = Math.max(0, x - 1);
      const xp = Math.min(resolution - 1, x + 1);
      const ym = Math.max(0, y - 1);
      const yp = Math.min(resolution - 1, y + 1);

      // Sample height pixels (red channel of height map)
      const h_TL = imgDataH.data[(ym * resolution + xm) * 4] / 255;
      const h_T  = imgDataH.data[(ym * resolution + x ) * 4] / 255;
      const h_TR = imgDataH.data[(ym * resolution + xp) * 4] / 255;
      
      const h_L  = imgDataH.data[(y  * resolution + xm) * 4] / 255;
      const h_R  = imgDataH.data[(y  * resolution + xp) * 4] / 255;
      
      const h_BL = imgDataH.data[(yp * resolution + xm) * 4] / 255;
      const h_B  = imgDataH.data[(yp * resolution + x ) * 4] / 255;
      const h_BR = imgDataH.data[(yp * resolution + xp) * 4] / 255;

      // Sobel filters
      const dX = (h_TR + 2.0 * h_R + h_BR) - (h_TL + 2.0 * h_L + h_BL);
      const dY = (h_BL + 2.0 * h_B + h_BR) - (h_TL + 2.0 * h_T + h_TR);

      // Normal vector components
      // To boost normal mapping strength, scale the gradient
      const nx = -dX * strength;
      const ny = -dY * strength;
      const nz = 1.0;

      // Normalize normal vector
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const rX = (nx / len) * 0.5 + 0.5;
      const rY = (ny / len) * 0.5 + 0.5;
      const rZ = nz / len; // blue is already positive pointing out

      imgDataN.data[pixelIndex]     = Math.round(rX * 255);
      imgDataN.data[pixelIndex + 1] = Math.round(rY * 255);
      imgDataN.data[pixelIndex + 2] = Math.round(rZ * 255);
      imgDataN.data[pixelIndex + 3] = 255;
    }
  }

  // Put image data on canvases
  ctxA.putImageData(imgDataA, 0, 0);
  ctxN.putImageData(imgDataN, 0, 0);
  ctxR.putImageData(imgDataR, 0, 0);
  ctxO.putImageData(imgDataO, 0, 0);
  ctxH.putImageData(imgDataH, 0, 0);

  return { albedo, normal, roughness, ao, height: heightCanvas };
}

// Seed points generator for Voronoi Tiling Caustics
function getVoronoiNoise(u: number, v: number, cellsCount: number): { f1: number; f2: number } {
  const x = u * cellsCount;
  const y = v * cellsCount;
  const iX = Math.floor(x);
  const iY = Math.floor(y);

  let minDist1 = 999;
  let minDist2 = 999;

  // Check 3x3 surrounding cells
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = (iX + dx + cellsCount) % cellsCount;
      const cy = (iY + dy + cellsCount) % cellsCount;

      // Deterministic seed point for this cell
      const hash1 = Math.sin(cx * 12.9898 + cy * 78.233) * 43758.5453;
      const hash2 = Math.cos(cx * 43.123 + cy * 12.311) * 23141.5234;
      const pX = cx + (hash1 - Math.floor(hash1));
      const pY = cy + (hash2 - Math.floor(hash2));

      // Calculate distance with tiling wrap-around taken into account
      let diffX = x - pX;
      let diffY = y - pY;

      // Wrap diffs around boundary if checking far edges
      if (diffX > cellsCount * 0.5) diffX -= cellsCount;
      if (diffX < -cellsCount * 0.5) diffX += cellsCount;
      if (diffY > cellsCount * 0.5) diffY -= cellsCount;
      if (diffY < -cellsCount * 0.5) diffY += cellsCount;

      const dist = Math.sqrt(diffX * diffX + diffY * diffY);

      if (dist < minDist1) {
        minDist2 = minDist1;
        minDist1 = dist;
      } else if (dist < minDist2) {
        minDist2 = dist;
      }
    }
  }

  return { f1: minDist1, f2: minDist2 };
}

/**
 * Generates the full set of PBR Water Textures on a set of canvases
 * Outputs Albedo with caustics, Normal with ripples, Roughness, AO, and Height maps
 */
export function generateWaterPBRCanvases(
  water: WaterConfig,
  resolution: number = 256
): {
  albedo: HTMLCanvasElement;
  normal: HTMLCanvasElement;
  roughness: HTMLCanvasElement;
  ao: HTMLCanvasElement;
  height: HTMLCanvasElement;
} {
  const createBlankCanvas = () => {
    const c = document.createElement('canvas');
    c.width = resolution;
    c.height = resolution;
    return c;
  };

  const albedo = createBlankCanvas();
  const normal = createBlankCanvas();
  const roughness = createBlankCanvas();
  const ao = createBlankCanvas();
  const heightCanvas = createBlankCanvas();

  const ctxA = albedo.getContext('2d')!;
  const ctxN = normal.getContext('2d')!;
  const ctxR = roughness.getContext('2d')!;
  const ctxO = ao.getContext('2d')!;
  const ctxH = heightCanvas.getContext('2d')!;

  const imgDataA = ctxA.createImageData(resolution, resolution);
  const imgDataN = ctxN.createImageData(resolution, resolution);
  const imgDataR = ctxR.createImageData(resolution, resolution);
  const imgDataO = ctxO.createImageData(resolution, resolution);
  const imgDataH = ctxH.createImageData(resolution, resolution);

  const waterRGB = hexToRgb(water.color);
  const causticRGB = hexToRgb(water.causticColor);

  const step = 1 / resolution;

  // First pass: Generate height buffer for caustics / ripples
  const heightBuffer = new Float32Array(resolution * resolution);

  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const u = x * step;
      const v = y * step;
      const index = y * resolution + x;

      let val = 0.5;

      if (water.pattern === 'voronoi') {
        const cells = Math.max(4, Math.round(water.noiseScale));
        const res = getVoronoiNoise(u, v, cells);
        // Underwater caustic shimmer net pattern
        val = Math.pow(Math.max(0, 1.0 - res.f1 * 1.5), 3.0);
      } else if (water.pattern === 'sine') {
        const radU = u * water.noiseScale * Math.PI * 2;
        const radV = v * water.noiseScale * Math.PI * 2;
        const s = Math.sin(radU) * Math.cos(radV);
        val = (s + 1.0) / 2.0;
      } else {
        const px = u * water.noiseScale;
        const py = v * water.noiseScale;
        val = (prn.noise(px, py) + 1.0) / 2.0;
      }

      heightBuffer[index] = val;
    }
  }

  // Second pass: Fill albedo, roughness, AO, heightmaps
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const index = y * resolution + x;
      const pixelIndex = index * 4;
      const val = heightBuffer[index];

      // Heightmap
      const heightColorVal = Math.max(0, Math.min(255, Math.round(val * 255)));
      imgDataH.data[pixelIndex] = heightColorVal;
      imgDataH.data[pixelIndex + 1] = heightColorVal;
      imgDataH.data[pixelIndex + 2] = heightColorVal;
      imgDataH.data[pixelIndex + 3] = 255;

      // Albedo: Blend water base color with bright caustics highlights
      const r = Math.round(waterRGB.r * (1 - val) + causticRGB.r * val);
      const g = Math.round(waterRGB.g * (1 - val) + causticRGB.g * val);
      const b = Math.round(waterRGB.b * (1 - val) + causticRGB.b * val);

      imgDataA.data[pixelIndex] = r;
      imgDataA.data[pixelIndex + 1] = g;
      imgDataA.data[pixelIndex + 2] = b;
      imgDataA.data[pixelIndex + 3] = 255;

      // Roughness: Very glossy with minor wave variances
      const roughVal = Math.max(0.01, Math.min(0.99, water.roughness + (val - 0.5) * 0.05));
      const roughColor = Math.round(roughVal * 255);
      imgDataR.data[pixelIndex] = roughColor;
      imgDataR.data[pixelIndex + 1] = roughColor;
      imgDataR.data[pixelIndex + 2] = roughColor;
      imgDataR.data[pixelIndex + 3] = 255;

      // AO
      const aoVal = 1.0 - (1.0 - val) * 0.15;
      const aoColor = Math.round(aoVal * 255);
      imgDataO.data[pixelIndex] = aoColor;
      imgDataO.data[pixelIndex + 1] = aoColor;
      imgDataO.data[pixelIndex + 2] = aoColor;
      imgDataO.data[pixelIndex + 3] = 255;
    }
  }

  // Third pass: Sobel Filter for Normal Map
  const strength = water.bumpiness * 3.0;
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      const index = y * resolution + x;
      const pixelIndex = index * 4;

      const xm = Math.max(0, x - 1);
      const xp = Math.min(resolution - 1, x + 1);
      const ym = Math.max(0, y - 1);
      const yp = Math.min(resolution - 1, y + 1);

      const h_TL = heightBuffer[ym * resolution + xm];
      const h_T  = heightBuffer[ym * resolution + x];
      const h_TR = heightBuffer[ym * resolution + xp];
      
      const h_L  = heightBuffer[y * resolution + xm];
      const h_R  = heightBuffer[y * resolution + xp];
      
      const h_BL = heightBuffer[yp * resolution + xm];
      const h_B  = heightBuffer[yp * resolution + x];
      const h_BR = heightBuffer[yp * resolution + xp];

      const dX = (h_TR + 2.0 * h_R + h_BR) - (h_TL + 2.0 * h_L + h_BL);
      const dY = (h_BL + 2.0 * h_B + h_BR) - (h_TL + 2.0 * h_T + h_TR);

      const nx = -dX * strength;
      const ny = -dY * strength;
      const nz = 1.0;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const rX = (nx / len) * 0.5 + 0.5;
      const rY = (ny / len) * 0.5 + 0.5;
      const rZ = nz / len;

      imgDataN.data[pixelIndex]     = Math.round(rX * 255);
      imgDataN.data[pixelIndex + 1] = Math.round(rY * 255);
      imgDataN.data[pixelIndex + 2] = Math.round(rZ * 255);
      imgDataN.data[pixelIndex + 3] = 255;
    }
  }

  ctxA.putImageData(imgDataA, 0, 0);
  ctxN.putImageData(imgDataN, 0, 0);
  ctxR.putImageData(imgDataR, 0, 0);
  ctxO.putImageData(imgDataO, 0, 0);
  ctxH.putImageData(imgDataH, 0, 0);

  return { albedo, normal, roughness, ao, height: heightCanvas };
}
