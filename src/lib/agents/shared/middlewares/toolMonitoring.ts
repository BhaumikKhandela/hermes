import { createMiddleware } from "langchain";

export const toolMonitoringMiddleware = createMiddleware({
  name: "ToolMonitoringMiddleware",
  wrapToolCall: async (request, handler) => {
    const { writer } = request.runtime;
    const toolName = request.toolCall.name;
    const args = request.toolCall.args;

    if (writer) {
      writer({ __event: "tool_call", tool_name: toolName, args, status: "started" });
    }

    try {
      const result = await handler(request);

      if (writer) {
        writer({ __event: "tool_call", toolName, args, status: "completed" });
      }

      return result;
    } catch (e) {
      if (writer) {
        writer({ __event: "tool_call", toolName, args, status: "failed", error: (e as Error).message });
      }
      throw e;
    }
  },
});
