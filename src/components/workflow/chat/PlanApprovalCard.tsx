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
    <div className="bg-white rounded-2xl p-[18px] space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
        <span className="text-sm font-semibold text-[#111827]">
          Implementation Plan &mdash; Review Required
        </span>
      </div>

      <div className="text-sm text-[#6B7280] whitespace-pre-wrap">
        {summary}
      </div>

      {agents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
            Agents
          </p>
          {agents.map((agent: any, i: number) => (
            <div
              key={i}
              className="text-xs bg-[#F5F5F5] rounded-xl p-3"
            >
              <span className="font-semibold text-[#111827]">{agent.name}</span>
              <span className="text-[#6B7280]"> &mdash; {agent.role}</span>
              {agent.tools && agent.tools.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {agent.tools.map((tool: string, j: number) => (
                    <span key={j} className="text-xs bg-[#EEF2FF] text-[#5B5CEB] px-2 py-0.5 rounded-full font-medium">
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
          className="text-xs px-3 py-1.5 rounded-xl bg-[#10B981] text-white hover:bg-[#059669] transition"
        >
          Approve
        </button>
        <button
          onClick={onEdit}
          className="text-xs px-3 py-1.5 rounded-xl bg-white border border-[#E7E7E7] text-[#6B7280] hover:bg-[#F5F5F5] transition"
        >
          Edit
        </button>
        <button
          onClick={onReject}
          className="text-xs px-3 py-1.5 rounded-xl bg-white border border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] transition"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
