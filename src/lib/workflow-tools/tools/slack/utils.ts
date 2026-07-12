export function stripColons(emoji: string): string {
  return emoji.replace(/^:/, "").replace(/:$/, "");
}

export function validateBlocks(json: string, maxBlocks = 50): Record<string, any>[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e: any) {
    throw new Error(`Invalid Block Kit JSON: ${e?.message ?? "parse error"}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Block Kit Blocks must be a JSON array.");
  }
  if (parsed.length > maxBlocks) {
    throw new Error(`Block Kit supports at most ${maxBlocks} blocks per message.`);
  }
  for (const [i, block] of parsed.entries()) {
    if (typeof block !== "object" || block === null || Array.isArray(block)) {
      throw new Error(`Block Kit block at index ${i} must be an object.`);
    }
  }
  return parsed as Record<string, any>[];
}

export function requireField(value: string | undefined | null, action: string, fieldLabel: string): string {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    throw new Error(`Slack ${action} failed: ${fieldLabel} is required. Provide it as a tool argument or configure it in the node settings.`);
  }
  return value;
}

export function requireFieldRaw<T>(value: T | undefined | null, action: string, fieldLabel: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Slack ${action} failed: ${fieldLabel} is required. Provide it as a tool argument or configure it in the node settings.`);
  }
  return value;
}
