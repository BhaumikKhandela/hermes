import { tool } from "@langchain/core/tools";
import { ToolFactory } from "../../types";
import { discordSchema } from "./schema";
import * as H from "./handlers";

export const handlerMap: Record<string, Function> = {
  // Channels
  get_channel: H.handleGetChannel,
  modify_channel: H.handleModifyChannel,
  delete_channel: H.handleDeleteChannel,
  // Messages
  get_channel_messages: H.handleListChannelMessages,
  get_message: H.handleGetMessage,
  send_message: H.handleSendMessage,
  edit_message: H.handleEditMessage,
  delete_message: H.handleDeleteMessage,
  bulk_delete_messages: H.handleBulkDeleteMessages,
  get_pinned_messages: H.handleListPinnedMessages,
  pin_message: H.handlePinMessage,
  unpin_message: H.handleUnpinMessage,
  crosspost_message: H.handleCrosspostMessage,
  // Reactions
  get_reactions: H.handleGetReactions,
  create_reaction: H.handleAddReaction,
  delete_own_reaction: H.handleRemoveReaction,
  delete_user_reaction: H.handleRemoveUserReaction,
  clear_reactions: H.handleClearReactions,
  // Threads
  create_thread: H.handleCreateThread,
  join_thread: H.handleJoinThread,
  leave_thread: H.handleLeaveThread,
  add_thread_member: H.handleAddThreadMember,
  remove_thread_member: H.handleRemoveThreadMember,
  get_thread_member: H.handleGetThreadMember,
  list_thread_members: H.handleListThreadMembers,
  list_active_threads: H.handleListActiveThreads,
  list_public_archived_threads: H.handleListPublicArchivedThreads,
  list_private_archived_threads: H.handleListPrivateArchivedThreads,
  list_joined_archived_threads: H.handleListJoinedArchivedThreads,
  // Guilds
  get_guild: H.handleGetGuild,
  get_guild_preview: H.handleGetGuildPreview,
  modify_guild: H.handleModifyGuild,
  get_guild_prune_count: H.handleGetGuildPruneCount,
  begin_guild_prune: H.handleBeginGuildPrune,
  get_guild_voice_regions: H.handleGetGuildVoiceRegions,
  get_guild_invites: H.handleGetGuildInvites,
  get_guild_widget: H.handleGetGuildWidget,
  get_guild_vanity_url: H.handleGetGuildVanityUrl,
  get_guild_welcome_screen: H.handleGetGuildWelcomeScreen,
  update_guild_welcome_screen: H.handleUpdateGuildWelcomeScreen,
  get_guild_onboarding: H.handleGetGuildOnboarding,
  update_guild_onboarding: H.handleUpdateGuildOnboarding,
  // Members
  get_member: H.handleGetMember,
  list_members: H.handleListMembers,
  search_members: H.handleSearchMembers,
  modify_member: H.handleModifyMember,
  add_member_role: H.handleAddMemberRole,
  remove_member_role: H.handleRemoveMemberRole,
  kick_member: H.handleKickMember,
  get_bans: H.handleGetBans,
  get_ban: H.handleGetBan,
  create_ban: H.handleCreateBan,
  remove_ban: H.handleRemoveBan,
  // Users
  get_user: H.handleGetUser,
  get_current_user: H.handleGetCurrentUser,
  // Roles
  get_roles: H.handleGetRoles,
  create_role: H.handleCreateRole,
  modify_role: H.handleModifyRole,
  modify_role_positions: H.handleModifyRolePositions,
  delete_role: H.handleDeleteRole,
  // Webhooks
  get_channel_webhooks: H.handleGetChannelWebhooks,
  get_guild_webhooks: H.handleGetGuildWebhooks,
  create_webhook: H.handleCreateWebhook,
  modify_webhook: H.handleModifyWebhook,
  delete_webhook: H.handleDeleteWebhook,
  execute_webhook: H.handleExecuteWebhook,
  // Invites
  get_channel_invites: H.handleGetChannelInvites,
  create_invite: H.handleCreateInvite,
  delete_invite: H.handleDeleteInvite,
  // Scheduled Events
  list_scheduled_events: H.handleListScheduledEvents,
  create_scheduled_event: H.handleCreateScheduledEvent,
  get_scheduled_event: H.handleGetScheduledEvent,
  modify_scheduled_event: H.handleModifyScheduledEvent,
  delete_scheduled_event: H.handleDeleteScheduledEvent,
  get_scheduled_event_users: H.handleGetScheduledEventUsers,
  // Emojis
  get_emojis: H.handleGetEmojis,
  get_emoji: H.handleGetEmoji,
  create_emoji: H.handleCreateEmoji,
  modify_emoji: H.handleModifyEmoji,
  delete_emoji: H.handleDeleteEmoji,
  // Stickers
  get_stickers: H.handleGetStickers,
  get_sticker: H.handleGetSticker,
  create_sticker: H.handleCreateSticker,
  modify_sticker: H.handleModifySticker,
  delete_sticker: H.handleDeleteSticker,
  // Auto Moderation
  list_auto_mod_rules: H.handleListAutoModRules,
  get_auto_mod_rule: H.handleGetAutoModRule,
  create_auto_mod_rule: H.handleCreateAutoModRule,
  modify_auto_mod_rule: H.handleModifyAutoModRule,
  delete_auto_mod_rule: H.handleDeleteAutoModRule,
  // Stage Instances
  create_stage_instance: H.handleCreateStageInstance,
  get_stage_instance: H.handleGetStageInstance,
  modify_stage_instance: H.handleModifyStageInstance,
  delete_stage_instance: H.handleDeleteStageInstance,
  // Application Commands
  get_global_commands: H.handleGetGlobalCommands,
  create_global_command: H.handleCreateGlobalCommand,
  get_guild_commands: H.handleGetGuildCommands,
  create_guild_command: H.handleCreateGuildCommand,
  bulk_overwrite_commands: H.handleBulkOverwriteCommands,
  // Audit Log
  get_audit_log: H.handleGetAuditLog,
};

export { discordSchema };

export const createDiscordTool: ToolFactory = (config) => {
  return tool(
    async (input) => {
      const parsed = discordSchema.parse(input);
      const action = parsed.action || config?.action;
      if (!action) throw new Error("Discord tool: action is required.");
      const handler = handlerMap[action];
      if (!handler) throw new Error(`Discord tool: unknown action "${action}".`);
      const result = await handler(parsed, config);
      return JSON.stringify(result);
    },
    {
      name: "discord",
      description:
        "Execute Discord Bot API actions across 17 categories and 112+ operations: channels, messages, reactions, threads, guilds, members, users, roles, webhooks, invites, scheduled events, emojis, stickers, auto-moderation, stage instances, application commands, and audit log. Uses Bot Token authentication. Falls back to configured values when arguments are omitted.",
      schema: discordSchema,
    },
  );
};
