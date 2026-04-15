"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

type Props = {
  text: string;
};

// Fix for inline typing
type CodeProps = React.ComponentProps<"code"> & {
  inline?: boolean;
};

const components: Components = {
  // Links
  a: ({ node, ...props }) => (
    <a
      {...props}
      className="underline underline-offset-2 mr-1 text-blue-600"
      target="_blank"
      rel="noreferrer"
    />
  ),

  // Headings
  h1: ({ ...props }) => (
    <h1 {...props} className="text-2xl font-bold mt-6 mb-4" />
  ),
  h2: ({ ...props }) => (
    <h2 {...props} className="text-xl font-semibold mt-5 mb-3" />
  ),
  h3: ({ ...props }) => (
    <h3 {...props} className="text-lg font-semibold mt-4 mb-2" />
  ),
  h4: ({ ...props }) => (
    <h4 {...props} className="text-base font-semibold mt-3 mb-2" />
  ),

  // Text
  p: ({ ...props }) => <p {...props} className="mb-3 leading-relaxed" />,
  strong: ({ ...props }) => <strong {...props} className="font-semibold" />,
  em: ({ ...props }) => <em {...props} className="italic" />,

  // Lists
  ul: ({ ...props }) => (
    <ul {...props} className="list-disc list-inside space-y-2 mb-5" />
  ),
  ol: ({ ...props }) => (
    <ol {...props} className="list-decimal list-inside space-y-2 mb-5" />
  ),
  li: ({ ...props }) => <li {...props} className="ml-2" />,

  // Code
  code({ inline, className, children, ...props }: CodeProps) {
    if (inline) {
      return (
        <code {...props} className="bg-gray-200 px-1 py-0.5 rounded text-sm">
          {children}
        </code>
      );
    }

    return (
      <pre className="bg-black text-white p-3 rounded-lg overflow-x-auto mb-4">
        <code {...props} className={className}>
          {children}
        </code>
      </pre>
    );
  },

  // Pre (fallback safety)
  pre: ({ ...props }) => (
    <pre
      {...props}
      className="bg-black text-white p-3 rounded-lg overflow-x-auto mb-4"
    />
  ),

  // Tables (VERY IMPORTANT)
  table: ({ ...props }) => (
    <div className="overflow-x-auto mb-6">
      <table {...props} className="min-w-full border border-gray-300" />
    </div>
  ),

  thead: ({ ...props }) => <thead {...props} className="bg-gray-100" />,

  tbody: ({ ...props }) => <tbody {...props} className="divide-y" />,

  tr: ({ ...props }) => <tr {...props} className="border-b" />,

  th: ({ ...props }) => (
    <th {...props} className="px-4 py-2 text-left font-semibold border" />
  ),

  td: ({ ...props }) => <td {...props} className="px-4 py-2 border text-sm" />,

  // Blockquote (also important for LLMs)
  blockquote: ({ ...props }) => (
    <blockquote
      {...props}
      className="border-l-4 border-gray-400 pl-4 italic text-gray-700 my-4"
    />
  ),

  // Horizontal rule
  hr: () => <hr className="my-6 border-gray-300" />,
};

export const ConvertMarkdownToText = memo(function MarkdownBubble({
  text,
}: Props) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  );
});
