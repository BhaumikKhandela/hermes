import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleCreateStageInstance(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "create_stage_instance", "Channel ID");
    const topic = requireField(input.topic ?? config?.topic, "create_stage_instance", "Topic");
    const client = createDiscordClient(config, "create_stage_instance");
    const body: Record<string, any> = { channel_id: channelId, topic };
    if (input.privacyLevel ?? config?.privacyLevel) body.privacy_level = input.privacyLevel ?? config?.privacyLevel;
    const res: any = await client.post(Routes.stageInstances(), { body });
    return { action: "create_stage_instance", data: { channelId, stageInstanceId: res.id as string, stageInstance: res } };
  } catch (error) { handleDiscordError("create_stage_instance", error); }
}

export async function handleGetStageInstance(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "get_stage_instance", "Channel ID");
    const client = createDiscordClient(config, "get_stage_instance");
    const res: any = await client.get(Routes.stageInstance(channelId));
    return { action: "get_stage_instance", data: { channelId, stageInstance: res } };
  } catch (error) { handleDiscordError("get_stage_instance", error); }
}

export async function handleModifyStageInstance(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "modify_stage_instance", "Channel ID");
    const client = createDiscordClient(config, "modify_stage_instance");
    const body: Record<string, any> = {};
    if (input.topic ?? config?.topic) body.topic = input.topic ?? config?.topic;
    if (input.privacyLevel ?? config?.privacyLevel) body.privacy_level = input.privacyLevel ?? config?.privacyLevel;
    const res: any = await client.patch(Routes.stageInstance(channelId), { body });
    return { action: "modify_stage_instance", data: { channelId, stageInstance: res } };
  } catch (error) { handleDiscordError("modify_stage_instance", error); }
}

export async function handleDeleteStageInstance(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const channelId = requireField(input.channelId ?? config?.channelId, "delete_stage_instance", "Channel ID");
    const client = createDiscordClient(config, "delete_stage_instance");
    await client.delete(Routes.stageInstance(channelId));
    return { action: "delete_stage_instance", data: { channelId } };
  } catch (error) { handleDiscordError("delete_stage_instance", error); }
}
