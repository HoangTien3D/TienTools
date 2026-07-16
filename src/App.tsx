/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppStore } from './store';
import ControlPanel from './components/ControlPanel';
import PresetPanel from './components/PresetPanel';
import GoldenLayoutWorkspace from './components/GoldenLayoutWorkspace';
import {
  Sparkles,
  Sun,
  Image as ImageIcon,
  Layers,
  Monitor,
  Cpu,
  RefreshCw,
  Globe
} from 'lucide-react';

export default function App() {
  const {
    terrain,
    pbr,
    sidebarWidth,
    activeTab,
    shadingMode,
    setUI
  } = useAppStore();

  const handleAddComponent = (type: string, title: string) => {
    if ((window as any).addGoldenLayoutComponent) {
      (window as any).addGoldenLayoutComponent(type, title);
    }
  };

  const handleResetLayout = () => {
    if ((window as any).resetGoldenLayout) {
      (window as any).resetGoldenLayout();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col overflow-hidden select-none font-sans antialiased">
      
      {/* 1. Header: Elegant Studio Menu Bar */}
      <header className="h-12 bg-[#0c0c0c] border-b border-[#1e1e1e] flex items-center justify-between px-4 z-55 flex-shrink-0">
        
        {/* Logo and Status */}
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center font-bold text-xs text-black">T</div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-sans font-semibold text-sm tracking-tight text-white">
                Tien's Mixer <span className="opacity-40 font-normal text-xs"></span>
              </span>
            </div>
            <span className="text-[10px] text-[#a3a3a3] font-medium leading-none">
              Procedural Terrain & PBR Texture Synthesizer
            </span>
          </div>
        </div>

        {/* Dynamic Workspace Layout Toggles (Golden-Layout style panel manager) */}
        <div className="hidden lg:flex items-center gap-1 bg-[#121212] p-1 rounded border border-[#2c2c2c]">
          <span className="text-[10px] text-[#a3a3a3] font-mono px-2">Workspace Windows:</span>
          
          <button
            onClick={() => handleAddComponent('viewport', '3D VIEWPORT')}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-sans font-medium rounded transition-colors text-[#a3a3a3] hover:text-white hover:bg-[#1e1e1e] cursor-pointer"
          >
            <Monitor className="w-3 h-3 text-white" />
            <span>Viewport</span>
          </button>

          <button
            onClick={() => handleAddComponent('pbrWorkspace', 'PBR SYNTHESIZER')}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-sans font-medium rounded transition-colors text-[#a3a3a3] hover:text-white hover:bg-[#1e1e1e] cursor-pointer"
          >
            <ImageIcon className="w-3 h-3 text-white" />
            <span>PBR</span>
          </button>

          <button
            onClick={() => handleAddComponent('ambientCG', 'AMBIENTCG LIBRARY')}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-sans font-medium rounded transition-colors text-[#a3a3a3] hover:text-white hover:bg-[#1e1e1e] cursor-pointer"
            title="Search and import materials from ambientCG library"
          >
            <Globe className="w-3 h-3 text-white" />
            <span>ambientCG</span>
          </button>

          <button
            onClick={() => handleAddComponent('aiPanel', 'AI CO-PILOT')}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-sans font-medium rounded transition-colors text-[#a3a3a3] hover:text-white hover:bg-[#1e1e1e] cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-white" />
            <span>Prompter</span>
          </button>

          <button
            onClick={() => handleAddComponent('lighting', 'STUDIO EXPORTER')}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-sans font-medium rounded transition-colors text-[#a3a3a3] hover:text-white hover:bg-[#1e1e1e] cursor-pointer"
          >
            <Sun className="w-3 h-3 text-white" />
            <span>Exporter</span>
          </button>

          <div className="h-4 w-[1px] bg-[#2c2c2c] mx-1"></div>

          <button
            onClick={handleResetLayout}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-sans font-bold rounded transition-colors bg-white hover:bg-neutral-200 text-black border border-white cursor-pointer"
            title="Reset Workspace layout to default"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Layout</span>
          </button>
        </div>

        {/* Current preset status indicators */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right font-mono text-[10px] text-[#a3a3a3]">
            <div>Terrain: <span className="text-white font-semibold">{terrain.name}</span></div>
            <div>Material: <span className="text-white font-semibold">{pbr.name}</span></div>
          </div>
          
          <div className="h-6 w-[1px] bg-[#1e1e1e]"></div>

          <div className="flex items-center gap-1.5 bg-white border border-white px-2.5 py-1 rounded text-[10px] text-black font-extrabold shadow">
            <Cpu className="w-3 h-3 text-black" />
            <span className="font-mono">3D VIEWPORT READY</span>
          </div>
        </div>

      </header>

      {/* 2. Main Studio Workspace Layout */}
      <main className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Left Control Sidebar */}
        <div
          className="flex flex-col border-r border-[#1e1e1e] bg-[#050505] flex-shrink-0 transition-all duration-300"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Tabs header selector */}
          <div className="flex bg-[#0c0c0c] border-b border-[#1e1e1e]">
            <button
              onClick={() => setUI('activeTab', 'terrain')}
              className={`flex-1 py-3 text-center text-xs font-bold tracking-wider transition-colors border-r border-[#1e1e1e] cursor-pointer ${
                activeTab === 'terrain'
                  ? 'bg-[#050505] text-white border-b-2 border-b-white font-black'
                  : 'text-[#a3a3a3] hover:text-white'
              }`}
            >
              SCULPT CONTROLS
            </button>
            <button
              onClick={() => setUI('activeTab', 'pbr')}
              className={`flex-1 py-3 text-center text-xs font-bold tracking-wider transition-colors cursor-pointer ${
                activeTab === 'pbr'
                  ? 'bg-[#050505] text-white border-b-2 border-b-white font-black'
                  : 'text-[#a3a3a3] hover:text-white'
              }`}
            >
              PRESET LIBRARY
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'terrain' ? <ControlPanel /> : <PresetPanel />}
          </div>
        </div>

        {/* Right Flexible Draggable/Resizable Workspace */}
        <div className="flex-1 overflow-hidden bg-[#050505]">
          <GoldenLayoutWorkspace />
        </div>

      </main>

      {/* 3. Footer: Elegant CAD Status Bar */}
      <footer className="h-7 bg-[#0c0c0c] border-t border-[#1e1e1e] flex items-center justify-between px-4 text-[10px] font-mono text-neutral-500 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-white font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>ENGINE: THREE.JS (R154) & GOLDEN LAYOUT</span>
          </span>
          <span className="hidden md:inline">|</span>
          <span className="hidden md:inline">GRID: {terrain.exponent} EXP | NOISE: {terrain.noiseType.toUpperCase()}</span>
          <span className="hidden lg:inline">|</span>
          <span className="hidden lg:inline">MAPS: ALBEDO, NORMAL, ROUGH, AO, DISPLACEMENT</span>
        </div>

        <div className="flex items-center gap-3">
          <span>SHADING: {shadingMode.toUpperCase()}</span>
          <span>|</span>
          <span className="text-white font-bold">JSON: PARAMS READY</span>
        </div>
      </footer>

    </div>
  );
}
