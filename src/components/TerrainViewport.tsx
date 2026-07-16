/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAppStore } from '../store';
import { getElevation, getTerrainColor, generatePBRCanvases, generateWaterPBRCanvases } from '../lib/generators';
import { Maximize2, Minimize2, RotateCw, Sun, Compass, Play, Pause, Layers } from 'lucide-react';

export default function TerrainViewport() {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Mesh and material references
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const quadWireframeRef = useRef<THREE.LineSegments | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);

  // Light references
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  // Get state from Zustand store
  const {
    terrain,
    pbr,
    water,
    gridResolution,
    wireframe,
    wireframeColor,
    showWater,
    waterColor,
    shadingMode,
    autoRotate,
    lightIntensity,
    lightColor,
    lightAngleX,
    lightAngleY,
  } = useAppStore();

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Dimensions
    const width = mountRef.current.clientWidth || 600;
    const height = mountRef.current.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0F0F11'); // Seamless High Density background
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 80, 110);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Clear previous children
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
    controls.minDistance = 10;
    controls.maxDistance = 300;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight('#1e293b', 0.6);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight('#ffffff', 1.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 300;
    const d = 80;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Subtle helper grid under the terrain
    const gridHelper = new THREE.GridHelper(120, 24, '#1e293b', '#0f172a');
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Initial Resize Observer to handle flexible containers dynamically (ResizeObserver Guideline!)
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (rendererRef.current && cameraRef.current) {
          rendererRef.current.setSize(w, h);
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
        }
      }
    });
    resizeObserver.observe(mountRef.current);

    // Animation Loop
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        if (autoRotate) {
          controlsRef.current.autoRotate = true;
          controlsRef.current.autoRotateSpeed = 1.0;
        } else {
          controlsRef.current.autoRotate = false;
        }
        controlsRef.current.update();
      }

      // Live procedural water wave vertex animation and texture panning
      if (waterMeshRef.current && showWater) {
        const waterState = useAppStore.getState().water;
        const time = performance.now() * 0.001 * waterState.speed;
        const geom = waterMeshRef.current.geometry as THREE.BufferGeometry;
        const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
        if (posAttr) {
          const count = posAttr.count;
          const freq = waterState.frequency;
          const amp = waterState.waveHeight;

          for (let i = 0; i < count; i++) {
            const px = posAttr.getX(i);
            const py = posAttr.getY(i);
            
            // Interactive layered sinusoidal wave equations
            const wave1 = Math.sin(px * freq * 0.15 + time * 1.5) * Math.cos(py * freq * 0.15 + time * 1.2);
            const wave2 = Math.cos(px * freq * 0.35 - time * 2.2) * Math.sin(py * freq * 0.35 + time * 1.8) * 0.4;
            const wave3 = Math.sin((px + py) * freq * 0.6 + time * 3.0) * 0.15;
            
            posAttr.setZ(i, (wave1 + wave2 + wave3) * amp);
          }
          posAttr.needsUpdate = true;
          geom.computeVertexNormals();
        }

        // Panning coordinates to create fluid flowing motion
        const mat = waterMeshRef.current.material as THREE.MeshStandardMaterial;
        if (mat) {
          if (mat.map) {
            mat.map.offset.x = time * 0.01;
            mat.map.offset.y = time * 0.015;
          }
          if (mat.normalMap) {
            mat.normalMap.offset.x = -time * 0.008;
            mat.normalMap.offset.y = time * 0.012;
          }
          if (mat.roughnessMap) {
            mat.roughnessMap.offset.x = time * 0.005;
            mat.roughnessMap.offset.y = -time * 0.008;
          }
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      resizeObserver.disconnect();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update Lights when parameters change
  useEffect(() => {
    if (!dirLightRef.current || !ambientLightRef.current) return;

    // Set colors & intensity
    dirLightRef.current.intensity = lightIntensity;
    dirLightRef.current.color.set(lightColor);
    
    // Calculate light direction from Angles X, Y (spherical coordinates to Cartesian)
    const radX = (lightAngleX * Math.PI) / 180;
    const radY = (lightAngleY * Math.PI) / 180;

    const radius = 100;
    const lx = radius * Math.cos(radX) * Math.sin(radY);
    const ly = radius * Math.sin(radX);
    const lz = radius * Math.cos(radX) * Math.cos(radY);

    dirLightRef.current.position.set(lx, ly, lz);
  }, [lightIntensity, lightColor, lightAngleX, lightAngleY]);

  // Generate / Update Terrain Geometry & Textures
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up old geometry
    if (terrainMeshRef.current) {
      scene.remove(terrainMeshRef.current);
      terrainMeshRef.current.geometry.dispose();
      if (Array.isArray(terrainMeshRef.current.material)) {
        terrainMeshRef.current.material.forEach(m => m.dispose());
      } else {
        terrainMeshRef.current.material.dispose();
      }
      terrainMeshRef.current = null;
    }

    if (quadWireframeRef.current) {
      scene.remove(quadWireframeRef.current);
      quadWireframeRef.current.geometry.dispose();
      if (Array.isArray(quadWireframeRef.current.material)) {
        quadWireframeRef.current.material.forEach(m => m.dispose());
      } else {
        quadWireframeRef.current.material.dispose();
      }
      quadWireframeRef.current = null;
    }

    if (waterMeshRef.current) {
      scene.remove(waterMeshRef.current);
      waterMeshRef.current.geometry.dispose();
      if (Array.isArray(waterMeshRef.current.material)) {
        waterMeshRef.current.material.forEach(m => m.dispose());
      } else {
        waterMeshRef.current.material.dispose();
      }
      waterMeshRef.current = null;
    }

    const N = gridResolution;
    const sizeX = terrain.sizeX ?? 100;
    const sizeY = terrain.sizeY ?? 100;
    const stepX = sizeX / (N - 1);
    const stepY = sizeY / (N - 1);

    // Create custom height buffer for vertices
    const heights = new Float32Array(N * N);
    const steepness = new Float32Array(N * N);

    // 1st Pass: Heights
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const u = x / (N - 1);
        const v = y / (N - 1);
        const index = y * N + x;
        heights[index] = getElevation(u, v, terrain);
      }
    }

    // 2nd Pass: Slopes (steepness)
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const index = y * N + x;

        const xm = Math.max(0, x - 1);
        const xp = Math.min(N - 1, x + 1);
        const ym = Math.max(0, y - 1);
        const yp = Math.min(N - 1, y + 1);

        const h_L = heights[y * N + xm];
        const h_R = heights[y * N + xp];
        const h_D = heights[ym * N + x];
        const h_U = heights[yp * N + x];

        const dx = (h_R - h_L) * 2.0;
        const dy = (h_U - h_D) * 2.0;
        steepness[index] = Math.sqrt(dx * dx + dy * dy);
      }
    }

    // Generate Procedural PBR textures on 2D canvases (resolutions: 512 for excellent rendering)
    const canvases = generatePBRCanvases(terrain, pbr, 512);

    // Convert Canvas elements or Custom URLs to Three.js Textures
    const textureLoader = new THREE.TextureLoader();
    const getTexture = (mapType: 'albedo' | 'normal' | 'roughness' | 'ao' | 'height', canvasElement: HTMLCanvasElement) => {
      const customUrl = pbr.customMaps?.[mapType === 'height' ? 'height' : mapType];
      if (customUrl) {
        const tex = textureLoader.load(customUrl);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        const rFactor = Math.max(1, Math.round(pbr.noiseScale / 5));
        tex.repeat.set(rFactor, rFactor);
        return tex;
      } else {
        const tex = new THREE.CanvasTexture(canvasElement);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
      }
    };

    const albedoTex = getTexture('albedo', canvases.albedo);
    const normalTex = getTexture('normal', canvases.normal);
    const roughnessTex = getTexture('roughness', canvases.roughness);
    const aoTex = getTexture('ao', canvases.ao);
    const heightTex = getTexture('height', canvases.height);

    // Create dynamic BufferGeometry
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(N * N * 3);
    const colors = new Float32Array(N * N * 3);
    const uvs = new Float32Array(N * N * 2);

    // Populate arrays
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const index = y * N + x;
        const u = x / (N - 1);
        const v = y / (N - 1);

        const px = x * stepX - sizeX / 2;
        const py = heights[index] * terrain.heightScale;
        const pz = y * stepY - sizeY / 2;

        vertices[index * 3] = px;
        vertices[index * 3 + 1] = py;
        vertices[index * 3 + 2] = pz;

        // UV mapping
        uvs[index * 2] = u;
        uvs[index * 2 + 1] = v;

        // Colors (depending on Shading mode)
        let col = new THREE.Color();
        if (shadingMode === 'elevation') {
          col.set(getTerrainColor(heights[index], steepness[index], terrain.colorStops));
        } else if (shadingMode === 'slope') {
          // Slope range: 0 is flat, 0.5+ is steep
          const sFactor = Math.min(1.0, steepness[index] * 1.5);
          // Interpolate blue (flat) to red (steep)
          col.setHSL(0.6 * (1.0 - sFactor), 1.0, 0.4);
        } else if (shadingMode === 'normal') {
          // Will be handled natively by standard normal shading, but we can color vertex normals for visualization
          col.setRGB(0.5, 0.5, 1.0);
        } else {
          // Default white, PBR material handles colors via Albedo texture
          col.setRGB(1.0, 1.0, 1.0);
        }

        colors[index * 3] = col.r;
        colors[index * 3 + 1] = col.g;
        colors[index * 3 + 2] = col.b;
      }
    }

    // Build indices for triangles
    const indices: number[] = [];
    for (let y = 0; y < N - 1; y++) {
      for (let x = 0; x < N - 1; x++) {
        const i0 = y * N + x;
        const i1 = y * N + (x + 1);
        const i2 = (y + 1) * N + x;
        const i3 = (y + 1) * N + (x + 1);

        // Quad split into two triangles
        indices.push(i0, i2, i1);
        indices.push(i1, i2, i3);
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    // Create materials based on shading modes
    let terrainMaterial: THREE.Material;

    if (shadingMode === 'pbr') {
      terrainMaterial = new THREE.MeshStandardMaterial({
        map: albedoTex,
        normalMap: normalTex,
        normalScale: new THREE.Vector2(pbr.normalStrength, pbr.normalStrength),
        roughnessMap: roughnessTex,
        metalness: pbr.metalness,
        aoMap: aoTex,
        aoMapIntensity: pbr.aoStrength,
        displacementMap: heightTex,
        displacementScale: pbr.displacementScale * (pbr.customMaps ? 0.05 : 0.15), // scaled nicely
        displacementBias: 0,
        flatShading: false,
        roughness: pbr.roughness,
      });
    } else if (shadingMode === 'normal') {
      terrainMaterial = new THREE.MeshNormalMaterial({
        flatShading: false,
      });
    } else {
      // Elevation or Slope vertex color shading
      terrainMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        metalness: 0.0,
        flatShading: false,
      });
    }

    const terrainMesh = new THREE.Mesh(geometry, terrainMaterial);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // Create the CUSTOM QUAD WIREFRAME (Strict Guideline constraint)
    // Connecting horizontal and vertical grids, skipping diagonal triangulation lines completely!
    const lineIndices: number[] = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = y * N + x;
        // Horizontal line
        if (x < N - 1) {
          lineIndices.push(i, i + 1);
        }
        // Vertical line
        if (y < N - 1) {
          lineIndices.push(i, i + N);
        }
      }
    }

    const wireframeGeom = new THREE.BufferGeometry();
    wireframeGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    wireframeGeom.setIndex(lineIndices);

    const wireframeMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(wireframeColor),
      transparent: true,
      opacity: wireframe ? 0.8 : 0.0, // hidden if wireframe is false
      depthWrite: false, // overlays beautifully without clipping
    });

    const quadWireframe = new THREE.LineSegments(wireframeGeom, wireframeMat);
    scene.add(quadWireframe);
    quadWireframeRef.current = quadWireframe;

    // Ocean / Water Level Plane (Subdivided for Wave vertex animation + PBR caustics)
    if (showWater && terrain.waterLevel > 0) {
      const waterGeom = new THREE.PlaneGeometry(sizeX, sizeY, 64, 64);
      
      // Generate water caustics / ripples PBR canvases
      const waterCanvases = generateWaterPBRCanvases(water, 512);

      const waterAlbedoTex = new THREE.CanvasTexture(waterCanvases.albedo);
      waterAlbedoTex.wrapS = THREE.RepeatWrapping;
      waterAlbedoTex.wrapT = THREE.RepeatWrapping;
      waterAlbedoTex.repeat.set(4, 4);

      const waterNormalTex = new THREE.CanvasTexture(waterCanvases.normal);
      waterNormalTex.wrapS = THREE.RepeatWrapping;
      waterNormalTex.wrapT = THREE.RepeatWrapping;
      waterNormalTex.repeat.set(4, 4);

      const waterRoughnessTex = new THREE.CanvasTexture(waterCanvases.roughness);
      waterRoughnessTex.wrapS = THREE.RepeatWrapping;
      waterRoughnessTex.wrapT = THREE.RepeatWrapping;
      waterRoughnessTex.repeat.set(4, 4);

      const waterAoTex = new THREE.CanvasTexture(waterCanvases.ao);
      waterAoTex.wrapS = THREE.RepeatWrapping;
      waterAoTex.wrapT = THREE.RepeatWrapping;
      waterAoTex.repeat.set(4, 4);

      const waterMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(water.color),
        map: waterAlbedoTex,
        normalMap: waterNormalTex,
        normalScale: new THREE.Vector2(water.bumpiness, water.bumpiness),
        roughnessMap: waterRoughnessTex,
        roughness: water.roughness,
        metalness: water.metalness,
        aoMap: waterAoTex,
        transparent: true,
        opacity: water.opacity,
        depthWrite: true,
      });

      const waterMesh = new THREE.Mesh(waterGeom, waterMat);
      waterMesh.rotation.x = -Math.PI / 2;
      // Position water at absolute scaled height
      waterMesh.position.y = (terrain.waterLevel / 100) * terrain.heightScale;
      scene.add(waterMesh);
      waterMeshRef.current = waterMesh;
      (window as any).activeWaterMesh = waterMesh;
    } else {
      (window as any).activeWaterMesh = null;
    }

    (window as any).activeTerrainMesh = terrainMesh;
  }, [
    terrain,
    pbr,
    water,
    gridResolution,
    wireframe,
    wireframeColor,
    showWater,
    waterColor,
    shadingMode,
  ]);

  const toggleFullscreen = () => {
    if (!mountRef.current) return;
    if (!isFullscreen) {
      if (mountRef.current.parentElement) {
        mountRef.current.parentElement.requestFullscreen?.();
      }
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 80, 110);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div id="viewport_panel" className="relative flex flex-col h-full bg-[#0F0F11] border border-[#2D2D33] rounded overflow-hidden group">
      {/* Viewport Top Header */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#18181B] border-b border-[#2D2D33]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="font-sans font-semibold text-xs tracking-wide text-[#E0E0E0]">
            3D TERRAIN REAL-TIME VIEWPORT
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 bg-[#252529] border border-[#3F3F46] rounded text-[#A1A1AA]">
            {gridResolution} x {gridResolution} Quads
          </span>
        </div>
        
        {/* Navigation / Toolbar Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={resetCamera}
            title="Reset Camera Position"
            className="p-1.5 hover:bg-[#252529] rounded text-[#A1A1AA] hover:text-[#E0E0E0] transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
          
          <div className="h-4 w-[1px] bg-[#2D2D33] my-auto mx-1"></div>

          {/* Shading selector shortcut */}
          <div className="flex items-center bg-[#252529] p-0.5 rounded border border-[#3F3F46]">
            {(['pbr', 'elevation', 'slope', 'normal'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => useAppStore.getState().setUI('shadingMode', mode)}
                className={`px-2 py-1 text-[10px] font-sans font-medium rounded-sm capitalize transition-colors ${
                  shadingMode === mode
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                    : 'text-[#A1A1AA] hover:text-[#E0E0E0] hover:bg-[#18181B]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => useAppStore.getState().setUI('autoRotate', !autoRotate)}
            title={autoRotate ? 'Pause Rotation' : 'Auto Rotate Camera'}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              autoRotate ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' : 'hover:bg-[#252529] text-[#A1A1AA] hover:text-[#E0E0E0]'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 hover:bg-[#252529] rounded text-[#A1A1AA] hover:text-[#E0E0E0] transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Mounting Area for ThreeJS */}
      <div ref={mountRef} className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing" style={{ minHeight: '300px' }} />

      {/* Embedded Camera / Light Info Overlay */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 bg-[#18181B]/80 backdrop-blur border border-[#3F3F46] px-3 py-2 rounded text-[10px] font-mono text-[#A1A1AA] pointer-events-none select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-[#E0E0E0] font-semibold">{terrain.name || "Custom Sculpt"}</span>
        </div>
        <div>Scale: {terrain.heightScale}m | Noise: {terrain.noiseType.toUpperCase()}</div>
        <div>Shading: {shadingMode.toUpperCase()}</div>
        {terrain.waterLevel > 0 && <div>Sea Level: {terrain.waterLevel}%</div>}
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-[#18181B]/80 backdrop-blur border border-[#3F3F46] px-3 py-2 rounded text-[10px] font-mono text-[#A1A1AA] pointer-events-none select-none">
        <Sun className="w-3.5 h-3.5 text-blue-400" />
        <span>DirLight Intensity: {lightIntensity}x</span>
      </div>
    </div>
  );
}
