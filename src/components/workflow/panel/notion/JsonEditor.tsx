"use client";

import { Textarea } from "@/components/ui/textarea";
import { useJsonValidation } from "./useJsonValidation";

type Props = {
  value: string;
  onChange: (json: string) => void;
  rows?: number;
};

export function JsonEditor({ value, onChange, rows }: Props) {
  const { isValid, error } = useJsonValidation(value);

  return (
    <div>
      <p className="text-xs text-[#6B7280] mb-2">
        Raw Notion block JSON. Use this for full control over block structure, rich text annotations, and unsupported block types.
      </p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='[{&#10;  "object": "block",&#10;  "type": "paragraph",&#10;  "paragraph": {&#10;    "rich_text": [{&#10;      "type": "text",&#10;      "text": { "content": "Hello" }&#10;    }]&#10;  }&#10;}]'
        rows={rows ?? 8}
        className={`min-h-[160px] resize-y bg-[#F8F9FC] border rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] transition-all duration-150 ${
          value.trim() && !isValid
            ? "border-red-300 focus:border-red-400"
            : "border-[#E7E7E7] focus:border-[#5B5CEB]"
        }`}
      />
      {value.trim() && !isValid && error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
      {value.trim() && isValid && (
        <p className="mt-1 text-xs text-emerald-500">Valid JSON</p>
      )}
    </div>
  );
}
