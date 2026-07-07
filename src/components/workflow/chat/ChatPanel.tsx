import { cn } from "@/lib/utils";
import ChatInput from "./ChatInput";
import { ChatMessages } from "./ChatMessages";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/stores";
import {
  addTodos,
  addUserAndAiPlaceholder,
  appendToAssistantThinking,
  appendTOLastAiMessage,
  clearTodos,
  getChatHistory,
  TodoStatus,
  updateTodos,
} from "@/stores/chatSlice";
import TaskCard from "../TaskCard";
import PlanApprovalCard from "./PlanApprovalCard";
import MCQCard from "./MCQCard";
import { Button } from "@/components/ui/button";
import ToolCallBadge from "./ToolCallBadge";
import { Cpu } from "lucide-react";

const ChatPanel = ({
  chatWidth,
  projectId,
  userId,
}: {
  chatWidth: number;
  projectId: string;
  userId: string;
}) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch<AppDispatch>();

  const { messages, todos } = useSelector((state: RootState) => state.chat);

  useEffect(() => {
    dispatch(getChatHistory({ userId, projectId }));
  }, [userId, dispatch]);

  const handleSubmitMcqs = () => {
    sendMessage(JSON.stringify(selectedAnswers));
  };

  const userMessageRef = useRef<string[]>([]);
  const typingRef = useRef(false);

  const [mcqs, setMcqs] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [planPending, setPlanPending] = useState<{
    summary: string;
    agents: any[];
  } | null>(null);
  const [buildingMessage, setBuildingMessage] = useState(false);
  const [toolCalls, setToolCalls] = useState<any[]>([]);

  const thinkingQueueRef = useRef<string[]>([]);
  const thinkingTypingRef = useRef(false);

  const typeNextThinking = () => {
    if (thinkingQueueRef.current.length === 0) {
      thinkingTypingRef.current = false;
      return;
    }
    thinkingTypingRef.current = true;

    const chunk = thinkingQueueRef.current.splice(0, 3).join("");
    dispatch(appendToAssistantThinking(chunk));
    setTimeout(typeNextThinking, 16);
  };

  const typeNextUserMessage = () => {
    if (userMessageRef.current.length === 0) {
      typingRef.current = false;
      return;
    }
    typingRef.current = true;

    const chunk = userMessageRef.current.splice(0, 10).join("");
    dispatch(appendTOLastAiMessage(chunk));
    setTimeout(typeNextUserMessage, 3);
  };

  const sendMessage = async (text?: string) => {
    const userMessage = (text || input).trim();

    userMessageRef.current = [];
    setInput("");
    setPlanPending(null);
    setMcqs([]);
    setSelectedAnswers({});
    setBuildingMessage(false);
    setToolCalls([]);

    dispatch(
      addUserAndAiPlaceholder({
        role: "ai",
        userId,
        thinking: "",
        projectId,
        content: userMessage,
      }),
    );

    try {
      setLoading(true);

      const res = await fetch("/api/agent/multi-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage, userId, projectId }),
      });

      if (!res.body) return;

      const reader = res.body.getReader();
      const decorder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decorder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("data:")) {
            const payload = trimmed.replace("data:", "").trim();
            if (!payload) continue;

            const data = JSON.parse(payload);

            if (data.message !== undefined && data.message !== null) {
              setBuildingMessage(false);
              for (const char of data.message) {
                userMessageRef.current.push(char);
              }

              if (!typingRef.current) {
                typeNextUserMessage();
              }
            }

            // todos
            if (data.todo_list !== undefined && data.todo_list !== null) {
              try {
                const jsonPayload = JSON.parse(
                  data.todo_list.todoList ?? "[]",
                ) as {
                  id: string;
                  task: string;
                  status: TodoStatus;
                }[];

                dispatch(clearTodos());
                dispatch(addTodos(jsonPayload));
              } catch (error) {
                console.log("failed to parse todos");
              }
            }

            if (data.update_todo !== undefined && data.update_todo !== null) {
              try {
                const jsonPayload = data.update_todo;
                dispatch(updateTodos(jsonPayload));
              } catch (error) {
                console.log("failed to parse todos");
              }
            }

            if (data.mcq !== undefined && data.mcq !== null) {
              setMcqs((prev) => [...prev, data.mcq]);
            }

            if (data.plan_approval !== undefined && data.plan_approval !== null) {
              setPlanPending({
                summary: data.plan_approval.summary,
                agents: data.plan_approval.agents ?? [],
              });
            }

            if (data.tool_call !== undefined && data.tool_call !== null) {
              setToolCalls((prev) => {
                const idx = prev.findIndex(
                  (t) => t.tool_name === data.tool_call.tool_name,
                );
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = data.tool_call;
                  return updated;
                }
                return [...prev, data.tool_call];
              });
            }

            if (data.thinking !== undefined && data.thinking !== null) {
              for (const char of data.thinking) {
                thinkingQueueRef.current.push(char);
              }

              if (!thinkingTypingRef.current) {
                typeNextThinking();
              }
            }
          } else if (trimmed.startsWith("event:")) {
            const eventType = trimmed.replace("event:", "").trim();

            if (eventType === "clear_todos") {
              dispatch(clearTodos());
            }

            if (eventType === "end") {
              setLoading(false);
              reader.cancel();
            }

            if (eventType === "error") {
              setLoading(false);
              reader.cancel();
            }
          }
        }
      }
    } catch (error) {
      setLoading(false);
      console.error(
        "fetch streaming error:",
        error instanceof Error
          ? error.message
          : "An error occurred while streaming messages",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  return (
    <div
      style={{ width: `${chatWidth}px ` }}
      className="flex flex-col h-full shrink-0"
    >
      <div className="h-14 border-b border-slate-200 flex items-center px-4 shrink-0">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span>Hermes</span>
          <span>AI</span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className={cn("flex-1 overflow-y-auto p-4 space-y-4")}
      >
        {messages.map((msg, i) => (
          <ChatMessages key={i} message={msg} loading={loading} />
        ))}

        {toolCalls.length > 0 && <ToolCallBadge toolCalls={toolCalls} />}

        {buildingMessage && toolCalls.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
            <Cpu className="w-4 h-4 animate-pulse text-blue-500" />
            <span>Building your agent tree...</span>
          </div>
        )}

        {mcqs.map((mcq: any, i: number) => (
          <MCQCard
            key={i}
            mcq={mcq}
            index={i}
            total={mcqs.length}
            selectedAnswer={selectedAnswers[i]}
            onSelect={(answer: string) =>
              setSelectedAnswers((prev) => ({ ...prev, [i]: answer }))
            }
          />
        ))}
        {mcqs.length > 0 &&
          Object.keys(selectedAnswers).length === mcqs.length && (
            <div className="flex justify-end">
              <Button onClick={handleSubmitMcqs}>
                Submit Answers
              </Button>
            </div>
          )}

        {planPending && (
          <PlanApprovalCard
            summary={planPending.summary}
            agents={planPending.agents}
            onApprove={() => {
              setBuildingMessage(true);
              sendMessage(
                JSON.stringify({ type: "approve" }),
              );
            }}
            onEdit={() => {
              const edits = prompt("What changes would you like?");
              if (edits)
                sendMessage(
                  JSON.stringify({ type: "edit", message: edits }),
                );
            }}
            onReject={() =>
              sendMessage(
                JSON.stringify({ type: "reject" }),
              )
            }
          />
        )}

        <div ref={bottomRef} className="mb-10" />
      </div>
      {todos.length > 0 && <TaskCard todos={todos} />}

      <ChatInput
        input={input}
        setInput={setInput}
        sendMessage={() => sendMessage()}
        loading={loading}
      />
    </div>
  );
};

export default ChatPanel;
