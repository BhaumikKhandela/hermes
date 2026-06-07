import { graph } from "@/lib/agent-builder/graph";
import { LLM } from "@/lib/llm/LLM";
import { createMemoryAgent } from "@/lib/memory/MemoryAgent";
import { withErrorHandler } from "@/lib/mongodb/withErrorHandler";
import { writeToChatHistoryTool } from "@/lib/tools/chatHistoryTool";
import { createAgent } from "langchain";

export const POST = withErrorHandler(async (req: Request) => {
  try {
    const {
      message,
      userId,
      projectId,
    }: { message: string; userId: string; projectId: string } =
      await req.json();

    const graphStream = await graph.stream(
      {
        messages: [{ role: "user", content: message }],
        userId,
        projectId,
      },
      {
        streamMode: "custom",
        subgraphs: true,
        recursionLimit: 150,
      },
    );

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
          for await (const [array, chunk] of graphStream) {
            if ((chunk as any).update_todos) {
              const update_todo = {
                todos: chunk?.todos,
                updates: chunk?.updates,
              };

              controller.enqueue(
                sse("update_todos", {
                  update_todo,
                }),
              );
              continue;
            }

            if ((chunk as any).todos) {
              const todo_list = {
                todos: chunk?.todos,
                todoList: chunk?.todoList,
              };
              controller.enqueue(
                sse("todo_list", {
                  todo_list,
                }),
              );
              continue;
            }

            if ((chunk as any).manager_name) {
              const content = (chunk as any).content as string;

              const parts = content.split(/(<think>|<\/think>)/);

              parts.forEach((part) => {
                if (part === "<think>") {
                  inThinking = true;
                } else if (part === "</think>") {
                  inThinking = false;
                } else if (part.length > 0) {
                  // Route the content based on current state
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

          controller.enqueue(sse("end", { ok: true }));
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
          controller.close();
        } catch (error) {
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
