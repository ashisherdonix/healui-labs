export type EntityType = 'condition' | 'exercise' | 'equipment' | 'metric';

export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  id: string;
  label: string;
  type: EntityType;
  properties: Record<string, any>;
  position?: Position;
  size?: number;
  color?: string;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  type: string;
  properties?: Record<string, any>;
  weight?: number;
  color?: string;
  width?: number;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

export interface GraphMetadata {
  version: string;
  created: Date;
  modified: Date;
  name?: string;
  description?: string;
  schema: GraphSchema;
}

export interface GraphSchema {
  nodeTypes: {
    [key in EntityType]: {
      displayName: string;
      color: string;
      icon?: string;
      properties: Record<string, PropertySchema>;
    };
  };
  edgeTypes: Record<string, {
    displayName: string;
    color: string;
    properties?: Record<string, PropertySchema>;
  }>;
}

export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required?: boolean;
  displayName?: string;
  description?: string;
  options?: string[];
}

export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
  metadata: GraphMetadata;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface SelectionState {
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
  lastSelected?: string;
  selectionMode: 'single' | 'multiple';
}

export interface GraphState {
  data: GraphData;
  viewport: ViewportState;
  selection: SelectionState;
  isLoading: boolean;
  isDirty: boolean;
  history: GraphData[];
  historyIndex: number;
}

export interface LayoutConfig {
  type: 'force' | 'hierarchical' | 'circular' | 'grid' | 'manual';
  strength?: number;
  distance?: number;
  iterations?: number;
  nodeSpacing?: number;
  levelSeparation?: number;
}

export interface FilterState {
  nodeTypes: Set<EntityType>;
  edgeTypes: Set<string>;
  searchQuery: string;
  propertyFilters: Array<{
    property: string;
    operator: 'equals' | 'contains' | 'greater' | 'less';
    value: any;
  }>;
}

export interface GraphAnalysis {
  nodeCount: number;
  edgeCount: number;
  density: number;
  connectedComponents: number;
  averageDegree: number;
  centralityMeasures?: {
    [nodeId: string]: {
      degree: number;
      betweenness?: number;
      closeness?: number;
      eigenvector?: number;
    };
  };
}

export interface GraphExportOptions {
  format: 'json' | 'csv' | 'graphml' | 'cypher' | 'rdf';
  includeMetadata: boolean;
  includePositions: boolean;
  selectedOnly?: boolean;
}