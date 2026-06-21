import type { ModelInfo } from "./types";

const CACHE_TTL_MS = 60 * 60 * 1000;

type CacheEntry = {
  data: ModelInfo[];
  expiresAt: number;
};

const store = new Map<string, CacheEntry>();

export function getCachedModels(key: string): ModelInfo[] | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedModels(key: string, data: ModelInfo[]): void {
  store.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}
