import { Bot, ChevronDown, ChevronRight, ClipboardList } from "lucide-react";

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
      className={`relative bg-white flex flex-col shrink-0 overflow-visible transition-all duration-300
      ${isRightPanelOpen ? "w-85" : "w-0 border-none opacity-0"}`}
    >
      <div className="flex items-center justify-start absolute top-3 -left-9">
        {isRightPanelOpen && (
          <button
            onClick={() => setIsRightPanelOpen(false)}
            className="bg-red-500 text-white rounded-md p-1.5 hover:bg-red-600"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <div className="w-85 px-4 pb-4 space-y-6 h-full overflow-y-auto">
        <div className="pt-3">
          {/* Nodes Section */}
          <div>
            <div className="flex items-center justify-between mb-3 cursor-pointer group">
              <h3 className="font-semibold text-slate-800 text-sm">Nodes</h3>

              <ChevronDown
                size={16}
                className="text-slate-400 group-hover:text-slate-600 transition-colors"
              />
            </div>

            <div className="space-y-3">
              <div className="border border-slate-200 rounded-lg p-3 flex items-center gap-2">
                <Bot size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  Agent
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg p-3 flex items-center gap-2">
                <ClipboardList size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  SubAgent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightPanel;
