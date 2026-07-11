"use client";

import { PlusIcon, Search } from "lucide-react";
import TopNav from "@/components/topnav/TopNav";
import { Button } from "@/components/ui/button";
import { createProject } from "@/lib/client/api/project";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/stores";
import { fetchProjects } from "@/stores/ProjectSlice";
import ProjectList from "@/components/project/ProjectList";

export default function Page() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const dispatch = useDispatch<AppDispatch>();
  const { projects, loading: projectsLoading } = useSelector(
    (state: RootState) => state.project,
  );

  const { pagination } = projects;
  const totalPages = pagination?.totalPages ?? 1;

  useEffect(() => {
    dispatch(fetchProjects({ page, search }));
  }, [page, search, dispatch]);

  const createAProject = async () => {
    if (isPending) return;
    if (session) {
      setLoading(true);
      const data = await createProject();
      if (data) {
        setLoading(false);
        router.push(`/workflows/${data.project._id}`);
      }
    } else {
      setLoading(false);
      toast.error("Please login again to continue");
      router.push(`/login`);
    }
  };

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1);
    },
    [],
  );

  return (
    <div className="h-screen flex flex-col bg-[#F6F7FB]">
      <TopNav />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 pt-10 pb-12">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-[26px] font-bold text-[#111827] tracking-tight">
                My Projects
              </h1>
              <p className="text-sm text-[#6B7280] mt-1">
                Manage and continue working on your AI workflows.
              </p>
            </div>
            <Button
              className="flex items-center gap-2 rounded-xl bg-[#5B5CEB] hover:bg-[#4C4DDA] shrink-0"
              onClick={createAProject}
              disabled={isPending || loading}
            >
              <PlusIcon className="h-4 w-4" />
              {loading ? "Creating..." : "New Project"}
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-8 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search workflows..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#F8F9FC] border border-[#E7E7E7] text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
            />
          </div>

          {/* Content */}
          {projectsLoading && !projects?.projects?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white border border-[#E7E7E7] overflow-hidden animate-pulse"
                >
                  <div className="h-32 bg-[#F5F5F5]" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-[#F5F5F5] rounded w-3/4" />
                    <div className="h-3 bg-[#F5F5F5] rounded w-1/2" />
                    <div className="h-3 bg-[#F5F5F5] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !projects?.projects?.length ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F5F5FF] border border-[#E7E7E7] flex items-center justify-center mb-5">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5B5CEB"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-[#111827] mb-1">
                No workflows yet
              </h2>
              <p className="text-sm text-[#6B7280] max-w-sm mb-6">
                Workflows let you connect AI agents, tools, and triggers to
                automate complex tasks. Create your first workflow to get
                started.
              </p>
              <Button
                className="flex items-center gap-2 rounded-xl bg-[#5B5CEB] hover:bg-[#4C4DDA]"
                onClick={createAProject}
                disabled={isPending || loading}
              >
                <PlusIcon className="h-4 w-4" />
                {loading ? "Creating..." : "Create your first workflow"}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <ProjectList projects={projects?.projects} />
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-sm text-[#6B7280] border border-[#E7E7E7] rounded-lg hover:bg-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-[#6B7280] px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-sm text-[#6B7280] border border-[#E7E7E7] rounded-lg hover:bg-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}