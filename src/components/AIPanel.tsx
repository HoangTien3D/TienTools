/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppStore } from '../store';
import { Sparkles, Key, AlertTriangle, Cpu, Terminal, HelpCircle, Code } from 'lucide-react';

export default function AIPanel() {
  const {
    openRouterKey,
    openRouterModel,
    aiPrompt,
    aiIsGenerating,
    aiError,
    aiLastResponse,
    setOpenRouterKey,
    setOpenRouterModel,
    setAiPrompt,
    generateWithAI,
    generateLocalDemo,
  } = useAppStore();

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpenRouterKey(e.target.value);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] border border-[#1e1e1e] rounded overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0c0c0c] border-b border-[#1e1e1e]">
        <Sparkles className="w-4 h-4 text-white animate-pulse" />
        <span className="font-sans font-semibold text-xs tracking-wide text-[#ffffff]">
          LLM GENERATOR PROMPT INPUT
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar text-[#ffffff] text-xs">
        
        {/* Intro */}
        <p className="leading-relaxed text-[#a3a3a3] text-[11px]">
          Describe the terrain or material you want to generate.
        </p>

        {/* API Key Box - Allowed since the user explicitly requested it! */}
        <div className="bg-[#121212] p-2.5 rounded border border-[#2c2c2c] space-y-2">
          <div className="flex items-center gap-1.5 font-medium text-[#ffffff]">
            <Key className="w-3 h-3 text-white" />
            <span className="text-[11px]">OpenRouter Credentials</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[9px] text-[#a3a3a3] uppercase tracking-wider font-bold">API Key</label>
              <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-white hover:underline text-[9px]">Get Key</a>
            </div>
            <input
              type="password"
              value={openRouterKey}
              onChange={handleKeyChange}
              placeholder="sk-or-v1-..."
              className="w-full bg-[#050505] border border-[#2c2c2c] rounded px-2 py-1 text-[#ffffff] font-mono text-[11px] focus:outline-none focus:border-white placeholder-white/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] text-[#a3a3a3] uppercase tracking-wider font-bold">Model</label>
            <div className="space-y-1">
              <input
                type="text"
                value={openRouterModel}
                onChange={(e) => setOpenRouterModel(e.target.value)}
                placeholder="Type model name, e.g. openrouter/free"
                className="w-full bg-[#050505] border border-[#2c2c2c] rounded px-2 py-1 text-[#ffffff] font-mono text-[11px] focus:outline-none focus:border-white placeholder-white/20"
              />
              
              {/* Quick suggestions chips */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {[
                  { label: "OR Free", id: "openrouter/free" },
                  { label: "Gemini Flash", id: "google/gemini-2.5-flash:free" },
                  { label: "Llama 3", id: "meta-llama/llama-3-8b-instruct:free" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setOpenRouterModel(chip.id)}
                    className={`px-1 py-0.5 rounded text-[8px] font-mono border transition-all cursor-pointer ${
                      openRouterModel === chip.id
                        ? "bg-white border-white text-black font-bold"
                        : "bg-[#050505] border-[#2c2c2c] text-[#a3a3a3] hover:text-[#ffffff] hover:bg-[#121212]"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Natural Language Prompt */}
        <div className="space-y-1">
          <label className="block text-[#a3a3a3] font-bold uppercase tracking-wider text-[9px]">Design Prompt</label>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={2}
            placeholder="Describe the landscape to generate (e.g., A frozen crystalline glacial plateau...)"
            className="w-full bg-[#121212] border border-[#2c2c2c] rounded p-2 text-[#ffffff] focus:outline-none focus:border-white leading-normal text-[11px] resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-1.5">
          <button
            onClick={generateWithAI}
            disabled={aiIsGenerating}
            className="w-full py-1.5 bg-white hover:bg-neutral-200 disabled:bg-[#121212] disabled:border-[#2c2c2c] text-black font-bold uppercase rounded text-[10px] tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md border border-white"
          >
            <Sparkles className="w-3.5 h-3.5 text-black/80" />
            <span>{aiIsGenerating ? 'GENERATING...' : 'RUN GENERATOR'}</span>
          </button>

          {/* Sandbox Fallback */}
          <button
            onClick={generateLocalDemo}
            type="button"
            className="w-full py-1.5 bg-[#121212] hover:bg-neutral-900 text-[#ffffff] font-bold uppercase rounded text-[10px] tracking-wider border border-[#2c2c2c] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Cpu className="w-3 h-3 text-white" />
            <span>OFFLINE GENERATOR (SANDBOX)</span>
          </button>
        </div>

        {/* Error Block */}
        {aiError && (
          <div className="p-2 bg-red-950/20 border border-red-900/50 rounded text-red-300 space-y-0.5 text-[10px] leading-normal animate-fade-in">
            <div className="flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>AI Error</span>
            </div>
            <p>{aiError}</p>
          </div>
        )}

        {/* Console / Last Response */}
        {aiLastResponse && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-[#a3a3a3] uppercase tracking-wider text-[9px]">
              <Terminal className="w-3 h-3 text-white" />
              <span>Output Log</span>
            </div>
            <div className="bg-black/40 rounded p-2 border border-white/5 font-mono text-[9px] text-green-500 overflow-x-auto max-h-32 whitespace-pre scrollbar-thin leading-tight">
              {aiLastResponse}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
