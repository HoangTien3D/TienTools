/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Download, Sun, Moon, Map, Info, Compass, HelpCircle, Check, MapPin, Layers } from 'lucide-react';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as THREE from 'three';

export default function ExportPanel() {
  const {
    terrain,
    pbr,
    shadingMode,
    lightIntensity,
    lightColor,
    lightAngleX,
    lightAngleY,
    setUI,
    setPBR,
  } = useAppStore();

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportFormat, setExportFormat] = useState<'gltf' | 'obj' | 'stl'>('gltf');

  // Batch displacement variation states
  const [batchCount, setBatchCount] = useState(4);
  const [variationStep, setVariationStep] = useState(0.20);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [batchSuccess, setBatchSuccess] = useState(false);

  // Cesium Simulation Coordinates (for spatial projection)
  const [lat, setLat] = useState(45.8327); // Mt Blanc area
  const [lng, setLng] = useState(6.8651);
  const [baseElev, setBaseElev] = useState(1200);

  // GLTF Batch Exporter
  const handleBatchExport = () => {
    const terrainMesh = (window as any).activeTerrainMesh as THREE.Mesh | undefined;
    const waterMesh = (window as any).activeWaterMesh as THREE.Mesh | undefined;

    if (!terrainMesh) {
      alert("No active 3D model found in viewport yet. Please wait for the canvas to load.");
      return;
    }

    setIsBatchExporting(true);
    setBatchSuccess(false);

    try {
      const exporter = new GLTFExporter();
      const baseName = terrain.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

      // Calculate multipliers centered around 1.0 (original height scale)
      const multipliers: number[] = [];
      const mid = Math.floor(batchCount / 2);
      for (let i = 0; i < batchCount; i++) {
        const offset = i - mid;
        const mult = 1.0 + offset * variationStep;
        multipliers.push(Math.max(0.15, mult)); // Clamp to sensible minimum scale
      }

      multipliers.forEach((mult, idx) => {
        setTimeout(() => {
          const exportGroup = new THREE.Group();
          exportGroup.name = `TerraCraft_Batch_v${idx + 1}_scale_${mult.toFixed(2)}`;

          // Clone and scale terrain
          const clonedTerrain = terrainMesh.clone();
          clonedTerrain.name = `Terrain_Mesh_v${idx + 1}_${Math.round(mult * 100)}pct_displacement`;
          
          // Modify local Y-scale representing displacement scale
          clonedTerrain.scale.y = clonedTerrain.scale.y * mult;
          
          exportGroup.add(clonedTerrain);

          if (waterMesh) {
            const clonedWater = waterMesh.clone();
            clonedWater.name = `Ocean_Level_v${idx + 1}`;
            exportGroup.add(clonedWater);
          }

          exporter.parse(
            exportGroup,
            (gltf) => {
              const output = JSON.stringify(gltf, null, 2);
              const blob = new Blob([output], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              
              const link = document.createElement('a');
              link.href = url;
              link.download = `terracraft_${baseName}_var${idx + 1}_displacement_${Math.round(mult * 100)}pct.gltf`;
              link.click();

              if (idx === multipliers.length - 1) {
                setIsBatchExporting(false);
                setBatchSuccess(true);
                setTimeout(() => setBatchSuccess(false), 4000);
              }
            },
            (err) => {
              console.error(`GLTF batch export failed for var index ${idx}`, err);
              if (idx === multipliers.length - 1) {
                setIsBatchExporting(false);
              }
            },
            { binary: false, animations: [] }
          );
        }, idx * 600); // 600ms stagger to prevent browsers from blocking multiple downloads
      });

    } catch (e) {
      console.error("Batch export compiled error", e);
      setIsBatchExporting(false);
    }
  };

  // 3D Mesh Exporter supporting GLTF, OBJ, and STL
  const handleExportMesh = () => {
    const terrainMesh = (window as any).activeTerrainMesh as THREE.Mesh | undefined;
    const waterMesh = (window as any).activeWaterMesh as THREE.Mesh | undefined;

    if (!terrainMesh) {
      alert("No active 3D model found in viewport yet. Please wait for the canvas to load.");
      return;
    }

    setIsExporting(true);
    setExportSuccess(false);

    try {
      const baseName = terrain.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

      if (exportFormat === 'gltf') {
        const exporter = new GLTFExporter();
        const exportGroup = new THREE.Group();
        exportGroup.name = "TerraCraft_Procedural_Terrain";

        const clonedTerrain = terrainMesh.clone();
        clonedTerrain.name = "Terrain_Mesh";
        exportGroup.add(clonedTerrain);

        if (waterMesh) {
          const clonedWater = waterMesh.clone();
          clonedWater.name = "Ocean_Level";
          exportGroup.add(clonedWater);
        }

        exporter.parse(
          exportGroup,
          (gltf) => {
            const output = JSON.stringify(gltf, null, 2);
            const blob = new Blob([output], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `terracraft_${baseName}.gltf`;
            link.click();
            
            setIsExporting(false);
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 4000);
          },
          (err) => {
            console.error("GLTF export failed", err);
            setIsExporting(false);
          },
          { binary: false, animations: [] }
        );
      } else if (exportFormat === 'obj') {
        let objText = "# Exported from TerraCraft\n";
        
        const addMeshToOBJ = (m: THREE.Mesh, name: string) => {
          objText += `o ${name}\n`;
          const geometry = m.geometry;
          const positionAttr = geometry.attributes.position;
          const uvAttr = geometry.attributes.uv;
          const normalAttr = geometry.attributes.normal;
          
          if (!positionAttr) return;
          
          m.updateMatrixWorld(true);
          const matrix = m.matrixWorld;
          const tempV = new THREE.Vector3();
          const tempN = new THREE.Vector3();
          
          for (let i = 0; i < positionAttr.count; i++) {
            tempV.fromBufferAttribute(positionAttr, i);
            tempV.applyMatrix4(matrix);
            objText += `v ${tempV.x} ${tempV.y} ${tempV.z}\n`;
          }
          
          if (uvAttr) {
            for (let i = 0; i < uvAttr.count; i++) {
              objText += `vt ${uvAttr.getX(i)} ${uvAttr.getY(i)}\n`;
            }
          }
          
          if (normalAttr) {
            for (let i = 0; i < normalAttr.count; i++) {
              tempN.fromBufferAttribute(normalAttr, i);
              const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
              tempN.applyMatrix3(normalMatrix).normalize();
              objText += `vn ${tempN.x} ${tempN.y} ${tempN.z}\n`;
            }
          }
          
          const index = geometry.index;
          if (index) {
            for (let i = 0; i < index.count; i += 3) {
              const a = index.getX(i) + 1;
              const b = index.getX(i + 1) + 1;
              const c = index.getX(i + 2) + 1;
              if (uvAttr && normalAttr) {
                objText += `f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}\n`;
              } else {
                objText += `f ${a} ${b} ${c}\n`;
              }
            }
          } else {
            for (let i = 1; i <= positionAttr.count; i += 3) {
              if (uvAttr && normalAttr) {
                objText += `f ${i}/${i}/${i} ${i+1}/${i+1}/${i+1} ${i+2}/${i+2}/${i+2}\n`;
              } else {
                objText += `f ${i} ${i+1} ${i+2}\n`;
              }
            }
          }
        };

        addMeshToOBJ(terrainMesh, "Terrain");
        if (waterMesh) {
          addMeshToOBJ(waterMesh, "Ocean");
        }

        const blob = new Blob([objText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `terracraft_${baseName}.obj`;
        link.click();

        setIsExporting(false);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 4000);
      } else if (exportFormat === 'stl') {
        let stlText = "solid terracraft_model\n";
        
        const addMeshToSTL = (m: THREE.Mesh) => {
          const geometry = m.geometry;
          const positionAttr = geometry.attributes.position;
          const normalAttr = geometry.attributes.normal;
          if (!positionAttr) return;

          m.updateMatrixWorld(true);
          const matrix = m.matrixWorld;
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);

          const tempV1 = new THREE.Vector3();
          const tempV2 = new THREE.Vector3();
          const tempV3 = new THREE.Vector3();
          const tempN = new THREE.Vector3();

          const index = geometry.index;
          if (index) {
            for (let i = 0; i < index.count; i += 3) {
              const idx1 = index.getX(i);
              const idx2 = index.getX(i + 1);
              const idx3 = index.getX(i + 2);

              tempV1.fromBufferAttribute(positionAttr, idx1).applyMatrix4(matrix);
              tempV2.fromBufferAttribute(positionAttr, idx2).applyMatrix4(matrix);
              tempV3.fromBufferAttribute(positionAttr, idx3).applyMatrix4(matrix);

              if (normalAttr) {
                tempN.fromBufferAttribute(normalAttr, idx1).applyMatrix3(normalMatrix).normalize();
              } else {
                const cb = new THREE.Vector3().subVectors(tempV3, tempV2);
                const ab = new THREE.Vector3().subVectors(tempV1, tempV2);
                tempN.crossVectors(cb, ab).normalize();
              }

              stlText += `  facet normal ${tempN.x} ${tempN.y} ${tempN.z}\n`;
              stlText += `    outer loop\n`;
              stlText += `      vertex ${tempV1.x} ${tempV1.y} ${tempV1.z}\n`;
              stlText += `      vertex ${tempV2.x} ${tempV2.y} ${tempV2.z}\n`;
              stlText += `      vertex ${tempV3.x} ${tempV3.y} ${tempV3.z}\n`;
              stlText += `    endloop\n`;
              stlText += `  endfacet\n`;
            }
          } else {
            for (let i = 0; i < positionAttr.count; i += 3) {
              tempV1.fromBufferAttribute(positionAttr, i).applyMatrix4(matrix);
              tempV2.fromBufferAttribute(positionAttr, i + 1).applyMatrix4(matrix);
              tempV3.fromBufferAttribute(positionAttr, i + 2).applyMatrix4(matrix);

              if (normalAttr) {
                tempN.fromBufferAttribute(normalAttr, i).applyMatrix3(normalMatrix).normalize();
              } else {
                const cb = new THREE.Vector3().subVectors(tempV3, tempV2);
                const ab = new THREE.Vector3().subVectors(tempV1, tempV2);
                tempN.crossVectors(cb, ab).normalize();
              }

              stlText += `  facet normal ${tempN.x} ${tempN.y} ${tempN.z}\n`;
              stlText += `    outer loop\n`;
              stlText += `      vertex ${tempV1.x} ${tempV1.y} ${tempV1.z}\n`;
              stlText += `      vertex ${tempV2.x} ${tempV2.y} ${tempV2.z}\n`;
              stlText += `      vertex ${tempV3.x} ${tempV3.y} ${tempV3.z}\n`;
              stlText += `    endloop\n`;
              stlText += `  endfacet\n`;
            }
          }
        };

        addMeshToSTL(terrainMesh);
        if (waterMesh) {
          addMeshToSTL(waterMesh);
        }
        stlText += "endsolid terracraft_model\n";

        const blob = new Blob([stlText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `terracraft_${baseName}.stl`;
        link.click();

        setIsExporting(false);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 4000);
      }
    } catch (e) {
      console.error("Export mesh error", e);
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] border border-[#1e1e1e] rounded overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0c0c0c] border-b border-[#1e1e1e]">
        <Sun className="w-4 h-4 text-white" />
        <span className="font-sans font-semibold text-xs tracking-wide text-[#ffffff]">
          LIGHTING & 3D STUDIO EXPORTER
        </span>
      </div>

      {/* Panel Scroll Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-[#ffffff] text-xs">
        
        {/* Compact Dynamic Studio Lighting */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#ffffff]">
              <Sun className="w-3.5 h-3.5 text-white" />
              <span>Studio Lighting Controls</span>
            </div>
            {/* Ambient Sun Color picker right aligned in the section header! */}
            <div className="flex items-center gap-1 bg-[#121212] p-0.5 px-1.5 rounded border border-[#2c2c2c] text-[9px]">
              <span className="text-[#a3a3a3] font-bold">COLOR:</span>
              <input
                type="color"
                value={lightColor}
                onChange={(e) => setUI('lightColor', e.target.value)}
                className="w-3.5 h-3.5 border-0 p-0 rounded cursor-pointer bg-transparent"
              />
              <span className="font-mono uppercase text-[#ffffff] text-[9px]">{lightColor}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 bg-[#121212]/15 p-2 rounded border border-[#1e1e1e]/40">
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-[#a3a3a3]">Intensity</span>
                <span className="font-mono text-white font-bold">{lightIntensity}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={lightIntensity}
                onChange={(e) => setUI('lightIntensity', Number(e.target.value))}
                className="w-full accent-white h-0.5 bg-[#121212] rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-[#a3a3a3]">Metalness</span>
                <span className="font-mono text-white font-bold">{pbr.metalness.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={pbr.metalness}
                onChange={(e) => setPBR({ metalness: Number(e.target.value) })}
                className="w-full accent-white h-0.5 bg-[#121212] rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-[#a3a3a3]">Elevation (X)</span>
                <span className="font-mono text-white font-bold">{lightAngleX}°</span>
              </div>
              <input
                type="range"
                min="5"
                max="85"
                step="1"
                value={lightAngleX}
                onChange={(e) => setUI('lightAngleX', Number(e.target.value))}
                className="w-full accent-white h-0.5 bg-[#121212] rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-[#a3a3a3]">Azimuth (Y)</span>
                <span className="font-mono text-white font-bold">{lightAngleY}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={lightAngleY}
                onChange={(e) => setUI('lightAngleY', Number(e.target.value))}
                className="w-full accent-white h-0.5 bg-[#121212] rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Cesium Geographic Mapping Panel */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#ffffff] border-b border-[#1e1e1e] pb-1">
            <Map className="w-3.5 h-3.5 text-white" />
            <span>Cesium Geographic Mapping</span>
          </div>
          
          <p className="text-[#a3a3a3] text-[11px] leading-relaxed">
            Project this procedurally generated local 3D terrain mesh onto standard WGS84 world coordinates for Cesium map overlay.
          </p>

          <div className="bg-[#121212]/40 p-3 rounded border border-[#2c2c2c] space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[#a3a3a3] mb-1">Latitude (WGS84)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full bg-[#050505] border border-[#2c2c2c] rounded px-2 py-1 text-[#ffffff] font-mono text-[11px] focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#a3a3a3] mb-1">Longitude (WGS84)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full bg-[#050505] border border-[#2c2c2c] rounded px-2 py-1 text-[#ffffff] font-mono text-[11px] focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-[10px] text-[#a3a3a3]">
                <span>Base Elevation Offset</span>
                <span className="font-mono text-white font-bold">{baseElev}m</span>
              </div>
              <input
                type="range"
                min="0"
                max="8000"
                step="100"
                value={baseElev}
                onChange={(e) => setBaseElev(Number(e.target.value))}
                className="w-full accent-white h-1 bg-[#121212] rounded cursor-pointer"
              />
            </div>

            <div className="border-t border-[#2c2c2c] pt-2 flex flex-col gap-1 text-[10px] font-mono text-[#a3a3a3]">
              <div className="flex justify-between">
                <span>Calculated Peak Height:</span>
                <span className="text-white font-semibold">{Math.round(baseElev + terrain.heightScale * 12)}m ASL</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Mesh Exporter supporting Multiple Formats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-1">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#ffffff]">
              <Download className="w-3.5 h-3.5 text-white" />
              <span>3D Mesh Exporter</span>
            </div>
            
            {/* Format Selector inside section header to save precious vertical space! */}
            <div className="flex items-center gap-1 bg-[#121212] p-0.5 px-1.5 rounded border border-[#2c2c2c] text-[9px]">
              <span className="text-[#a3a3a3] uppercase font-bold tracking-tight">Format:</span>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="bg-transparent border-0 text-[#ffffff] focus:outline-none font-mono font-bold cursor-pointer"
              >
                <option value="gltf">GLTF (.gltf)</option>
                <option value="obj">OBJ (.obj)</option>
                <option value="stl">STL (.stl)</option>
              </select>
            </div>
          </div>

          <p className="text-[#a3a3a3] text-[11px] leading-relaxed">
            Download the procedurally sculpted terrain as a high-fidelity 3D model. Preserves the quad-split structure, PBR vertex shading, and material components.
          </p>

          <button
            onClick={handleExportMesh}
            disabled={isExporting}
            className="w-full py-2 bg-white hover:bg-neutral-200 disabled:bg-[#121212] disabled:border-[#2c2c2c] text-black font-bold uppercase text-[10px] tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md border border-white"
          >
            <Download className="w-4 h-4 text-black" />
            <span>{isExporting ? 'COMPILING 3D ASSETS...' : `DOWNLOAD 3D MESH (.${exportFormat.toUpperCase()})`}</span>
          </button>

          {exportSuccess && (
            <div className="p-2.5 bg-white/10 border border-white/30 rounded text-white flex items-center gap-1.5 text-[11px] animate-fade-in font-bold">
              <Check className="w-4 h-4 text-white flex-shrink-0" />
              <span>Model compiled! Your {exportFormat.toUpperCase()} model is downloading.</span>
            </div>
          )}
        </div>

        {/* Multiversion Displacement Batch Exporter */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#ffffff] border-b border-[#1e1e1e] pb-1">
            <Layers className="w-3.5 h-3.5 text-white" />
            <span>Multiversion Batch Exporter</span>
          </div>

          <p className="text-[#a3a3a3] text-[11px] leading-relaxed">
            Generate several physical model variations with different height scale step factors in one sequential batch.
          </p>

          <div className="bg-[#121212]/40 p-3 rounded border border-[#2c2c2c] space-y-3 text-[11px]">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-[#a3a3a3] mb-1">Batch Count</label>
                <select
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value))}
                  className="w-full bg-[#050505] border border-[#2c2c2c] rounded px-2.5 py-1.5 text-[#ffffff] font-mono text-[11px] focus:outline-none focus:border-white cursor-pointer"
                >
                  <option value={3}>3 Versions</option>
                  <option value={4}>4 Versions</option>
                  <option value={5}>5 Versions</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#a3a3a3]">Variation Step</span>
                  <span className="font-mono text-white font-bold">{Math.round(variationStep * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.40"
                  step="0.05"
                  value={variationStep}
                  onChange={(e) => setVariationStep(Number(e.target.value))}
                  className="w-full accent-white h-1 bg-[#050505] rounded cursor-pointer mt-1.5"
                />
              </div>
            </div>

            <div className="pt-1 text-[10px] text-[#a3a3a3] font-mono border-t border-[#1e1e1e] space-y-1">
              <div>Preview Displacement Scales:</div>
              <div className="flex gap-1 flex-wrap text-white">
                {Array.from({ length: batchCount }).map((_, i) => {
                  const offset = i - Math.floor(batchCount / 2);
                  const scalePct = Math.round((1.0 + offset * variationStep) * 100);
                  return (
                    <span key={i} className="bg-white/10 border border-white/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
                      V{i+1}: {scalePct}%
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={handleBatchExport}
            disabled={isBatchExporting}
            className="w-full py-2 bg-white hover:bg-neutral-200 disabled:bg-[#121212] disabled:border-[#2c2c2c] text-black font-bold uppercase text-[10px] tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border border-white"
          >
            <Layers className="w-4 h-4 text-black" />
            <span>{isBatchExporting ? 'EXPORTING SEQUENTIAL BATCH...' : 'GENERATE & EXPORT BATCH'}</span>
          </button>

          {batchSuccess && (
            <div className="p-2.5 bg-white/10 border border-white/30 rounded text-white flex items-center gap-1.5 text-[11px] animate-fade-in font-bold">
              <Check className="w-4 h-4 text-white flex-shrink-0" />
              <span>Batch compiled! Sequential downloads initiated.</span>
            </div>
          )}
        </div>

        {/* CAD Shortcuts Guide */}
        <div className="bg-[#121212]/40 p-3 rounded border border-[#2c2c2c] space-y-1.5 text-[11px]">
          <div className="flex items-center gap-1 text-[#ffffff] font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-white" />
            <span>CAD Viewport Navigation</span>
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-[#a3a3a3] font-mono text-[10px]">
            <li>Left Click + Drag : Rotate Camera</li>
            <li>Right Click + Drag : Pan/Translate</li>
            <li>Scroll Wheel : Zoom In / Out</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
