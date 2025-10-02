'use client';

import { useState } from 'react';
import useGraphStore from '@/store/graphStore';

export default function GraphControls() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    data,
    selection,
    clearSelection,
    selectAll,
    resetViewport 
  } = useGraphStore();

  const [layoutConfig, setLayoutConfig] = useState({
    algorithm: 'force-directed',
    strength: 0.6,
    distance: 120,
    clustering: false
  });

  const handleLayoutChange = (algorithm: string) => {
    setLayoutConfig(prev => ({ ...prev, algorithm }));
    // This would trigger a re-layout in a real implementation
  };

  const nodeCount = data.nodes.length;
  const edgeCount = data.edges.length;
  const selectedCount = selection.selectedNodeIds.size + selection.selectedEdgeIds.size;

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      minWidth: '200px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div 
        style={{
          padding: '16px',
          borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '2px' }}>
            Graph Controls
          </div>
          <div style={{ fontSize: '11px', color: '#718096' }}>
            {nodeCount} nodes, {edgeCount} edges
          </div>
        </div>
        <div style={{
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          fontSize: '12px'
        }}>
          ▼
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ padding: '16px' }}>
          {/* Layout algorithms */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#4a5568' }}>
              Layout Algorithm
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { key: 'force-directed', label: 'Force Directed' },
                { key: 'hierarchical', label: 'Hierarchical' },
                { key: 'circular', label: 'Circular' },
                { key: 'grid', label: 'Grid' }
              ].map(({ key, label }) => (
                <label key={key} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="layout"
                    value={key}
                    checked={layoutConfig.algorithm === key}
                    onChange={() => handleLayoutChange(key)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ color: '#4a5568' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Force settings */}
          {layoutConfig.algorithm === 'force-directed' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: '#4a5568' }}>
                Force Settings
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '10px', color: '#718096' }}>
                  Link Strength: {layoutConfig.strength}
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={layoutConfig.strength}
                    onChange={(e) => setLayoutConfig(prev => ({ ...prev, strength: parseFloat(e.target.value) }))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
                <label style={{ fontSize: '10px', color: '#718096' }}>
                  Link Distance: {layoutConfig.distance}px
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={layoutConfig.distance}
                    onChange={(e) => setLayoutConfig(prev => ({ ...prev, distance: parseInt(e.target.value) }))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Clustering */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '11px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={layoutConfig.clustering}
                onChange={(e) => setLayoutConfig(prev => ({ ...prev, clustering: e.target.checked }))}
                style={{ margin: 0 }}
              />
              <span style={{ color: '#4a5568' }}>Enable node clustering</span>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={resetViewport}
              style={{
                padding: '8px 12px',
                fontSize: '11px',
                backgroundColor: '#4299e1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Reset View
            </button>
            
            {selectedCount > 0 ? (
              <button
                onClick={clearSelection}
                style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  backgroundColor: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Clear Selection ({selectedCount})
              </button>
            ) : (
              <button
                onClick={selectAll}
                style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  backgroundColor: '#38a169',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Select All
              </button>
            )}
          </div>

          {/* Stats */}
          {selectedCount > 0 && (
            <div style={{
              marginTop: '12px',
              padding: '8px',
              backgroundColor: '#f7fafc',
              borderRadius: '6px',
              fontSize: '10px',
              color: '#4a5568'
            }}>
              <div>Selected: {selection.selectedNodeIds.size} nodes</div>
              <div>Selected: {selection.selectedEdgeIds.size} edges</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}