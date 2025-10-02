'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import useGraphStore from '@/store/graphStore';
import { theme } from '@/lib/theme';

interface D3Node {
  id: string;
  label: string;
  type: string;
  group?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

interface D3Link {
  id: string;
  source: string | D3Node;
  target: string | D3Node;
  type: string;
  value?: number;
}

interface D3ForceGraphProps {
  width?: number;
  height?: number;
  isDarkMode?: boolean;
  setDarkMode?: (value: boolean) => void;
  data?: any;
}

interface SelectedNodeInfo {
  node: D3Node;
  properties?: Record<string, any>;
  connections: {
    incoming: number;
    outgoing: number;
    edges: Array<{
      type: string;
      target: string;
      source: string;
    }>;
  };
}

export default function D3ForceGraph({ 
  width, 
  height,
  isDarkMode = false,
  setDarkMode,
  data: propsData
}: D3ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<SelectedNodeInfo | null>(null);
  
  const graphStore = useGraphStore();
  const data = propsData || graphStore.data;
  const { 
    selection,
    selectNode,
    clearSelection,
    updateNodePosition 
  } = graphStore;

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const initializeGraph = useCallback(() => {
    if (!svgRef.current) return;

    // Get actual dimensions
    const actualWidth = width || svgRef.current.clientWidth || 800;
    const actualHeight = height || svgRef.current.clientHeight || 600;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', actualWidth)
      .attr('height', actualHeight);

    // Add background rectangle
    svg.append('rect')
      .attr('width', actualWidth)
      .attr('height', actualHeight)
      .attr('fill', isDarkMode ? '#0d1117' : '#ffffff');

    // Create container for zoom
    const container = svg.append('g');

    // Convert data to D3 format
    const nodes: D3Node[] = data.nodes.map((node: any) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      group: ['condition', 'exercise', 'equipment', 'metric'].indexOf(node.type),
      x: node.position?.x,
      y: node.position?.y
    }));

    // Create a set of valid node IDs for validation
    const nodeIds = new Set(nodes.map(n => n.id));

    // Filter out edges that reference non-existent nodes
    const links: D3Link[] = data.edges
      .filter((edge: any) => {
        const sourceExists = nodeIds.has(edge.source);
        const targetExists = nodeIds.has(edge.target);
        if (!sourceExists || !targetExists) {
          console.warn(`Edge ${edge.id} references missing node(s): source=${edge.source} (${sourceExists}), target=${edge.target} (${targetExists})`);
          return false;
        }
        return true;
      })
      .map((edge: any) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        value: 1
      }));

    // Log data summary for debugging
    console.log(`Graph data: ${nodes.length} nodes, ${links.length} valid links (${data.edges.length - links.length} invalid links filtered)`);
    
    // Debug metrics connections
    const metricNodes = nodes.filter(n => n.type === 'metric');
    const metricEdges = links.filter(e => {
      const source = nodes.find(n => n.id === e.source);
      const target = nodes.find(n => n.id === e.target);
      return (source?.type === 'metric' || target?.type === 'metric');
    });
    
    console.log('Metrics debug:', {
      metricNodes: metricNodes.length,
      metricEdges: metricEdges.length,
      sampleMetricNodes: metricNodes.slice(0, 3).map(n => ({ id: n.id, label: n.label })),
      sampleMetricEdges: metricEdges.slice(0, 3).map(e => ({ source: e.source, target: e.target, type: e.type }))
    });

    // Create force simulation with error handling
    let simulation: d3.Simulation<any, any>;
    try {
      simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100).strength(0.2))
        .force('charge', d3.forceManyBody().strength(-400).distanceMax(250))
        .force('center', d3.forceCenter(actualWidth / 2, actualHeight / 2).strength(0.05))
        .force('collision', d3.forceCollide().radius(35).strength(0.8))
        .force('x', d3.forceX(actualWidth / 2).strength(0.01))
        .force('y', d3.forceY(actualHeight / 2).strength(0.01))
        .velocityDecay(0.6) // Higher decay for smoother movement
        .alphaMin(0.02) // Never go below this alpha
        .alphaDecay(0); // Never decay - keep running forever

      simulationRef.current = simulation as any;
    } catch (error) {
      console.error('Error creating force simulation:', error);
      return;
    }

    // Create links with different styles for different relationship types
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => {
        // Color based on edge type
        const edgeColors: Record<string, string> = {
          'treats': isDarkMode ? '#58a6ff' : theme.colors.primary[600],      // Blue for treatment
          'requires': isDarkMode ? '#3fb950' : theme.colors.secondary[500],  // Green for equipment
          'measures': isDarkMode ? '#f0883e' : theme.colors.warning[500],    // Orange for metrics
          'related_to': isDarkMode ? '#484f58' : theme.colors.gray[400]      // Gray for general
        };
        return edgeColors[d.type] || (isDarkMode ? '#6e7681' : theme.colors.gray[500]);
      })
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', d => {
        // Vary width based on importance
        const baseWidth = Math.sqrt(d.value || 1);
        return d.type === 'measures' ? baseWidth * 2 : baseWidth * 1.5;
      })
      .attr('stroke-dasharray', d => {
        // Dashed lines for optional relationships
        return d.type === 'requires' && (d as any).properties?.requirement_type === 'optional' ? '5,5' : null;
      });

    // Create nodes with theme colors
    const nodeColors = {
      0: isDarkMode ? '#f778ba' : theme.categories.joints.accent,     // condition - using joints category
      1: isDarkMode ? '#3fb950' : theme.categories.exercises.accent,  // exercise
      2: isDarkMode ? '#56d6d1' : theme.colors.secondary[500],        // equipment - teal
      3: isDarkMode ? '#f0883e' : theme.colors.warning[500]           // metric - orange
    };
    
    const node = container.append('g')
      .attr('stroke', isDarkMode ? '#30363d' : theme.colors.primary[100])
      .attr('stroke-width', 2)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 10)
      .attr('fill', d => nodeColors[d.group as keyof typeof nodeColors] || theme.colors.secondary[400])
      .attr('opacity', d => {
        // Make unconnected metrics more visible
        if (d.type === 'metric') {
          const hasConnections = links.some(link => 
            link.source === d.id || link.target === d.id ||
            (typeof link.source === 'object' && (link.source as any).id === d.id) ||
            (typeof link.target === 'object' && (link.target as any).id === d.id)
          );
          return hasConnections ? 0.9 : 0.4;
        }
        return 0.9;
      })
      .style('cursor', 'pointer');

    // Add labels
    const label = container.append('g')
      .style('font', '12px sans-serif')
      .style('user-select', 'none')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', 12)
      .attr('y', 3)
      .text(d => d.label)
      .style('font-size', '10px')
      .style('fill', isDarkMode ? '#f0f6fc' : theme.colors.primary[900])
      .style('text-shadow', isDarkMode ? '0 0 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.5)' : '0 0 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.5)');

    // Add titles for hover
    node.append('title')
      .text(d => `${d.label} (${d.type})`);

    // Update selection appearance
    const updateSelection = () => {
      node
        .attr('stroke', d => selection.selectedNodeIds.has(d.id) ? (isDarkMode ? '#58a6ff' : theme.colors.primary[600]) : (isDarkMode ? '#30363d' : theme.colors.primary[100]))
        .attr('stroke-width', d => selection.selectedNodeIds.has(d.id) ? 3 : 1.5)
        .attr('r', d => selection.selectedNodeIds.has(d.id) ? 10 : 8);
    };

    // Click handler for selection and info display
    node.on('click', function(event, d) {
      event.stopPropagation();
      const multiSelect = event.ctrlKey || event.metaKey || event.shiftKey;
      selectNode(d.id, multiSelect);
      updateSelection();
      
      // Find full node data and connections
      const fullNode = data.nodes.find((n: any) => n.id === d.id);
      if (fullNode) {
        const incomingEdges = data.edges.filter((e: any) => e.target === d.id);
        const outgoingEdges = data.edges.filter((e: any) => e.source === d.id);
        
        setSelectedNodeInfo({
          node: d,
          properties: fullNode.properties,
          connections: {
            incoming: incomingEdges.length,
            outgoing: outgoingEdges.length,
            edges: [...incomingEdges, ...outgoingEdges].map(e => ({
              type: e.type,
              source: e.source,
              target: e.target
            }))
          }
        });
      }
    });

    // Click on background to clear selection
    svg.on('click', () => {
      clearSelection();
      updateSelection();
      setSelectedNodeInfo(null);
    });

    // Drag functionality - smooth and simple
    const drag = d3.drag<SVGCircleElement, D3Node>()
      .on('start', function(event, d) {
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function(event, d) {
        // Immediately release the node back to physics
        d.fx = null;
        d.fy = null;
        
        // Update position in store
        if (d.x !== undefined && d.y !== undefined) {
          updateNodePosition(d.id, d.x, d.y);
        }
      });

    node.call(drag as any);

    // Zoom functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        container.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // Update positions on simulation tick
    simulation!.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x + 12)
        .attr('y', (d: any) => d.y + 3);
    });

    // Initial selection update
    updateSelection();

    // Keep simulation always running with gentle forces
    simulation.alphaMin(0.01).alphaDecay(0); // Never stop the simulation
    
    // Add continuous gentle forces to keep movement natural
    const applyGentleForces = () => {
      nodes.forEach(node => {
        if (!node.fx && !node.fy) {
          // Apply small random forces for organic movement
          node.vx = (node.vx || 0) * 0.99 + (Math.random() - 0.5) * 0.3;
          node.vy = (node.vy || 0) * 0.99 + (Math.random() - 0.5) * 0.3;
        }
      });
      simulation.alpha(0.02); // Keep a minimum energy level
    };
    
    const forceInterval = setInterval(applyGentleForces, 100);

    // Keyboard shortcuts
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearSelection();
        updateSelection();
      }
      // Reset zoom on 'r'
      if (event.key === 'r' || event.key === 'R') {
        svg.transition()
          .duration(750)
          .call(zoom.transform as any, d3.zoomIdentity);
      }
      // Space to restart simulation
      if (event.key === ' ') {
        event.preventDefault();
        simulation.alpha(0.3).restart();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearInterval(forceInterval);
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };

  }, [data, selection, width, height, selectNode, clearSelection, updateNodePosition, color, setSelectedNodeInfo, isDarkMode]);

  useEffect(() => {
    const cleanup = initializeGraph();
    return cleanup;
  }, [initializeGraph]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (simulationRef.current && svgRef.current) {
        const actualWidth = width || svgRef.current.clientWidth || 800;
        const actualHeight = height || svgRef.current.clientHeight || 600;
        simulationRef.current.force('center', d3.forceCenter(actualWidth / 2, actualHeight / 2));
        simulationRef.current.alpha(0.3).restart();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg 
        ref={svgRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          cursor: 'grab',
          background: '#ffffff'
        }}
      />
      

      {/* Legend */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: isDarkMode ? '#161b22' : '#ffffff',
        border: `1px solid ${isDarkMode ? '#30363d' : theme.colors.primary[100]}`,
        padding: '15px',
        borderRadius: '8px',
        fontSize: '12px',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
        color: isDarkMode ? '#8b949e' : theme.colors.primary[600],
        minWidth: '220px'
      }}>
        {/* Title and Dark Mode Toggle */}
        <div style={{ 
          marginBottom: '15px', 
          paddingBottom: '15px', 
          borderBottom: `1px solid ${isDarkMode ? '#30363d' : theme.colors.primary[100]}`
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: isDarkMode ? '#f0f6fc' : theme.colors.primary[900],
            marginBottom: '8px'
          }}>
            Interactive Knowledge Graph
          </div>
          {setDarkMode && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: isDarkMode ? '#8b949e' : theme.colors.primary[600] }}>
                Dark Mode
              </span>
              <button
                onClick={() => setDarkMode(!isDarkMode)}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  padding: '2px',
                  backgroundColor: isDarkMode ? '#3fb950' : theme.colors.primary[100],
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: isDarkMode ? '#ffffff' : theme.colors.primary[600],
                  transition: 'transform 0.2s',
                  transform: isDarkMode ? 'translateX(20px)' : 'translateX(0)'
                }} />
              </button>
            </div>
          )}
        </div>
        <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '14px', color: isDarkMode ? '#f0f6fc' : theme.colors.primary[900] }}>
          Node Types
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: isDarkMode ? '#f778ba' : theme.categories.joints.accent, marginRight: '10px' }} />
            <span>Conditions</span>
          </div>
          <span style={{ fontSize: '11px', color: isDarkMode ? '#6e7681' : theme.colors.gray[500] }}>
            {data.nodes.filter((n: any) => n.type === 'condition').length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: isDarkMode ? '#3fb950' : theme.categories.exercises.accent, marginRight: '10px' }} />
            <span>Exercises</span>
          </div>
          <span style={{ fontSize: '11px', color: isDarkMode ? '#6e7681' : theme.colors.gray[500] }}>
            {data.nodes.filter((n: any) => n.type === 'exercise').length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: isDarkMode ? '#56d6d1' : theme.colors.secondary[500], marginRight: '10px' }} />
            <span>Equipment</span>
          </div>
          <span style={{ fontSize: '11px', color: isDarkMode ? '#6e7681' : theme.colors.gray[500] }}>
            {data.nodes.filter((n: any) => n.type === 'equipment').length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: isDarkMode ? '#f0883e' : theme.colors.warning[500], marginRight: '10px' }} />
            <span>Metrics</span>
          </div>
          <span style={{ fontSize: '11px', color: isDarkMode ? '#6e7681' : theme.colors.gray[500] }}>
            {data.nodes.filter((n: any) => n.type === 'metric').length}
          </span>
        </div>
        
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: `1px solid ${isDarkMode ? '#30363d' : theme.colors.gray[200]}` }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px', color: isDarkMode ? '#f0f6fc' : theme.colors.primary[900] }}>Edge Types</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '11px' }}>
            <div style={{ width: '30px', height: '2px', backgroundColor: isDarkMode ? '#58a6ff' : theme.colors.primary[600], marginRight: '8px' }} />
            <span>Treats</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '11px' }}>
            <div style={{ width: '30px', height: '2px', backgroundColor: isDarkMode ? '#f0883e' : theme.colors.warning[500], marginRight: '8px' }} />
            <span>Measures</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '11px' }}>
            <div style={{ width: '30px', height: '2px', backgroundColor: isDarkMode ? '#3fb950' : theme.colors.secondary[500], marginRight: '8px' }} />
            <span>Requires</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '11px' }}>
            <div style={{ width: '30px', height: '2px', backgroundColor: isDarkMode ? '#3fb950' : theme.colors.secondary[500], marginRight: '8px', borderStyle: 'dashed', borderWidth: '1px 0 0 0' }} />
            <span>Optional</span>
          </div>
        </div>
        
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: `1px solid ${isDarkMode ? '#30363d' : theme.colors.gray[200]}` }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#f0f6fc' : theme.colors.primary[900] }}>Stats</div>
          <div style={{ fontSize: '11px' }}>Nodes: {data.nodes.length}</div>
          <div style={{ fontSize: '11px' }}>Edges: {data.edges.length}</div>
          {selection.selectedNodeIds.size > 0 && (
            <div style={{ marginTop: '5px', color: isDarkMode ? '#58a6ff' : theme.colors.primary[600], fontSize: '11px' }}>
              Selected: {selection.selectedNodeIds.size}
            </div>
          )}
        </div>
      </div>

      {/* Node Details Panel */}
      {selectedNodeInfo && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: isDarkMode ? '#161b22' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#30363d' : theme.colors.primary[100]}`,
          padding: '15px',
          borderRadius: '8px',
          fontSize: '12px',
          boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
          color: isDarkMode ? '#8b949e' : theme.colors.primary[600],
          maxWidth: '300px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: isDarkMode ? '#f0f6fc' : theme.colors.primary[900] }}>Node Information</h3>
            <button
              onClick={() => setSelectedNodeInfo(null)}
              style={{
                background: 'none',
                border: 'none',
                color: isDarkMode ? '#58a6ff' : theme.colors.primary[600],
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', color: isDarkMode ? '#f0f6fc' : theme.colors.primary[900] }}>
              {selectedNodeInfo.node.label}
            </div>
            <div style={{ fontSize: '11px', color: isDarkMode ? '#6e7681' : theme.colors.gray[500], textTransform: 'capitalize' }}>
              Type: {selectedNodeInfo.node.type}
            </div>
            <div style={{ fontSize: '11px', color: isDarkMode ? '#6e7681' : theme.colors.gray[500] }}>
              ID: {selectedNodeInfo.node.id}
            </div>
          </div>

          {selectedNodeInfo.properties && Object.keys(selectedNodeInfo.properties).length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#f0f6fc' : theme.colors.primary[900] }}>Properties:</div>
              {Object.entries(selectedNodeInfo.properties).map(([key, value]) => (
                <div key={key} style={{ fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ color: isDarkMode ? '#6e7681' : theme.colors.gray[500] }}>{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#f0f6fc' : theme.colors.primary[900] }}>Connections:</div>
            <div style={{ fontSize: '11px' }}>
              Incoming: {selectedNodeInfo.connections.incoming}
            </div>
            <div style={{ fontSize: '11px' }}>
              Outgoing: {selectedNodeInfo.connections.outgoing}
            </div>
          </div>

          {selectedNodeInfo.connections.edges.length > 0 && (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#f0f6fc' : theme.colors.primary[900] }}>Related Nodes:</div>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {selectedNodeInfo.connections.edges.slice(0, 10).map((edge, idx) => {
                  const isSource = edge.source === selectedNodeInfo.node.id;
                  const relatedId = isSource ? edge.target : edge.source;
                  const relatedNode = data.nodes.find((n: any) => n.id === relatedId);
                  
                  return (
                    <div key={idx} style={{ 
                      fontSize: '11px', 
                      marginBottom: '3px',
                      padding: '3px',
                      backgroundColor: isDarkMode ? '#21262d' : theme.colors.gray[50],
                      borderRadius: '3px'
                    }}>
                      <span style={{ color: isDarkMode ? '#6e7681' : theme.colors.gray[500] }}>
                        {isSource ? '→' : '←'} {edge.type}:
                      </span> {relatedNode?.label || relatedId}
                    </div>
                  );
                })}
                {selectedNodeInfo.connections.edges.length > 10 && (
                  <div style={{ fontSize: '10px', color: isDarkMode ? '#6e7681' : theme.colors.gray[500], marginTop: '5px' }}>
                    ...and {selectedNodeInfo.connections.edges.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}