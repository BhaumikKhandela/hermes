import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField, parseJSONField, paginateAfter } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleListAutoModRules(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "list_auto_mod_rules", "Guild ID");
    const client = createDiscordClient(config, "list_auto_mod_rules");
    const res: any = await client.get(Routes.guildAutoModerationRules(guildId));
    return { action: "list_auto_mod_rules", data: { guildId, rules: Array.isArray(res) ? res : [] } };
  } catch (error) { handleDiscordError("list_auto_mod_rules", error); }
}

export async function handleGetAutoModRule(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "get_auto_mod_rule", "Guild ID");
    const ruleId = requireField(input.ruleId ?? config?.ruleId, "get_auto_mod_rule", "Rule ID");
    const client = createDiscordClient(config, "get_auto_mod_rule");
    const res: any = await client.get(Routes.guildAutoModerationRule(guildId, ruleId));
    return { action: "get_auto_mod_rule", data: { guildId, ruleId, rule: res } };
  } catch (error) { handleDiscordError("get_auto_mod_rule", error); }
}

export async function handleCreateAutoModRule(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "create_auto_mod_rule", "Guild ID");
    const name = requireField(input.name ?? config?.name, "create_auto_mod_rule", "Name");
    const eventType = requireField(input.eventType ?? config?.eventType, "create_auto_mod_rule", "Event Type");
    const triggerType = requireField(input.triggerType ?? config?.triggerType, "create_auto_mod_rule", "Trigger Type");
    const actions = requireField(input.actions ?? config?.actions, "create_auto_mod_rule", "Actions (JSON)");
    const client = createDiscordClient(config, "create_auto_mod_rule");
    const body: Record<string, any> = {
      name,
      event_type: Number(eventType),
      trigger_type: Number(triggerType),
      trigger_metadata: parseJSONField(input.triggerMetadata ?? config?.triggerMetadata, "trigger_metadata", "create_auto_mod_rule") ?? {},
      actions: parseJSONField(actions, "actions", "create_auto_mod_rule"),
    };
    if (input.enabled !== undefined || config?.enabled !== undefined) body.enabled = input.enabled ?? config?.enabled;
    if (input.reason ?? config?.reason) body.reason = input.reason ?? config?.reason;
    const res: any = await client.post(Routes.guildAutoModerationRules(guildId), { body });
    return { action: "create_auto_mod_rule", data: { guildId, ruleId: res.id as string, rule: res } };
  } catch (error) { handleDiscordError("create_auto_mod_rule", error); }
}

export async function handleModifyAutoModRule(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "modify_auto_mod_rule", "Guild ID");
    const ruleId = requireField(input.ruleId ?? config?.ruleId, "modify_auto_mod_rule", "Rule ID");
    const client = createDiscordClient(config, "modify_auto_mod_rule");
    const body: Record<string, any> = {};
    if (input.name ?? config?.name) body.name = input.name ?? config?.name;
    if (input.eventType ?? config?.eventType) body.event_type = Number(input.eventType ?? config?.eventType);
    if (input.triggerType ?? config?.triggerType) body.trigger_type = Number(input.triggerType ?? config?.triggerType);
    if (input.actions ?? config?.actions) body.actions = parseJSONField(input.actions ?? config?.actions, "actions", "modify_auto_mod_rule");
    if (input.enabled !== undefined || config?.enabled !== undefined) body.enabled = input.enabled ?? config?.enabled;
    if (input.reason ?? config?.reason) body.reason = input.reason ?? config?.reason;
    if (input.triggerMetadata ?? config?.triggerMetadata) body.trigger_metadata = parseJSONField(input.triggerMetadata ?? config?.triggerMetadata, "trigger_metadata", "modify_auto_mod_rule");
    const res: any = await client.patch(Routes.guildAutoModerationRule(guildId, ruleId), { body });
    return { action: "modify_auto_mod_rule", data: { guildId, ruleId, rule: res } };
  } catch (error) { handleDiscordError("modify_auto_mod_rule", error); }
}

export async function handleDeleteAutoModRule(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const guildId = requireField(input.guildId ?? config?.guildId, "delete_auto_mod_rule", "Guild ID");
    const ruleId = requireField(input.ruleId ?? config?.ruleId, "delete_auto_mod_rule", "Rule ID");
    const client = createDiscordClient(config, "delete_auto_mod_rule");
    await client.delete(Routes.guildAutoModerationRule(guildId, ruleId));
    return { action: "delete_auto_mod_rule", data: { guildId, ruleId } };
  } catch (error) { handleDiscordError("delete_auto_mod_rule", error); }
}
