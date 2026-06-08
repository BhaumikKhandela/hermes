"use client";

import { Loader2Icon, Save, SidebarIcon } from "lucide-react";
import UpdateProjectTitle from "./UpdateProjectTitle";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/stores";
import { useState } from "react";
import { makeHttpReq } from "@/helper/makeHttpReq";
import { toast } from "sonner";

type CanvasHeaderProps = {
  isChatOpen: boolean;
  setIsChatOpen: (value: boolean) => void;
  projectId: string;
  userId: string;
};

export default function CanvasHeader({
  isChatOpen,
  setIsChatOpen,
  projectId,
  userId,
}: CanvasHeaderProps) {
  const dispatch = useDispatch<AppDispatch>();

  const { agentTree } = useSelector((state: RootState) => state.agentTree);
  const { nodes, edges } = useSelector((state: RootState) => state.builder);

  const [loading, setLoading] = useState(false);

  async function saveCanvasData() {
    const data = {
      userId,
      projectId,
      agent_edges: edges,
      agent_nodes: nodes,
      agentTree,
    };

    try {
      setLoading(true);
      const res = await makeHttpReq<typeof data, { message: string }>(
        "POST",
        "agent/agent-tree",
        { ...data },
      );

      setLoading(false);
      toast.success(res.message || "Workflow saved successfully");
    } catch (error) {
      setLoading(false);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occured while saving the workflow",
      );
    }
  }

  return (
    <header className="h-14 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`p-1.5 rounded-md transition ${
            isChatOpen
              ? "text-slate-500 hover:bg-slate-100"
              : "text-blue-600 bg-blue-100 hover:bg-blue-200"
          }`}
          title={isChatOpen ? "Close Chat" : "Open Chat"}
        >
          <SidebarIcon size={18} />
        </button>

        <UpdateProjectTitle
          projectId={projectId}
          initialTitle={"Untitled Project"}
        />
      </div>

      <div className="flex items-center gap-3 text-slate-600">
        <button
          onClick={() => saveCanvasData()}
          className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 active:scale-95 transition"
          title="Save"
        >
          {loading ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <Save size={18} className="fill-current" />
          )}
        </button>
      </div>
    </header>
  );
}
