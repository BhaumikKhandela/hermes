import { createMiddleware } from "langchain";
import { inngest } from "@/lib/inngest/client";

export function createToolLifecycleMiddleware(options: {
  runId: string;
  toolIdMap: Map<string, string>;
}) {
  return createMiddleware({
    name: "ToolLifecycleMiddleware",
    wrapToolCall: async (request, handler) => {
      const toolName = request.toolCall.name;
      const elementId = options.toolIdMap.get(toolName) ?? toolName;

      void inngest
        .send({
          name: "workflow/element.started",
          data: {
            runId: options.runId,
            elementId,
            elementType: "tool",
            label: toolName,
          },
        })
        .catch((e: Error) =>
          console.error("Failed to send workflow/element.started event", e),
        );

      try {
        const result = await handler(request);
        void inngest
          .send({
            name: "workflow/element.completed",
            data: {
              runId: options.runId,
              elementId,
              elementType: "tool",
              label: toolName,
            },
          })
          .catch((e: Error) =>
            console.error("Failed to send workflow/element.completed event", e),
          );
        return result;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        void inngest
          .send({
            name: "workflow/element.failed",
            data: {
              runId: options.runId,
              elementId,
              elementType: "tool",
              label: toolName,
              error: errMsg,
            },
          })
          .catch((e: Error) =>
            console.error("Failed to send workflow/element.failed event", e),
          );
        throw error;
      }
    },
  });
}
