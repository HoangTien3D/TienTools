/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Compass, Sparkles, Paintbrush, Play, Check, Globe } from 'lucide-react';
import AmbientCGPanel from './AmbientCGPanel';

export default function PresetPanel() {
  const {
    terrain,
    pbr,
    terrainPresets,
    pbrPresets,
    loadPreset
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'terrain' | 'pbr' | 'ambientcg'>('terrain');

  return (
    <div className="flex flex-col h-full bg-[#050505] border border-[#1e1e1e] rounded overflow-hidden">
      {/* Panel Tab Headers */}
      <div className="flex border-b border-[#1e1e1e] bg-[#0c0c0c]">
        <button
          onClick={() => setActiveTab('terrain')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold tracking-wide transition-colors border-r border-[#1e1e1e] cursor-pointer ${
            activeTab === 'terrain'
              ? 'bg-[#050505] text-white border-b border-b-white'
              : 'text-[#a3a3a3] hover:text-[#ffffff] hover:bg-[#121212]'
          }`}
          title="15 Procedural Terrain Shapes"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>SHAPES</span>
        </button>
        <button
          onClick={() => setActiveTab('pbr')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold tracking-wide transition-colors border-r border-[#1e1e1e] cursor-pointer ${
            activeTab === 'pbr'
              ? 'bg-[#050505] text-white border-b border-b-white'
              : 'text-[#a3a3a3] hover:text-[#ffffff] hover:bg-[#121212]'
          }`}
          title="15 Procedural PBR Presets"
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span>PRESETS</span>
        </button>
        <button
          onClick={() => setActiveTab('ambientcg')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold tracking-wide transition-colors cursor-pointer ${
            activeTab === 'ambientcg'
              ? 'bg-[#050505] text-white border-b border-b-white'
              : 'text-[#a3a3a3] hover:text-[#ffffff] hover:bg-[#121212]'
          }`}
          title="Search CC0 Seamless Textures on ambientCG"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>AMBIENTCG</span>
        </button>
      </div>

      {/* Tab Content Body */}
      {activeTab === 'ambientcg' ? (
        <div className="flex-1 overflow-hidden">
          <AmbientCGPanel />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2 custom-scrollbar">
          {activeTab === 'terrain' ? (
            <div className="grid grid-cols-1 gap-2.5">
              {terrainPresets.map((p, idx) => {
                const isSelected = terrain.name === p.name;
                return (
                  <button
                    key={idx}
                    onClick={() => loadPreset('terrain', idx)}
                    className={`w-full text-left p-3 rounded border transition-all flex flex-col gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-white/10 border-white shadow-md'
                        : 'bg-[#121212]/60 border-[#2c2c2c] hover:border-white/50 hover:bg-[#121212]'
                    }`}
                  >
                    {/* Top line with active state */}
                    <div className="flex justify-between items-center w-full">
                      <span className={`font-sans font-semibold text-xs transition-colors ${
                        isSelected ? 'text-white' : 'text-[#ffffff]'
                      }`}>
                        {idx + 1}. {p.name}
                      </span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] bg-white text-black border border-white px-1.5 py-0.5 rounded font-bold">
                          <Check className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#a3a3a3] capitalize">{p.noiseType} noise</span>
                      )}
                    </div>

                    {/* Gradient representation bar */}
                    <div className="h-2.5 w-full rounded relative overflow-hidden flex border border-[#050505]/40" style={{
                      background: `linear-gradient(to right, ${p.colorStops.map(s => `${s.color} ${s.elevation * 100}%`).join(', ')})`
                    }}>
                      {p.colorStops.map((stop, sidx) => (
                        <div
                          key={sidx}
                          className="absolute top-0 w-[1px] h-full bg-white/20"
                          style={{ left: `${stop.elevation * 100}%` }}
                        />
                      ))}
                    </div>

                    {/* Metadata labels */}
                    <div className="flex justify-between text-[10px] text-[#a3a3a3] font-mono">
                      <span>Octaves: {p.octaves} | Exp: {p.exponent}x</span>
                      <span>Disp: {p.heightScale}m</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {pbrPresets.map((p, idx) => {
                const isSelected = pbr.name === p.name;
                return (
                  <button
                    key={idx}
                    onClick={() => loadPreset('pbr', idx)}
                    className={`w-full text-left p-3 rounded border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-white/10 border-white shadow-md'
                        : 'bg-[#121212]/60 border-[#2c2c2c] hover:border-white/50 hover:bg-[#121212]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Tiny PBR pattern micro preview */}
                      <div className="w-8 h-8 rounded border border-black/40 relative flex overflow-hidden shadow-inner flex-shrink-0" style={{
                        backgroundColor: p.primaryColor
                      }}>
                        <div className="absolute inset-0 opacity-45" style={{
                          backgroundImage: `radial-gradient(circle, ${p.secondaryColor} 15%, transparent 20%)`,
                          backgroundSize: '8px 8px'
                        }} />
                        {/* Highlight reflection mimicking material gloss */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className={`font-sans font-semibold text-xs transition-colors ${
                          isSelected ? 'text-white' : 'text-[#ffffff]'
                        }`}>
                          {idx + 1}. {p.name}
                        </span>
                        <span className="text-[10px] text-[#a3a3a3] font-mono capitalize">
                          Roughness: {p.roughness} | Normal: {p.normalStrength}x
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] bg-white text-black border border-white px-1.5 py-0.5 rounded font-bold">
                          <Check className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#050505] text-[#a3a3a3] rounded border border-[#2c2c2c] capitalize">
                          {p.patternType}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
