import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUpdatedAt(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

type Pos = { x: number; y: number };

export function getCenteredRandomPosition(
  offsetRange: number = 120,
  opts?: {
    // pass your ReactFlow wrapper element if you have it
    container?: HTMLElement | null;

    // node size used to keep it from spawning out of view
    nodeWidth?: number;
    nodeHeight?: number;

    // extra padding from edges
    padding?: number;
  },
): Pos {
  const nodeWidth = opts?.nodeWidth ?? 180;
  const nodeHeight = opts?.nodeHeight ?? 80;
  const padding = opts?.padding ?? 24;

  // pick container size (best) else fallback to window
  const rect = opts?.container?.getBoundingClientRect?.();

  const width =
    rect?.width ?? (typeof window !== "undefined" ? window.innerWidth : 1200);

  const height =
    rect?.height ?? (typeof window !== "undefined" ? window.innerHeight : 800);

  // center
  const centerX = width / 2;
  const centerY = height / 2;

  // random spread around center
  const xOffset = (Math.random() - 0.5) * offsetRange;
  const yOffset = (Math.random() - 0.5) * offsetRange;

  // clamp to keep node visible in container
  const minX = padding;
  const minY = padding;
  const maxX = Math.max(padding, width - nodeWidth - padding);
  const maxY = Math.max(padding, height - nodeHeight - padding);

  const x = Math.min(maxX, Math.max(minX, centerX + xOffset));
  const y = Math.min(maxY, Math.max(minY, centerY + yOffset));

  return { x, y };
}

export function truncateTitle(
  text: string | null | undefined,
  maxLength: number
): string {
  if (!text) return "";

  const trimmed = text.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}...`;
}