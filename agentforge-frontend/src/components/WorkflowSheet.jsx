import { useMemo } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import Sheet from "./Sheet.jsx";

function layoutNodes(rawNodes) {
  return rawNodes.map((node, index) => ({
    id: node.id,
    data: { label: node.label || node.id },
    position: { x: (index % 3) * 280, y: Math.floor(index / 3) * 140 },
    style: {
      background: node.id === "user" ? "#0f172a" : "#10233f",
      color: "#e2e8f0",
      border: "1px solid #3b82f6",
      borderRadius: 24,
      padding: "16px 20px",
      fontSize: 13,
      width: 230,
      textAlign: "center",
      boxShadow: "0 18px 60px rgba(15, 23, 42, 0.4)",
    },
  }));
}

function layoutEdges(rawEdges) {
  return rawEdges.map((edge, index) => ({
    id: `edge-${index}`,
    source: edge.from,
    target: edge.to,
    label: edge.condition && edge.condition !== "always" ? edge.condition : undefined,
    animated: true,
    style: { stroke: "#38bdf8" },
    labelStyle: { fill: "#94a3b8", fontSize: 11 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#38bdf8" },
  }));
}

export default function WorkflowSheet({ workflow }) {
  const nodes = useMemo(() => layoutNodes(workflow?.nodes || []), [workflow]);
  const edges = useMemo(() => layoutEdges(workflow?.edges || []), [workflow]);

  return (
    <Sheet number="03" title="Workflow" subtitle={`${edges.length} connections`}>
      {nodes.length ? (
        <div className="h-[500px] rounded-[2rem] border border-slate-800/70 bg-slate-950/90 p-3 shadow-[0_20px_90px_-50px_rgba(15,23,42,0.8)]">
          <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
            <Background color="#10233f" gap={18} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 p-6 text-sm text-slate-400">
          Workflow diagram will appear here once the backend returns nodes and edges.
        </div>
      )}
    </Sheet>
  );
}
