import { LLM } from "@/lib/llm/LLM";
import { createMemoryAgent } from "@/lib/memory/MemoryAgent";
import { withErrorHandler } from "@/lib/mongodb/withErrorHandler";
import { writeToChatHistoryTool } from "@/lib/tools/chatHistoryTool";
import { ContentBlock, createAgent } from "langchain";

export const POST = withErrorHandler(async (req: Request) => {
  try {
    const {
      message,
      userId,
      projectId,
    }: { message: string; userId: string; projectId: string } =
      await req.json();

    const llm = LLM.getInstance("cerebras");

    const { streamAgent, logLastAIMsg } = await createMemoryAgent({
      userId,
      projectId,
      model: llm,
    });
    const streamMemoryAgent = await streamAgent(message);
    const encoder = new TextEncoder();

    const sse = (event: string, data: any) => {
      return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    await writeToChatHistoryTool.invoke({
      messages: [{ role: "user", content: message, userId, projectId }],
    });
    let streamingText = "";
    let thinkingBuffer = "";
    let inThinking = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamMemoryAgent) {
            const updates = chunk?.tools?.messages;
            const req = chunk?.model_request?.messages;

            if (updates && updates.length > 0) {
              thinkingBuffer += updates[0].content;
              controller.enqueue(
                sse("thinking", { thinking: updates[0].content }),
              );
            }

            if (req && req.length > 0) {
              const rawContent = req[0].content;
              const content = normalizeContent(rawContent);

              const hasOpening = content.includes("<think>");
              const hasClosing = content.includes("</think>");
              inThinking =
                hasClosing &&
                (!hasOpening ||
                  content.indexOf("</think>") < content.indexOf("<think>"));

              const parts = content
                .split(/(<think>|<\/think>)/g)
                .filter(Boolean);

              parts.forEach((part: string) => {
                if (part === "<think>") {
                  inThinking = true;
                } else if (part === "</think>") {
                  inThinking = false;
                } else {
                  if (inThinking) {
                    thinkingBuffer += part;
                    controller.enqueue(sse("thinking", { thinking: part }));
                  } else {
                    streamingText += part;
                    controller.enqueue(sse("message", { message: part }));
                  }
                }
              });
            }
          }

          await writeToChatHistoryTool.invoke({
            messages: [
              {
                role: "ai",
                thinking: thinkingBuffer,
                content: streamingText,
                userId,
                projectId,
              },
            ],
          });
          await logLastAIMsg(streamingText);
          controller.enqueue(sse("end", { ok: true }));
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";

          controller.enqueue(sse("error", { error: message }));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown Error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

function normalizeContent(
  content: string | ContentBlock[] | null | undefined,
): string {
  if (!content) return "";

  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof content === "string") return block;

        if (
          typeof block === "object" &&
          block !== null &&
          "text" in block &&
          typeof block.text === "string"
        ) {
          return block.text;
        }

        return "";
      })
      .join("");
  }
  return "";
}
