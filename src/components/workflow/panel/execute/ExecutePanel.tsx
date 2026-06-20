import { Play } from "lucide-react";

const ExecutePanel = ({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 gap-6 p-8">
      <div className="text-center space-y-3">
        <h2 className="text-xl font-semibold text-slate-800">
          Execute Workflow
        </h2>
        <p className="text-sm text-slate-500 max-w-md">
          Run your configured agents and tasks. Execution results will appear
          here once you start.
        </p>
      </div>

      <button
        disabled
        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-medium text-sm 
                   opacity-60 cursor-not-allowed"
      >
        <Play size={18} />
        Run Workflow
      </button>

      <p className="text-xs text-slate-400 mt-2">
        Coming soon — configure your workflow in the Visual Editor first.
      </p>
    </div>
  );
};

export default ExecutePanel;
