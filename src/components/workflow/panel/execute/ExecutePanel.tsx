"use client";

import { Play, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type RunStatus =
  | "idle"
  | "queuing"
  | "queued"
  | "running"
  | "completed"
  | "failed";

type RunData = {
  _id: string;
  status: string;
  input?: string;
  output?: string;
  error?: string;
  agentCount?: number;
  toolCount?: number;
  modelProvider?: string;
  modelName?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
};

const ExecutePanel = ({
  projectId,
}: {
  projectId: string;
}) => {
  const [input, setInput] = useState("");
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runData, setRunData] = useState<RunData | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

  const startPolling = useCallback(
    (runId: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/runs/${runId}`);
          if (!res.ok) {
            stopPolling();
            setRunStatus("failed");
            return;
          }
          const json = await res.json();
          const data = json.run as RunData;
          setRunData(data);

          if (data.status === "completed") {
            setRunStatus("completed");
            stopPolling();
          } else if (data.status === "failed") {
            setRunStatus("failed");
            stopPolling();
          } else if (data.status === "running") {
            setRunStatus("running");
          }
        } catch {
          stopPolling();
          setRunStatus("failed");
        }
      }, 2000);
    },
    [stopPolling],
  );

  const handleRun = async () => {
    setRunStatus("queuing");
    setRunData(null);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, input }),
      });

      if (!res.ok) {
        const err = await res.json();
        setRunStatus("failed");
        setRunData({ _id: "", status: "failed", error: err.error || "Request failed" });
        return;
      }

      const { runId } = await res.json();
      setRunStatus("queued");
      setRunData({ _id: runId, status: "queued" });
      startPolling(runId);
    } catch (err: any) {
      setRunStatus("failed");
      setRunData({ _id: "", status: "failed", error: err.message });
    }
  };

  const isRunning = runStatus === "queuing" || runStatus === "queued" || runStatus === "running";

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <div className="flex-1 flex flex-col gap-6 p-8 max-w-2xl mx-auto w-full">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">
            Execute Workflow
          </h2>
          <p className="text-sm text-slate-500">
            Enter a prompt and run your configured agents.
          </p>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Prompt
          </label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Find the latest news about AI and summarize it..."
            rows={4}
            disabled={isRunning}
            className="resize-none"
          />
        </div>

        {/* Run Button */}
        <Button
          onClick={handleRun}
          disabled={isRunning || !input.trim()}
          size="lg"
          className="w-full"
        >
          {runStatus === "queuing" && (
            <Loader2 size={18} className="animate-spin mr-2" />
          )}
          {runStatus === "idle" && <Play size={18} className="mr-2" />}
          {runStatus === "queuing" && "Queuing..."}
          {runStatus === "idle" && "Run Workflow"}
          {runStatus === "queued" && (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Queued...
            </>
          )}
          {runStatus === "running" && (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Running...
            </>
          )}
          {runStatus === "completed" && "Run Again"}
          {runStatus === "failed" && "Retry"}
        </Button>

        {/* Status */}
        {runData && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-sm">
            {/* Status header */}
            <div className="flex items-center gap-2">
              {runStatus === "completed" && (
                <CheckCircle2 size={18} className="text-green-500" />
              )}
              {runStatus === "failed" && (
                <XCircle size={18} className="text-red-500" />
              )}
              {(runStatus === "queued" || runStatus === "running") && (
                <Clock size={18} className="text-amber-500" />
              )}
              <span className="font-medium capitalize">{runData.status}</span>
            </div>

            {/* Run metadata */}
            {runData.agentCount !== undefined && (
              <div className="flex gap-4 text-xs text-slate-500">
                <span>{runData.agentCount} agent</span>
                <span>{runData.toolCount} tools</span>
                {runData.modelProvider && (
                  <span>
                    {runData.modelProvider}/{runData.modelName}
                  </span>
                )}
              </div>
            )}

            {/* Error */}
            {runData.error && (
              <div className="text-red-500 text-xs bg-red-50 rounded-lg p-3">
                {runData.error}
              </div>
            )}

            {/* Output */}
            {runData.output && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Output
                </span>
                <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-3">
                  {runData.output}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutePanel;
