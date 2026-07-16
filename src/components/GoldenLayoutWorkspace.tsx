/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { VirtualLayout, LayoutConfig } from 'golden-layout';
import TerrainViewport from './TerrainViewport';
import AIPanel from './AIPanel';
import TextureWorkspace from './TextureWorkspace';
import ExportPanel from './ExportPanel';
import AmbientCGPanel from './AmbientCGPanel';

interface PortalState {
  id: string;
  type: string;
  container: HTMLElement;
}

const initialLayoutConfig: LayoutConfig = {
  root: {
    type: 'row',
    content: [
      {
        type: 'column',
        width: 65,
        content: [
          {
            type: 'component',
            componentType: 'viewport',
            title: '3D VIEWPORT',
            isClosable: false,
          },
          {
            type: 'component',
            componentType: 'lighting',
            title: 'STUDIO EXPORTER',
            height: 35,
          }
        ]
      },
      {
        type: 'column',
        width: 35,
        content: [
          {
            type: 'component',
            componentType: 'aiPanel',
            title: 'AI CO-PILOT',
          },
          {
            type: 'component',
            componentType: 'pbrWorkspace',
            title: 'PBR SYNTHESIZER',
          }
        ]
      }
    ]
  }
};

export default function GoldenLayoutWorkspace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<VirtualLayout | null>(null);
  const [portals, setPortals] = useState<PortalState[]>([]);

  // Initialize Golden Layout
  useEffect(() => {
    if (!containerRef.current) return;

    // Create the layout
    const layout = new VirtualLayout(containerRef.current);
    layoutRef.current = layout;

    // Set up component factory/binder
    layout.bindComponentEvent = (container, itemConfig) => {
      const componentType = itemConfig.componentType as string;
      const portalId = Math.random().toString(36).substr(2, 9);

      // Append new portal
      setPortals((prev) => [
        ...prev,
        {
          id: portalId,
          type: componentType,
          container: container.element,
        },
      ]);

      return {
        component: portalId,
        virtual: true,
      };
    };

    layout.unbindComponentEvent = (container) => {
      setPortals((prev) => prev.filter((p) => p.container !== container.element));
    };

    // Load initial config
    try {
      layout.loadLayout(initialLayoutConfig);
    } catch (e) {
      console.error('Failed to load golden-layout config', e);
    }

    // Bind layout reset to window for global access
    (window as any).resetGoldenLayout = () => {
      try {
        layout.loadLayout(initialLayoutConfig);
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      } catch (err) {
        console.error('Failed to reset golden-layout', err);
      }
    };

    // Programmatic add component method bound to window
    (window as any).addGoldenLayoutComponent = (componentType: string, title: string) => {
      try {
        // Find if component is already open
        const existingPortal = portals.find((p) => p.type === componentType);
        if (existingPortal) {
          // If already exists, focus or let user know
          return;
        }

        // Add component to layout root
        const rootItem = layout.rootItem;
        if (rootItem) {
          layout.addComponent(componentType, {}, title);
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 50);
        }
      } catch (err) {
        console.error('Failed to add component', err);
      }
    };

    return () => {
      try {
        layout.destroy();
      } catch (e) {
        // Suppress cleanup errors
      }
      layoutRef.current = null;
      if ((window as any).resetGoldenLayout) delete (window as any).resetGoldenLayout;
      if ((window as any).addGoldenLayoutComponent) delete (window as any).addGoldenLayoutComponent;
    };
  }, []);

  // Set up container size observer to handle window resize and sidebar resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (layoutRef.current) {
        const width = containerRef.current?.clientWidth || 800;
        const height = containerRef.current?.clientHeight || 600;
        try {
          layoutRef.current.setSize(width, height);
          // Propagate resize event to three.js and components
          window.dispatchEvent(new Event('resize'));
        } catch (e) {
          // Ignore transient resize errors during layout changes
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Helper to render portals corresponding to component types
  const renderPortalComponent = (portal: PortalState) => {
    switch (portal.type) {
      case 'viewport':
        return <TerrainViewport />;
      case 'aiPanel':
        return <AIPanel />;
      case 'pbrWorkspace':
        return <TextureWorkspace />;
      case 'lighting':
        return <ExportPanel />;
      case 'ambientCG':
        return <AmbientCGPanel />;
      default:
        return (
          <div className="p-4 text-xs text-red-400">
            Unknown Component: {portal.type}
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full relative" style={{ minHeight: '600px' }}>
      {/* Golden Layout DOM Container */}
      <div ref={containerRef} className="w-full h-full bg-[#050505]" />

      {/* Render all Portals inside their respective Golden Layout HTML nodes */}
      {portals.map((portal) =>
        createPortal(
          <div className="w-full h-full overflow-hidden flex flex-col bg-[#050505] text-white">
            {renderPortalComponent(portal)}
          </div>,
          portal.container
        )
      )}
    </div>
  );
}
