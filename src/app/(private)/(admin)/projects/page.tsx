"use client";

import { PlusIcon } from "lucide-react";
import TopNav from "@/components/topnav/TopNav";
import { Button } from "@/components/ui/button";
export default function Page() {
  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-gray-900">
      <TopNav />
      <main className="flex-1 p-15 overflow-auto">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            My Projects
          </h1>
          <div className="flex gap-3">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          
        </div>
      </main>
    </div>
  );
}
