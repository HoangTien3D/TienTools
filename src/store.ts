/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { AppState, TerrainConfig, PBRConfig, WaterConfig, ColorStop, NoiseType } from './types';
import { TERRAIN_PRESETS, PBR_PRESETS } from './data/presets';

const DEFAULT_TERRAIN: TerrainConfig = { ...TERRAIN_PRESETS[0], sizeX: 100, sizeY: 100 };
const DEFAULT_PBR: PBRConfig = { ...PBR_PRESETS[3] }; // Grass by default

const DEFAULT_WATER: WaterConfig = {
  roughness: 0.1,
  metalness: 0.9,
  opacity: 0.7,
  color: '#0ea5e9',
  causticColor: '#7ae2ff',
  speed: 1.0,
  waveHeight: 0.8,
  frequency: 1.5,
  pattern: 'voronoi',
  noiseScale: 25,
  bumpiness: 0.6,
};

export const useAppStore = create<AppState & {
  setTerrain: (t: Partial<TerrainConfig>) => void;
  setPBR: (p: Partial<PBRConfig>) => void;
  setWater: (w: Partial<WaterConfig>) => void;
  setUI: (key: string, val: any) => void;
  setOpenRouterKey: (key: string) => void;
  setOpenRouterModel: (model: string) => void;
  setAiPrompt: (prompt: string) => void;
  togglePanel: (panelId: string) => void;
  loadPreset: (type: 'terrain' | 'pbr', index: number) => void;
  generateWithAI: () => Promise<void>;
  generateLocalDemo: () => void;
  addColorStop: (stop: ColorStop) => void;
  removeColorStop: (index: number) => void;
  updateColorStop: (index: number, stop: Partial<ColorStop>) => void;
}>((set, get) => ({
  // Default Configs
  terrain: DEFAULT_TERRAIN,
  pbr: DEFAULT_PBR,
  water: DEFAULT_WATER,
  
  // App UI State
  gridResolution: 128,
  wireframe: false,
  wireframeColor: '#cbd5e1',
  showWater: true,
  waterColor: '#0ea5e9',
  shadingMode: 'pbr',
  autoRotate: false,
  
  // Lighting
  lightIntensity: 1.5,
  lightColor: '#ffffff',
  lightAngleX: 45,
  lightAngleY: 45,
  
  // Lists
  terrainPresets: TERRAIN_PRESETS,
  pbrPresets: PBR_PRESETS,
  
  // OpenRouter State
  openRouterKey: localStorage.getItem('terra_openrouter_key') || '',
  openRouterModel: 'openrouter/free',
  aiPrompt: 'A glowing lava planet with jagged basalt columns, deep valleys of hot magma, and extremely high normal bumpiness.',
  aiIsGenerating: false,
  aiError: null,
  aiLastResponse: null,
  
  // Layout
  activePanels: {
    viewport: true,
    presets: true,
    aiPanel: true,
    generators: true,
    pbrWorkspace: true,
    lighting: true,
  },
  sidebarWidth: 320,
  activeTab: 'terrain',

  // Actions
  setTerrain: (t) => set((state) => ({ terrain: { ...state.terrain, ...t } })),
  setPBR: (p) => set((state) => ({ pbr: { ...state.pbr, ...p } })),
  setWater: (w) => set((state) => ({ water: { ...state.water, ...w } })),
  setUI: (key, val) => set(() => ({ [key]: val })),
  
  setOpenRouterKey: (key) => {
    localStorage.setItem('terra_openrouter_key', key);
    set({ openRouterKey: key });
  },
  
  setOpenRouterModel: (model) => set({ openRouterModel: model }),
  setAiPrompt: (prompt) => set({ aiPrompt: prompt }),
  
  togglePanel: (panelId) => set((state) => ({
    activePanels: {
      ...state.activePanels,
      [panelId]: !state.activePanels[panelId]
    }
  })),
  
  loadPreset: (type, index) => {
    if (type === 'terrain') {
      const preset = get().terrainPresets[index];
      if (preset) {
        set({ terrain: { ...preset } });
      }
    } else {
      const preset = get().pbrPresets[index];
      if (preset) {
        set({ pbr: { ...preset } });
      }
    }
  },

  addColorStop: (stop) => set((state) => {
    const stops = [...state.terrain.colorStops, stop].sort((a, b) => a.elevation - b.elevation);
    return { terrain: { ...state.terrain, colorStops: stops } };
  }),

  removeColorStop: (index) => set((state) => {
    if (state.terrain.colorStops.length <= 1) return {}; // Keep at least one
    const stops = state.terrain.colorStops.filter((_, i) => i !== index);
    return { terrain: { ...state.terrain, colorStops: stops } };
  }),

  updateColorStop: (index, stop) => set((state) => {
    const stops = state.terrain.colorStops.map((s, i) => {
      if (i === index) {
        return { ...s, ...stop };
      }
      return s;
    });
    // Re-sort only if elevation changed
    if (stop.elevation !== undefined) {
      stops.sort((a, b) => a.elevation - b.elevation);
    }
    return { terrain: { ...state.terrain, colorStops: stops } };
  }),

  generateWithAI: async () => {
    const key = get().openRouterKey;
    const prompt = get().aiPrompt;
    const model = get().openRouterModel;

    if (!key) {
      set({ aiError: "OpenRouter API Key is missing. Please enter your API key in the API Settings box below." });
      return;
    }

    set({ aiIsGenerating: true, aiError: null });

    const systemPrompt = `You are a high-performance 3D Procedural Terrain Studio generator assistant.
Your task is to generate complete, visually stunning 3D procedural terrain parameters based on the user's description.
You MUST respond ONLY with a raw JSON object matching the following structure. Do not output any chat, explanation, or markdown wrapping other than valid JSON.

JSON Schema:
{
  "terrain": {
    "name": "Descriptive, atmospheric name of the terrain style",
    "heightScale": 10-100 (number),
    "exponent": 0.5-3.0 (number, shapes slope curves),
    "noiseType": "simplex" | "fbm" | "ridged" | "billow",
    "octaves": 1-8 (number, level of detail),
    "frequency": 0.002-0.03 (number, noise scale),
    "lacunarity": 1.5-2.5 (number),
    "persistence": 0.2-0.8 (number),
    "waterLevel": 0-50 (number),
    "craterDepth": 0-1 (number, adds meteorite impact circular bowl),
    "craterScale": 0.1-0.5 (number),
    "plateauThreshold": 0-1 (number, 0 is smooth, 1 is fully stepped/terraced flat steps),
    "colorStops": [
      { "elevation": 0.0, "color": "#hex" },
      { "elevation": 0.25, "color": "#hex" },
      { "elevation": 0.5, "color": "#hex" },
      { "elevation": 0.75, "color": "#hex" },
      { "elevation": 1.0, "color": "#hex" }
    ]
  },
  "pbr": {
    "name": "Descriptive PBR Material Name",
    "roughness": 0.0-1.0 (number),
    "metalness": 0.0-1.0 (number),
    "normalStrength": 0.0-3.0 (number),
    "aoStrength": 0.0-2.0 (number),
    "displacementScale": 0.0-10.0 (number),
    "patternType": "mud" | "rock" | "sand" | "grass" | "lava" | "ice" | "moss" | "snow" | "clay" | "wood" | "dirt" | "lichen" | "pebbles" | "cracked" | "gravel",
    "noiseScale": 5-40 (number, pattern frequency),
    "bumpiness": 0.0-2.0 (number, height of bumps),
    "primaryColor": "#hex (micro-pattern base color)",
    "secondaryColor": "#hex (micro-pattern accent color)"
  }
}

You must select exactly matching types for "noiseType" and "patternType". Ensure the colorStops list contains 3 to 6 sorted steps from elevation 0.0 to 1.0, customized to perfectly match the theme (e.g. volcanic ash uses black and neon oranges, islands use turquoise sands, mossy woodlands use deep forest greens).
Do not insert markdown block quotes like \\\`\\\`\\\`json or comments. Return ONLY valid JSON.`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          "HTTP-Referer": window.location.href,
          "X-Title": "TerraCraft 3D Studio"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate procedural parameters for this terrain idea: "${prompt}"` }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API responded with status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from AI model.");
      }

      // Try to clean/extract JSON from possible markdown wrapping
      let jsonString = content.trim();
      if (jsonString.includes("```")) {
        const match = jsonString.match(/```(?:json)?([\s\S]*?)```/);
        if (match && match[1]) {
          jsonString = match[1].trim();
        }
      }

      const parsed = JSON.parse(jsonString);

      // Validate schemas before loading
      if (parsed.terrain && parsed.pbr) {
        // Sanitize values
        const t = parsed.terrain;
        const p = parsed.pbr;

        const cleanTerrain: TerrainConfig = {
          name: typeof t.name === 'string' ? t.name : "AI Generated Terrain",
          heightScale: Math.max(1, Math.min(100, Number(t.heightScale) || 40)),
          exponent: Math.max(0.1, Math.min(5.0, Number(t.exponent) || 1.3)),
          noiseType: ['simplex', 'fbm', 'ridged', 'billow'].includes(t.noiseType) ? t.noiseType : 'fbm',
          octaves: Math.max(1, Math.min(8, Math.round(Number(t.octaves)) || 5)),
          frequency: Math.max(0.001, Math.min(0.08, Number(t.frequency) || 0.01)),
          lacunarity: Math.max(1.0, Math.min(3.5, Number(t.lacunarity) || 2.0)),
          persistence: Math.max(0.05, Math.min(0.95, Number(t.persistence) || 0.5)),
          waterLevel: Math.max(0, Math.min(80, Number(t.waterLevel) || 0)),
          craterDepth: Math.max(0, Math.min(1.0, Number(t.craterDepth) || 0)),
          craterScale: Math.max(0.05, Math.min(0.8, Number(t.craterScale) || 0.25)),
          plateauThreshold: Math.max(0, Math.min(1.0, Number(t.plateauThreshold) || 0)),
          sizeX: Math.max(10, Math.min(500, Number(t.sizeX) || 100)),
          sizeY: Math.max(10, Math.min(500, Number(t.sizeY) || 100)),
          colorStops: Array.isArray(t.colorStops) ? t.colorStops.map((stop: any, idx: number) => ({
            elevation: Math.max(0, Math.min(1.0, Number(stop.elevation) ?? (idx / (t.colorStops.length - 1)))),
            color: typeof stop.color === 'string' && stop.color.startsWith('#') ? stop.color : '#888888',
            label: typeof stop.label === 'string' ? stop.label : `Stop ${idx + 1}`
          })).sort((a: any, b: any) => a.elevation - b.elevation) : [
            { elevation: 0.0, color: "#1e293b", label: "Bottom" },
            { elevation: 0.5, color: "#475569", label: "Slope" },
            { elevation: 1.0, color: "#cbd5e1", label: "Peak" }
          ]
        };

        const cleanPBR: PBRConfig = {
          name: typeof p.name === 'string' ? p.name : "AI Generated PBR",
          roughness: Math.max(0, Math.min(1.0, Number(p.roughness) ?? 0.8)),
          metalness: Math.max(0, Math.min(1.0, Number(p.metalness) ?? 0.05)),
          normalStrength: Math.max(0, Math.min(4.0, Number(p.normalStrength) ?? 1.5)),
          aoStrength: Math.max(0, Math.min(3.0, Number(p.aoStrength) ?? 1.0)),
          displacementScale: Math.max(0, Math.min(15.0, Number(p.displacementScale) ?? 4.0)),
          patternType: typeof p.patternType === 'string' ? p.patternType : 'rock',
          noiseScale: Math.max(2, Math.min(60, Number(p.noiseScale) || 15)),
          bumpiness: Math.max(0, Math.min(3.0, Number(p.bumpiness) ?? 0.5)),
          primaryColor: typeof p.primaryColor === 'string' && p.primaryColor.startsWith('#') ? p.primaryColor : '#444444',
          secondaryColor: typeof p.secondaryColor === 'string' && p.secondaryColor.startsWith('#') ? p.secondaryColor : '#888888'
        };

        set({
          terrain: cleanTerrain,
          pbr: cleanPBR,
          aiLastResponse: jsonString,
          aiIsGenerating: false
        });
      } else {
        throw new Error("Invalid parameters returned from model. Make sure both 'terrain' and 'pbr' blocks are present.");
      }

    } catch (err: any) {
      console.error(err);
      set({
        aiError: err.message || "An unknown error occurred during AI generation.",
        aiIsGenerating: false
      });
    }
  },

  // offline fallback sandbox generation
  generateLocalDemo: () => {
    // Selects a random combination of elements and shapes them organically
    const names = ["Cosmic Wasteland", "Jade Archipelago", "Iron Plateau", "Neon Subduction", "Sulphur Canyons"];
    const name = names[Math.floor(Math.random() * names.length)];

    const randomNoise: NoiseType[] = ["simplex", "fbm", "ridged", "billow"];
    const selectedNoise = randomNoise[Math.floor(Math.random() * randomNoise.length)];

    const randomPatterns = ["mud", "rock", "sand", "grass", "lava", "ice", "moss", "snow", "clay", "cracked", "lichen"];
    const selectedPattern = randomPatterns[Math.floor(Math.random() * randomPatterns.length)];

    // Generate random warm or cool gradients
    const colSet = Math.random() > 0.5 ? [
      { elevation: 0.0, color: "#111827", label: "Depths" },
      { elevation: 0.35, color: "#dc2626", label: "Magma flows" },
      { elevation: 0.65, color: "#f97316", label: "Cooled crust" },
      { elevation: 1.0, color: "#fef08a", label: "Sulfur tips" }
    ] : [
      { elevation: 0.0, color: "#0c4a6e", label: "Fjord sea" },
      { elevation: 0.2, color: "#0284c7", label: "Coastal sand" },
      { elevation: 0.5, color: "#059669", label: "Rainforest" },
      { elevation: 0.8, color: "#4b5563", label: "Gravel slope" },
      { elevation: 1.0, color: "#f8fafc", label: "Summit ice" }
    ];

    const cleanTerrain: TerrainConfig = {
      name: `${name} (Sandbox Demo)`,
      heightScale: Math.round(30 + Math.random() * 50),
      exponent: Number((0.8 + Math.random() * 1.5).toFixed(2)),
      noiseType: selectedNoise,
      octaves: Math.round(4 + Math.random() * 3),
      frequency: Number((0.005 + Math.random() * 0.015).toFixed(4)),
      lacunarity: Number((1.8 + Math.random() * 0.5).toFixed(2)),
      persistence: Number((0.35 + Math.random() * 0.25).toFixed(2)),
      waterLevel: Math.round(Math.random() * 25),
      craterDepth: Math.random() > 0.4 ? Number(Math.random().toFixed(2)) : 0,
      craterScale: Number((0.15 + Math.random() * 0.3).toFixed(2)),
      plateauThreshold: Math.random() > 0.6 ? Number(Math.random().toFixed(2)) : 0,
      sizeX: 100,
      sizeY: 100,
      colorStops: colSet
    };

    // PBR
    const randomColors = [
      ["#1f2937", "#4b5563"],
      ["#7c2d12", "#ca8a04"],
      ["#064e3b", "#10b981"],
      ["#431407", "#ea580c"],
      ["#0f172a", "#f43f5e"]
    ];
    const colPair = randomColors[Math.floor(Math.random() * randomColors.length)];

    const cleanPBR: PBRConfig = {
      name: `Procedural ${selectedPattern.toUpperCase()}`,
      roughness: Number((0.1 + Math.random() * 0.8).toFixed(2)),
      metalness: Number((Math.random() * 0.4).toFixed(2)),
      normalStrength: Number((0.5 + Math.random() * 2.0).toFixed(2)),
      aoStrength: Number((0.4 + Math.random() * 1.2).toFixed(2)),
      displacementScale: Number((1.0 + Math.random() * 8.0).toFixed(2)),
      patternType: selectedPattern,
      noiseScale: Math.round(10 + Math.random() * 25),
      bumpiness: Number((0.2 + Math.random() * 1.2).toFixed(2)),
      primaryColor: colPair[0],
      secondaryColor: colPair[1]
    };

    set({
      terrain: cleanTerrain,
      pbr: cleanPBR,
      aiError: null,
      aiLastResponse: "Loaded local random procedural parameters (Offline Sandbox Mode)!"
    });
  }
}));
