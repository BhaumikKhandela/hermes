"use client";

import { updateProject } from "@/lib/client/api/project";
import { useState } from "react";

type Props = {
  initialTitle?: string;
  projectId: string;
};

export default function UpdateProjectTitle({
  initialTitle = "Untitled Project",
  projectId,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);

  async function handleBlur() {
    setEditing(false);
    await updateProject({ projectId, name: title });
  }

  return (
    <div className="text-sm font-semibold text-slate-800">
      {editing ? (
        <input
          type="text"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleBlur();
            }
          }}
          className="bg-transparent border-b border-slate-300 outline-none"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className="cursor-pointer hover:text-[#5B5CEB]"
        >
          {title || "Untitled Project"}
        </span>
      )}
    </div>
  );
}
