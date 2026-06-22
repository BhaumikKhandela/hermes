import { createMiddleware } from "langchain";
import { inngest } from "@/lib/inngest/client";

export function createRetryObservabilityMiddleware(options: {
  runId: string;
  elementId: string;
  agentLabel: string;
}) {
  return createMiddleware({
    name: `RetryObservability:${options.agentLabel}`,
    wrapModelCall: async (request, handler) => {
      const callId = crypto.randomUUID().slice(0, 8);
      const startedAt = Date.now();

      console.info("agent.model_call.started", {
        runId: options.runId,
        agentLabel: options.agentLabel,
        callId,
        timestamp: startedAt,
      });

      try {
        const result = await handler(request);
        console.info("agent.model_call.completed", {
          runId: options.runId,
          agentLabel: options.agentLabel,
          callId,
          durationMs: Date.now() - startedAt,
        });
        return result;
      } catch (error) {
        const durationMs = Date.now() - startedAt;
        const errMsg = error instanceof Error ? error.message : String(error);

        console.info("agent.model_call.failed", {
          runId: options.runId,
          elementId: options.elementId,
          agentLabel: options.agentLabel,
          callId,
          error: errMsg,
          durationMs,
        });

        void inngest
          .send({
            name: "agent/model.call.failed",
            data: {
              runId: options.runId,
              elementId: options.elementId,
              agentLabel: options.agentLabel,
              callId,
              error: errMsg,
              durationMs,
            },
          })
          .catch((e: Error) =>
            console.error("Failed to send agent/model.call.failed event", e),
          );

        throw error;
      }
    },
  });
}
