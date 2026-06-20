import React from "react";

interface TabsProps {
  activeTab: string;
  setActiveTab: (val: string) => void;
}

export const Tabs = ({ activeTab, setActiveTab }: TabsProps) => {
  const tabs = ["Visual Editor", "Execute"];

  return (
    <div className="flex items-center px-4 border-b border-slate-200 h-11 shrink-0 bg-white">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 h-full text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab
              ? "border-red-500 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
