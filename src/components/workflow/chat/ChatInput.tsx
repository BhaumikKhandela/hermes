"use client";

import { cn } from "@/lib/utils";
import { memo, KeyboardEvent } from "react";
import { SendHorizonal, Loader2 } from "lucide-react";

type ChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  loading: boolean;
};

const ChatInput = memo(
  ({ input, setInput, sendMessage, loading }: ChatInputProps) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!loading && input.trim()) {
          sendMessage();
        }
      }
    };

    return (
      <div className={cn("py-1")}>
        <div className="p-4 shrink-0">
          <div className="border border-slate-200 rounded-xl p-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition">
            {/* Input */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={2}
              className="w-full resize-none outline-none text-sm placeholder:text-gray-400"
              disabled={loading}
            />

            {/* Bottom bar */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">
                Enter to send • Shift + Enter for newline
              </span>

              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition",
                  loading || !input.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700",
                )}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SendHorizonal className="w-4 h-4" />
                )}
                {loading ? "Sending" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ChatInput.displayName = "ChatInput";

export default ChatInput;
