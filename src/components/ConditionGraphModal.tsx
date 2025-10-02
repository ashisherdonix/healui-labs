'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { X, Maximize2, Minimize2, Heart, Dumbbell, Wrench, BarChart3 } from 'lucide-react';
import { theme } from '@/lib/theme';

interface GraphNode {
  id: string;
  name: string;
  type: 'condition' | 'exercise' | 'equipment' | 'metric';
  group: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface ConditionGraphModalProps {
  condition: any;
  exercises: any;
  equipment: any;
  onClose: () => void;
}

interface DetailPopupData {
  type: 'exercise' | 'equipment';
  data: any;
  position: { x: number; y: number };
}

export default function ConditionGraphModal({ 
  condition, 
  exercises, 
  equipment, 
  onClose 
}: ConditionGraphModalProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [detailPopup, setDetailPopup] = useState<DetailPopupData | null>(null);

  useEffect(() => {
    if (!condition || !svgRef.current) return;

    // Build graph data
    const graphData = buildGraphData(condition, exercises, equipment);
    console.log('Graph data built:', graphData);
    
    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Set dimensions
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .on('click', () => {
        setDetailPopup(null); // Close detail popup when clicking background
      });

    // Define enterprise-grade solid colors for each node type
    const nodeColors = {
      condition: '#1e40af', // Professional blue
      exercise: '#059669',   // Medical green
      equipment: '#dc2626',  // Equipment red
      metric: '#7c3aed'      // Analytics purple
    };

    // Create simulation
    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force('link', d3.forceLink(graphData.links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Create link elements
    const link = svg.append('g')
      .selectAll('line')
      .data(graphData.links)
      .enter().append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.8);

    // Create node groups
    const node = svg.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .enter().append('g')
      .call(d3.drag<any, any>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded));

    // Add circles to nodes
    node.append('circle')
      .attr('r', (d: any) => d.type === 'condition' ? 40 : 30)
      .attr('fill', (d: any) => nodeColors[d.type as keyof typeof nodeColors] || theme.colors.gray[500])
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', (d: any) => d.type === 'condition' ? 45 : 35);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', (d: any) => d.type === 'condition' ? 40 : 30);
      })
      .on('click', function(event, d: any) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Node clicked:', d.type, d.id, d.name);
        console.log('Available exercises keys:', Object.keys(exercises).slice(0, 5));
        console.log('Available equipment keys:', Object.keys(equipment).slice(0, 5));
        
        if (d.type === 'exercise' || d.type === 'equipment') {
          const entityData = d.type === 'exercise' ? exercises[d.id] : equipment[d.id];
          console.log('Entity data found:', entityData);
          
          // Always show popup even if no detailed data is found
          const popupData = {
            type: d.type as 'exercise' | 'equipment',
            data: {
              id: d.id,
              name: d.name,
              ...(entityData || {})
            },
            position: { x: 0, y: 0 } // Position not used for top-left
          };
          
          console.log('Setting popup data:', popupData);
          setDetailPopup(popupData);
        }
      });

    // Add labels  
    node.append('text')
      .text((d: any) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => d.type === 'condition' ? 55 : 45)
      .style('font-size', (d: any) => d.type === 'condition' ? '14px' : '12px')
      .style('font-weight', (d: any) => d.type === 'condition' ? 'bold' : 'normal')
      .style('fill', theme.colors.primary[900])
      .style('pointer-events', 'none');

    // Add SVG icons using foreignObject
    node.append('foreignObject')
      .attr('x', -12)
      .attr('y', -12)
      .attr('width', 24)
      .attr('height', 24)
      .style('pointer-events', 'none')
      .append('xhtml:div')
      .style('width', '24px')
      .style('height', '24px')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .html((d: any) => {
        const iconColor = 'white';
        switch(d.type) {
          case 'condition':
            return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
          case 'exercise':
            return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"></path><path d="m21 21-1-1"></path><path d="m3 3 1 1"></path><path d="m18 22 4-4"></path><path d="m2 6 4-4"></path><path d="m3 10 7-7"></path><path d="m14 21 7-7"></path></svg>`;
          case 'equipment':
            return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;
          case 'metric':
            return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>`;
          default:
            return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;
        }
      });

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragStarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragEnded(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [condition, exercises, equipment]);

  const buildGraphData = (condition: any, exercises: any, equipment: any): GraphData => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map();

    // Add condition as central node
    const conditionNode: GraphNode = {
      id: condition.id,
      name: condition.name,
      type: 'condition',
      group: 1
    };
    nodes.push(conditionNode);
    nodeMap.set(condition.id, conditionNode);

    // Add exercises
    if (condition.treatment_protocol?.phases) {
      const exerciseIds = new Set<string>();
      
      condition.treatment_protocol.phases.forEach((phase: any) => {
        if (phase.exercises) {
          phase.exercises.forEach((ex: any) => {
            const exId = typeof ex === 'string' ? ex : ex.exercise_id;
            if (!exerciseIds.has(exId) && exercises[exId]) {
              exerciseIds.add(exId);
              const exerciseNode: GraphNode = {
                id: exId,
                name: exercises[exId].name || exId,
                type: 'exercise',
                group: 2
              };
              nodes.push(exerciseNode);
              nodeMap.set(exId, exerciseNode);
              
              links.push({
                source: condition.id,
                target: exId,
                type: 'has_exercise'
              });
            }
          });
        }
      });

      // Add equipment (but don't link directly to condition)
      const equipmentIds = new Set<string>();
      
      // Collect equipment from exercises, not directly from condition
      exerciseIds.forEach(exId => {
        const exercise = exercises[exId];
        if (exercise?.equipment_required || exercise?.equipment_needed) {
          const exEquipment = exercise.equipment_required || exercise.equipment_needed;
          const equipmentList = Array.isArray(exEquipment) ? exEquipment : [exEquipment];
          
          equipmentList.filter(Boolean).forEach((eqId: string) => {
            if (!equipmentIds.has(eqId) && equipment[eqId]) {
              equipmentIds.add(eqId);
              const equipmentNode: GraphNode = {
                id: eqId,
                name: equipment[eqId].name || eqId,
                type: 'equipment',
                group: 3
              };
              nodes.push(equipmentNode);
              nodeMap.set(eqId, equipmentNode);
              
              // Note: We'll link equipment to exercises below, not to condition
            }
          });
        }
      });

      // Add exercise-equipment relationships (this was already handled above)
      exerciseIds.forEach(exId => {
        const exercise = exercises[exId];
        if (exercise?.equipment_required || exercise?.equipment_needed) {
          const exEquipment = exercise.equipment_required || exercise.equipment_needed;
          const equipmentList = Array.isArray(exEquipment) ? exEquipment : [exEquipment];
          
          equipmentList.filter(Boolean).forEach((eqId: string) => {
            if (nodeMap.has(eqId)) {
              links.push({
                source: exId,
                target: eqId,
                type: 'uses_equipment'
              });
            }
          });
        }
      });
    }

    return { nodes, links };
  };

  const handleFullScreen = () => {
    if (!isFullScreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex">
      {/* Main Graph Area - Takes full screen */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Knowledge Graph: {condition.name}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Interactive visualization showing relationships between condition, exercises, and equipment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors cursor-pointer"
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-6 h-6 text-slate-600" style={{ cursor: 'pointer' }} />
          </button>
        </div>

        {/* Graph Container - Full remaining height */}
        <div className="flex-1 bg-slate-50 relative">
          <svg ref={svgRef} className="w-full h-full" />
          
          {/* Legend - Bottom Left */}
          <div className="absolute bottom-6 left-6 bg-white rounded-xl shadow-xl border border-slate-200 p-4 max-w-xs">
            <h3 className="font-bold text-slate-900 mb-3">Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                  <Heart className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-900">Medical Condition</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                  <Dumbbell className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-900">Therapeutic Exercise</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                  <Wrench className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-900">Medical Equipment</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-600">
                Click on exercises or equipment nodes to view detailed information
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Floating Detail Popup */}
      {detailPopup && (
        <div 
          className="absolute top-24 right-6 w-80 backdrop-blur-xl bg-white/90 border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {detailPopup.type === 'exercise' ? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <Dumbbell className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
              )}
              <h3 className="font-bold text-slate-800 text-lg">
                {detailPopup.data.name || detailPopup.data.id}
              </h3>
            </div>
            <button
              onClick={() => setDetailPopup(null)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 cursor-pointer group"
              style={{ cursor: 'pointer' }}
            >
              <X className="w-4 h-4 text-slate-600 group-hover:text-slate-800 transition-colors duration-200" style={{ cursor: 'pointer' }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* ID Badge */}
            <div className="mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/40 text-slate-700 backdrop-blur-sm">
                ID: {detailPopup.data.id}
              </span>
            </div>

            {/* Information List */}
            <div className="space-y-3">
              {detailPopup.type === 'exercise' && (
                <>
                  {detailPopup.data.type && (
                    <div>
                      <dt className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Exercise Type</dt>
                      <dd className="text-sm text-slate-800 font-medium">
                        {detailPopup.data.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </dd>
                    </div>
                  )}
                  
                  {detailPopup.data.body_region && (
                    <div>
                      <dt className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Body Region</dt>
                      <dd className="text-sm text-slate-800 font-medium">
                        {detailPopup.data.body_region.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </dd>
                    </div>
                  )}
                  
                  {detailPopup.data.difficulty_level && (
                    <div>
                      <dt className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Difficulty</dt>
                      <dd className="text-sm text-slate-800 font-medium">Level {detailPopup.data.difficulty_level}</dd>
                    </div>
                  )}
                  
                  {(detailPopup.data.muscle_targets_primary || detailPopup.data.muscle_targets) && (
                    <div>
                      <dt className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Target Muscles</dt>
                      <dd className="text-sm text-slate-800">
                        {(() => {
                          let muscles = detailPopup.data.muscle_targets_primary;
                          
                          if (!muscles && detailPopup.data.muscle_targets) {
                            if (detailPopup.data.muscle_targets.primary) {
                              muscles = detailPopup.data.muscle_targets.primary;
                            } else if (Array.isArray(detailPopup.data.muscle_targets)) {
                              muscles = detailPopup.data.muscle_targets;
                            }
                          }
                          
                          if (Array.isArray(muscles) && muscles.length > 0) {
                            return (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {muscles.slice(0, 5).map((muscle, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-white/30 backdrop-blur-sm rounded-full text-xs text-slate-700">
                                    {muscle}
                                  </span>
                                ))}
                                {muscles.length > 5 && (
                                  <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs text-slate-600">
                                    +{muscles.length - 5} more
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return <span className="text-slate-600">Not specified</span>;
                        })()}
                      </dd>
                    </div>
                  )}
                  
                  {detailPopup.data.equipment_required && (
                    <div>
                      <dt className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Equipment</dt>
                      <dd className="text-sm text-slate-800">
                        {Array.isArray(detailPopup.data.equipment_required) ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {detailPopup.data.equipment_required.slice(0, 3).map((eq: any, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-white/30 backdrop-blur-sm rounded-full text-xs text-slate-700">
                                {eq}
                              </span>
                            ))}
                            {detailPopup.data.equipment_required.length > 3 && (
                              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs text-slate-600">
                                +{detailPopup.data.equipment_required.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 bg-white/30 backdrop-blur-sm rounded-full text-xs text-slate-700">
                            {detailPopup.data.equipment_required}
                          </span>
                        )}
                      </dd>
                    </div>
                  )}
                </>
              )}

              {detailPopup.type === 'equipment' && (
                <>
                  {detailPopup.data.category && (
                    <div>
                      <dt className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Category</dt>
                      <dd className="text-sm text-slate-800 font-medium">
                        {detailPopup.data.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </dd>
                    </div>
                  )}
                  
                  {detailPopup.data.cost_range && (
                    <div>
                      <dt className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Cost Range</dt>
                      <dd className="text-sm text-slate-800 font-medium">
                        {detailPopup.data.cost_range.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </dd>
                    </div>
                  )}
                  
                  {detailPopup.data.size_range && (
                    <div>
                      <dt className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Size</dt>
                      <dd className="text-sm text-slate-800 font-medium">
                        {detailPopup.data.size_range.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </dd>
                    </div>
                  )}
                  
                  {detailPopup.data.portability && (
                    <div>
                      <dt className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Portability</dt>
                      <dd className="text-sm text-slate-800 font-medium">
                        {detailPopup.data.portability.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </dd>
                    </div>
                  )}
                </>
              )}

              {/* Description */}
              {detailPopup.data.description && (
                <div>
                  <dt className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Description</dt>
                  <dd className="text-sm text-slate-700 leading-relaxed">
                    {detailPopup.data.description.length > 150 
                      ? `${detailPopup.data.description.substring(0, 150)}...` 
                      : detailPopup.data.description}
                  </dd>
                </div>
              )}

              {/* Fallback message */}
              {!detailPopup.data.type && !detailPopup.data.category && !detailPopup.data.description && (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-600">
                    Basic {detailPopup.type} node information
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}