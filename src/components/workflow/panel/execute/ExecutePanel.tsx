"use client";

import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

type RunStatus = "idle" | "queuing" | "queued" | "failed";

type RunResult = {
  runId: string;
  status: string;
  error?: string;
};

const ExecutePanel = ({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) => {
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [result, setResult] = useState<RunResult | null>(null);

  const handleRun = async () => {
    setRunStatus("queuing");
    setResult(null);

    try {
      const res = await fetch("/api/workflow/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, userId }),
      });

      const data: RunResult = await res.json();

      if (!res.ok) {
        setRunStatus("failed");
        setResult({ runId: "", status: "failed", error: data.error || "Request failed" });
        return;
      }

      setRunStatus("queued");
      setResult(data);
    } catch (err: any) {
      setRunStatus("failed");
      setResult({ runId: "", status: "failed", error: err.message });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">
            Execute Workflow
          </h2>
          <p className="text-sm text-slate-500 max-w-md">
            {runStatus === "idle"
              ? "Run your configured agents and tasks."
              : runStatus === "queuing"
                ? "Queuing workflow..."
                : runStatus === "queued"
                  ? "Workflow queued for execution."
                  : "Failed to queue workflow."}
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={runStatus === "queuing"}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition
            ${runStatus === "failed" ? "bg-red-500 text-white" : "bg-red-500 text-white hover:bg-red-600"}
            ${runStatus === "queuing" ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          {runStatus === "queuing" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Play size={18} />
          )}
          {runStatus === "idle" && "Run Workflow"}
          {runStatus === "queuing" && "Queuing..."}
          {runStatus === "queued" && "Run Again"}
          {runStatus === "failed" && "Retry"}
        </button>

        {result && (
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {runStatus === "queued" ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <XCircle size={16} className="text-red-500" />
              )}
              <span className="font-medium">Workflow {result.status}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Run ID</span>
              <span className="font-mono">{result.runId.slice(0, 12)}...</span>
            </div>
            {result.error && (
              <div className="text-red-500 text-xs mt-2">{result.error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutePanel;
