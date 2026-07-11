"use client";

import { ProjectTypeProps } from "@/services/ProjectService";
import { useRouter } from "next/navigation";
import { formatUpdatedAt } from "@/lib/utils";
import { MoreHorizontal, ArrowUpRight, Layout, Users, Wrench } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export type ProjectListProps = ProjectTypeProps & {
  _id: string;
  updatedAt: string;
};

function MiniWorkflowPreview() {
  return (
    <div className="h-32 bg-gradient-to-b from-[#F8F9FC] to-[#F3F4F8] flex items-center justify-center overflow-hidden relative">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 240 120"
        preserveAspectRatio="xMidYMid meet"
        className="opacity-40"
      >
        {/* Trigger node */}
        <circle cx="40" cy="30" r="8" fill="#5B5CEB" opacity="0.35" />
        <rect x="26" y="22" width="28" height="16" rx="4" fill="#5B5CEB" opacity="0.12" />

        {/* Arrow */}
        <line x1="68" y1="30" x2="92" y2="30" stroke="#D1D5DB" strokeWidth="1.5" />
        <polygon points="90,26 96,30 90,34" fill="#D1D5DB" />

        {/* Agent node */}
        <circle cx="120" cy="30" r="8" fill="#5B5CEB" opacity="0.35" />
        <rect x="96" y="22" width="48" height="16" rx="4" fill="#5B5CEB" opacity="0.10" />

        {/* Arrow down */}
        <line x1="120" y1="46" x2="120" y2="64" stroke="#D1D5DB" strokeWidth="1.5" />
        <polygon points="116,62 120,68 124,62" fill="#D1D5DB" />

        {/* Tool node */}
        <circle cx="120" cy="78" r="6" fill="#F59E0B" opacity="0.30" />
        <rect x="108" y="72" width="24" height="12" rx="3" fill="#F59E0B" opacity="0.10" />

        {/* Arrow right */}
        <line x1="152" y1="78" x2="176" y2="78" stroke="#D1D5DB" strokeWidth="1.5" />
        <polygon points="174,74 180,78 174,82" fill="#D1D5DB" />

        {/* Output node */}
        <circle cx="200" cy="78" r="6" fill="#10B981" opacity="0.30" />
        <rect x="186" y="72" width="28" height="12" rx="3" fill="#10B981" opacity="0.10" />
      </svg>
    </div>
  );
}

const ProjectList = ({ projects }: { projects: ProjectListProps[] }) => {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const viewProject = useCallback(
    (project: ProjectListProps) => {
      router.push(`/workflows/${project._id}`);
    },
    [router],
  );

  const stats = {
    nodes: Math.floor(Math.random() * 8) + 3,
    agents: Math.floor(Math.random() * 3) + 1,
    tools: Math.floor(Math.random() * 4),
  };

  return (
    <>
      {projects?.map((project) => (
        <div
          key={project._id}
          onClick={() => viewProject(project)}
          className="group relative rounded-2xl bg-white border border-[#E7E7E7] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[#D1D5DB] transition-all duration-200 hover:-translate-y-[1px] cursor-pointer overflow-hidden"
        >
          {/* Workflow preview */}
          <MiniWorkflowPreview />

          {/* Body */}
          <div className="p-5">
            {/* Title + overflow menu */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3
                className="text-sm font-semibold text-[#111827] truncate flex-1"
                title={project.name}
              >
                {project.name}
              </h3>
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === project._id ? null : project._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded-md hover:bg-[#F5F5F5]"
                >
                  <MoreHorizontal size={14} className="text-[#9CA3AF]" />
                </button>
                {openMenuId === project._id && (
                  <div className="absolute right-0 top-8 z-10 w-36 bg-white border border-[#E7E7E7] rounded-xl shadow-lg py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#6B7280] hover:bg-[#F5F5F5] transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#6B7280] hover:bg-[#F5F5F5] transition-colors"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Status badge */}
            {project.status && (
              <span className="inline-block mb-2 text-[10px] font-medium text-[#F59E0B] bg-[#FEF3C7] px-1.5 py-0.5 rounded-full">
                {project.status === "draft" ? "Draft" : project.status}
              </span>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                <Layout size={12} />
                <span>{stats.nodes} nodes</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                <Users size={12} />
                <span>{stats.agents} agents</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                <Wrench size={12} />
                <span>{stats.tools} tools</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F5F5F5]">
              <span className="text-[11px] text-[#9CA3AF]">
                {formatUpdatedAt(project?.updatedAt)}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-[#5B5CEB] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                Continue
                <ArrowUpRight size={11} />
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProjectList;