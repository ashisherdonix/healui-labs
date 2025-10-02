# D3.js Force-Directed Graph Components

This project uses D3.js for graph visualization, specifically implementing force-directed graphs with interactive features like drag-and-drop and zoom capabilities.

## Components

### D3ForceGraph.tsx
The main force-directed graph component with full interactivity:

**Features:**
- Force-directed layout using D3.js physics simulation
- Drag-and-drop nodes to reposition them
- Zoom and pan using mouse scroll and drag
- Click to select nodes (with multi-select using Ctrl/Cmd)
- Keyboard shortcuts (R to reset zoom, Esc to clear selection)
- Color-coded nodes by type
- Real-time stats display

**Usage:**
```tsx
import D3ForceGraph from '@/components/D3ForceGraph';

<D3ForceGraph width={800} height={600} />
```

### ForceDirectedGraph.tsx
A simplified, minimal force-directed graph implementation:

**Features:**
- Basic force simulation
- Drag-and-drop functionality
- Zoom capabilities
- Automatic layout calculation

**Usage:**
```tsx
import ForceDirectedGraph from '@/components/ForceDirectedGraph';

<ForceDirectedGraph />
```

## D3.js Forces Used

1. **Force Link** - Creates links between connected nodes
   ```js
   d3.forceLink(links).id(d => d.id).distance(100)
   ```

2. **Force Many-Body** - Nodes repel each other
   ```js
   d3.forceManyBody().strength(-300)
   ```

3. **Force Center** - Pulls nodes toward the center
   ```js
   d3.forceCenter(width / 2, height / 2)
   ```

4. **Force Collision** - Prevents node overlap
   ```js
   d3.forceCollide().radius(30)
   ```

## Interactive Features

### Drag-and-Drop
Implemented using D3's drag behavior:
- Start: Fix node position and restart simulation
- Drag: Update node position to cursor
- End: Release node and let simulation continue

### Zoom
Implemented using D3's zoom behavior:
- Scroll: Zoom in/out
- Pan: Click and drag on background
- Scale limits: 0.1x to 10x

## Performance Considerations

For large graphs (>1000 nodes):
- Use `GraphCanvasOptimized.tsx` with clustering
- Adjust force strengths for better performance
- Consider implementing node/edge filtering
- Use Canvas instead of SVG for very large datasets

## Customization

### Node Appearance
```js
const colors = {
  condition: '#ff6b6b',
  exercise: '#4ecdc4',
  equipment: '#45b7d1',
  metric: '#f39c12'
};
```

### Force Parameters
Adjust these for different layouts:
- Link distance: Controls edge length
- Charge strength: Controls repulsion
- Collision radius: Controls node spacing

## Data Format

The graph expects data in this format:
```typescript
{
  nodes: [
    { id: '1', label: 'Node 1', type: 'condition' },
    // ...
  ],
  edges: [
    { id: 'e1', source: '1', target: '2', type: 'treats' },
    // ...
  ]
}
```