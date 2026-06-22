import { createMiddleware } from "langchain";
import { inngest } from "@/lib/inngest/client";

export function createRetriesExhaustedMiddleware(options: {
  runId: string;
  elementId: string;
  agentLabel: string;
}) {
  return createMiddleware({
    name: `RetriesExhausted:${options.agentLabel}`,
    wrapModelCall: async (request, handler) => {
      try {
        return await handler(request);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);

        console.info("agent.model.retries_exhausted", {
          runId: options.runId,
          elementId: options.elementId,
          agentLabel: options.agentLabel,
          error: errMsg,
        });

        void inngest
          .send({
            name: "agent/model.retries_exhausted",
            data: {
              runId: options.runId,
              elementId: options.elementId,
              agentLabel: options.agentLabel,
              error: errMsg,
            },
          })
          .catch((e: Error) =>
            console.error(
              "Failed to send agent/model.retries_exhausted event",
              e,
            ),
          );

        throw error;
      }
    },
  });
}
