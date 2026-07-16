/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TerrainConfig, PBRConfig } from '../types';

export const TERRAIN_PRESETS: TerrainConfig[] = [
  {
    name: "Mountain Range",
    heightScale: 65,
    exponent: 1.5,
    noiseType: "ridged",
    octaves: 6,
    frequency: 0.012,
    lacunarity: 2.1,
    persistence: 0.45,
    waterLevel: 0,
    craterDepth: 0,
    craterScale: 0,
    plateauThreshold: 0,
    colorStops: [
      { elevation: 0.0, color: "#1e293b", label: "Basalt Valley" },
      { elevation: 0.3, color: "#334155", label: "Lower Cliffs" },
      { elevation: 0.55, color: "#64748b", label: "Granite Slopes" },
      { elevation: 0.75, color: "#cbd5e1", label: "Snow Line" },
      { elevation: 0.9, color: "#f8fafc", label: "Pure Snow Peaks" }
    ]
  },
  {
    name: "Sand Dunes (Desert)",
    heightScale: 25,
    exponent: 1.2,
    noiseType: "billow",
    octaves: 4,
    frequency: 0.008,
    lacunarity: 1.9,
    persistence: 0.55,
    waterLevel: 0,
    craterDepth: 0,
    craterScale: 0,
    plateauThreshold: 0,
    colorStops: [
      { elevation: 0.0, color: "#9a3412", label: "Clay Hollows" },
      { elevation: 0.2, color: "#c2410c", label: "Deep Red Sand" },
      { elevation: 0.5, color: "#ea580c", label: "Dune Slopes" },
      { elevation: 0.8, color: "#f97316", label: "Windward Crests" },
      { elevation: 1.0, color: "#ffedd5", label: "Sunlit Sand" }
    ]
  },
  {
    name: "Volcanic Caldera",
    heightScale: 75,
    exponent: 2.1,
    noiseType: "ridged",
    octaves: 6,
    frequency: 0.015,
    lacunarity: 2.2,
    persistence: 0.4,
    waterLevel: 10,
    craterDepth: 0.8,
    craterScale: 0.35,
    plateauThreshold: 0.1,
    colorStops: [
      { elevation: 0.0, color: "#ef4444", label: "Lava Pools" },
      { elevation: 0.15, color: "#1e1b4b", label: "Burnt Obsidian" },
      { elevation: 0.4, color: "#0f172a", label: "Basalt Caldera Floor" },
      { elevation: 0.7, color: "#334155", label: "Ash Slopes" },
      { elevation: 1.0, color: "#94a3b8", label: "Sulphur Peak" }
    ]
  },
  {
    name: "Grand Canyon",
    heightScale: 60,
    exponent: 1.1,
    noiseType: "fbm",
    octaves: 7,
    frequency: 0.006,
    lacunarity: 2.3,
    persistence: 0.35,
    waterLevel: 8,
    craterDepth: 0,
    craterScale: 0,
    plateauThreshold: 0.85, // High terrace/plateau step effect
    colorStops: [
      { elevation: 0.0, color: "#065f46", label: "Colorado River Bed" },
      { elevation: 0.1, color: "#b45309", label: "Silt Deposits" },
      { elevation: 0.3, color: "#9a3412", label: "Red Shale Layer" },
      { elevation: 0.6, color: "#ea580c", label: "Sandstone Cliffs" },
      { elevation: 0.85, color: "#d97706", label: "Ochre Tablelands" },
      { elevation: 1.0, color: "#fed7aa", label: "Plateau Rim" }
    ]
  },
  {
    name: "Alpine Valley",
    heightScale: 55,
    exponent: 1.6,
    noiseType: "fbm",
    octaves: 5,
    frequency: 0.009,
    lacunarity: 2.0,
    persistence: 0.48,
    waterLevel: 12,
    craterDepth: 0,
    craterScale: 0,
    plateauThreshold: 0,
    colorStops: [
      { elevation: 0.0, color: "#1d4ed8", label: "Deep Alpine Lake" },
      { elevation: 0.15, color: "#047857", label: "Pine Forest Bottoms" },
      { elevation: 0.4, color: "#10b981", label: "Lush Emerald Grass" },
      { elevation: 0.65, color: "#475569", label: "Stone Cliffs" },
      { elevation: 0.85, color: "#cbd5e1", label: "Glacial Ice" },
      { elevation: 1.0, color: "#ffffff", label: "Pure Snow Caps" }
    ]
  },
  {
    name: "Volcanic Island",
    heightScale: 50,
    exponent: 1.8,
    noiseType: "simplex",
    octaves: 5,
    frequency: 0.014,
    lacunarity: 2.1,
    persistence: 0.5,
    waterLevel: 22, // significant ocean portion
    craterDepth: 0.5,
    craterScale: 0.15,
    plateauThreshold: 0,
    colorStops: [
      { elevation: 0.0, color: "#1d4ed8", label: "Abyssal Sea" },
      { elevation: 0.22, color: "#2563eb", label: "Coastal Shallows" },
      { elevation: 0.25, color: "#0f172a", label: "Black Sand Beaches" },
      { elevation: 0.4, color: "#15803d", label: "Tropical Rainforest" },
      { elevation: 0.7, color: "#475569", label: "Exposed Obsidian Slopes" },
      { elevation: 1.0, color: "#dc2626", label: "Fiery Caldera Rim" }
    ]
  },
  {
    name: "Step Plateau",
    heightScale: 40,
    exponent: 1.3,
    noiseType: "fbm",
    octaves: 5,
    frequency: 0.007,
    lacunarity: 2.2,
    persistence: 0.3,
    waterLevel: 0,
    craterDepth: 0,
    craterScale: 0,
    plateauThreshold: 0.95, // extremely stepped plateaus
    colorStops: [
      { elevation: 0.0, color: "#78350f", label: "Eroded Ravines" },
      { elevation: 0.2, color: "#92400e", label: "Lower Step" },
      { elevation: 0.5, color: "#b45309", label: "Mid Mesa" },
      { elevation: 0.8, color: "#d97706", label: "Upper Plateau" },
      { elevation: 1.0, color: "#fef3c7", label: "Butte Summits" }
    ]
  },
  {
    name: "Arctic Tundra",
    heightScale: 20,
    exponent: 1.1,
    noiseType: "billow",
    octaves: 4,
    frequency: 0.01,
    lacunarity: 2.0,
    persistence: 0.55,
    waterLevel: 15,
    craterDepth: 0,
    craterScale: 0,
    plateauThreshold: 0,
    colorStops: [
      { elevation: 0.0, color: "#38bdf8", label: "Frozen Glacial Pools" },
      { elevation: 0.16, color: "#451a03", label: "Peat Bogs" },
      { elevation: 0.35, color: "#1c1917", label: "Permafrost Dirt" },
      { elevation: 0.6, color: "#52525b", label: "Lichen Rock" },
      { elevation: 0.8, color: "#e2e8f0", label: "Packed Slush" },
      { elevation: 1.0, color: "#ffffff", label: "Dry Tundra Snow" }
    ]
  },
  {
    name: "Ocean Trench",
    heightScale: 80,
    exponent: 2.0,
    noiseType: "ridged",
    octaves: 6,
    frequency: 0.008,
    lacunarity: 2.0,
    persistence: 0.5,
    waterLevel: 50, // very high, underwater-focused
    craterDepth: 0,
    craterScale: 0,
    plateauThreshold: 0,
    colorStops: [
      { elevation: 0.0, color: "#030712", label: "Challenger Deep Bed" },
      { elevation: 0.15, color: "#172554", label: "Abyssal Plain" },
      { elevation: 0.4, color: "#1e3a8a", label: "Hydrothermal Vents" },
      { elevation: 0.6, color: "#1d4ed8", label: "Pelagic Slope" },
      { elevation: 0.8, color: "#3b82f6", label: "Continental Shelf" },
      { elevation: 1.0, color: "#93c5fd", label: "Coral Reef Shallows" }
    ]
  },
  {
    name: "Meteor Crater",
    heightScale: 35,
    exponent: 1.4,
    noiseType: "simplex",
    octaves: 4,
    frequency: 0.011,
    lacunarity: 1.9,
    persistence: 0.45,
    waterLevel: 0,
    craterDepth: 0.95, // extreme crater focus
    craterScale: 0.45,
    plateauThreshold: 0,
    colorStops: [
      { elevation: 0.0, color: "#7f1d1d", label: "Impact Core" },
      { elevation: 0.15, color: "#450a0a", label: "Shattered Bedrock" },
      { elevation: 0.4, color: "#404040", label: "Dusty Floor" },
      { elevation: 0.7, color: "#737373", label: "Impact Breccia Rim" },
      { elevation: 0.85, color: "#a3a3a3", label: "Ejecta Blanket" },
      { elevation: 1.0, color: "#f5f5f5", label: "Shock Quartz Peaks" }
    ]
  },
  {
    name: "Karst Hills",
    heightScale: 55,
    exponent: 2.5, // extreme peak sharpness
    noiseType: "ridged",
    octaves: 5,
    frequency: 0.018,
    lacunarity: 2.1,
    persistence: 0.42,
    waterLevel: 5,
    craterDepth: 0,
    craterScale: 0,
    plateauThreshold: 0,
    colorStops: [
      { elevation: 0.0, color: "#065f46", label: "Underground Rivers" },
      { elevation: 0.1, color: "#10b981", label: "Lush Paddy Fields" },
      { elevation: 0.35, color: "#047857", label: "Bamboo Jungle Base" },
      { elevation: 0.6, color: "#4b5563", label: "Limestone Walls" },
      { elevation: 0.85, color: "#9ca3af", label: "Weathered Karst" },
      { elevation: 1.0, color: "#e5e7eb", label: "Exposed Carbonate Spire" }
    ]
  },
  {
    name: "Badlands",
    heightScale: 45,
    exponent: 1.3,
    noiseType: "fbm",
    octaves: 6,
    frequency: 0.014,
    lacunarity: 2.3,
    persistence: 0.5,
    waterLevel: 0,
    craterDepth: 0,
    craterScale: 0,
    plateauThreshold: 0.6,
    colorStops: [
      { elevation: 0.0, color: "#581c87", label: "Purple Clay Bed" },
      { elevation: 0.2, color: "#701a75", label: "Lavender Silt" },
      { elevation: 0.4, color: "#9a3412", label: "Red Ochre Band" },
      { elevation: 0.6, color: "#b45309", label: "Yellow Sandstone" },
      { elevation: 0.8, color: "#7c2d12", label: "Ironstone Crest" },
      { elevation: 1.0, color: "#fbcfe8", label: "Pale Silt Cap" }
    ]
  },
  {
    name: "Fold Mountains",
    heightScale: 50,
    exponent: 1.6,
    noiseType: "ridged",
    octaves: 5,
    frequency: 0.01,
    lacunarity: 1.8,
    persistence: 0.45,
    waterLevel: 0,
    craterDepth: 0,
    craterScale: 0,
    plateauThreshold: 0,
    colorStops: [
      { elevation: 0.0, color: "#14532d", label: "Forest Troughs" },
      { elevation: 0.3, color: "#166534", label: "Syncline Meadows" },
      { elevation: 0.6, color: "#374151", label: "Folded Shale Wall" },
      { elevation: 0.85, color: "#6b7280", label: "Anticline Peak" },
      { elevation: 1.0, color: "#ffffff", label: "Snowy Ridges" }
    ]
  },
  {
    name: "Glacial Fjords",
    heightScale: 65,
    exponent: 1.8,
    noiseType: "ridged",
    octaves: 6,
    frequency: 0.008,
    lacunarity: 2.1,
    persistence: 0.46,
    waterLevel: 25, // Deep marine fjord
    craterDepth: 0,
    craterScale: 0,
    plateauThreshold: 0,
    colorStops: [
      { elevation: 0.0, color: "#083344", label: "Abyssal Fjord Basin" },
      { elevation: 0.25, color: "#06b6d4", label: "Glacial Blue Shallows" },
      { elevation: 0.3, color: "#065f46", label: "Steep Fir Valleys" },
      { elevation: 0.55, color: "#334155", label: "Sheer Fjord Granite" },
      { elevation: 0.8, color: "#94a3b8", label: "Glacier Tongue" },
      { elevation: 1.0, color: "#ffffff", label: "Ice Sheet Peak" }
    ]
  },
  {
    name: "Coastal Cliffs",
    heightScale: 38,
    exponent: 1.4,
    noiseType: "fbm",
    octaves: 5,
    frequency: 0.009,
    lacunarity: 2.2,
    persistence: 0.4,
    waterLevel: 18,
    craterDepth: 0,
    craterScale: 0,
    plateauThreshold: 0.75, // shear coastal drops
    colorStops: [
      { elevation: 0.0, color: "#1e3a8a", label: "Deep Sea" },
      { elevation: 0.18, color: "#0284c7", label: "Surf Zone" },
      { elevation: 0.2, color: "#f8fafc", label: "Chalk Cliff Walls" },
      { elevation: 0.5, color: "#166534", label: "Emerald Clifftop Turf" },
      { elevation: 0.85, color: "#15803d", label: "Heathy Meadows" },
      { elevation: 1.0, color: "#eab308", label: "Sunlit Gorse Slopes" }
    ]
  }
];

export const PBR_PRESETS: PBRConfig[] = [
  {
    name: "Muddy Earth",
    roughness: 0.85,
    metalness: 0.02,
    normalStrength: 1.8,
    aoStrength: 1.4,
    displacementScale: 4.5,
    patternType: "mud",
    noiseScale: 15,
    bumpiness: 0.8,
    primaryColor: "#271b12",
    secondaryColor: "#453225"
  },
  {
    name: "Jagged Rocks",
    roughness: 0.9,
    metalness: 0.1,
    normalStrength: 2.5,
    aoStrength: 1.8,
    displacementScale: 8.0,
    patternType: "rock",
    noiseScale: 25,
    bumpiness: 1.2,
    primaryColor: "#2d3135",
    secondaryColor: "#545b62"
  },
  {
    name: "Fine Sand",
    roughness: 0.75,
    metalness: 0.0,
    normalStrength: 0.7,
    aoStrength: 0.4,
    displacementScale: 1.5,
    patternType: "sand",
    noiseScale: 8,
    bumpiness: 0.25,
    primaryColor: "#d9a05b",
    secondaryColor: "#f3c78d"
  },
  {
    name: "Lush Grass",
    roughness: 0.95,
    metalness: 0.0,
    normalStrength: 1.2,
    aoStrength: 0.8,
    displacementScale: 2.5,
    patternType: "grass",
    noiseScale: 18,
    bumpiness: 0.5,
    primaryColor: "#1d4013",
    secondaryColor: "#3d7328"
  },
  {
    name: "Volcanic Ash & Lava",
    roughness: 0.8,
    metalness: 0.3,
    normalStrength: 2.2,
    aoStrength: 1.6,
    displacementScale: 7.0,
    patternType: "lava",
    noiseScale: 20,
    bumpiness: 1.4,
    primaryColor: "#110b0b",
    secondaryColor: "#ea3e0c"
  },
  {
    name: "Arctic Ice",
    roughness: 0.1,
    metalness: 0.45,
    normalStrength: 0.9,
    aoStrength: 0.3,
    displacementScale: 2.0,
    patternType: "ice",
    noiseScale: 12,
    bumpiness: 0.4,
    primaryColor: "#7dd3fc",
    secondaryColor: "#e0f2fe"
  },
  {
    name: "Mossy Granite",
    roughness: 0.88,
    metalness: 0.05,
    normalStrength: 2.0,
    aoStrength: 1.5,
    displacementScale: 6.0,
    patternType: "moss",
    noiseScale: 22,
    bumpiness: 0.95,
    primaryColor: "#334155",
    secondaryColor: "#166534"
  },
  {
    name: "Soft Snow",
    roughness: 0.98,
    metalness: 0.0,
    normalStrength: 0.4,
    aoStrength: 0.15,
    displacementScale: 1.0,
    patternType: "snow",
    noiseScale: 6,
    bumpiness: 0.15,
    primaryColor: "#f1f5f9",
    secondaryColor: "#ffffff"
  },
  {
    name: "Red Clay",
    roughness: 0.92,
    metalness: 0.0,
    normalStrength: 1.4,
    aoStrength: 1.1,
    displacementScale: 3.5,
    patternType: "clay",
    noiseScale: 14,
    bumpiness: 0.65,
    primaryColor: "#9a3412",
    secondaryColor: "#c2410c"
  },
  {
    name: "Forest Mulch",
    roughness: 0.94,
    metalness: 0.0,
    normalStrength: 1.7,
    aoStrength: 1.4,
    displacementScale: 5.0,
    patternType: "dirt",
    noiseScale: 16,
    bumpiness: 0.85,
    primaryColor: "#1f140d",
    secondaryColor: "#3d2a1c"
  },
  {
    name: "Dry Cracked Earth",
    roughness: 0.96,
    metalness: 0.0,
    normalStrength: 2.4,
    aoStrength: 1.7,
    displacementScale: 6.5,
    patternType: "cracked",
    noiseScale: 24,
    bumpiness: 1.1,
    primaryColor: "#6b5847",
    secondaryColor: "#a38971"
  },
  {
    name: "Gravel Pebbles",
    roughness: 0.85,
    metalness: 0.1,
    normalStrength: 2.3,
    aoStrength: 1.6,
    displacementScale: 6.2,
    patternType: "pebbles",
    noiseScale: 30,
    bumpiness: 1.3,
    primaryColor: "#4b5563",
    secondaryColor: "#9ca3af"
  },
  {
    name: "Sandy Grass Blend",
    roughness: 0.88,
    metalness: 0.0,
    normalStrength: 1.1,
    aoStrength: 0.7,
    displacementScale: 2.2,
    patternType: "grass",
    noiseScale: 15,
    bumpiness: 0.45,
    primaryColor: "#b45309",
    secondaryColor: "#15803d"
  },
  {
    name: "Wet Shoreline Sand",
    roughness: 0.15,
    metalness: 0.05,
    normalStrength: 0.6,
    aoStrength: 0.35,
    displacementScale: 1.2,
    patternType: "sand",
    noiseScale: 10,
    bumpiness: 0.2,
    primaryColor: "#78350f",
    secondaryColor: "#92400e"
  },
  {
    name: "Lichen Rock",
    roughness: 0.91,
    metalness: 0.05,
    normalStrength: 2.1,
    aoStrength: 1.5,
    displacementScale: 5.5,
    patternType: "lichen",
    noiseScale: 26,
    bumpiness: 1.0,
    primaryColor: "#374151",
    secondaryColor: "#ca8a04"
  }
];
