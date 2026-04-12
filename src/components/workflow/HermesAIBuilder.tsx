"use client";

import {
  ArrowUpIcon,
  PaperclipIcon,
  PlayIcon,
  PlusIcon,
  SidebarIcon,
  Wand2Icon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import UpdateProjectTitle from "./UpdateProjectTitle";

export default function HermesAIBuilder() {
  const [activeTab, setActiveTab] = useState("Visual Editor");

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      let newWidth = e.clientX;
      if (newWidth < 260) newWidth = 260;
      if (newWidth > 520) newWidth = 520;

      setChatWidth(newWidth);
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    } else {
      document.body.style.userSelect = "auto";
      document.body.style.cursor = "default";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const params = useParams();
  const projectId = params?.projectId as string;

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside
        style={{ width: isChatOpen ? `${chatWidth}px` : "0px" }}
        className={`relative flex flex-col h-full shrink-0 overflow-hidden bg-slate-50
        ${isChatOpen ? "border-r border-slate-200" : ""}
        ${!isDragging ? "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" : ""}`}
      >
        <div
          style={{ width: `${chatWidth}px` }}
          className="flex flex-col h-full"
        >
          {/* HEADER */}
          <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2 font-semibold text-base tracking-tight">
              <span className="italic">Hermes</span>
              <span className="text-red-500 italic">AI</span>
            </div>

            <button className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition">
              <PlusIcon size={18} />
            </button>
          </div>

          {/* CHAT */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-300">
            {/* USER MESSAGE */}
            <div className="flex justify-end">
              <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm text-sm leading-relaxed max-w-[80%]">
                hello
              </div>
            </div>

            {/* AI MESSAGE */}
            <div className="bg-slate-100/60 rounded-2xl p-4 text-sm space-y-3 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <PlayIcon size={14} className="fill-current" />
                <span>Thought process</span>
              </div>

              <p className="text-slate-700 leading-relaxed">
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Repudiandae fuga commodi beatae.
              </p>

              <p className="text-slate-600">
                What automation task would you like to work with?
              </p>
            </div>
          </div>

          {/* INPUT */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
            <div className="border border-slate-200 rounded-2xl p-3 shadow-sm focus-within:ring-2 focus-within:ring-slate-300 transition">
              <textarea
                placeholder="Ask, build... (Shift + Enter for new line)"
                className="w-full text-sm resize-none outline-none max-h-32 min-h-[40px] leading-relaxed placeholder:text-slate-400"
                rows={2}
              />

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md active:scale-95 transition">
                  <Wand2Icon size={16} />
                </button>

                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md active:scale-95 transition">
                    <PaperclipIcon size={16} />
                  </button>

                  <button className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm hover:opacity-90 active:scale-95 transition">
                    Send <ArrowUpIcon size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESIZE HANDLE */}
        {isChatOpen && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            className="absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize group z-10"
          >
            <div className="w-[2px] mx-auto h-full bg-transparent group-hover:bg-slate-300 transition" />
          </div>
        )}
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* HEADER */}
        <header className="h-14 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-1.5 rounded-md transition ${
                isChatOpen
                  ? "text-slate-500 hover:bg-slate-100"
                  : "text-blue-600 bg-blue-100 hover:bg-blue-200"
              }`}
            >
              <SidebarIcon size={18} />
            </button>
            <UpdateProjectTitle projectId={projectId} initialTitle={"Untitled Project"} />
          </div>

          <button className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 active:scale-95 transition">
            <PlayIcon size={18} className="fill-current" />
          </button>
        </header>
      </main>
    </div>
  );
}
