"use client";

import {
  ArrowUpIcon,
  PaperclipIcon,
  PlayIcon,
  PlusIcon,
  SidebarIcon,
  Wand2Icon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UpdateProjectTitle from "./UpdateProjectTitle";
import ChatPanel from "./chat/ChatPanel";
import { authClient } from "@/lib/auth/auth-client";
import { MiddlePanel } from "./panel/MiddlePanel";

export default function HermesAIBuilder() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Visual Editor");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatWidth, setChatWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);

  const params = useParams();
  const projectId = params?.projectId as string;

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user?.id) {
      router.push("/login");
    }
  }, [isPending, session, router]);

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

  if (isPending) {
    return <BuilderSkeleton />;
  }

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside
        style={{ width: isChatOpen ? `${chatWidth}px` : "0px" }}
        className={`relative flex flex-col h-full shrink-0 overflow-hidden bg-slate-50
        ${isChatOpen ? "border-r border-slate-200" : ""}
        ${!isDragging ? "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" : ""}`}
      >
        <ChatPanel
          projectId={projectId}
          userId={userId}
          chatWidth={chatWidth}
        />

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

            <UpdateProjectTitle
              projectId={projectId}
              initialTitle={"Untitled Project"}
            />
          </div>

          <button className="bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 active:scale-95 transition">
            <PlayIcon size={18} className="fill-current" />
          </button>
        </header>

        <MiddlePanel />
      </main>
    </div>
  );
}

function BuilderSkeleton() {
  return (
    <div className="flex h-screen animate-pulse">
      <div className="w-[320px] bg-slate-100 border-r border-slate-200 p-4 space-y-4">
        <div className="h-6 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-200 rounded w-full" />
        <div className="h-4 bg-slate-200 rounded w-5/6" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b border-slate-200 flex items-center px-4 gap-3">
          <div className="h-6 w-6 bg-slate-200 rounded" />
          <div className="h-5 w-40 bg-slate-200 rounded" />
        </div>

        <div className="flex-1 p-6 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}
