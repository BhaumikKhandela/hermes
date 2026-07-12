import { Routes } from "discord-api-types/v10";
import { createDiscordClient, handleDiscordError } from "../client";
import { requireField } from "../utils";
import type { DiscordToolResult } from "../types";

export async function handleGetUser(input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const userId = requireField(input.userId ?? config?.userId, "get_user", "User ID");
    const client = createDiscordClient(config, "get_user");
    const res: any = await client.get(Routes.user(userId));
    return { action: "get_user", data: { userId, user: res } };
  } catch (error) { handleDiscordError("get_user", error); }
}

export async function handleGetCurrentUser(_input: Record<string, any>, config?: Record<string, any>): Promise<DiscordToolResult> {
  try {
    const client = createDiscordClient(config, "get_current_user");
    const res: any = await client.get(Routes.user());
    return { action: "get_current_user", data: { user: res } };
  } catch (error) { handleDiscordError("get_current_user", error); }
}
