/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NoiseType = 'simplex' | 'fbm' | 'ridged' | 'billow';

export interface ColorStop {
  elevation: number; // 0 to 1
  color: string;     // Hex color
  label?: string;
}

export interface TerrainConfig {
  name: string;
  heightScale: number;      // Max height of terrain
  exponent: number;         // Controls contrast/sharpness of heights
  noiseType: NoiseType;
  octaves: number;          // 1 to 8
  frequency: number;        // Primary noise frequency
  lacunarity: number;       // Change in frequency per octave
  persistence: number;      // Change in amplitude per octave
  waterLevel: number;       // Level below which terrain is flat/blue
  craterDepth: number;      // Special crater-shaping factor
  craterScale: number;      // Extent of crater
  plateauThreshold: number; // For step-like plateaus
  colorStops: ColorStop[];
  sizeX?: number;           // Width of terrain (X axis)
  sizeY?: number;           // Length of terrain (Y axis)
}

export interface PBRConfig {
  name: string;
  roughness: number;        // Base roughness
  metalness: number;        // Base metalness
  normalStrength: number;   // Normal map multiplier
  aoStrength: number;       // Ambient occlusion visibility
  displacementScale: number;// High-frequency PBR displacement scale
  patternType: string;      // 'mud' | 'rock' | 'sand' | 'grass' | 'lava' | 'ice' | 'moss' | 'snow' | 'clay' | 'wood' | 'dirt' | 'lichen' | 'pebbles' | 'cracked' | 'gravel';
  noiseScale: number;       // Scale of pattern details
  bumpiness: number;        // Amplitude of micro-bumps
  primaryColor: string;
  secondaryColor: string;
  customMaps?: {
    albedo?: string;
    normal?: string;
    roughness?: string;
    ao?: string;
    height?: string;
  };
}

export interface WaterConfig {
  roughness: number;
  metalness: number;
  opacity: number;
  color: string;
  causticColor: string;
  speed: number;
  waveHeight: number;
  frequency: number;
  pattern: 'voronoi' | 'sine' | 'simplex';
  noiseScale: number;
  bumpiness: number;
}

export interface AppState {
  // Configs
  terrain: TerrainConfig;
  pbr: PBRConfig;
  water: WaterConfig;
  
  // App UI State
  gridResolution: number;   // e.g. 128 (meaning 128x128 quads)
  wireframe: boolean;
  wireframeColor: string;
  showWater: boolean;
  waterColor: string;
  shadingMode: 'pbr' | 'elevation' | 'slope' | 'normal';
  autoRotate: boolean;
  
  // Lighting
  lightIntensity: number;
  lightColor: string;
  lightAngleX: number; // in degrees
  lightAngleY: number; // in degrees
  
  // Presets List
  terrainPresets: TerrainConfig[];
  pbrPresets: PBRConfig[];
  
  // OpenRouter LLM AI State
  openRouterKey: string;
  openRouterModel: string;
  aiPrompt: string;
  aiIsGenerating: boolean;
  aiError: string | null;
  aiLastResponse: string | null;
  
  // Active layouts
  activePanels: { [key: string]: boolean };
  sidebarWidth: number;
  activeTab: 'terrain' | 'pbr' | 'ai' | 'export';
}
