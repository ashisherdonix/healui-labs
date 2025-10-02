import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

enableMapSet();
import { 
  GraphState, 
  GraphData, 
  NodeData, 
  EdgeData, 
  ViewportState, 
  SelectionState, 
  FilterState, 
  LayoutConfig,
  EntityType 
} from '@/types/graph';

interface GraphActions {
  // Data management
  setGraphData: (data: GraphData) => void;
  addNode: (node: NodeData) => void;
  updateNode: (nodeId: string, updates: Partial<NodeData>) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: EdgeData) => void;
  updateEdge: (edgeId: string, updates: Partial<EdgeData>) => void;
  removeEdge: (edgeId: string) => void;

  // Viewport management
  setViewport: (viewport: Partial<ViewportState>) => void;
  resetViewport: () => void;

  // Selection management
  selectNode: (nodeId: string, multi?: boolean) => void;
  selectEdge: (edgeId: string, multi?: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;
  isNodeSelected: (nodeId: string) => boolean;
  isEdgeSelected: (edgeId: string) => boolean;
  getSelectedNodes: () => NodeData[];
  getSelectedEdges: () => EdgeData[];

  // History management
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Filter management
  setNodeTypeFilter: (types: Set<EntityType>) => void;
  setEdgeTypeFilter: (types: Set<string>) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Layout management
  applyLayout: (config: LayoutConfig) => void;
  updateNodePosition: (nodeId: string, x: number, y: number) => void;

  // Utility
  setLoading: (loading: boolean) => void;
  setDirty: (dirty: boolean) => void;
  getNodeById: (nodeId: string) => NodeData | undefined;
  getEdgeById: (edgeId: string) => EdgeData | undefined;
  getConnectedEdges: (nodeId: string) => EdgeData[];
  getNeighborNodes: (nodeId: string) => NodeData[];
}

const initialViewport: ViewportState = {
  x: 0,
  y: 0,
  zoom: 1
};

const initialSelection: SelectionState = {
  selectedNodeIds: new Set(),
  selectedEdgeIds: new Set(),
  selectionMode: 'single'
};

const initialFilter: FilterState = {
  nodeTypes: new Set(['condition', 'exercise', 'equipment', 'metric']),
  edgeTypes: new Set(['treats', 'requires', 'measures', 'related_to']),
  searchQuery: '',
  propertyFilters: []
};

const initialGraphData: GraphData = {
  nodes: [],
  edges: [],
  metadata: {
    version: '1.0.0',
    created: new Date(),
    modified: new Date(),
    schema: {
      nodeTypes: {
        condition: { displayName: 'Condition', color: '#ff6b6b', properties: {} },
        exercise: { displayName: 'Exercise', color: '#4ecdc4', properties: {} },
        equipment: { displayName: 'Equipment', color: '#45b7d1', properties: {} },
        metric: { displayName: 'Metric', color: '#f39c12', properties: {} }
      },
      edgeTypes: {}
    }
  }
};

const useGraphStore = create<GraphState & FilterState & GraphActions>()(
  immer((set, get) => ({
    // Initial state
    data: initialGraphData,
    viewport: initialViewport,
    selection: initialSelection,
    isLoading: false,
    isDirty: false,
    history: [initialGraphData],
    historyIndex: 0,
    
    // Filter state
    nodeTypes: initialFilter.nodeTypes,
    edgeTypes: initialFilter.edgeTypes,
    searchQuery: initialFilter.searchQuery,
    propertyFilters: initialFilter.propertyFilters,

    // Data management actions
    setGraphData: (data) => set((state) => {
      state.data = data;
      state.history = [data];
      state.historyIndex = 0;
      state.isDirty = false;
    }),

    addNode: (node) => set((state) => {
      state.data.nodes.push(node);
      state.isDirty = true;
    }),

    updateNode: (nodeId, updates) => set((state) => {
      const nodeIndex = state.data.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex !== -1) {
        Object.assign(state.data.nodes[nodeIndex], updates);
        state.isDirty = true;
      }
    }),

    removeNode: (nodeId) => set((state) => {
      state.data.nodes = state.data.nodes.filter(n => n.id !== nodeId);
      state.data.edges = state.data.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
      state.selection.selectedNodeIds.delete(nodeId);
      state.isDirty = true;
    }),

    addEdge: (edge) => set((state) => {
      state.data.edges.push(edge);
      state.isDirty = true;
    }),

    updateEdge: (edgeId, updates) => set((state) => {
      const edgeIndex = state.data.edges.findIndex(e => e.id === edgeId);
      if (edgeIndex !== -1) {
        Object.assign(state.data.edges[edgeIndex], updates);
        state.isDirty = true;
      }
    }),

    removeEdge: (edgeId) => set((state) => {
      state.data.edges = state.data.edges.filter(e => e.id !== edgeId);
      state.selection.selectedEdgeIds.delete(edgeId);
      state.isDirty = true;
    }),

    // Viewport management
    setViewport: (viewport) => set((state) => {
      Object.assign(state.viewport, viewport);
    }),

    resetViewport: () => set((state) => {
      state.viewport = initialViewport;
    }),

    // Selection management
    selectNode: (nodeId, multi = false) => set((state) => {
      if (!multi) {
        state.selection.selectedNodeIds.clear();
        state.selection.selectedEdgeIds.clear();
      }
      state.selection.selectedNodeIds.add(nodeId);
      state.selection.lastSelected = nodeId;
    }),

    selectEdge: (edgeId, multi = false) => set((state) => {
      if (!multi) {
        state.selection.selectedNodeIds.clear();
        state.selection.selectedEdgeIds.clear();
      }
      state.selection.selectedEdgeIds.add(edgeId);
      state.selection.lastSelected = edgeId;
    }),

    clearSelection: () => set((state) => {
      state.selection.selectedNodeIds.clear();
      state.selection.selectedEdgeIds.clear();
      state.selection.lastSelected = undefined;
    }),

    selectAll: () => set((state) => {
      state.selection.selectedNodeIds.clear();
      state.selection.selectedEdgeIds.clear();
      state.data.nodes.forEach(node => state.selection.selectedNodeIds.add(node.id));
      state.data.edges.forEach(edge => state.selection.selectedEdgeIds.add(edge.id));
    }),

    isNodeSelected: (nodeId) => get().selection.selectedNodeIds.has(nodeId),
    isEdgeSelected: (edgeId) => get().selection.selectedEdgeIds.has(edgeId),

    getSelectedNodes: () => {
      const state = get();
      return state.data.nodes.filter(node => state.selection.selectedNodeIds.has(node.id));
    },

    getSelectedEdges: () => {
      const state = get();
      return state.data.edges.filter(edge => state.selection.selectedEdgeIds.has(edge.id));
    },

    // History management
    saveToHistory: () => set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(state.data)));
      
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        state.historyIndex++;
      }
      
      state.history = newHistory;
    }),

    undo: () => set((state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        state.data = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
      }
    }),

    redo: () => set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        state.data = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
      }
    }),

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    // Filter management
    setNodeTypeFilter: (types) => set((state) => {
      state.nodeTypes = types;
    }),

    setEdgeTypeFilter: (types) => set((state) => {
      state.edgeTypes = types;
    }),

    setSearchQuery: (query) => set((state) => {
      state.searchQuery = query;
    }),

    clearFilters: () => set((state) => {
      state.nodeTypes = initialFilter.nodeTypes;
      state.edgeTypes = initialFilter.edgeTypes;
      state.searchQuery = '';
      state.propertyFilters = [];
    }),

    // Layout management
    applyLayout: (config) => {
      // This will be implemented when we create the layout algorithms
      console.log('Applying layout:', config);
    },

    updateNodePosition: (nodeId, x, y) => set((state) => {
      const node = state.data.nodes.find(n => n.id === nodeId);
      if (node) {
        if (!node.position) node.position = { x: 0, y: 0 };
        node.position.x = x;
        node.position.y = y;
      }
    }),

    // Utility actions
    setLoading: (loading) => set((state) => {
      state.isLoading = loading;
    }),

    setDirty: (dirty) => set((state) => {
      state.isDirty = dirty;
    }),

    getNodeById: (nodeId) => {
      return get().data.nodes.find(node => node.id === nodeId);
    },

    getEdgeById: (edgeId) => {
      return get().data.edges.find(edge => edge.id === edgeId);
    },

    getConnectedEdges: (nodeId) => {
      return get().data.edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
    },

    getNeighborNodes: (nodeId) => {
      const state = get();
      const connectedEdges = state.data.edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
      const neighborIds = connectedEdges.map(edge => edge.source === nodeId ? edge.target : edge.source);
      return state.data.nodes.filter(node => neighborIds.includes(node.id));
    }
  }))
);

export default useGraphStore;