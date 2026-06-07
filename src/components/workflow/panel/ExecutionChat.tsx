import React, { useState } from "react";
import { Send } from "lucide-react";

export const ExecutionChat = () => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;

    console.log(message);

    setMessage("");
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      {/* Mode Badge */}
      <div className="absolute top-4 left-4 text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
        Execution Mode Active
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 mt-8">
        <div className="self-start max-w-[80%] bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-700">
          Workflow ready. What would you like to execute?
        </div>
      </div>

      {/* Chat Input Area */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="relative flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
            placeholder="Describe what you want to execute..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none focus:border-red-400"
          />

          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="absolute right-2 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};