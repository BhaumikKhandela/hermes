import {
  Bot,
  ChevronDown,
  ClipboardList,
  Search,
  Funnel,
} from "lucide-react";

interface RightPanelProps {
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (val: boolean) => void;
}

const RightPanel = ({
  isRightPanelOpen,
  setIsRightPanelOpen,
}: RightPanelProps) => {
  return (
    <aside
      className={`relative bg-white border-l border-slate-200 shrink-0 overflow-hidden transition-all duration-300
      ${isRightPanelOpen ? "w-[340px]" : "w-0 border-none opacity-0"}`}
    >
      <div className="h-full overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 text-sm">
            Nodes
          </h3>

          <ChevronDown
            size={16}
            className="text-slate-400 cursor-pointer"
          />
        </div>

        <div className="space-y-3">
          <button className="w-full border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:bg-slate-50 transition">
            <Bot
              size={18}
              className="text-slate-500 shrink-0"
            />

            <span className="text-sm font-medium text-slate-700">
              Agent
            </span>
          </button>

          <button className="w-full border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:bg-slate-50 transition">
            <ClipboardList
              size={18}
              className="text-slate-500 shrink-0"
            />

            <span className="text-sm font-medium text-slate-700">
              SubAgent
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 my-6" />

        {/* Tools Section */}
        <div>
          <div className="flex items-center justify-between mb-4 cursor-pointer group">
            <h3 className="font-semibold text-slate-800 text-sm">
              Tools
            </h3>

            <ChevronDown
              size={16}
              className="text-slate-400 group-hover:text-slate-600 transition-colors"
            />
          </div>

          {/* Search */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search tools..."
                className="w-full h-10 pl-9 pr-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-red-400"
              />
            </div>

            <button className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              <Funnel
                size={16}
                className="text-slate-500"
              />
            </button>
          </div>

          {/* Tool Categories */}
          <div className="space-y-5">
            <div className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-slate-700">
                Integrations
              </span>

              <ChevronDown
                size={14}
                className="text-slate-400 group-hover:text-slate-600"
              />
            </div>

            <div className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-slate-700">
                Search & Research
              </span>

              <ChevronDown
                size={14}
                className="text-slate-400 group-hover:text-slate-600"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightPanel;