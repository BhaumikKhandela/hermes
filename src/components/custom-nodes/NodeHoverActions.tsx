"use client";

import { useState, type ReactNode } from "react";
import { useDispatch } from "react-redux";
import { Settings, Trash2, X } from "lucide-react";
import type { AppDispatch } from "@/stores";
import {
  setSelectedNode,
  removeNode,
} from "@/stores/agentBuilderSlice";

type Props = {
  id: string;
  children: ReactNode;
};

export function NodeHoverActions({ id, children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSettings = () => {
    dispatch(setSelectedNode(id));
  };

  const handleDelete = () => {
    dispatch(removeNode(id));
    setShowConfirm(false);
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {isHovered && !showConfirm && (
        <div className="absolute -top-9 right-0 flex items-center gap-1 z-50">
          <button
            onClick={handleSettings}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-white border border-slate-200 shadow-md hover:bg-slate-50 transition-colors"
            title="Configure"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-white border border-slate-200 shadow-md hover:bg-red-50 hover:border-red-200 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-[1px] rounded-sm">
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xl p-4 w-56">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Delete node?
              </h4>
              <button
                onClick={() => setShowConfirm(false)}
                className="p-0.5 rounded hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
