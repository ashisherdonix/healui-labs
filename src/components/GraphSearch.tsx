'use client';

import { useState, useEffect } from 'react';
import useGraphStore from '@/store/graphStore';

export default function GraphSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  
  const { 
    data, 
    searchQuery, 
    nodeTypes, 
    edgeTypes,
    setSearchQuery, 
    setNodeTypeFilter, 
    setEdgeTypeFilter,
    clearFilters,
    selectNode,
    clearSelection
  } = useGraphStore();

  const allNodeTypes = ['condition', 'exercise', 'equipment', 'metric'];
  const allEdgeTypes = ['treats', 'requires', 'measures', 'related_to'];

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim()) {
      const results = data.nodes
        .filter(node => 
          node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (node.properties && Object.values(node.properties).some(prop => 
            String(prop).toLowerCase().includes(searchTerm.toLowerCase())
          ))
        )
        .map(node => node.id);
      
      setSearchResults(results);
      setSearchQuery(searchTerm);
    } else {
      setSearchResults([]);
      setSearchQuery('');
    }
  }, [searchTerm, data.nodes, setSearchQuery]);

  const handleNodeTypeToggle = (type: string) => {
    const newTypes = new Set(nodeTypes);
    if (newTypes.has(type as any)) {
      newTypes.delete(type as any);
    } else {
      newTypes.add(type as any);
    }
    setNodeTypeFilter(newTypes);
  };

  const handleEdgeTypeToggle = (type: string) => {
    const newTypes = new Set(edgeTypes);
    if (newTypes.has(type as any)) {
      newTypes.delete(type as any);
    } else {
      newTypes.add(type as any);
    }
    setEdgeTypeFilter(newTypes);
  };

  const handleSearchResultClick = (nodeId: string) => {
    clearSelection();
    selectNode(nodeId);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '60px',
      left: '10px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      minWidth: '280px',
      maxWidth: '320px',
      overflow: 'hidden'
    }}>
      {/* Search input */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '8px 12px'
        }}>
          <div style={{ fontSize: '14px', color: '#718096' }}>🔍</div>
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '14px',
              color: '#2d3748'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '12px',
                color: '#718096',
                cursor: 'pointer',
                padding: '0'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div style={{
            marginTop: '8px',
            maxHeight: '120px',
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            background: 'white'
          }}>
            {searchResults.slice(0, 8).map(nodeId => {
              const node = data.nodes.find(n => n.id === nodeId);
              if (!node) return null;

              const typeConfig = {
                condition: { color: '#ff6b6b', symbol: '🏥' },
                exercise: { color: '#4ecdc4', symbol: '💪' },
                equipment: { color: '#45b7d1', symbol: '🏋️' },
                metric: { color: '#f39c12', symbol: '📊' }
              };

              const config = typeConfig[node.type as keyof typeof typeConfig];

              return (
                <div
                  key={nodeId}
                  onClick={() => handleSearchResultClick(nodeId)}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #f7fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLDivElement).style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLDivElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: config?.color || '#gray',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}>
                    {config?.symbol || '●'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', color: '#2d3748' }}>
                      {node.label}
                    </div>
                    <div style={{ fontSize: '10px', color: '#718096', textTransform: 'capitalize' }}>
                      {node.type}
                    </div>
                  </div>
                </div>
              );
            })}
            {searchResults.length > 8 && (
              <div style={{
                padding: '8px 12px',
                fontSize: '10px',
                color: '#718096',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                +{searchResults.length - 8} more results
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter toggle */}
      <div
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568' }}>
          Filters
        </div>
        <div style={{
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          fontSize: '12px',
          color: '#718096'
        }}>
          ▼
        </div>
      </div>

      {/* Filter content */}
      {isExpanded && (
        <div style={{ padding: '16px' }}>
          {/* Node type filters */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              marginBottom: '8px', 
              color: '#4a5568' 
            }}>
              Node Types
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {allNodeTypes.map(type => {
                const typeConfig = {
                  condition: { color: '#ff6b6b', symbol: '🏥' },
                  exercise: { color: '#4ecdc4', symbol: '💪' },
                  equipment: { color: '#45b7d1', symbol: '🏋️' },
                  metric: { color: '#f39c12', symbol: '📊' }
                };
                const config = typeConfig[type as keyof typeof typeConfig];

                return (
                  <label
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={nodeTypes.has(type as any)}
                      onChange={() => handleNodeTypeToggle(type)}
                      style={{ margin: 0 }}
                    />
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
                    <span style={{ color: '#718096', fontSize: '10px', marginLeft: 'auto' }}>
                      ({data.nodes.filter(n => n.type === type).length})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Edge type filters */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              marginBottom: '8px', 
              color: '#4a5568' 
            }}>
              Edge Types
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {allEdgeTypes.map(type => {
                const edgeColors = {
                  treats: '#e53e3e',
                  requires: '#3182ce',
                  measures: '#38a169',
                  related_to: '#805ad5'
                };

                return (
                  <label
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={edgeTypes.has(type)}
                      onChange={() => handleEdgeTypeToggle(type)}
                      style={{ margin: 0 }}
                    />
                    <div style={{
                      width: '12px',
                      height: '2px',
                      backgroundColor: edgeColors[type as keyof typeof edgeColors],
                      borderRadius: '1px'
                    }} />
                    <span style={{ color: '#4a5568' }}>
                      {type.replace('_', ' ')}
                    </span>
                    <span style={{ color: '#718096', fontSize: '10px', marginLeft: 'auto' }}>
                      ({data.edges.filter(e => e.type === type).length})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Clear filters */}
          <button
            onClick={clearFilters}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '11px',
              backgroundColor: '#f7fafc',
              color: '#4a5568',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}