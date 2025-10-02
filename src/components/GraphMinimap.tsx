'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import useGraphStore from '@/store/graphStore';

interface GraphMinimapProps {
  width?: number;
  height?: number;
}

export default function GraphMinimap({ 
  width = 200, 
  height = 150 
}: GraphMinimapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { data, viewport, setViewport } = useGraphStore();

  const render = useCallback(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Calculate bounds of all nodes
    const bounds = {
      minX: Math.min(...data.nodes.map(n => n.position?.x || 0)),
      maxX: Math.max(...data.nodes.map(n => n.position?.x || 0)),
      minY: Math.min(...data.nodes.map(n => n.position?.y || 0)),
      maxY: Math.max(...data.nodes.map(n => n.position?.y || 0))
    };

    const graphWidth = bounds.maxX - bounds.minX || 1;
    const graphHeight = bounds.maxY - bounds.minY || 1;

    // Scale to fit minimap
    const scale = Math.min(width / graphWidth, height / graphHeight) * 0.8;
    const offsetX = (width - graphWidth * scale) / 2 - bounds.minX * scale;
    const offsetY = (height - graphHeight * scale) / 2 - bounds.minY * scale;

    // Add background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#f8fafc')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1)
      .attr('rx', 4);

    // Render edges as thin lines
    const edges = svg.append('g').attr('class', 'minimap-edges');
    edges.selectAll('line')
      .data(data.edges)
      .enter()
      .append('line')
      .attr('x1', (d) => {
        const source = data.nodes.find(n => n.id === d.source);
        return (source?.position?.x || 0) * scale + offsetX;
      })
      .attr('y1', (d) => {
        const source = data.nodes.find(n => n.id === d.source);
        return (source?.position?.y || 0) * scale + offsetY;
      })
      .attr('x2', (d) => {
        const target = data.nodes.find(n => n.id === d.target);
        return (target?.position?.x || 0) * scale + offsetX;
      })
      .attr('y2', (d) => {
        const target = data.nodes.find(n => n.id === d.target);
        return (target?.position?.y || 0) * scale + offsetY;
      })
      .attr('stroke', '#cbd5e0')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.6);

    // Render nodes as small circles
    const nodes = svg.append('g').attr('class', 'minimap-nodes');
    nodes.selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('cx', (d) => (d.position?.x || 0) * scale + offsetX)
      .attr('cy', (d) => (d.position?.y || 0) * scale + offsetY)
      .attr('r', 2)
      .attr('fill', (d) => {
        const typeColors = {
          condition: '#ff6b6b',
          exercise: '#4ecdc4',
          equipment: '#45b7d1',
          metric: '#f39c12'
        };
        return typeColors[d.type as keyof typeof typeColors] || '#69b3a2';
      })
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5);

    // Add viewport indicator
    const viewportRect = svg.append('rect')
      .attr('class', 'viewport-indicator')
      .attr('fill', 'none')
      .attr('stroke', '#3182ce')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '2,2')
      .attr('rx', 2);

    // Update viewport indicator position
    const updateViewportIndicator = () => {
      const viewportWidth = 800; // Assume main canvas width
      const viewportHeight = 600; // Assume main canvas height
      
      const vx = (-viewport.x / viewport.zoom) * scale + offsetX;
      const vy = (-viewport.y / viewport.zoom) * scale + offsetY;
      const vw = (viewportWidth / viewport.zoom) * scale;
      const vh = (viewportHeight / viewport.zoom) * scale;

      viewportRect
        .attr('x', vx)
        .attr('y', vy)
        .attr('width', vw)
        .attr('height', vh);
    };

    updateViewportIndicator();

    // Add click to navigate functionality
    svg.on('click', (event) => {
      const [mouseX, mouseY] = d3.pointer(event);
      
      // Convert minimap coordinates back to graph coordinates
      const graphX = (mouseX - offsetX) / scale;
      const graphY = (mouseY - offsetY) / scale;
      
      // Center viewport on clicked position
      setViewport({
        x: -graphX * viewport.zoom + 400, // Center on canvas
        y: -graphY * viewport.zoom + 300,
        zoom: viewport.zoom
      });
    });

  }, [data, viewport, width, height, setViewport]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
      zIndex: 1000
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '600',
        marginBottom: '8px',
        color: '#4a5568',
        textAlign: 'center'
      }}>
        Graph Overview
      </div>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ 
          cursor: 'pointer',
          border: '1px solid #e2e8f0',
          borderRadius: '4px'
        }}
      />
      <div style={{
        fontSize: '9px',
        color: '#718096',
        marginTop: '4px',
        textAlign: 'center'
      }}>
        Click to navigate
      </div>
    </div>
  );
}