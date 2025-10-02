'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import useGraphStore from '@/store/graphStore';
import { NodeData, EdgeData } from '@/types/graph';

interface D3NodeData extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  color?: string;
  size?: number;
  properties?: Record<string, any>;
}

interface D3EdgeData extends d3.SimulationLinkDatum<D3NodeData> {
  id: string;
  type: string;
  color?: string;
  width?: number;
  properties?: Record<string, any>;
}

interface GraphCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

const nodeTypeConfig = {
  condition: { color: '#ff6b6b', size: 25, symbol: '🏥' },
  exercise: { color: '#4ecdc4', size: 22, symbol: '💪' },
  equipment: { color: '#45b7d1', size: 20, symbol: '🏋️' },
  metric: { color: '#f39c12', size: 18, symbol: '📊' }
};

export default function GraphCanvas({ 
  width = 800, 
  height = 600, 
  className = '' 
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<D3NodeData, D3EdgeData> | null>(null);
  
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  
  const { 
    data, 
    viewport, 
    selection,
    setViewport,
    selectNode,
    selectEdge,
    clearSelection,
    updateNodePosition 
  } = useGraphStore();

  const initializeSimulation = useCallback((nodes: D3NodeData[], links: D3EdgeData[], canvasWidth: number, canvasHeight: number) => {
    // Stop existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create force simulation
    const simulation = d3.forceSimulation<D3NodeData>(nodes)
      .force('link', d3.forceLink<D3NodeData, D3EdgeData>(links)
        .id(d => d.id)
        .distance(d => {
          const sourceType = (d.source as D3NodeData).type;
          const targetType = (d.target as D3NodeData).type;
          // Adjust link distance based on node types
          if (sourceType === targetType) return 80;
          return 120;
        })
        .strength(0.6)
      )
      .force('charge', d3.forceManyBody()
        .strength((d: any) => {
          const size = nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.size || 20;
          return -300 * (size / 20); // Stronger repulsion for larger nodes
        })
      )
      .force('center', d3.forceCenter(canvasWidth / 2, canvasHeight / 2))
      .force('collision', d3.forceCollide()
        .radius((d: any) => (nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.size || 20) + 10)
        .strength(0.7)
      )
      .force('x', d3.forceX(canvasWidth / 2).strength(0.1))
      .force('y', d3.forceY(canvasHeight / 2).strength(0.1));

    simulationRef.current = simulation;
    return simulation;
  }, []);

  const initializeCanvas = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // Clear existing content
    svg.selectAll('*').remove();

    // Set up responsive dimensions
    const containerRect = containerRef.current.getBoundingClientRect();
    const canvasWidth = width || containerRect.width;
    const canvasHeight = height || containerRect.height;

    svg
      .attr('width', canvasWidth)
      .attr('height', canvasHeight)
      .attr('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);

    // Add gradient definitions
    const defs = svg.append('defs');
    
    // Create gradients for different node types
    Object.entries(nodeTypeConfig).forEach(([type, config]) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${type}`)
        .attr('cx', '30%')
        .attr('cy', '30%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.color(config.color)?.brighter(0.5)?.toString() || config.color);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', config.color);
    });

    // Add drop shadow filter
    const filter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('height', '130%');
    
    filter.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 2);
    
    filter.append('feOffset')
      .attr('dx', 2)
      .attr('dy', 2)
      .attr('result', 'offset');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'offset');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Create main group for zooming/panning
    const mainGroup = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', `translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`);

    // Create container groups for edges and nodes (edges should be drawn first)
    const edgesContainer = mainGroup.append('g').attr('class', 'edges-container');
    const nodesContainer = mainGroup.append('g').attr('class', 'nodes-container');

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        const { transform } = event;
        mainGroup.attr('transform', transform.toString());
        
        // Update viewport state
        setViewport({
          x: transform.x,
          y: transform.y,
          zoom: transform.k
        });
      });

    svg.call(zoom);

    // Set up click handler for canvas background
    svg.on('click', (event) => {
      // Only clear selection if clicking on background
      if (event.target === svg.node()) {
        clearSelection();
      }
    });

    // Initialize zoom transform based on current viewport
    const initialTransform = d3.zoomIdentity
      .translate(viewport.x, viewport.y)
      .scale(viewport.zoom);
    
    svg.call(zoom.transform, initialTransform);

    return { svg, mainGroup, canvasWidth, canvasHeight, edgesContainer, nodesContainer };
  }, [width, height, viewport, setViewport, clearSelection]);

  const renderNodes = useCallback((
    nodesContainer: d3.Selection<SVGGElement, unknown, null, undefined>, 
    nodes: D3NodeData[], 
    simulation: d3.Simulation<D3NodeData, D3EdgeData>
  ) => {
    // Bind data to nodes
    const nodeSelection = nodesContainer
      .selectAll<SVGGElement, D3NodeData>('.node')
      .data(nodes, (d: D3NodeData) => d.id);

    // Remove old nodes
    nodeSelection.exit().remove();

    // Create new node groups
    const nodeEnter = nodeSelection
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer');

    // Add main circle for nodes with gradient fill
    nodeEnter
      .append('circle')
      .attr('class', 'node-circle')
      .attr('r', (d: D3NodeData) => nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.size || 20)
      .attr('fill', (d: D3NodeData) => `url(#gradient-${d.type})`)
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('filter', 'url(#drop-shadow)');

    // Add selection ring
    nodeEnter
      .append('circle')
      .attr('class', 'selection-ring')
      .attr('r', (d: D3NodeData) => (nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.size || 20) + 6)
      .attr('fill', 'none')
      .attr('stroke', '#ff6b35')
      .attr('stroke-width', 3)
      .attr('opacity', 0);

    // Add icon text
    nodeEnter
      .append('text')
      .attr('class', 'node-icon')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.1em')
      .attr('font-size', (d: D3NodeData) => `${(nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.size || 20) * 0.6}px`)
      .attr('font-family', 'Apple Color Emoji, Segoe UI Emoji, sans-serif')
      .text((d: D3NodeData) => nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.symbol || '●');

    // Add text labels below nodes
    nodeEnter
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: D3NodeData) => (nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.size || 20) + 20)
      .attr('font-size', '11px')
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .attr('font-weight', '500')
      .attr('fill', '#2d3748')
      .text((d: D3NodeData) => {
        const maxLength = 16;
        return d.label.length > maxLength ? d.label.substring(0, maxLength - 3) + '...' : d.label;
      });

    // Add connection count badge for highly connected nodes
    const connectionBadge = nodeEnter
      .append('g')
      .attr('class', 'connection-badge')
      .attr('transform', (d: D3NodeData) => {
        const nodeSize = nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.size || 20;
        return `translate(${nodeSize * 0.7}, ${-nodeSize * 0.7})`;
      });

    connectionBadge
      .append('circle')
      .attr('r', 8)
      .attr('fill', '#e53e3e')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    connectionBadge
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.1em')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', 'white')
      .text('5+'); // This would be calculated based on actual connections

    // Merge enter and update selections
    const nodeUpdate = nodeEnter.merge(nodeSelection);

    // Update selection appearance
    nodeUpdate
      .select('.selection-ring')
      .attr('opacity', (d: D3NodeData) => selection.selectedNodeIds.has(d.id) ? 1 : 0);

    nodeUpdate
      .select('.node-circle')
      .attr('stroke', (d: D3NodeData) => selection.selectedNodeIds.has(d.id) ? '#ff6b35' : '#fff')
      .attr('stroke-width', (d: D3NodeData) => selection.selectedNodeIds.has(d.id) ? 4 : 3);

    // Add hover effects
    nodeUpdate
      .on('mouseenter', function(event, d) {
        d3.select(this).select('.node-circle')
          .transition().duration(200)
          .attr('stroke-width', 5)
          .attr('r', (nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.size || 20) + 2);
      })
      .on('mouseleave', function(event, d) {
        if (!selection.selectedNodeIds.has(d.id)) {
          d3.select(this).select('.node-circle')
            .transition().duration(200)
            .attr('stroke-width', 3)
            .attr('r', nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.size || 20);
        }
      });

    // Add click handlers
    nodeUpdate.on('click', (event, d: D3NodeData) => {
      event.stopPropagation();
      const multiSelect = event.ctrlKey || event.metaKey;
      selectNode(d.id, multiSelect);
    });

    // Add enhanced drag behavior with simulation restart
    const drag = d3.drag<SVGGElement, D3NodeData>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        event.sourceEvent.stopPropagation();
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        updateNodePosition(d.id, event.x, event.y);
      });

    nodeUpdate.call(drag);

    // Update positions during simulation
    simulation.on('tick', () => {
      nodeUpdate.attr('transform', (d: D3NodeData) => `translate(${d.x || 0}, ${d.y || 0})`);
    });

  }, [selection, selectNode, updateNodePosition]);

  const renderEdges = useCallback((
    edgesContainer: d3.Selection<SVGGElement, unknown, null, undefined>, 
    links: D3EdgeData[], 
    simulation: d3.Simulation<D3NodeData, D3EdgeData>
  ) => {
    // Bind data to edge groups
    const edgeSelection = edgesContainer
      .selectAll<SVGGElement, D3EdgeData>('.edge')
      .data(links, (d: D3EdgeData) => d.id);

    // Remove old edges
    edgeSelection.exit().remove();

    // Create new edge groups
    const edgeEnter = edgeSelection
      .enter()
      .append('g')
      .attr('class', 'edge')
      .attr('cursor', 'pointer');

    // Add the main edge line
    edgeEnter
      .append('line')
      .attr('class', 'edge-line')
      .attr('stroke', (d: D3EdgeData) => {
        const edgeTypeColors = {
          'treats': '#e53e3e',
          'requires': '#3182ce',
          'measures': '#38a169',
          'related_to': '#805ad5'
        };
        return edgeTypeColors[d.type as keyof typeof edgeTypeColors] || '#718096';
      })
      .attr('stroke-width', (d: D3EdgeData) => d.width || 2)
      .attr('stroke-opacity', 0.8)
      .attr('stroke-linecap', 'round');

    // Add edge labels
    edgeEnter
      .append('text')
      .attr('class', 'edge-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .attr('font-weight', '500')
      .attr('fill', '#4a5568')
      .attr('dy', -3)
      .text((d: D3EdgeData) => d.type.replace('_', ' '));

    // Add arrow markers for directed edges
    edgeEnter
      .append('polygon')
      .attr('class', 'edge-arrow')
      .attr('points', '0,-3 8,0 0,3')
      .attr('fill', (d: D3EdgeData) => {
        const edgeTypeColors = {
          'treats': '#e53e3e',
          'requires': '#3182ce',
          'measures': '#38a169',
          'related_to': '#805ad5'
        };
        return edgeTypeColors[d.type as keyof typeof edgeTypeColors] || '#718096';
      })
      .attr('fill-opacity', 0.8);

    // Merge enter and update selections
    const edgeUpdate = edgeEnter.merge(edgeSelection);

    // Update edge appearance based on selection
    edgeUpdate
      .select('.edge-line')
      .attr('stroke-width', (d: D3EdgeData) => 
        selection.selectedEdgeIds.has(d.id) ? 4 : (d.width || 2)
      )
      .attr('stroke-opacity', (d: D3EdgeData) => 
        selection.selectedEdgeIds.has(d.id) ? 1 : 0.8
      );

    // Add hover effects
    edgeUpdate
      .on('mouseenter', function(event, d) {
        d3.select(this).select('.edge-line')
          .transition().duration(150)
          .attr('stroke-width', (d.width || 2) + 1)
          .attr('stroke-opacity', 1);
        
        d3.select(this).select('.edge-label')
          .transition().duration(150)
          .attr('font-size', '10px')
          .attr('font-weight', '600');
      })
      .on('mouseleave', function(event, d) {
        if (!selection.selectedEdgeIds.has(d.id)) {
          d3.select(this).select('.edge-line')
            .transition().duration(150)
            .attr('stroke-width', d.width || 2)
            .attr('stroke-opacity', 0.8);
          
          d3.select(this).select('.edge-label')
            .transition().duration(150)
            .attr('font-size', '9px')
            .attr('font-weight', '500');
        }
      });

    // Add click handlers
    edgeUpdate.on('click', (event, d: D3EdgeData) => {
      event.stopPropagation();
      const multiSelect = event.ctrlKey || event.metaKey;
      selectEdge(d.id, multiSelect);
    });

    // Update positions during simulation
    simulation.on('tick', () => {
      edgeUpdate.each(function(d) {
        const source = d.source as D3NodeData;
        const target = d.target as D3NodeData;
        
        if (!source.x || !source.y || !target.x || !target.y) return;
        
        // Calculate edge positioning
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const angle = Math.atan2(dy, dx);
        
        // Adjust for node sizes
        const sourceSize = nodeTypeConfig[source.type as keyof typeof nodeTypeConfig]?.size || 20;
        const targetSize = nodeTypeConfig[target.type as keyof typeof nodeTypeConfig]?.size || 20;
        
        const sourceX = source.x + Math.cos(angle) * sourceSize;
        const sourceY = source.y + Math.sin(angle) * sourceSize;
        const targetX = target.x - Math.cos(angle) * (targetSize + 8); // Extra space for arrow
        const targetY = target.y - Math.sin(angle) * (targetSize + 8);
        
        // Update line position
        d3.select(this).select('.edge-line')
          .attr('x1', sourceX)
          .attr('y1', sourceY)
          .attr('x2', targetX)
          .attr('y2', targetY);
        
        // Update label position (middle of edge)
        d3.select(this).select('.edge-label')
          .attr('x', (sourceX + targetX) / 2)
          .attr('y', (sourceY + targetY) / 2);
        
        // Update arrow position and rotation
        d3.select(this).select('.edge-arrow')
          .attr('transform', `translate(${targetX}, ${targetY}) rotate(${angle * 180 / Math.PI})`);
      });
    });

  }, [selection, selectEdge]);

  const render = useCallback(() => {
    const canvasSetup = initializeCanvas();
    if (!canvasSetup) return;

    const { canvasWidth, canvasHeight, edgesContainer, nodesContainer } = canvasSetup;
    
    // Convert data to D3 format
    const d3Nodes: D3NodeData[] = data.nodes.map(node => ({
      id: node.id,
      label: node.label,
      type: node.type,
      color: node.color,
      size: node.size,
      properties: node.properties,
      x: node.position?.x,
      y: node.position?.y
    }));

    const d3Links: D3EdgeData[] = data.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      color: edge.color,
      width: edge.width,
      properties: edge.properties
    }));

    // Initialize force simulation
    const simulation = initializeSimulation(d3Nodes, d3Links, canvasWidth, canvasHeight);
    
    setIsSimulationRunning(true);
    
    // Stop simulation after some time to improve performance
    setTimeout(() => {
      simulation.stop();
      setIsSimulationRunning(false);
    }, 5000);

    // Render edges first, then nodes (so nodes appear on top)
    renderEdges(edgesContainer, d3Links, simulation);
    renderNodes(nodesContainer, d3Nodes, simulation);
    
  }, [initializeCanvas, renderEdges, renderNodes, data.nodes, data.edges, initializeSimulation]);

  // Re-render when data or viewport changes
  useEffect(() => {
    render();
  }, [render, data.nodes, data.edges, selection]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      render();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`graph-canvas-container ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {/* Control panel */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
        zIndex: 1000
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '12px',
          color: '#4a5568'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isSimulationRunning ? '#48bb78' : '#cbd5e0'
          }} />
          {isSimulationRunning ? 'Calculating layout...' : 'Layout stable'}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
        zIndex: 1000,
        minWidth: '160px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>
          Node Types
        </div>
        {Object.entries(nodeTypeConfig).map(([type, config]) => (
          <div key={type} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '4px',
            fontSize: '11px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: config.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px'
            }}>
              {config.symbol}
            </div>
            <span style={{ color: '#4a5568', textTransform: 'capitalize' }}>
              {type}
            </span>
          </div>
        ))}
      </div>

      {/* Selection info */}
      {(selection.selectedNodeIds.size > 0 || selection.selectedEdgeIds.size > 0) && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
          zIndex: 1000,
          fontSize: '12px',
          color: '#4a5568'
        }}>
          Selected: {selection.selectedNodeIds.size} nodes, {selection.selectedEdgeIds.size} edges
        </div>
      )}

      <svg
        ref={svgRef}
        className="graph-canvas"
        style={{ 
          width: '100%', 
          height: '100%', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px'
        }}
      />
    </div>
  );
}