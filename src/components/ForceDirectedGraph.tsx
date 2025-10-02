'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import useGraphStore from '@/store/graphStore';

export default function ForceDirectedGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { data } = useGraphStore();

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    // Dimensions
    const width = window.innerWidth;
    const height = window.innerHeight - 100;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .attr('width', width)
      .attr('height', height);

    // Create simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.edges)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Create container group
    const g = svg.append('g');

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(data.edges)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', 10)
      .attr('fill', (d: any) => {
        const colors: any = {
          condition: '#ff6b6b',
          exercise: '#4ecdc4',
          equipment: '#45b7d1',
          metric: '#f39c12'
        };
        return colors[d.type] || '#69b3a2';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'move');

    // Add node labels
    const labels = g.append('g')
      .selectAll('text')
      .data(data.nodes)
      .join('text')
      .text((d: any) => d.label)
      .attr('font-size', 12)
      .attr('dx', 15)
      .attr('dy', 4);

    // Add drag behavior
    const drag = d3.drag()
      .on('start', (event: any, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: any, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: any, d: any) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag as any);

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data]);

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />;
}