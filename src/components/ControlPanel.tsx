/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Sliders, Plus, Trash2, Mountain, Settings2, Waves, Orbit, HelpCircle } from 'lucide-react';
import { NoiseType } from '../types';

export default function ControlPanel() {
  const {
    terrain,
    gridResolution,
    wireframe,
    wireframeColor,
    showWater,
    waterColor,
    setTerrain,
    setUI,
    addColorStop,
    removeColorStop,
    updateColorStop,
  } = useAppStore();

  const [newStopElevation, setNewStopElevation] = useState(0.5);
  const [newStopColor, setNewStopColor] = useState('#10b981');

  const handleAddStop = () => {
    addColorStop({
      elevation: Math.max(0, Math.min(1, newStopElevation)),
      color: newStopColor,
      label: `Custom Stop`
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] border border-[#1e1e1e] rounded overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0c0c0c] border-b border-[#1e1e1e]">
        <Sliders className="w-4 h-4 text-white" />
        <span className="font-sans font-semibold text-xs tracking-wide text-[#ffffff]">
          TERRAIN PROCEDURAL PARAMS
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-[#ffffff] text-xs">
        
        {/* Core Geometry Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#ffffff] border-b border-[#1e1e1e] pb-1">
            <Mountain className="w-3.5 h-3.5 text-white" />
            <span>Sculpting & Displacement</span>
          </div>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#a3a3a3]">Height Scale (Displacement)</span>
                <span className="font-mono text-white font-bold">{terrain.heightScale}m</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={terrain.heightScale}
                onChange={(e) => setTerrain({ heightScale: Number(e.target.value) })}
                className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#a3a3a3]">Slope Sharpness (Exponent)</span>
                <span className="font-mono text-white font-bold">{terrain.exponent}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={terrain.exponent}
                onChange={(e) => setTerrain({ exponent: Number(e.target.value) })}
                className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#a3a3a3]">Plateau Step Intensity</span>
                <span className="font-mono text-white font-bold">{(terrain.plateauThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={terrain.plateauThreshold}
                onChange={(e) => setTerrain({ plateauThreshold: Number(e.target.value) })}
                className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#a3a3a3]">Terrain Width (X)</span>
                  <span className="font-mono text-white font-bold">{terrain.sizeX ?? 100}m</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="5"
                  value={terrain.sizeX ?? 100}
                  onChange={(e) => setTerrain({ sizeX: Number(e.target.value) })}
                  className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#a3a3a3]">Terrain Length (Y)</span>
                  <span className="font-mono text-white font-bold">{terrain.sizeY ?? 100}m</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="5"
                  value={terrain.sizeY ?? 100}
                  onChange={(e) => setTerrain({ sizeY: Number(e.target.value) })}
                  className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Noise Algorithms */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#ffffff] border-b border-[#1e1e1e] pb-1">
            <Settings2 className="w-3.5 h-3.5 text-white" />
            <span>Noise Profile & Math</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[#a3a3a3] mb-1">Noise Algorithm</label>
              <select
                value={terrain.noiseType}
                onChange={(e) => setTerrain({ noiseType: e.target.value as NoiseType })}
                className="w-full bg-[#121212] border border-[#2c2c2c] rounded px-2.5 py-1.5 text-[#ffffff] focus:outline-none focus:border-white font-mono text-[11px] cursor-pointer"
              >
                <option value="simplex">Simplex (Standard Perlin)</option>
                <option value="fbm">Fractional Brownian Motion (FBM)</option>
                <option value="ridged">Ridged Multifractal (Alpine Peaks)</option>
                <option value="billow">Billow (Rolling Hummocks)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#a3a3a3]">Frequency</span>
                  <span className="font-mono text-white font-bold">{terrain.frequency.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="0.002"
                  max="0.03"
                  step="0.0005"
                  value={terrain.frequency}
                  onChange={(e) => setTerrain({ frequency: Number(e.target.value) })}
                  className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#a3a3a3]">Octaves (Detail)</span>
                  <span className="font-mono text-white font-bold">{terrain.octaves}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={terrain.octaves}
                  onChange={(e) => setTerrain({ octaves: Number(e.target.value) })}
                  className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#a3a3a3]">Lacunarity</span>
                  <span className="font-mono text-white font-bold">{terrain.lacunarity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="3.0"
                  step="0.05"
                  value={terrain.lacunarity}
                  onChange={(e) => setTerrain({ lacunarity: Number(e.target.value) })}
                  className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#a3a3a3]">Persistence</span>
                  <span className="font-mono text-white font-bold">{terrain.persistence.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={terrain.persistence}
                  onChange={(e) => setTerrain({ persistence: Number(e.target.value) })}
                  className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Meteor Impact Crater (Shape sculpting) */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#ffffff] border-b border-[#1e1e1e] pb-1">
            <Orbit className="w-3.5 h-3.5 text-white" />
            <span>Impact Crater Shaping</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#a3a3a3]">Crater Depth</span>
                <span className="font-mono text-white font-bold">{(terrain.craterDepth * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={terrain.craterDepth}
                onChange={(e) => setTerrain({ craterDepth: Number(e.target.value) })}
                className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#a3a3a3]">Crater Diameter</span>
                <span className="font-mono text-white font-bold">{(terrain.craterScale * 200).toFixed(0)}m</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.02"
                value={terrain.craterScale}
                onChange={(e) => setTerrain({ craterScale: Number(e.target.value) })}
                className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Sea Level / Hydrology */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#ffffff] border-b border-[#1e1e1e] pb-1">
            <Waves className="w-3.5 h-3.5 text-white" />
            <span>Sea Level & Hydrology</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[#a3a3a3]">
              <span>Render Fluid Ocean</span>
              <button
                onClick={() => setUI('showWater', !showWater)}
                className={`w-9 h-5 rounded-full p-0.5 border border-[#2c2c2c] transition-colors focus:outline-none cursor-pointer ${
                  showWater ? 'bg-white' : 'bg-[#121212]'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full transition-transform ${
                  showWater ? 'translate-x-4 bg-black' : 'translate-x-0 bg-[#a3a3a3]'
                }`} />
              </button>
            </div>

            {showWater && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#a3a3a3]">Ocean Level</span>
                    <span className="font-mono text-white font-bold">{terrain.waterLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={terrain.waterLevel}
                    onChange={(e) => setTerrain({ waterLevel: Number(e.target.value) })}
                    className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[#a3a3a3] mb-1">Fluid Color</label>
                  <div className="flex gap-1.5">
                    <input
                      type="color"
                      value={waterColor}
                      onChange={(e) => setUI('waterColor', e.target.value)}
                      className="w-6 h-6 border-0 p-0 rounded cursor-pointer bg-transparent"
                    />
                    <span className="font-mono uppercase text-[#ffffff] pt-0.5">{waterColor}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mesh Quad Density & Wireframe */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#ffffff] border-b border-[#1e1e1e] pb-1">
            <HelpCircle className="w-3.5 h-3.5 text-white" />
            <span>Wireframe / Mesh Resolution</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#a3a3a3]">Mesh Resolution (Quads)</span>
                <span className="font-mono text-white font-bold">{gridResolution}x{gridResolution}</span>
              </div>
              <input
                type="range"
                min="32"
                max="256"
                step="32"
                value={gridResolution}
                onChange={(e) => setUI('gridResolution', Number(e.target.value))}
                className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-[#a3a3a3]">
              <span>Show Quad Wireframe Lines</span>
              <button
                onClick={() => setUI('wireframe', !wireframe)}
                className={`w-9 h-5 rounded-full p-0.5 border border-[#2c2c2c] transition-colors focus:outline-none cursor-pointer ${
                  wireframe ? 'bg-white' : 'bg-[#121212]'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full transition-transform ${
                  wireframe ? 'translate-x-4 bg-black' : 'translate-x-0 bg-[#a3a3a3]'
                }`} />
              </button>
            </div>

            {wireframe && (
              <div>
                <label className="block text-[#a3a3a3] mb-1">Wireframe Color</label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={wireframeColor}
                    onChange={(e) => setUI('wireframeColor', e.target.value)}
                    className="w-6 h-6 border-0 p-0 rounded cursor-pointer bg-transparent"
                  />
                  <span className="font-mono uppercase text-[#ffffff] pt-0.5">{wireframeColor}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Elevation Gradient Color Stops */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#ffffff] border-b border-[#1e1e1e] pb-1">
            <div className="w-3.5 h-3.5 rounded bg-white" />
            <span>Height Gradient Color Workspace</span>
          </div>

          {/* Color Ramp Preview */}
          <div className="h-4 rounded border border-[#2c2c2c] relative overflow-hidden flex animate-fade-in" style={{
            background: `linear-gradient(to right, ${terrain.colorStops.map(s => `${s.color} ${s.elevation * 100}%`).join(', ')})`
          }}>
            {terrain.colorStops.map((stop, i) => (
              <div
                key={i}
                className="absolute top-0 w-[2px] h-full bg-white pointer-events-none"
                style={{ left: `${stop.elevation * 100}%` }}
              />
            ))}
          </div>

          {/* List of stops */}
          <div className="space-y-1.5">
            {terrain.colorStops.map((stop, i) => (
              <div key={i} className="flex items-center justify-between gap-1 bg-[#121212] p-2 rounded border border-[#2c2c2c]">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => updateColorStop(i, { color: e.target.value })}
                    className="w-5 h-5 border-0 p-0 rounded cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-[10px] text-[#a3a3a3]">{stop.elevation.toFixed(2)}</span>
                  <input
                    type="text"
                    value={stop.label || `Level ${i+1}`}
                    onChange={(e) => updateColorStop(i, { label: e.target.value })}
                    className="bg-transparent text-[#ffffff] border-0 p-0 w-20 focus:outline-none focus:bg-[#050505] px-1 rounded font-medium text-[11px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.01"
                    value={stop.elevation}
                    onChange={(e) => updateColorStop(i, { elevation: Number(e.target.value) })}
                    className="w-16 accent-white h-1 cursor-pointer bg-[#050505]"
                  />
                  <button
                    onClick={() => removeColorStop(i)}
                    className="p-1 text-[#a3a3a3] hover:text-red-400 transition-colors cursor-pointer"
                    disabled={terrain.colorStops.length <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Color Stop Form */}
          <div className="bg-[#121212]/40 p-2 rounded border border-dashed border-[#2c2c2c] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newStopColor}
                onChange={(e) => setNewStopColor(e.target.value)}
                className="w-5 h-5 border-0 p-0 rounded cursor-pointer bg-transparent"
              />
              <span className="text-[10px] text-[#a3a3a3]">Elevation:</span>
              <input
                type="number"
                min="0"
                max="1.0"
                step="0.05"
                value={newStopElevation}
                onChange={(e) => setNewStopElevation(Math.max(0, Math.min(1, Number(e.target.value))))}
                className="w-12 bg-[#050505] border border-[#2c2c2c] text-[#ffffff] rounded px-1.5 py-0.5 text-center font-mono text-[10px]"
              />
            </div>
            
            <button
              onClick={handleAddStop}
              className="flex items-center gap-1 bg-white hover:bg-neutral-200 text-black border border-white transition-colors px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Stop</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
