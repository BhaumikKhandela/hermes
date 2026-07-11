import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import RightPanel from "./RightPanel";
import { Tabs } from "./Tabs";
import ExecutePanel from "./execute/ExecutePanel";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/stores";

import {
  addNodeFromPalette,
  clearDeletedEdgeKey,
  handleAutoConnect,
  onEdgesChange,
  onNodesChange,
  setSelectedNode,
} from "@/stores/agentBuilderSlice";
import { nodeTypes } from "@/components/custom-nodes/nodesTypes";
import { edgeTypes } from "@/components/edges/edgeTypes";
import { ToolConfigSheet } from "./ToolConfigSheet";
import { toast } from "sonner";

function wouldCreateCycle(
  source: string,
  target: string,
  existingEdges: { source: string; target: string }[],
): boolean {
  const visited = new Set<string>();
  const stack = [target];
  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    if (nodeId === source) return true;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    for (const e of existingEdges) {
      if (e.source === nodeId) stack.push(e.target);
    }
  }
  return false;
}

export const MiddlePanel = ({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) => {
  const [activeTab, setActiveTab] = useState("Visual Editor");
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const dispatch = useDispatch<AppDispatch>();
  const reactFlowInstance = useReactFlow();

  const { nodes, edges } = useSelector((state: RootState) => state.builder);
  const hasAutoConnected = useRef(false);
  const lastToastTime = useRef(0);

  const isValidConnection = useCallback(
    (connection: any) => {
      const { source, target, sourceHandle, targetHandle } = connection;

      if (source === target) {
        const now = Date.now();
        if (now - lastToastTime.current > 2000) {
          lastToastTime.current = now;
          toast.error("Cannot connect a node to itself");
        }
        return false;
      }

      if (sourceHandle === "out" && targetHandle !== "in") {
        const now = Date.now();
        if (now - lastToastTime.current > 2000) {
          lastToastTime.current = now;
          toast.error("Sequential connections must use right → left handles");
        }
        return false;
      }

      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);

      if (sourceHandle === "tools" && targetNode?.type === "agent") {
        const now = Date.now();
        if (now - lastToastTime.current > 2000) {
          lastToastTime.current = now;
          toast.error("Agent tools handle cannot connect to another agent");
        }
        return false;
      }

      if (sourceHandle === "tools" && targetHandle !== "tool_in" && targetHandle !== "in") {
        const now = Date.now();
        if (now - lastToastTime.current > 2000) {
          lastToastTime.current = now;
          toast.error("Tool connections must use bottom → top handles");
        }
        return false;
      }

      if (sourceHandle === "tool_in") {
        const now = Date.now();
        if (now - lastToastTime.current > 2000) {
          lastToastTime.current = now;
          toast.error("Tool input handle cannot be a source");
        }
        return false;
      }

      if (!sourceNode || !targetNode) return false;

      if (
        targetNode.type === "triggerNode" ||
        targetNode.type === "inputNode"
      ) {
        const now = Date.now();
        if (now - lastToastTime.current > 2000) {
          lastToastTime.current = now;
          toast.error("Trigger/input nodes cannot receive connections");
        }
        return false;
      }

      if (targetNode.type === "modelNode" && sourceHandle !== "tools") {
        const now = Date.now();
        if (now - lastToastTime.current > 2000) {
          lastToastTime.current = now;
          toast.error("Model nodes can only receive tool connections");
        }
        return false;
      }

      // Tool nodes can be sequential (in/out) or tool (tool_in), not both
      const isToolTarget = targetNode.type === "tool";
      const isToolSource = sourceNode.type === "tool";

      if (isToolTarget && targetHandle === "tool_in") {
        const hasSequentialEdge = edges.some(
          (e) =>
            (e.source === target && e.sourceHandle === "out") ||
            (e.target === target && e.targetHandle === "in"),
        );
        if (hasSequentialEdge) {
          const now = Date.now();
          if (now - lastToastTime.current > 2000) {
            lastToastTime.current = now;
            toast.error("Tool already used as a sequential node");
          }
          return false;
        }
      }

      if (isToolTarget && targetHandle === "in") {
        const hasToolEdge = edges.some(
          (e) => e.target === target && e.targetHandle === "tool_in",
        );
        if (hasToolEdge) {
          const now = Date.now();
          if (now - lastToastTime.current > 2000) {
            lastToastTime.current = now;
            toast.error("Tool already assigned to an agent");
          }
          return false;
        }
      }

      if (isToolSource && sourceHandle === "out") {
        const hasToolEdge = edges.some(
          (e) => e.target === source && e.targetHandle === "tool_in",
        );
        if (hasToolEdge) {
          const now = Date.now();
          if (now - lastToastTime.current > 2000) {
            lastToastTime.current = now;
            toast.error(
              "Tool with a tool_in connection cannot be used as a sequential node",
            );
          }
          return false;
        }
      }

      if (wouldCreateCycle(source, target, edges)) {
        const now = Date.now();
        if (now - lastToastTime.current > 2000) {
          lastToastTime.current = now;
          toast.error("This connection would create a cycle");
        }
        return false;
      }

      return true;
    },
    [nodes, edges],
  );

  const handleNodesChange = useCallback(
    (changes: any) => {
      dispatch(onNodesChange(changes));
    },
    [dispatch],
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      dispatch(onEdgesChange(changes));
    },
    [dispatch],
  );

  const handleNodeDoubleClick = useCallback(
    (_event: any, node: any) => {
      dispatch(setSelectedNode(node.id));
    },
    [dispatch],
  );

  const handleConnect = useCallback(
    (params: any) => {
      const isToolConnection = params.sourceHandle === "tools" || params.targetHandle === "tool_in";
      const isSubAgentConnection = params.sourceHandle === "tools" && params.targetHandle === "in";
      const newEdge = {
        ...params,
        id: `e-${params.source}-${params.sourceHandle || "none"}-${params.target}-${params.targetHandle || "none"}-${Date.now()}`,
        animated: isSubAgentConnection,
        style: isSubAgentConnection
          ? { strokeDasharray: "6 6", stroke: "#F59E0B" }
          : isToolConnection
            ? { strokeDasharray: "6 6", stroke: "#9CA3AF" }
            : { stroke: "#5B5CEB", strokeWidth: 2 },
        markerEnd: isToolConnection
          ? undefined
          : { type: MarkerType.ArrowClosed, color: "#5B5CEB" },
      };
      dispatch(clearDeletedEdgeKey(`${params.source}:${params.sourceHandle}->${params.target}:${params.targetHandle}`));
      dispatch(onEdgesChange([{ type: "add", item: newEdge }]));
    },
    [dispatch],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeRegistry = event.dataTransfer.getData("application/node-registry");
      if (!nodeRegistry) return;
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      dispatch(addNodeFromPalette({ nodeRegistry, position }));
    },
    [dispatch, reactFlowInstance],
  );

  // Auto-connect only once — either from saved edges or generated
  useEffect(() => {
    if (nodes.length === 0) return;
    if (hasAutoConnected.current) return;
    hasAutoConnected.current = true;

    // If edges were loaded from DB, don't regenerate them
    if (edges.length > 0) return;

    const timer = setTimeout(() => {
      dispatch(handleAutoConnect());
    }, 0);

    return () => clearTimeout(timer);
  }, [nodes, dispatch]);

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col relative bg-[#F6F7FB]">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "Visual Editor" ? (
          <>
            <div
              className="flex-1 relative p-2"
              style={{
                backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              <div className="w-full h-full rounded-2xl overflow-hidden bg-white">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onNodeDoubleClick={handleNodeDoubleClick}
                onConnect={handleConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                isValidConnection={isValidConnection}
                fitView
                proOptions={{ hideAttribution: true }}
              >
                <Controls className="!rounded-xl !border-[#E7E7E7] !shadow-[0_1px_2px_rgba(0,0,0,0.04)]" />

                <MiniMap
                  pannable
                  zoomable
                  className="!rounded-xl !border-[#E7E7E7] !shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  maskColor="rgba(246,247,251,0.85)"
                  nodeColor="#5B5CEB"
                  nodeStrokeColor="#D1D5DB"
                  style={{ background: "#fff" }}
                />

                <Background
                  variant={BackgroundVariant.Dots}
                  gap={16}
                  size={1}
                />
              </ReactFlow>
            </div>
          </div>
          <ToolConfigSheet />
          </>
        ) : (
          <ExecutePanel projectId={projectId} />
        )}

        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className={`absolute right-0 top-14 z-20 text-white p-1.5 transition bg-[#5B5CEB] hover:bg-[#4C4DDA] ${isRightPanelOpen ? "rounded-l-xl" : "rounded-r-xl"}`}
        >
          {isRightPanelOpen ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>
      </div>

      <RightPanel
        isRightPanelOpen={isRightPanelOpen}
        setIsRightPanelOpen={setIsRightPanelOpen}
      />
    </div>
  );
};
