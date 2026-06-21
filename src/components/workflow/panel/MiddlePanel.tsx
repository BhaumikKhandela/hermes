import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import RightPanel from "./RightPanel";
import { Tabs } from "./Tabs";
import ExecutePanel from "./execute/ExecutePanel";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/stores";

import {
  addNodeFromPalette,
  handleAutoConnect,
  onEdgesChange,
  onNodesChange,
  setSelectedNode,
} from "@/stores/agentBuilderSlice";
import { nodeTypes } from "@/components/custom-nodes/nodesTypes";
import { ToolConfigSheet } from "./ToolConfigSheet";

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

  useEffect(() => {
    if (nodes.length === 0) return;

    const timer = setTimeout(() => {
      dispatch(handleAutoConnect());
    }, 2000);

    return () => clearTimeout(timer);
  }, [nodes, dispatch]);

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col relative bg-slate-50">
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
              <div className="w-full h-full rounded-lg overflow-hidden bg-white border border-slate-200">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onNodeDoubleClick={handleNodeDoubleClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                fitView
                proOptions={{ hideAttribution: true }}
              >
                <Controls />

                <MiniMap pannable zoomable />

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
          className="absolute right-0 top-14 z-20 bg-red-500 text-white p-1.5 hover:bg-red-600 transition"
          style={{
            borderRadius: isRightPanelOpen ? "0 4px 4px 0" : "4px 0 0 4px",
          }}
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
