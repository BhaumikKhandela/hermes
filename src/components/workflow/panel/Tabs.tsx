import React from "react";

interface TabsProps {
  activeTab: string;
  setActiveTab: (val: string) => void;
}

export const Tabs = ({ activeTab, setActiveTab }: TabsProps) => {
  const tabs = ["Visual Editor", "Execute"];

  return (
    <div className="flex items-center px-4 border-b border-[#E7E7E7] h-11 shrink-0 bg-white">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 h-full text-[13px] font-semibold border-b-2 transition-colors ${
            activeTab === tab
              ? "border-[#5B5CEB] text-[#111827]"
              : "border-transparent text-[#6B7280] hover:text-[#111827]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
