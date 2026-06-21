import type { ProviderAdapter } from "./types";

const registry = new Map<string, ProviderAdapter>();

export function registerProvider(adapter: ProviderAdapter): void {
  registry.set(adapter.provider, adapter);
}

export function getProvider(provider: string): ProviderAdapter {
  const adapter = registry.get(provider);
  if (!adapter) {
    throw new Error(`No provider registered for "${provider}"`);
  }
  return adapter;
}

export function listProviders(): string[] {
  return Array.from(registry.keys());
}
