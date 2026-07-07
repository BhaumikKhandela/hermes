import { graph } from "@/lib/agents/graph";
import { withErrorHandler } from "@/lib/mongodb/withErrorHandler";
import { writeToChatHistoryTool } from "@/lib/tools/chatHistoryTool";
import { Command } from "@langchain/langgraph";
import path from "path";
import fs from "fs";

export const POST = withErrorHandler(async (req: Request) => {
  try {
    const {
      message,
      userId,
      projectId,
    }: { message: string; userId: string; projectId: string } =
      await req.json();

    const threadId = `thread-${projectId}`;
    const runConfig = {
      configurable: { thread_id: threadId },
      streamMode: "custom" as const,
      subgraphs: true,
      recursionLimit: 150,
    };

    // Check if graph has a pending interrupt (MCQ answer or plan approval)
    let graphStream;
    try {
      const currentState = await (graph as any).getState({
        configurable: { thread_id: threadId },
      });
      const hasInterrupt = currentState.tasks?.some(
        (t: any) => t.interrupts?.length > 0,
      );

      if (hasInterrupt) {
        const interruptVal = currentState.tasks.find(
          (t: any) => t.interrupts?.length > 0,
        ).interrupts[0].value;

        // All interrupts are now raw interrupts (MCQ or plan_approval)
        let resumeValue: any;
        let stateUpdate: any = undefined;
        try {
          resumeValue = typeof message === "string" ? JSON.parse(message) : message;
        } catch {
          // Plain text — treat as MCQ answer
          resumeValue = message;
          stateUpdate = { messages: [] };
        }

        if (resumeValue?.type === "approve") {
          console.log("[route] User approved plan");
          stateUpdate = { approved: true };
        } else if (resumeValue?.type === "edit") {
          const suggestion = resumeValue.message || "";
          console.log("[route] User requested edit — suggestion:", suggestion);
          let fullPlan = "";
          try {
            const planPath = path.resolve(
              process.cwd(), "public", "agent-builder", "working-agent-folder", `plan-${projectId}.json`
            );
            fullPlan = fs.readFileSync(planPath, "utf-8");
          } catch {
            fullPlan = "Plan file not found";
          }
          resumeValue = { type: "edit", message: suggestion, plan: fullPlan };
        }

        console.log("[route] Resuming graph:", JSON.stringify(resumeValue).substring(0, 500));
        graphStream = await (graph as any).stream(
          new Command({ resume: resumeValue, update: stateUpdate }),
          runConfig,
        );
      } else {
        // Thread exists but no interrupt — start fresh
        graphStream = await (graph as any).stream(
          { messages: [{ role: "user", content: message }], userId, projectId },
          runConfig,
        );
      }
    } catch {
      // No existing thread — start fresh
      graphStream = await (graph as any).stream(
        { messages: [{ role: "user", content: message }], userId, projectId },
        runConfig,
      );
    }

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

            if ((chunk as any).__event === "tool_call") {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    tool_call: {
                      tool_name: (chunk as any).tool_name,
                      toolName: (chunk as any).toolName,
                      args: (chunk as any).args,
                      status: (chunk as any).status,
                      error: (chunk as any).error,
                    },
                  })}\n\n`,
                ),
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

          // After stream ends, check for pending interrupts (plan_approval or MCQ)
          const postState = await (graph as any).getState({
            configurable: { thread_id: threadId },
          });
          console.log("[post-stream] postState.tasks count:", postState.tasks?.length);

          // Check if a plan_approval raw interrupt is pending
          const planTask = postState.tasks?.find((t: any) => {
            const val = t.interrupts?.[0]?.value;
            if (typeof val !== "string") return false;
            try {
              return JSON.parse(val).type === "plan_approval";
            } catch {
              return false;
            }
          });
          if (planTask) {
            let parsed: any;
            try {
              parsed = JSON.parse(planTask.interrupts[0].value);
            } catch {
              parsed = null;
            }
            if (parsed) {
              console.log("[post-stream] Emitting plan_approval card. agents count:", parsed.agents?.length);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    plan_approval: {
                      summary: parsed.summary,
                      agents: parsed.agents ?? [],
                    },
                  })}\n\n`,
                ),
              );
            }
          }

          // Check if a raw MCQ interrupt is pending
          const mcqTask = postState.tasks?.find((t: any) => {
            const val = t.interrupts?.[0]?.value;
            if (typeof val !== "string") return false;
            try {
              return JSON.parse(val).type === "mcq_batch";
            } catch {
              return false;
            }
          });
          if (mcqTask) {
            let parsed: any;
            try {
              parsed = JSON.parse(mcqTask.interrupts[0].value);
            } catch {
              parsed = null;
            }
            if (parsed?.questions) {
              for (const q of parsed.questions) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      mcq: {
                        section: q.section,
                        question: q.question,
                        options: q.options,
                      },
                    })}\n\n`,
                  ),
                );
              }
            }
          }

          // If no interrupts are pending, the graph reached END — clear stale todos
          if (!planTask && !mcqTask) {
            controller.enqueue(sse("clear_todos", {}));
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
          const errorMsg = error instanceof Error ? error.message : "Unknown error";

          controller.enqueue(sse("error", { error: errorMsg }));
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
