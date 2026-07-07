interface PlanApprovalCardProps {
  summary: string;
  agents: any[];
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
}

export default function PlanApprovalCard({
  summary,
  agents,
  onApprove,
  onEdit,
  onReject,
}: PlanApprovalCardProps) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-sm font-semibold text-slate-700">
          Implementation Plan — Review Required
        </span>
      </div>

      <div className="text-sm text-slate-600 whitespace-pre-wrap">
        {summary}
      </div>

      {agents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Agents
          </p>
          {agents.map((agent: any, i: number) => (
            <div
              key={i}
              className="text-xs bg-slate-50 rounded p-2 border border-slate-100"
            >
              <span className="font-semibold text-slate-700">{agent.name}</span>
              <span className="text-slate-500"> — {agent.role}</span>
              {agent.tools && agent.tools.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {agent.tools.map((tool: string, j: number) => (
                    <span key={j} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          onClick={onApprove}
          className="text-xs px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700"
        >
          Approve
        </button>
        <button
          onClick={onEdit}
          className="text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
        >
          Edit
        </button>
        <button
          onClick={onReject}
          className="text-xs px-3 py-1.5 rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
