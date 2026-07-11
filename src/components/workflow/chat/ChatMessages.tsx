"use client";

import { ChatMessage } from "@/lib/client/api/project";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { ConvertMarkdownToText } from "./ConvertMarkdownToText";
import { ChevronDown, ChevronUp } from "lucide-react";

export const ChatMessages = memo(function MessageBubble({
  message,
  loading,
}: {
  message: ChatMessage;
  loading: boolean;
}) {
  const isUser = message?.role === "user";
  const [showThinking, setShowThinking] = useState(false);

  return (
    <div
      className={cn(
        "w-full flex mb-4",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
          isUser ? "bg-[#5B5CEB] text-white" : "bg-[#F5F5F5] text-[#111827]",
        )}
      >
        {/* Thinking section (AI only) */}
        {!isUser && message.thinking && (
          <div className="mb-2">
            <button
              onClick={() => setShowThinking((prev) => !prev)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition"
            >
              {showThinking ? (
                <>
                  Hide thinking <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  Show thinking <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>

            {showThinking && (
              <div className="mt-2 p-2 bg-gray-200 rounded-md text-xs whitespace-pre-wrap">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        {/* Main content */}
        {message.content ? (
          <ConvertMarkdownToText text={message.content} />
        ) : loading && !isUser ? (
          <div className="text-gray-400 text-xs animate-pulse">Thinking...</div>
        ) : null}
      </div>
    </div>
  );
});
