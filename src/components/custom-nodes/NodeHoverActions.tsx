"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
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
  const [showActions, setShowActions] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!showActions) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showActions]);

  const handleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      setShowActions((prev) => !prev);
    }, 250);
  };

  const handleDoubleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    setShowActions(false);
    dispatch(setSelectedNode(id));
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    dispatch(setSelectedNode(id));
  };

  const handleDelete = () => {
    dispatch(removeNode(id));
    setShowConfirm(false);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {children}

      {showActions && !showConfirm && (
        <div className="absolute -top-9 right-0 flex items-center gap-1 z-50 pointer-events-auto">
          <button
            onClick={handleSettings}
            className="flex items-center justify-center w-7 h-7 rounded-xl bg-white border border-[#E7E7E7] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-[#F5F5F5] hover:border-[#D1D5DB] transition"
            title="Configure"
          >
            <Settings className="w-3.5 h-3.5 text-[#6B7280]" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
            className="flex items-center justify-center w-7 h-7 rounded-xl bg-white border border-[#E7E7E7] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:bg-[#FEF2F2] hover:border-[#FCA5A5] transition"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 rounded-2xl pointer-events-auto">
          <div className="bg-white rounded-2xl p-5 w-56 border border-[#E7E7E7] shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[#111827]">
                Delete node?
              </h4>
              <button
                onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
                className="p-0.5 rounded-xl hover:bg-[#F5F5F5] transition"
              >
                <X className="w-3.5 h-3.5 text-[#6B7280]" />
              </button>
            </div>
            <p className="text-xs text-[#6B7280] mb-4">
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-[#6B7280] bg-[#F5F5F5] rounded-xl hover:bg-[#E7E7E7] transition"
              >
                Cancel
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-[#EF4444] rounded-xl hover:bg-[#DC2626] transition"
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
