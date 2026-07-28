import { useState, useEffect, useCallback } from "react";
import ReactFlow, { 
  Background, 
  Controls, 
  MarkerType, 
  Handle, 
  Position, 
  useNodesState, 
  useEdgesState, 
  addEdge 
} from "reactflow";
import "reactflow/dist/style.css";
import Sheet from "./Sheet.jsx";

// Custom Workflow Node component
function CustomWorkflowNode({ data }) {
  const isUser = data.isUser;
  const isOutput = data.isOutput;
  
  let borderColor = "border-slate-855";
  let badgeColor = "text-sky-400 bg-sky-500/10 border-sky-500/20";
  let badgeLabel = "Agent Unit";
  
  if (isUser) {
    borderColor = "border-emerald-500/30 shadow-[0_0_15px_-4px_rgba(52,211,153,0.2)]";
    badgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    badgeLabel = "User Trigger";
  } else if (isOutput) {
    borderColor = "border-indigo-500/30 shadow-[0_0_15px_-4px_rgba(99,102,241,0.2)]";
    badgeColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
    badgeLabel = "Asset Output";
  }

  return (
    <div className={`glass-panel rounded-2xl px-5 py-3.5 text-left min-w-[180px] border ${borderColor}`}>
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          background: isUser ? '#10b981' : isOutput ? '#818cf8' : '#38bdf8', 
          width: '7px', 
          height: '7px',
          border: 'none'
        }} 
      />
      <div className="flex flex-col gap-1">
        <span className={`inline-block font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeColor} w-max`}>
          {badgeLabel}
        </span>
        <div className="text-xs font-semibold mt-1.5 text-slate-200">{data.label}</div>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          background: isUser ? '#10b981' : isOutput ? '#818cf8' : '#38bdf8', 
          width: '7px', 
          height: '7px',
          border: 'none'
        }} 
      />
    </div>
  );
}

const nodeTypes = {
  customNode: CustomWorkflowNode
};

function initialLayout(rawNodes, rawEdges) {
  if (rawNodes.length === 0) return [];
  
  const adj = {};
  const inDegrees = {};
  rawNodes.forEach(node => {
    adj[node.id] = [];
    inDegrees[node.id] = 0;
  });

  rawEdges.forEach(edge => {
    if (adj[edge.from] && adj[edge.to] !== undefined) {
      adj[edge.from].push(edge.to);
      inDegrees[edge.to]++;
    }
  });

  const levels = {};
  const visited = new Set();
  const queue = [];

  let starts = rawNodes.filter(n => n.id === "user");
  if (starts.length === 0) {
    starts = rawNodes.filter(n => inDegrees[n.id] === 0);
  }
  if (starts.length === 0 && rawNodes.length > 0) {
    starts = [rawNodes[0]];
  }

  starts.forEach(node => {
    levels[node.id] = 0;
    visited.add(node.id);
    queue.push(node.id);
  });

  while (queue.length > 0) {
    const current = queue.shift();
    const currentLevel = levels[current];

    (adj[current] || []).forEach(neighbor => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        levels[neighbor] = currentLevel + 1;
        queue.push(neighbor);
      } else {
        if (levels[neighbor] < currentLevel + 1) {
          levels[neighbor] = currentLevel + 1;
        }
      }
    });
  }

  rawNodes.forEach(node => {
    if (levels[node.id] === undefined) {
      levels[node.id] = 0;
    }
  });

  const nodesByLevel = {};
  rawNodes.forEach(node => {
    const lvl = levels[node.id];
    if (!nodesByLevel[lvl]) {
      nodesByLevel[lvl] = [];
    }
    nodesByLevel[lvl].push(node);
  });

  const levelKeys = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);
  const layoutedNodes = [];

  let maxLevelSize = 0;
  levelKeys.forEach(lvl => {
    if (nodesByLevel[lvl].length > maxLevelSize) {
      maxLevelSize = nodesByLevel[lvl].length;
    }
  });

  levelKeys.forEach(lvl => {
    const nodesInLevel = nodesByLevel[lvl];
    const lvlSize = nodesInLevel.length;

    nodesInLevel.forEach((node, index) => {
      const x = lvl * 260 + 40;
      const totalHeight = (lvlSize - 1) * 120;
      const startY = (maxLevelSize * 120 - totalHeight) / 3;
      const y = startY + index * 120 + 40;

      layoutedNodes.push({
        id: node.id,
        type: "customNode",
        data: { 
          label: node.label || node.id,
          isUser: node.id === "user",
          isOutput: node.id.includes("output") || node.id.includes("write") || node.id.includes("code") || node.id.includes("file")
        },
        position: { x, y }
      });
    });
  });

  return layoutedNodes;
}

export default function WorkflowSheet({ workflow, onWorkflowChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [newNodeName, setNewNodeName] = useState("");
  const [selectedElement, setSelectedElement] = useState(null);

  // Load initial layout
  useEffect(() => {
    if (workflow?.nodes) {
      const layouted = initialLayout(workflow.nodes, workflow.edges || []);
      setNodes(layouted);
    }
    if (workflow?.edges) {
      const formattedEdges = (workflow.edges || []).map((edge, index) => ({
        id: `edge-${index}`,
        source: edge.from,
        target: edge.to,
        label: edge.condition && edge.condition !== "always" ? edge.condition : undefined,
        animated: true,
        style: { stroke: "#38bdf8", strokeWidth: 1.5 },
        labelStyle: { fill: "#64748b", fontSize: 9, fontFamily: 'IBM Plex Mono' },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#38bdf8" },
      }));
      setEdges(formattedEdges);
    }
  }, [workflow]);

  // Connect handler
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ 
      ...params, 
      id: `edge-${Date.now()}`,
      animated: true, 
      style: { stroke: "#38bdf8", strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#38bdf8" }
    }, eds));
  }, [setEdges]);

  // Track selection
  const onSelectionChange = useCallback(({ nodes, edges }) => {
    if (nodes.length > 0) {
      setSelectedElement({ type: "node", id: nodes[0].id });
    } else if (edges.length > 0) {
      setSelectedElement({ type: "edge", id: edges[0].id });
    } else {
      setSelectedElement(null);
    }
  }, []);

  // Add agent node
  const handleAddNode = () => {
    if (!newNodeName.trim()) return;
    const nodeId = newNodeName.trim().toLowerCase().replace(/\s+/g, "_");
    
    // Check duplication
    if (nodes.some(n => n.id === nodeId)) return;

    const newNode = {
      id: nodeId,
      type: "customNode",
      data: { label: newNodeName.trim(), isUser: false, isOutput: false },
      position: { x: 100, y: 150 }
    };
    
    setNodes((nds) => [...nds, newNode]);
    setNewNodeName("");
  };

  // Delete node or edge
  const handleDeleteSelected = () => {
    if (!selectedElement) return;
    
    if (selectedElement.type === "node") {
      setNodes((nds) => nds.filter((n) => n.id !== selectedElement.id));
      // Clean corresponding edges too
      setEdges((eds) => eds.filter((e) => e.source !== selectedElement.id && e.target !== selectedElement.id));
    } else if (selectedElement.type === "edge") {
      setEdges((eds) => eds.filter((e) => e.id !== selectedElement.id));
    }
    
    setSelectedElement(null);
  };

  // Save changes
  const handleSave = () => {
    if (onWorkflowChange) {
      const rawNodes = nodes.map(n => ({ id: n.id, label: n.data.label }));
      const rawEdges = edges.map(e => ({ from: e.source, to: e.target, condition: e.label || "always" }));
      onWorkflowChange({ nodes: rawNodes, edges: rawEdges });
    }
  };

  return (
    <Sheet number="03" title="Workflow Topology Designer" subtitle="Interactive Blueprint">
      <div className="space-y-4">
        {/* Editor Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 border border-slate-900 rounded-xl p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newNodeName}
              onChange={(e) => setNewNodeName(e.target.value)}
              placeholder="e.g. Validator Node"
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-[10px] text-white outline-none transition focus:border-sky-500"
            />
            <button
              onClick={handleAddNode}
              className="rounded-lg bg-sky-500 hover:bg-sky-400 px-3 py-1.5 font-mono text-[10px] font-bold text-slate-950 transition-all"
            >
              + Add Agent Node
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedElement && (
              <button
                onClick={handleDeleteSelected}
                className="rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white px-3 py-1.5 font-mono text-[10px] font-bold transition-all"
              >
                Delete Selected
              </button>
            )}
            <button
              onClick={handleSave}
              className="rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 px-3.5 py-1.5 font-mono text-[10px] font-bold transition-all"
            >
              Apply Visual Changes
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="h-[440px] rounded-2xl border border-slate-900 bg-slate-950/60 p-2 shadow-inner">
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            fitView 
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1e293b" gap={20} size={1} />
            <Controls className="!bg-slate-950 !border-slate-800 !text-slate-400 hover:!text-slate-100" showInteractive={true} />
          </ReactFlow>
        </div>
        <p className="text-[10px] font-mono text-slate-500">
          💡 Drag from node circles to connect agents. Click elements to select, then click Delete. Press "Apply Visual Changes" to save layout modifications to workspace.
        </p>
      </div>
    </Sheet>
  );
}
