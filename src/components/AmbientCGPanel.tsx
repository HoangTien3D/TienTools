/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import JSZip from 'jszip';
import {
  Search,
  Loader2,
  Download,
  Image as ImageIcon,
  Globe,
  Check,
  AlertCircle,
  RefreshCw,
  Sliders,
  Filter
} from 'lucide-react';

interface AmbientCGAsset {
  assetId: string;
  displayName: string;
  type: string;
  previewUrl?: string;
  downloads?: {
    ZIP?: {
      [key: string]: {
        downloadLink: string;
        size: number;
      };
    };
  };
}

const CATEGORIES = [
  'All',
  'Rock',
  'Sand',
  'Grass',
  'Wood',
  'Ground',
  'Soil',
  'Concrete',
  'Bricks',
  'Metal',
  'Tiles',
  'Pebbles'
];

export default function AmbientCGPanel() {
  const { pbr, setPBR } = useAppStore();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [assets, setAssets] = useState<AmbientCGAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Material import progress state
  const [importState, setImportState] = useState<{
    assetId: string | null;
    status: 'idle' | 'downloading' | 'unzipping' | 'success' | 'error';
    progress: number;
    errorMsg?: string;
  }>({
    assetId: null,
    status: 'idle',
    progress: 0
  });

  const fetchAssets = async (searchQuery: string, cat: string, sort: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Build search query: blend category into the query string if not 'All'
      let finalQ = searchQuery.trim();
      if (cat !== 'All') {
        finalQ = finalQ ? `${finalQ} ${cat}` : cat;
      }

      const url = `/api/ambientcg/assets?q=${encodeURIComponent(finalQ)}&sort=${sort}&limit=24`;
      let data;
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Proxy status ${res.status}`);
        }
        data = await res.json();
      } catch (proxyErr) {
        console.warn('Local proxy failed, falling back to CORS proxy for ambientCG API fetch:', proxyErr);
        const directUrl = `https://ambientcg.com/api/v3/assets?type=material&q=${encodeURIComponent(finalQ)}&sort=${sort}&include=downloads,previews&limit=24`;
        const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(directUrl)}`;
        const directRes = await fetch(proxiedUrl);
        if (!directRes.ok) {
          throw new Error(`CORS proxy fetch from ambientCG API failed: ${directRes.statusText}`);
        }
        data = await directRes.json();
      }
      
      if (data.assets) {
        const mapped: AmbientCGAsset[] = data.assets.map((item: any) => {
          const zip1KJPG = item.downloads?.find((dl: any) => dl.attributes === '1K-JPG' && dl.extension === 'zip');
          
          let previewUrl = '';
          try {
            if (item.previews && Array.isArray(item.previews)) {
              const mapPreview = item.previews.find((p: any) => p.type === 'pbr-one-material-shading' || p.type === 'pbr-one-material-maps');
              if (mapPreview && mapPreview.url) {
                const urlObj = new URL(mapPreview.url);
                const hash = urlObj.hash;
                if (hash) {
                  const params = new URLSearchParams(hash.substring(1));
                  const colorUrl = params.get('color_url') || params.get('texture_url')?.split(',')[0];
                  if (colorUrl) {
                    previewUrl = colorUrl;
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Error parsing previews from API:', e);
          }

          if (!previewUrl) {
            previewUrl = `https://f003.backblazeb2.com/file/ambientCG-Web/media/surface-preview/${item.id}/${item.id}_SQ_Color.jpg`;
          }

          return {
            assetId: item.id,
            displayName: item.id.replace(/([A-Z])/g, ' $1').trim(), // e.g. "Ground054" -> "Ground 054"
            type: 'material',
            previewUrl,
            downloads: {
              ZIP: {
                '1K-JPG': {
                  downloadLink: zip1KJPG?.url || `https://ambientcg.com/get?file=${item.id}_1K-JPG.zip`,
                  size: zip1KJPG?.size || 0
                }
              }
            }
          };
        });
        setAssets(mapped);
      } else {
        setAssets([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to search ambientCG. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch initial popular materials on mount
  useEffect(() => {
    fetchAssets('', 'All', 'popular');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssets(query, activeCategory, sortBy);
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    fetchAssets(query, cat, sortBy);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    fetchAssets(query, activeCategory, newSort);
  };

  // Core Import Flow: Download ZIP + JSZip decompression + Blob URL generation
  const handleImportMaterial = async (asset: AmbientCGAsset) => {
    const assetId = asset.assetId;
    setImportState({
      assetId,
      status: 'downloading',
      progress: 10
    });

    try {
      // 1. Determine download link (prefer 1K-JPG for optimal lightweight client-side download)
      let filename = `${assetId}_1K-JPG.zip`;
      let downloadUrl = asset.downloads?.ZIP?.['1K-JPG']?.downloadLink;
      if (downloadUrl) {
        try {
          const urlObj = new URL(downloadUrl);
          const fileParam = urlObj.searchParams.get('file');
          if (fileParam) {
            filename = fileParam;
          }
        } catch (e) {
          console.warn('Failed to parse downloadUrl, using fallback filename', e);
        }
      }

      // Request through our local server-side download proxy to bypass CORS
      const proxyDownloadUrl = `/api/ambientcg/download?file=${encodeURIComponent(filename)}`;
      const directDownloadUrl = `https://ambientcg.com/get?file=${encodeURIComponent(filename)}`;

      setImportState(prev => ({ ...prev, progress: 30 }));

      // 2. Download ZIP file as arrayBuffer
      let arrayBuffer: ArrayBuffer;
      try {
        const response = await fetch(proxyDownloadUrl);
        if (!response.ok) {
          throw new Error(`Proxy status ${response.status}`);
        }
        arrayBuffer = await response.arrayBuffer();
      } catch (proxyErr) {
        console.warn('Local proxy download failed, falling back to CORS proxy download:', proxyErr);
        const targetUrl = downloadUrl || directDownloadUrl;
        const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const directResponse = await fetch(proxiedUrl);
        if (!directResponse.ok) {
          throw new Error(`CORS proxy download from ambientCG failed: ${directResponse.statusText}`);
        }
        arrayBuffer = await directResponse.arrayBuffer();
      }
      
      setImportState({
        assetId,
        status: 'unzipping',
        progress: 60
      });

      // 3. Decompress using JSZip
      const zip = await JSZip.loadAsync(arrayBuffer);
      const files = zip.files;
      
      let colorFile: any = null;
      let normalFile: any = null;
      let roughnessFile: any = null;
      let aoFile: any = null;
      let displacementFile: any = null;

      // Classify files in the ZIP recursively based on suffix patterns
      for (const filename of Object.keys(files)) {
        const lowerName = filename.toLowerCase();
        if (lowerName.includes('color') || lowerName.includes('albedo')) {
          colorFile = files[filename];
        } else if (lowerName.includes('normalgl') || lowerName.includes('normal_gl') || lowerName.includes('normallpremult')) {
          normalFile = files[filename];
        } else if (lowerName.includes('normal') && !normalFile) {
          normalFile = files[filename];
        } else if (lowerName.includes('roughness') || lowerName.includes('rough')) {
          roughnessFile = files[filename];
        } else if (lowerName.includes('ambientocclusion') || lowerName.includes('ao')) {
          aoFile = files[filename];
        } else if (lowerName.includes('displacement') || lowerName.includes('height')) {
          displacementFile = files[filename];
        }
      }

      // 4. Generate local Object URLs for Three.js
      const getFileUrl = async (zipFile: any) => {
        if (!zipFile) return undefined;
        const blob = await zipFile.async('blob');
        return URL.createObjectURL(blob);
      };

      setImportState(prev => ({ ...prev, progress: 80 }));

      const albedoUrl = await getFileUrl(colorFile);
      const normalUrl = await getFileUrl(normalFile);
      const roughnessUrl = await getFileUrl(roughnessFile);
      const aoUrl = await getFileUrl(aoFile);
      const displacementUrl = await getFileUrl(displacementFile);

      // Clean up previous custom map URLs to avoid memory leaks
      if (pbr.customMaps) {
        Object.values(pbr.customMaps).forEach(url => {
          if (url && url.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(url);
            } catch (e) {}
          }
        });
      }

      // 5. Update Zustand store
      setPBR({
        name: `ambientCG: ${asset.displayName}`,
        roughness: 0.8,
        metalness: 0.0,
        normalStrength: 1.0,
        aoStrength: 1.0,
        displacementScale: 4.0,
        patternType: 'custom',
        customMaps: {
          albedo: albedoUrl,
          normal: normalUrl,
          roughness: roughnessUrl,
          ao: aoUrl,
          height: displacementUrl
        }
      });

      setImportState({
        assetId,
        status: 'success',
        progress: 100
      });

      // Clear success overlay after 2 seconds
      setTimeout(() => {
        setImportState({ assetId: null, status: 'idle', progress: 0 });
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setImportState({
        assetId,
        status: 'error',
        progress: 0,
        errorMsg: err.message || 'Failed to download or decompress PBR textures. Please try another material.'
      });
    }
  };

  const handleClearCustomMaps = () => {
    if (pbr.customMaps) {
      Object.values(pbr.customMaps).forEach(url => {
        if (url && url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {}
        }
      });
    }

    setPBR({
      name: 'Procedural Grass',
      patternType: 'grass',
      customMaps: undefined
    });
  };

  const isCurrentAssetLoaded = (assetId: string) => {
    return pbr.name.includes(assetId) || pbr.name.includes(assetId.toLowerCase());
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-[#ffffff] select-none">
      
      {/* Search Bar Form */}
      <div className="p-3 border-b border-[#1e1e1e] bg-[#0c0c0c]">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[#a3a3a3]" />
            <input
              type="text"
              placeholder="Search ambientCG PBR materials (e.g. sand, lava, cliff)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#121212] border border-[#2c2c2c] rounded pl-9 pr-3 py-2 text-xs text-[#ffffff] placeholder-[#a3a3a3] focus:outline-none focus:border-white font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-white hover:bg-neutral-200 rounded text-xs font-bold uppercase tracking-wider text-black transition-colors cursor-pointer border border-white"
          >
            Search
          </button>
        </form>
 
        {/* Sort and Actions Row */}
        <div className="flex items-center justify-between mt-3 gap-2">
          {/* Sort selection */}
          <div className="flex items-center gap-1.5 text-[10px]">
            <Sliders className="w-3.5 h-3.5 text-[#a3a3a3]" />
            <span className="text-[#a3a3a3] font-mono">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-[#121212] border border-[#2c2c2c] text-[#ffffff] rounded px-2 py-1 font-mono text-[10px] focus:outline-none cursor-pointer"
            >
              <option value="popular">Popularity</option>
              <option value="latest">Latest</option>
              <option value="downloads">Downloads count</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
 
          {/* Reset custom maps if loaded */}
          {pbr.customMaps && (
            <button
              onClick={handleClearCustomMaps}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 rounded text-[10px] font-bold tracking-wider transition-all cursor-pointer"
              title="Unload imported PBR Maps and return to procedurally generated material styles"
            >
              <RefreshCw className="w-3 h-3" />
              <span>RESET PROCEDURAL TEXTURES</span>
            </button>
          )}
        </div>
      </div>
 
      {/* Category Tags Horizontal scroll */}
      <div className="px-3 py-2 border-b border-[#1e1e1e] bg-[#050505] flex items-center gap-1.5 overflow-x-auto custom-scrollbar whitespace-nowrap">
        <Filter className="w-3.5 h-3.5 text-white flex-shrink-0" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-2.5 py-1 text-[10px] font-mono rounded-full border transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-white text-black border-white font-bold'
                : 'bg-[#121212]/60 border-[#2c2c2c] text-[#a3a3a3] hover:text-[#ffffff] hover:border-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Body Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
        {/* Main loading spinner for search results */}
        {isLoading ? (
          <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <span className="text-xs text-[#a3a3a3] font-mono">Fetching ambientCG Library...</span>
          </div>
        ) : null}

        {/* Global Error Notice */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 mb-4 bg-red-600/10 border border-red-500/30 rounded text-xs text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">ambientCG API Error</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Results grid */}
        {!isLoading && assets.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1e1e1e] rounded">
            <Globe className="w-8 h-8 text-[#a3a3a3] mb-2" />
            <span className="text-xs font-semibold text-[#ffffff]">No Materials Found</span>
            <span className="text-[10px] text-[#a3a3a3] mt-1 max-w-xs">
              No material matches for "{query}". Try searching simple tags like "cliff", "moss", "gravel", or "rock".
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            {assets.map((asset) => {
              const isLoaded = isCurrentAssetLoaded(asset.assetId);
              const isProcessing = importState.assetId === asset.assetId;
              
              return (
                <div
                  key={asset.assetId}
                  className={`bg-[#121212]/40 border rounded overflow-hidden flex flex-col transition-all duration-200 hover:border-white ${
                    isLoaded ? 'border-white shadow-md ring-1 ring-white/20' : 'border-[#1e1e1e]'
                  }`}
                >
                  {/* Thumbnail Wrapper */}
                  <div className="aspect-square w-full bg-[#000000] relative overflow-hidden group/thumb border-b border-[#1e1e1e]">
                    <img
                      src={asset.previewUrl || `https://f003.backblazeb2.com/file/ambientCG-Web/media/surface-preview/${asset.assetId}/${asset.assetId}_SQ_Color.jpg`}
                      alt={asset.displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Active State Check */}
                    {isLoaded && (
                      <div className="absolute top-2 right-2 bg-white text-black rounded-full p-1 shadow-md">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {/* Progress Loader Overlay per Card */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-[#000000]/90 flex flex-col items-center justify-center p-3 text-center gap-1.5">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                        <span className="text-[9px] font-mono text-[#a3a3a3] uppercase tracking-wider">
                          {importState.status === 'downloading' ? 'Downloading...' : 'Unzipping...'}
                        </span>
                        {/* Custom visual progress bar */}
                        <div className="w-full bg-[#121212] h-1 rounded overflow-hidden">
                          <div
                            className="bg-white h-full transition-all duration-300"
                            style={{ width: `${importState.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text Description */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold block text-ellipsis overflow-hidden whitespace-nowrap text-[#ffffff]" title={asset.displayName}>
                        {asset.displayName}
                      </span>
                      <span className="text-[9px] text-[#a3a3a3] font-mono block tracking-wider uppercase mt-0.5">
                        {asset.assetId}
                      </span>
                    </div>

                    <div className="mt-3">
                      {isLoaded ? (
                        <div className="w-full text-center py-1 bg-white/10 text-white border border-white/20 text-[9px] font-bold uppercase tracking-wider rounded font-mono flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>ACTIVE TEXTURE</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleImportMaterial(asset)}
                          disabled={importState.assetId !== null}
                          className="w-full py-1 bg-[#121212] hover:bg-white hover:text-black border border-[#2c2c2c] hover:border-white text-[#ffffff] text-[9px] font-bold uppercase tracking-wider rounded font-mono flex items-center justify-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>IMPORT MAPS</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Bottom Status Bar info */}
      <div className="px-3 py-1.5 bg-[#0c0c0c] border-t border-[#1e1e1e] flex justify-between items-center text-[10px] font-mono text-[#a3a3a3]">
        <span className="flex items-center gap-1">
          <Globe className="w-3 h-3 text-white" />
          <span>Connected to ambientcg.com Public CC0 Assets API</span>
        </span>
        {importState.status === 'error' && (
          <span className="text-red-400 font-bold truncate max-w-sm" title={importState.errorMsg}>
            Import Error: {importState.errorMsg}
          </span>
        )}
      </div>

    </div>
  );
}
