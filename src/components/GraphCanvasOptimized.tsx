'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
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
  cluster?: string;
  isClusterNode?: boolean;
  childNodes?: string[];
}

interface D3EdgeData extends d3.SimulationLinkDatum<D3NodeData> {
  id: string;
  type: string;
  color?: string;
  width?: number;
  properties?: Record<string, any>;
}

interface GraphCanvasOptimizedProps {
  width?: number;
  height?: number;
  className?: string;
  maxVisibleNodes?: number;
  enableClustering?: boolean;
  clusterThreshold?: number;
}

const nodeTypeConfig = {
  condition: { color: '#ff6b6b', size: 25, symbol: '🏥' },
  exercise: { color: '#4ecdc4', size: 22, symbol: '💪' },
  equipment: { color: '#45b7d1', size: 20, symbol: '🏋️' },
  metric: { color: '#f39c12', size: 18, symbol: '📊' },
  cluster: { color: '#9f7aea', size: 35, symbol: '📦' }
};

export default function GraphCanvasOptimized({ 
  width = 800, 
  height = 600, 
  className = '',
  maxVisibleNodes = 100,
  enableClustering = true,
  clusterThreshold = 10
}: GraphCanvasOptimizedProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<D3NodeData, D3EdgeData> | null>(null);
  
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [visibilityMode, setVisibilityMode] = useState<'all' | 'important' | 'filtered'>('important');
  
  const { 
    data, 
    viewport, 
    selection,
    nodeTypes,
    edgeTypes,
    searchQuery,
    setViewport,
    selectNode,
    selectEdge,
    clearSelection,
    updateNodePosition 
  } = useGraphStore();

  // Calculate node importance scores
  const nodeImportance = useMemo(() => {
    const importance = new Map<string, number>();
    
    // Calculate degree centrality
    data.nodes.forEach(node => {
      const degree = data.edges.filter(edge => 
        edge.source === node.id || edge.target === node.id
      ).length;
      importance.set(node.id, degree);
    });

    return importance;
  }, [data.nodes, data.edges]);

  // Cluster nodes by type and proximity
  const clusteredData = useMemo(() => {
    if (!enableClustering || data.nodes.length < clusterThreshold) {
      return { nodes: data.nodes, edges: data.edges };
    }

    const clusters = new Map<string, NodeData[]>();
    const clusterNodes: D3NodeData[] = [];
    const remainingNodes: NodeData[] = [];

    // Group nodes by type
    data.nodes.forEach(node => {
      if (nodeTypes.has(node.type)) {
        const key = `cluster_${node.type}`;
        if (!clusters.has(key)) {
          clusters.set(key, []);
        }
        clusters.get(key)!.push(node);
      }
    });

    // Create cluster nodes for large groups
    clusters.forEach((nodes, clusterId) => {
      if (nodes.length > clusterThreshold && !expandedClusters.has(clusterId)) {
        // Create a cluster node
        const clusterNode: D3NodeData = {
          id: clusterId,
          label: `${nodes[0].type} cluster (${nodes.length})`,
          type: 'cluster',
          isClusterNode: true,
          childNodes: nodes.map(n => n.id),
          size: Math.min(35 + nodes.length / 2, 60)
        };
        clusterNodes.push(clusterNode);
      } else {
        remainingNodes.push(...nodes);
      }
    });

    // Add non-clustered nodes
    data.nodes.forEach(node => {
      if (!nodeTypes.has(node.type) || expandedClusters.has(`cluster_${node.type}`)) {
        remainingNodes.push(node);
      }
    });

    // Update edges to connect to cluster nodes
    const updatedEdges = data.edges.map(edge => {
      let source = edge.source;
      let target = edge.target;

      clusterNodes.forEach(cluster => {
        if (cluster.childNodes?.includes(source)) {
          source = cluster.id;
        }
        if (cluster.childNodes?.includes(target)) {
          target = cluster.id;
        }
      });

      return { ...edge, source, target };
    });

    // Remove duplicate edges between clusters
    const uniqueEdges = Array.from(
      new Map(updatedEdges.map(e => [`${e.source}-${e.target}`, e])).values()
    );

    return {
      nodes: [...remainingNodes, ...clusterNodes] as NodeData[],
      edges: uniqueEdges
    };
  }, [data, nodeTypes, enableClustering, clusterThreshold, expandedClusters]);

  // Filter visible nodes based on zoom level and importance
  const visibleData = useMemo(() => {
    let visibleNodes = clusteredData.nodes;
    let visibleEdges = clusteredData.edges;

    // Apply search filter
    if (searchQuery) {
      const matchingNodeIds = new Set(
        visibleNodes
          .filter(node => 
            node.label.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(node => node.id)
      );
      
      visibleNodes = visibleNodes.filter(node => matchingNodeIds.has(node.id));
      visibleEdges = visibleEdges.filter(edge => 
        matchingNodeIds.has(edge.source) && matchingNodeIds.has(edge.target)
      );
    }

    // Apply type filters
    visibleNodes = visibleNodes.filter(node => 
      nodeTypes.has(node.type) || (node as any).isClusterNode
    );
    visibleEdges = visibleEdges.filter(edge => edgeTypes.has(edge.type));

    // Apply importance-based filtering for large graphs
    if (visibilityMode === 'important' && visibleNodes.length > maxVisibleNodes) {
      const sortedNodes = [...visibleNodes].sort((a, b) => 
        (nodeImportance.get(b.id) || 0) - (nodeImportance.get(a.id) || 0)
      );
      
      const topNodes = new Set(sortedNodes.slice(0, maxVisibleNodes).map(n => n.id));
      
      visibleNodes = visibleNodes.filter(node => topNodes.has(node.id));
      visibleEdges = visibleEdges.filter(edge => 
        topNodes.has(edge.source) && topNodes.has(edge.target)
      );
    }

    // Apply level-of-detail based on zoom
    if (zoomLevel < 0.5) {
      // Show only most important nodes at low zoom
      const minImportance = Math.max(...Array.from(nodeImportance.values())) * 0.3;
      visibleNodes = visibleNodes.filter(node => 
        (nodeImportance.get(node.id) || 0) >= minImportance || (node as any).isClusterNode
      );
    }

    return { nodes: visibleNodes, edges: visibleEdges };
  }, [clusteredData, searchQuery, nodeTypes, edgeTypes, visibilityMode, maxVisibleNodes, nodeImportance, zoomLevel]);

  const initializeSimulation = useCallback((nodes: D3NodeData[], links: D3EdgeData[], canvasWidth: number, canvasHeight: number) => {
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Use a weaker simulation for large graphs
    const nodeCount = nodes.length;
    const chargeStrength = nodeCount > 200 ? -100 : -300;
    const linkDistance = nodeCount > 200 ? 150 : 120;

    const simulation = d3.forceSimulation<D3NodeData>(nodes)
      .force('link', d3.forceLink<D3NodeData, D3EdgeData>(links)
        .id(d => d.id)
        .distance(linkDistance)
        .strength(0.3)
      )
      .force('charge', d3.forceManyBody()
        .strength(chargeStrength)
        .distanceMax(300)
      )
      .force('center', d3.forceCenter(canvasWidth / 2, canvasHeight / 2))
      .force('collision', d3.forceCollide()
        .radius(d => ((d as any).isClusterNode ? 40 : 25))
        .strength(0.7)
      )
      .velocityDecay(0.6)
      .alphaMin(0.001);

    // Stop simulation earlier for large graphs
    if (nodeCount > 100) {
      simulation.stop();
      simulation.tick(Math.min(300, nodeCount * 2));
    }

    simulationRef.current = simulation;
    return simulation;
  }, []);

  const handleClusterClick = useCallback((clusterId: string) => {
    setExpandedClusters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clusterId)) {
        newSet.delete(clusterId);
      } else {
        newSet.add(clusterId);
      }
      return newSet;
    });
  }, []);

  const renderNodes = useCallback((
    nodesContainer: d3.Selection<SVGGElement, unknown, null, undefined>, 
    nodes: D3NodeData[], 
    simulation: d3.Simulation<D3NodeData, D3EdgeData>
  ) => {
    const nodeSelection = nodesContainer
      .selectAll<SVGGElement, D3NodeData>('.node')
      .data(nodes, (d: D3NodeData) => d.id);

    nodeSelection.exit().remove();

    const nodeEnter = nodeSelection
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer');

    // Render based on zoom level
    if (zoomLevel > 0.7) {
      // Full detail rendering
      nodeEnter
        .append('circle')
        .attr('class', 'node-circle')
        .attr('r', (d: D3NodeData) => {
          if (d.isClusterNode) return d.size || 35;
          return nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.size || 20;
        })
        .attr('fill', (d: D3NodeData) => {
          if (d.isClusterNode) return nodeTypeConfig.cluster.color;
          return nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.color || '#gray';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('opacity', 0.9);

      nodeEnter
        .append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('dy', (d: D3NodeData) => d.isClusterNode ? '0.3em' : '2.5em')
        .attr('font-size', (d: D3NodeData) => d.isClusterNode ? '14px' : '10px')
        .attr('font-weight', (d: D3NodeData) => d.isClusterNode ? 'bold' : 'normal')
        .attr('fill', '#2d3748')
        .text((d: D3NodeData) => {
          if (d.isClusterNode) {
            return d.childNodes ? `${d.childNodes.length} nodes` : '';
          }
          return d.label.length > 12 ? d.label.substring(0, 12) + '...' : d.label;
        });
    } else {
      // Simplified rendering for low zoom
      nodeEnter
        .append('circle')
        .attr('class', 'node-circle')
        .attr('r', (d: D3NodeData) => d.isClusterNode ? 8 : 4)
        .attr('fill', (d: D3NodeData) => {
          if (d.isClusterNode) return nodeTypeConfig.cluster.color;
          return nodeTypeConfig[d.type as keyof typeof nodeTypeConfig]?.color || '#gray';
        })
        .attr('opacity', 0.8);
    }

    const nodeUpdate = nodeEnter.merge(nodeSelection);

    // Update selection appearance
    nodeUpdate
      .select('.node-circle')
      .attr('stroke', (d: D3NodeData) => selection.selectedNodeIds.has(d.id) ? '#ff6b35' : '#fff')
      .attr('stroke-width', (d: D3NodeData) => selection.selectedNodeIds.has(d.id) ? 3 : 2);

    // Add click handlers
    nodeUpdate.on('click', (event, d: D3NodeData) => {
      event.stopPropagation();
      if (d.isClusterNode) {
        handleClusterClick(d.id);
      } else {
        const multiSelect = event.ctrlKey || event.metaKey;
        selectNode(d.id, multiSelect);
      }
    });

    // Simplified drag for performance
    const drag = d3.drag<SVGGElement, D3NodeData>()
      .on('start', (event, d) => {
        if (!event.active && nodes.length < 100) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        if (!d.isClusterNode) {
          updateNodePosition(d.id, event.x, event.y);
        }
      });

    nodeUpdate.call(drag);

    // Update positions during simulation
    simulation.on('tick', () => {
      nodeUpdate.attr('transform', (d: D3NodeData) => `translate(${d.x || 0}, ${d.y || 0})`);
    });

  }, [selection, selectNode, updateNodePosition, handleClusterClick, zoomLevel]);

  const renderEdges = useCallback((
    edgesContainer: d3.Selection<SVGGElement, unknown, null, undefined>, 
    links: D3EdgeData[], 
    simulation: d3.Simulation<D3NodeData, D3EdgeData>
  ) => {
    // Simplified edge rendering for performance
    const edgeSelection = edgesContainer
      .selectAll<SVGLineElement, D3EdgeData>('.edge')
      .data(links, (d: D3EdgeData) => d.id);

    edgeSelection.exit().remove();

    const edgeEnter = edgeSelection
      .enter()
      .append('line')
      .attr('class', 'edge')
      .attr('stroke', '#cbd5e0')
      .attr('stroke-width', 1)
      .attr('opacity', 0.6);

    const edgeUpdate = edgeEnter.merge(edgeSelection);

    // Update edge appearance
    edgeUpdate
      .attr('stroke', (d: D3EdgeData) => selection.selectedEdgeIds.has(d.id) ? '#ff6b35' : '#cbd5e0')
      .attr('stroke-width', (d: D3EdgeData) => selection.selectedEdgeIds.has(d.id) ? 2 : 1);

    // Update positions during simulation
    simulation.on('tick.edges', () => {
      edgeUpdate
        .attr('x1', (d: any) => d.source.x || 0)
        .attr('y1', (d: any) => d.source.y || 0)
        .attr('x2', (d: any) => d.target.x || 0)
        .attr('y2', (d: any) => d.target.y || 0);
    });

  }, [selection]);

  const initializeCanvas = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerRect = containerRef.current.getBoundingClientRect();
    const canvasWidth = width || containerRect.width;
    const canvasHeight = height || containerRect.height;

    svg
      .attr('width', canvasWidth)
      .attr('height', canvasHeight)
      .attr('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);

    const mainGroup = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', `translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`);

    const edgesContainer = mainGroup.append('g').attr('class', 'edges-container');
    const nodesContainer = mainGroup.append('g').attr('class', 'nodes-container');

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        const { transform } = event;
        mainGroup.attr('transform', transform.toString());
        
        setZoomLevel(transform.k);
        setViewport({
          x: transform.x,
          y: transform.y,
          zoom: transform.k
        });
      });

    svg.call(zoom);

    svg.on('click', (event) => {
      if (event.target === svg.node()) {
        clearSelection();
      }
    });

    const initialTransform = d3.zoomIdentity
      .translate(viewport.x, viewport.y)
      .scale(viewport.zoom);
    
    svg.call(zoom.transform, initialTransform);

    return { svg, mainGroup, canvasWidth, canvasHeight, edgesContainer, nodesContainer };
  }, [width, height, viewport, setViewport, clearSelection]);

  const render = useCallback(() => {
    const canvasSetup = initializeCanvas();
    if (!canvasSetup) return;

    const { canvasWidth, canvasHeight, edgesContainer, nodesContainer } = canvasSetup;
    
    // Convert data to D3 format
    const d3Nodes: D3NodeData[] = visibleData.nodes.map(node => ({
      id: node.id,
      label: node.label,
      type: node.type,
      color: node.color,
      size: node.size,
      properties: node.properties,
      x: node.position?.x,
      y: node.position?.y,
      isClusterNode: (node as any).isClusterNode,
      childNodes: (node as any).childNodes
    }));

    const d3Links: D3EdgeData[] = visibleData.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      color: edge.color,
      width: edge.width,
      properties: edge.properties
    }));

    const simulation = initializeSimulation(d3Nodes, d3Links, canvasWidth, canvasHeight);
    
    setIsSimulationRunning(true);
    
    // Stop simulation after shorter time for large graphs
    const stopTime = d3Nodes.length > 100 ? 2000 : 5000;
    setTimeout(() => {
      simulation.stop();
      setIsSimulationRunning(false);
    }, stopTime);

    renderEdges(edgesContainer, d3Links, simulation);
    renderNodes(nodesContainer, d3Nodes, simulation);
    
  }, [initializeCanvas, renderEdges, renderNodes, visibleData, initializeSimulation]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const handleResize = () => {
      render();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

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
      {/* Performance mode selector */}
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
        <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#2d3748' }}>
          Performance Mode
        </div>
        <select
          value={visibilityMode}
          onChange={(e) => setVisibilityMode(e.target.value as any)}
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#4a5568'
          }}
        >
          <option value="all">Show All ({data.nodes.length} nodes)</option>
          <option value="important">Show Important ({Math.min(maxVisibleNodes, data.nodes.length)} nodes)</option>
          <option value="filtered">Show Filtered ({visibleData.nodes.length} nodes)</option>
        </select>
        
        <div style={{ 
          marginTop: '8px',
          fontSize: '10px',
          color: '#718096'
        }}>
          {isSimulationRunning ? '⚡ Calculating...' : '✓ Layout stable'}
        </div>
        
        {visibleData.nodes.length !== data.nodes.length && (
          <div style={{ 
            marginTop: '4px',
            fontSize: '10px',
            color: '#e53e3e'
          }}>
            Showing {visibleData.nodes.length} of {data.nodes.length} nodes
          </div>
        )}
      </div>

      {/* Cluster info */}
      {expandedClusters.size > 0 && (
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
          fontSize: '11px',
          color: '#4a5568'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            Expanded Clusters: {expandedClusters.size}
          </div>
          <button
            onClick={() => setExpandedClusters(new Set())}
            style={{
              fontSize: '10px',
              padding: '4px 8px',
              backgroundColor: '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Collapse All
          </button>
        </div>
      )}

      <svg
        ref={svgRef}
        className="graph-canvas"
        style={{ 
          width: '100%', 
          height: '100%', 
          background: '#fafafa',
          borderRadius: '8px'
        }}
      />
    </div>
  );
}