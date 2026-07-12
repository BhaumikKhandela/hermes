import { REST } from "@discordjs/rest";
import type { APIActionRowComponent, APIMessageActionRowComponent } from "discord-api-types/v10";
import { MessageComponentType } from "discord-api-types/v10";
import { Snowflake } from "discord-api-types/v10";

export function requireField(value: unknown, action: string, fieldLabel: string): string {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Discord ${action}: ${fieldLabel} is required.`);
  }
  return String(value);
}

export function requireFieldRaw<T>(value: T | undefined | null, action: string, fieldLabel: string): T {
  if (value === undefined || value === null || (typeof value === "string" && value === "")) {
    throw new Error(`Discord ${action}: ${fieldLabel} is required.`);
  }
  return value as T;
}

export function parseJSONField(value: string | undefined | null, fieldLabel: string, action: string): any {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch (e: any) {
    throw new Error(`Discord ${action}: Invalid ${fieldLabel} JSON — ${e.message}`);
  }
}

export function parseJSONFieldWithValidation<T>(
  value: string | undefined | null,
  fieldLabel: string,
  action: string,
  validate: (parsed: any) => T,
): T | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return validate(parsed);
  } catch (e: any) {
    throw new Error(`Discord ${action}: Invalid ${fieldLabel} JSON — ${e.message}`);
  }
}

export function parseStickerIds(value: string | undefined | null): Snowflake[] | undefined {
  if (!value) return undefined;
  const ids = value.split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return undefined;
  return ids as Snowflake[];
}

function tryParseJSON(value: string, fieldLabel: string): any {
  try {
    return JSON.parse(value);
  } catch (e: any) {
    throw new Error(`Invalid ${fieldLabel} JSON — ${e.message}`);
  }
}

export function validateMessageComponents(value: string | undefined | null): any {
  if (!value) return undefined;
  const parsed = tryParseJSON(value, "components");
  if (!Array.isArray(parsed)) throw new Error("Components must be an array of action rows.");
  for (const row of parsed) {
    if (row.type !== 1) throw new Error("Each component row must have type 1 (Action Row).");
    if (!Array.isArray(row.components)) throw new Error("Each action row must have a components array.");
    for (const comp of row.components) {
      if (comp.type === 4) {
        throw new Error("TextInput components (type 4) are not supported in message components.");
      }
    }
  }
  if (parsed.length > 5) throw new Error("Maximum of 5 action rows allowed.");
  return parsed;
}

export function validateMessageEmbeds(value: string | undefined | null): any {
  if (!value) return undefined;
  const parsed = tryParseJSON(value, "embeds");
  if (!Array.isArray(parsed)) throw new Error("Embeds must be an array.");
  if (parsed.length > 10) throw new Error("Maximum of 10 embeds allowed.");
  for (const embed of parsed) {
    if (embed.title && typeof embed.title === "string" && embed.title.length > 256) {
      throw new Error("Embed title must be 256 characters or fewer.");
    }
    if (embed.description && typeof embed.description === "string" && embed.description.length > 4096) {
      throw new Error("Embed description must be 4096 characters or fewer.");
    }
    if (embed.fields && Array.isArray(embed.fields) && embed.fields.length > 25) {
      throw new Error("Maximum of 25 embed fields allowed.");
    }
  }
  return parsed;
}

export async function paginateAfter<T>(
  rest: REST,
  routeBuilder: (after?: Snowflake) => string,
  extractItems: (result: any) => T[],
  limit: number,
  maxItems: number,
  initialAfter?: Snowflake,
): Promise<{ items: T[]; hasMore: boolean }> {
  const allItems: T[] = [];
  let after = initialAfter;
  let hasMore = false;

  while (allItems.length < maxItems) {
    const route = routeBuilder(after);
    const result: any = await rest.get(route, {
      query: new URLSearchParams({ limit: String(limit), ...(after ? { after } : {}) }),
    });
    const items = extractItems(result);
    if (items.length === 0) break;
    allItems.push(...items);
    if (allItems.length >= maxItems) {
      hasMore = items.length >= limit;
      break;
    }
    if (items.length < limit) break;
    const last = items[items.length - 1] as any;
    after = last.id ?? last.user?.id;
    if (!after) break;
  }

  return { items: allItems.slice(0, maxItems), hasMore };
}

export async function paginateArchivedThreads(
  rest: REST,
  route: string,
  limit: number,
  maxItems: number,
  initialBefore?: string,
): Promise<{ items: Record<string, any>[]; hasMore: boolean }> {
  const allItems: Record<string, any>[] = [];
  let before = initialBefore;
  let previousBefore: string | undefined;
  let hasMore = false;

  while (allItems.length < maxItems) {
    const params: Record<string, string> = { limit: String(limit) };
    if (before) params.before = before;
    const result: any = await rest.get(route, {
      query: new URLSearchParams(params),
    });
    const threads: Record<string, any>[] = result.threads ?? [];
    if (threads.length === 0) break;
    allItems.push(...threads);
    if (allItems.length >= maxItems) {
      hasMore = threads.length >= limit;
      break;
    }
    if (threads.length < limit) break;
    const last = threads[threads.length - 1];
    const nextBefore = last.thread_metadata?.archive_timestamp ?? last.id;
    if (!nextBefore) break;
    if (nextBefore === previousBefore || nextBefore === before) break;
    previousBefore = before;
    before = nextBefore;
  }

  return { items: allItems.slice(0, maxItems), hasMore };
}

export function isStringRecord(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
