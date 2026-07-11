"use client";

import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (markdown: string) => void;
  rows?: number;
};

export function MarkdownEditor({ value, onChange, rows }: Props) {
  return (
    <div>
      <p className="text-xs text-[#6B7280] mb-2">
        Markdown content. Notion&apos;s enhanced Markdown API supports rich text, code blocks, tables, and more.
      </p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="# My Heading&#10;&#10;Some paragraph text with **bold** and *italic*."
        rows={rows ?? 8}
        className="min-h-[160px] resize-y bg-[#F8F9FC] border border-[#E7E7E7] rounded-xl p-3 text-sm font-mono leading-relaxed text-[#111827] placeholder:text-[#9CA3AF] focus:bg-white focus:ring-2 focus:ring-[rgba(91,92,235,0.15)] focus:border-[#5B5CEB] transition-all duration-150"
      />
    </div>
  );
}
