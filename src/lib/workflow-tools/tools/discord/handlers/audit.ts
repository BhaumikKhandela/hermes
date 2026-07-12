import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField, parseJSONField, paginateAfter } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleGetAuditLog(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_audit_log", "Guild ID");
    const limit = Math.min(input.limit ?? config?.limit ?? 50, 100);
    const returnAll = input.returnAll ?? config?.returnAll ?? false;
    const maxItems = input.maxItems ?? config?.maxItems ?? 10000;
    const client = createDiscordClient(config, "get_audit_log");
    if (returnAll) {
      const { items, hasMore } = await paginateAfter<any>(
        client,
        (a) => Routes.guildAuditLog(guildId),
        (r) => Array.isArray(r?.audit_log_entries) ? r.audit_log_entries : [],
        limit, maxItems, input.after ?? config?.after,
      );
      return { action: "get_audit_log", data: { guildId, entries: items, hasMore } };
    }
    const query: Record<string, string> = { limit: String(limit) };
    if (input.after ?? config?.after) query.after = input.after ?? config?.after;
    if (input.before ?? config?.before) query.before = input.before ?? config?.before;
    if (input.userId ?? config?.userId) query.user_id = input.userId ?? config?.userId;
    if (input.actionType ?? config?.actionType) query.action_type = String(input.actionType ?? config?.actionType);
    const res: any = await client.get(Routes.guildAuditLog(guildId), { query: new URLSearchParams(query) });
    return { action: "get_audit_log", data: { guildId, entries: Array.isArray(res?.audit_log_entries) ? res.audit_log_entries : [], ...(res?.users ? { users: res.users } : {}), ...(res?.integrations ? { integrations: res.integrations } : {}) } };
  } catch (error) { handleDiscordError("get_audit_log", error); }
}
