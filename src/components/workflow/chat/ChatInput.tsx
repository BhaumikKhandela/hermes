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
      <div className="px-4 pb-4 shrink-0">
        <div className="bg-[#F5F5F5] border border-[#E7E7E7] rounded-xl p-3 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[rgba(91,92,235,0.15)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={2}
            className="w-full resize-none outline-none text-sm placeholder:text-[#6B7280] bg-transparent"
            disabled={loading}
          />

          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-[#6B7280]">
              Enter to send &bull; Shift + Enter for newline
            </span>

            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm rounded-xl transition",
                loading || !input.trim()
                  ? "bg-[#E7E7E7] text-[#6B7280] cursor-not-allowed"
                  : "bg-[#5B5CEB] text-white hover:bg-[#4C4DDA]",
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
    );
  },
);

ChatInput.displayName = "ChatInput";

export default ChatInput;