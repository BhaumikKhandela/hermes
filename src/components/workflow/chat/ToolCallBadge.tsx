import { CheckCircle2, Loader2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ToolCall {
  tool_name: string;
  status: "started" | "completed" | "failed";
}

interface ToolCallBadgeProps {
  toolCalls: ToolCall[];
}

export default function ToolCallBadge({ toolCalls }: ToolCallBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  const running = toolCalls.find((t) => t.status === "started");
  const latest = toolCalls[toolCalls.length - 1];

  if (toolCalls.length === 0) return null;

  const currentTool = running || latest;
  const isRunning = !!running;

  return (
    <div className="py-2 rounded-xl px-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800 w-full text-left"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        )}
        {isRunning ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
        )}
        {isRunning
          ? `Running ${currentTool.tool_name}...`
          : `${toolCalls.length} ${toolCalls.length === 1 ? "tool" : "tools"} completed`}
        <span className="text-slate-400 ml-auto text-[10px]">
          {toolCalls.filter((t) => t.status === "completed" || t.status === "failed").length}
          /{toolCalls.length}
        </span>
      </button>

      {expanded && (
        <div className="mt-1.5 ml-6 space-y-1">
          {toolCalls.map((tc, i) => {
            const icon =
              tc.status === "started" ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-500 shrink-0" />
              ) : tc.status === "completed" ? (
                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
              ) : (
                <XCircle className="w-3 h-3 text-red-500 shrink-0" />
              );
            return (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                {icon}
                <span>{tc.tool_name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}