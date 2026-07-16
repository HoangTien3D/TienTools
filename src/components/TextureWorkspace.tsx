/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { generatePBRCanvases, generateWaterPBRCanvases } from '../lib/generators';
import { Image, Download, Sparkles, ZoomIn, Info, Eye, Waves, Compass } from 'lucide-react';

export default function TextureWorkspace() {
  const { terrain, pbr, water, setWater } = useAppStore();
  const [activeMaterial, setActiveMaterial] = useState<'terrain' | 'water'>('terrain');
  const [exportRes, setExportRes] = useState<number>(1024); // default high resolution export
  const [isExportingAll, setIsExportingAll] = useState(false);

  // Selection states for exporting channels
  const [selectedExportChannels, setSelectedExportChannels] = useState<{
    albedo: boolean;
    normal: boolean;
    roughness: boolean;
    ao: boolean;
    height: boolean;
  }>({
    albedo: true,
    normal: true,
    roughness: true,
    ao: true,
    height: true
  });

  // References to mini canvas previews
  const albedoRef = useRef<HTMLCanvasElement>(null);
  const normalRef = useRef<HTMLCanvasElement>(null);
  const roughnessRef = useRef<HTMLCanvasElement>(null);
  const aoRef = useRef<HTMLCanvasElement>(null);
  const heightRef = useRef<HTMLCanvasElement>(null);

  // Re-draw 2D previews when state changes
  useEffect(() => {
    // Generate at 256x256 for fast interactive UI preview
    const maps = activeMaterial === 'terrain'
      ? generatePBRCanvases(terrain, pbr, 256)
      : generateWaterPBRCanvases(water, 256);

    const copyCanvas = (src: HTMLCanvasElement, dest: HTMLCanvasElement | null) => {
      if (!dest) return;
      const ctx = dest.getContext('2d');
      if (!ctx) return;
      dest.width = src.width;
      dest.height = src.height;
      ctx.drawImage(src, 0, 0);
    };

    copyCanvas(maps.albedo, albedoRef.current);
    copyCanvas(maps.normal, normalRef.current);
    copyCanvas(maps.roughness, roughnessRef.current);
    copyCanvas(maps.ao, aoRef.current);
    copyCanvas(maps.height, heightRef.current);
  }, [terrain, pbr, water, activeMaterial]);

  // Individual Map Exporter at High-Resolution
  const exportHighResMap = (mapType: 'albedo' | 'normal' | 'roughness' | 'ao' | 'height') => {
    try {
      const size = exportRes;
      const maps = activeMaterial === 'terrain'
        ? generatePBRCanvases(terrain, pbr, size)
        : generateWaterPBRCanvases(water, size);
      
      let targetCanvas: HTMLCanvasElement;
      switch (mapType) {
        case 'albedo': targetCanvas = maps.albedo; break;
        case 'normal': targetCanvas = maps.normal; break;
        case 'roughness': targetCanvas = maps.roughness; break;
        case 'ao': targetCanvas = maps.ao; break;
        case 'height': targetCanvas = maps.height; break;
      }

      // Trigger download
      const dataUrl = targetCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      const prefix = activeMaterial === 'terrain' ? pbr.name : 'water_plane';
      const safeName = prefix.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = `pbr_${safeName}_${mapType}_${size}x${size}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("High-Res Export failed", e);
    }
  };

  // Export All Maps together
  const exportAllMaps = async () => {
    setIsExportingAll(true);
    const maps = ['albedo', 'normal', 'roughness', 'ao', 'height'] as const;
    
    // Stagger downloads to prevent browser blocking
    let count = 0;
    for (let i = 0; i < maps.length; i++) {
      const map = maps[i];
      if (selectedExportChannels[map]) {
        await new Promise((resolve) => {
          setTimeout(() => {
            exportHighResMap(map);
            resolve(true);
          }, count * 350);
        });
        count++;
      }
    }
    setIsExportingAll(false);
  };

  const mapInfo = {
    albedo: activeMaterial === 'terrain'
      ? "Albedo (Color): Contains base color diffuse data blended with procedural terrain slope gradients and soil noise micro-textures."
      : "Albedo (Color): Procedural water color featuring high-intensity Voronoi caustic shimmers, representing light focusing underwater.",
    normal: activeMaterial === 'terrain'
      ? "Normal Map (RGB): High-resolution surface normals calculated via Sobel filter, describing vector directions for lighting angles."
      : "Normal Map (RGB): Micro-ripple surface normals calculated via Sobel filter to create realistic, dynamic light refractiveness.",
    roughness: activeMaterial === 'terrain'
      ? "Roughness Map (Grayscale): Controls micro-surface reflection, smooth valleys and water surfaces vs. sharp granite cliffs."
      : "Roughness Map (Grayscale): Controls water glossiness and mirror reflectivity. Crests are slightly more textured than troughs.",
    ao: activeMaterial === 'terrain'
      ? "Ambient Occlusion (AO): Micro-crevice shadowing based on surface height variance to add physical depth in shadowed cracks."
      : "Ambient Occlusion (AO): Simulates the self-shadowing and light attenuation of deep waves and caustic light concentrations.",
    height: activeMaterial === 'terrain'
      ? "Height/Displacement Map (Grayscale): Represents the high-frequency displacement of the sculpt, suitable for 3D shaders."
      : "Height/Displacement Map (Grayscale): Height field representing high-frequency water ripples and cellular caustics waves."
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] border border-[#1e1e1e] rounded overflow-hidden">
      {/* Panel Header */}
      <div className="flex justify-between items-center px-4 py-2.5 bg-[#0c0c0c] border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-white" />
          <span className="font-sans font-semibold text-xs tracking-wide text-[#ffffff]">
            PBR TEXTURE DESIGNER WORKSPACE
          </span>
        </div>

        {/* Export Resolution Picker */}
        <div className="flex items-center gap-2 bg-[#121212] p-1 rounded border border-[#2c2c2c] text-[10px]">
          <span className="text-[#a3a3a3] font-mono font-bold uppercase tracking-wider">Export:</span>
          <select
            value={exportRes}
            onChange={(e) => setExportRes(Number(e.target.value))}
            className="bg-transparent border-0 text-[#ffffff] focus:outline-none font-mono font-bold cursor-pointer"
          >
            <option value="512">512px</option>
            <option value="1024">1024px HD</option>
            <option value="2048">2048px Ultra</option>
          </select>
        </div>
      </div>

      {/* Material Selector Bar */}
      <div className="grid grid-cols-2 bg-[#0c0c0c] border-b border-[#1e1e1e] p-1 gap-1">
        <button
          onClick={() => {
            setActiveMaterial('terrain');
          }}
          className={`py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMaterial === 'terrain'
              ? 'bg-white text-black font-extrabold border border-white shadow'
              : 'text-[#a3a3a3] hover:text-[#ffffff] hover:bg-[#121212]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Terrain Material</span>
        </button>

        <button
          onClick={() => {
            setActiveMaterial('water');
          }}
          className={`py-1.5 text-[10px] font-sans font-bold uppercase tracking-wider rounded transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeMaterial === 'water'
              ? 'bg-white text-black font-extrabold border border-white shadow'
              : 'text-[#a3a3a3] hover:text-[#ffffff] hover:bg-[#121212]'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Water Material</span>
        </button>
      </div>

      {/* Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-white">
        
        {/* 5 Channels Grid Selectors */}
        <div className="space-y-2">
          <label className="block text-[#a3a3a3] text-[10px] uppercase font-bold tracking-wider">
            Material Texture Channels
          </label>
          
          <div className="space-y-2">
            {(['albedo', 'normal', 'roughness', 'ao', 'height'] as const).map((map) => {
              const isSelected = selectedExportChannels[map];
              return (
                <div
                  key={map}
                  className={`flex items-center gap-3 p-2 rounded border bg-[#121212]/30 transition-all ${
                    isSelected ? 'border-[#2c2c2c]' : 'border-[#1e1e1e] opacity-60'
                  }`}
                >
                  {/* Miniature canvas */}
                  <div className="w-12 h-12 rounded overflow-hidden border border-[#2c2c2c] bg-[#050505] relative flex-shrink-0">
                    <canvas
                      ref={
                        map === 'albedo' ? albedoRef :
                        map === 'normal' ? normalRef :
                        map === 'roughness' ? roughnessRef :
                        map === 'ao' ? aoRef : heightRef
                      }
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Channel Meta & Selection */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wide text-[#ffffff]">
                        {map}
                      </span>
                      {/* Individual Download Icon */}
                      <button
                        onClick={() => exportHighResMap(map)}
                        title={`Download High-Res ${map.toUpperCase()} Map`}
                        className="p-1 text-[#a3a3a3] hover:text-[#ffffff] hover:bg-[#121212] rounded transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {/* Checkbox toggle */}
                    <label className="flex items-center gap-1.5 mt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setSelectedExportChannels(prev => ({
                          ...prev,
                          [map]: !prev[map]
                        }))}
                        className="rounded border-[#2c2c2c] bg-[#050505] text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 accent-white cursor-pointer"
                      />
                      <span className="text-[9px] text-[#a3a3a3] font-mono uppercase tracking-wider">
                        Include in Export Package
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Options */}
        <div className="pt-2">
          <button
            onClick={exportAllMaps}
            disabled={isExportingAll || !Object.values(selectedExportChannels).some(Boolean)}
            className="w-full py-2 bg-white hover:bg-neutral-200 disabled:bg-[#121212] disabled:border-[#2c2c2c] text-black font-bold uppercase text-[10px] tracking-wider rounded transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer border border-white"
          >
            <Download className="w-4 h-4 text-black" />
            <span>
              {isExportingAll ? 'EXPORTING SELECTED...' : `DOWNLOAD SELECTED PBR MAPS (${exportRes}px)`}
            </span>
          </button>
        </div>

        {/* Conditional settings panel depending on active material */}
        {activeMaterial === 'terrain' ? (
          /* Texturize App style Micro-patterns settings for Terrain */
          <div className="bg-[#121212]/40 p-3 rounded border border-[#2c2c2c] text-[11px] text-[#a3a3a3] space-y-2.5">
            <div className="flex items-center gap-1.5 font-bold text-[#ffffff]">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="uppercase text-[10px]">PBR Settings & Micro-Grain</span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Micro-pattern Frequency</span>
                  <span className="font-mono text-white font-bold">{pbr.noiseScale}x</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={pbr.noiseScale}
                  onChange={(e) => useAppStore.getState().setPBR({ noiseScale: Number(e.target.value) })}
                  className="w-full accent-white h-1 bg-[#050505] rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Bumpiness (Depth)</span>
                  <span className="font-mono text-white font-bold">{pbr.bumpiness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.05"
                  value={pbr.bumpiness}
                  onChange={(e) => useAppStore.getState().setPBR({ bumpiness: Number(e.target.value) })}
                  className="w-full accent-white h-1 bg-[#050505] rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Displacement Multiplier</span>
                  <span className="font-mono text-white font-bold">{pbr.displacementScale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="10.0"
                  step="0.5"
                  value={pbr.displacementScale}
                  onChange={(e) => useAppStore.getState().setPBR({ displacementScale: Number(e.target.value) })}
                  className="w-full accent-white h-1 bg-[#050505] rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[#a3a3a3] mb-1">Pattern Primary</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={pbr.primaryColor}
                      onChange={(e) => useAppStore.getState().setPBR({ primaryColor: e.target.value })}
                      className="w-5 h-5 border-0 p-0 rounded cursor-pointer bg-transparent"
                    />
                    <span className="font-mono uppercase text-[9px] text-[#ffffff]">{pbr.primaryColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[#a3a3a3] mb-1">Pattern Secondary</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={pbr.secondaryColor}
                      onChange={(e) => useAppStore.getState().setPBR({ secondaryColor: e.target.value })}
                      className="w-5 h-5 border-0 p-0 rounded cursor-pointer bg-transparent"
                    />
                    <span className="font-mono uppercase text-[9px] text-[#ffffff]">{pbr.secondaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Water Caustics & Waves PBR Settings Panel */
          <div className="bg-[#121212]/40 p-3 rounded border border-[#2c2c2c] text-[11px] text-[#a3a3a3] space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-[#ffffff]">
              <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="uppercase text-[10px]">PBR Water Caustic & Wave Editor</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[#a3a3a3] mb-1 font-semibold uppercase text-[9px] tracking-wider">Procedural Pattern</label>
                <select
                  value={water.pattern}
                  onChange={(e) => setWater({ pattern: e.target.value as any })}
                  className="w-full bg-[#050505] border border-[#2c2c2c] rounded px-2.5 py-1.5 text-[#ffffff] font-mono text-[11px] focus:outline-none focus:border-white cursor-pointer"
                >
                  <option value="voronoi">Voronoi Caustics</option>
                  <option value="sine">Sine Wave Ripples</option>
                  <option value="simplex">Simplex Fluid Flows</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Caustic/Pattern Frequency</span>
                  <span className="font-mono text-white font-bold">{water.noiseScale}x</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={water.noiseScale}
                  onChange={(e) => setWater({ noiseScale: Number(e.target.value) })}
                  className="w-full accent-white h-1 bg-[#050505] rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Micro-ripple Strength (Bump)</span>
                  <span className="font-mono text-white font-bold">{water.bumpiness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.05"
                  value={water.bumpiness}
                  onChange={(e) => setWater({ bumpiness: Number(e.target.value) })}
                  className="w-full accent-white h-1 bg-[#050505] rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Roughness</span>
                    <span className="font-mono text-white font-bold">{water.roughness.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={water.roughness}
                    onChange={(e) => setWater({ roughness: Number(e.target.value) })}
                    className="w-full accent-white h-1 bg-[#050505] rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Metalness</span>
                    <span className="font-mono text-white font-bold">{water.metalness.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={water.metalness}
                    onChange={(e) => setWater({ metalness: Number(e.target.value) })}
                    className="w-full accent-white h-1 bg-[#050505] rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Water Opacity</span>
                    <span className="font-mono text-white font-bold">{water.opacity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={water.opacity}
                    onChange={(e) => setWater({ opacity: Number(e.target.value) })}
                    className="w-full accent-white h-1 bg-[#050505] rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Wave Speed</span>
                    <span className="font-mono text-white font-bold">{water.speed.toFixed(1)}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="4.0"
                    step="0.1"
                    value={water.speed}
                    onChange={(e) => setWater({ speed: Number(e.target.value) })}
                    className="w-full accent-white h-1 bg-[#050505] rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Wave Height (Vertex)</span>
                    <span className="font-mono text-white font-bold">{water.waveHeight.toFixed(2)}m</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="4.0"
                    step="0.05"
                    value={water.waveHeight}
                    onChange={(e) => setWater({ waveHeight: Number(e.target.value) })}
                    className="w-full accent-white h-1 bg-[#050505] rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Wave Density</span>
                    <span className="font-mono text-white font-bold">{water.frequency.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={water.frequency}
                    onChange={(e) => setWater({ frequency: Number(e.target.value) })}
                    className="w-full accent-white h-1 bg-[#050505] rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[#a3a3a3] mb-1">Water Base Color</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={water.color}
                      onChange={(e) => setWater({ color: e.target.value })}
                      className="w-5 h-5 border-0 p-0 rounded cursor-pointer bg-transparent"
                    />
                    <span className="font-mono uppercase text-[9px] text-[#ffffff]">{water.color}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[#a3a3a3] mb-1">Caustic Highlight</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={water.causticColor}
                      onChange={(e) => setWater({ causticColor: e.target.value })}
                      className="w-5 h-5 border-0 p-0 rounded cursor-pointer bg-transparent"
                    />
                    <span className="font-mono uppercase text-[9px] text-[#ffffff]">{water.causticColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
