export type DiscordActionResult<T extends string, D> = { action: T; data: D };

export type SendMessageResult = DiscordActionResult<"send_message", { channelId: string; messageId: string; message: Record<string, any> }>;
export type GetMessageResult = DiscordActionResult<"get_message", { channelId: string; messageId: string; message: Record<string, any> }>;
export type EditMessageResult = DiscordActionResult<"edit_message", { channelId: string; messageId: string; message: Record<string, any> }>;
export type DeleteMessageResult = DiscordActionResult<"delete_message", { channelId: string; messageId: string }>;
export type BulkDeleteMessagesResult = DiscordActionResult<"bulk_delete_messages", { channelId: string; count: number }>;
export type ListChannelMessagesResult = DiscordActionResult<"list_channel_messages", { channelId: string; messages: Record<string, any>[]; hasMore: boolean }>;
export type CrosspostMessageResult = DiscordActionResult<"crosspost_message", { channelId: string; messageId: string; message: Record<string, any> }>;
export type PinMessageResult = DiscordActionResult<"pin_message", { channelId: string; messageId: string }>;
export type UnpinMessageResult = DiscordActionResult<"unpin_message", { channelId: string; messageId: string }>;
export type ListPinnedMessagesResult = DiscordActionResult<"list_pinned_messages", { channelId: string; messages: Record<string, any>[] }>;

export type AddReactionResult = DiscordActionResult<"add_reaction", { channelId: string; messageId: string; emoji: string }>;
export type RemoveReactionResult = DiscordActionResult<"remove_reaction", { channelId: string; messageId: string; emoji: string }>;
export type RemoveUserReactionResult = DiscordActionResult<"remove_user_reaction", { channelId: string; messageId: string; emoji: string; userId: string }>;
export type GetReactionsResult = DiscordActionResult<"get_reactions", { channelId: string; messageId: string; emoji: string; users: Record<string, any>[] }>;
export type ClearReactionsResult = DiscordActionResult<"clear_reactions", { channelId: string; messageId: string }>;
export type ClearReactionEmojiResult = DiscordActionResult<"clear_reaction_emoji", { channelId: string; messageId: string; emoji: string }>;

export type GetChannelResult = DiscordActionResult<"get_channel", { channelId: string; channel: Record<string, any> }>;
export type ModifyChannelResult = DiscordActionResult<"modify_channel", { channelId: string; channel: Record<string, any> }>;
export type DeleteChannelResult = DiscordActionResult<"delete_channel", { channelId: string }>;
export type CreateChannelResult = DiscordActionResult<"create_channel", { guildId: string; channelId: string; channel: Record<string, any> }>;
export type ListChannelsResult = DiscordActionResult<"list_channels", { guildId: string; channels: Record<string, any>[] }>;
export type FollowChannelResult = DiscordActionResult<"follow_channel", { channelId: string; webhookId: string }>;

export type StartThreadFromMessageResult = DiscordActionResult<"start_thread_from_message", { channelId: string; threadId: string; thread: Record<string, any> }>;
export type StartThreadWithoutMessageResult = DiscordActionResult<"start_thread_without_message", { channelId: string; threadId: string; thread: Record<string, any> }>;
export type CreateForumThreadResult = DiscordActionResult<"create_forum_thread", { channelId: string; threadId: string; thread: Record<string, any> }>;
export type JoinThreadResult = DiscordActionResult<"join_thread", { threadId: string }>;
export type LeaveThreadResult = DiscordActionResult<"leave_thread", { threadId: string }>;
export type AddThreadMemberResult = DiscordActionResult<"add_thread_member", { threadId: string; userId: string }>;
export type RemoveThreadMemberResult = DiscordActionResult<"remove_thread_member", { threadId: string; userId: string }>;
export type GetThreadMemberResult = DiscordActionResult<"get_thread_member", { threadId: string; userId: string; member: Record<string, any> | null }>;
export type ListThreadMembersResult = DiscordActionResult<"list_thread_members", { threadId: string; members: Record<string, any>[] }>;
export type ListActiveThreadsResult = DiscordActionResult<"list_active_threads", { guildId: string; threads: Record<string, any>[] }>;
export type ListPublicArchivedThreadsResult = DiscordActionResult<"list_public_archived_threads", { channelId: string; threads: Record<string, any>[]; hasMore: boolean }>;
export type ListPrivateArchivedThreadsResult = DiscordActionResult<"list_private_archived_threads", { channelId: string; threads: Record<string, any>[]; hasMore: boolean }>;
export type ListJoinedArchivedThreadsResult = DiscordActionResult<"list_joined_archived_threads", { channelId: string; threads: Record<string, any>[]; hasMore: boolean }>;

export type GetGuildResult = DiscordActionResult<"get_guild", { guildId: string; guild: Record<string, any> }>;
export type GetGuildPreviewResult = DiscordActionResult<"get_guild_preview", { guildId: string; preview: Record<string, any> }>;
export type ModifyGuildResult = DiscordActionResult<"modify_guild", { guildId: string; guild: Record<string, any> }>;
export type GetGuildPruneCountResult = DiscordActionResult<"get_guild_prune_count", { guildId: string; pruned: number }>;
export type BeginGuildPruneResult = DiscordActionResult<"begin_guild_prune", { guildId: string; pruned: number }>;
export type GetGuildVoiceRegionsResult = DiscordActionResult<"get_guild_voice_regions", { guildId: string; regions: Record<string, any>[] }>;
export type GetGuildInvitesResult = DiscordActionResult<"get_guild_invites", { guildId: string; invites: Record<string, any>[] }>;
export type GetGuildWidgetResult = DiscordActionResult<"get_guild_widget", { guildId: string; widget: Record<string, any> }>;
export type GetGuildVanityUrlResult = DiscordActionResult<"get_guild_vanity_url", { guildId: string; vanityUrl: string | null }>;
export type GetGuildWelcomeScreenResult = DiscordActionResult<"get_guild_welcome_screen", { guildId: string; welcomeScreen: Record<string, any> }>;
export type UpdateGuildWelcomeScreenResult = DiscordActionResult<"update_guild_welcome_screen", { guildId: string; welcomeScreen: Record<string, any> }>;
export type GetGuildOnboardingResult = DiscordActionResult<"get_guild_onboarding", { guildId: string; onboarding: Record<string, any> }>;
export type UpdateGuildOnboardingResult = DiscordActionResult<"update_guild_onboarding", { guildId: string; onboarding: Record<string, any> }>;

export type GetMemberResult = DiscordActionResult<"get_member", { guildId: string; userId: string; member: Record<string, any> }>;
export type ListMembersResult = DiscordActionResult<"list_members", { guildId: string; members: Record<string, any>[]; hasMore: boolean }>;
export type SearchMembersResult = DiscordActionResult<"search_members", { guildId: string; members: Record<string, any>[] }>;
export type ModifyMemberResult = DiscordActionResult<"modify_member", { guildId: string; userId: string; member: Record<string, any> }>;
export type AddMemberRoleResult = DiscordActionResult<"add_member_role", { guildId: string; userId: string; roleId: string }>;
export type RemoveMemberRoleResult = DiscordActionResult<"remove_member_role", { guildId: string; userId: string; roleId: string }>;
export type KickMemberResult = DiscordActionResult<"kick_member", { guildId: string; userId: string }>;
export type GetBansResult = DiscordActionResult<"get_bans", { guildId: string; bans: Record<string, any>[]; hasMore: boolean }>;
export type GetBanResult = DiscordActionResult<"get_ban", { guildId: string; userId: string; ban: Record<string, any> }>;
export type CreateBanResult = DiscordActionResult<"create_ban", { guildId: string; userId: string }>;
export type RemoveBanResult = DiscordActionResult<"remove_ban", { guildId: string; userId: string }>;

export type GetUserResult = DiscordActionResult<"get_user", { userId: string; user: Record<string, any> }>;
export type GetCurrentUserResult = DiscordActionResult<"get_current_user", { user: Record<string, any> }>;

export type GetRolesResult = DiscordActionResult<"get_roles", { guildId: string; roles: Record<string, any>[] }>;
export type CreateRoleResult = DiscordActionResult<"create_role", { guildId: string; roleId: string; role: Record<string, any> }>;
export type ModifyRoleResult = DiscordActionResult<"modify_role", { guildId: string; roleId: string; role: Record<string, any> }>;
export type ModifyRolePositionsResult = DiscordActionResult<"modify_role_positions", { guildId: string; roles: Record<string, any>[] }>;
export type DeleteRoleResult = DiscordActionResult<"delete_role", { guildId: string; roleId: string }>;

export type CreateWebhookResult = DiscordActionResult<"create_webhook", { channelId: string; webhookId: string; webhook: Record<string, any> }>;
export type GetChannelWebhooksResult = DiscordActionResult<"get_channel_webhooks", { channelId: string; webhooks: Record<string, any>[] }>;
export type GetGuildWebhooksResult = DiscordActionResult<"get_guild_webhooks", { guildId: string; webhooks: Record<string, any>[] }>;
export type GetWebhookResult = DiscordActionResult<"get_webhook", { webhookId: string; webhook: Record<string, any> }>;
export type ModifyWebhookResult = DiscordActionResult<"modify_webhook", { webhookId: string; webhook: Record<string, any> }>;
export type DeleteWebhookResult = DiscordActionResult<"delete_webhook", { webhookId: string }>;
export type ExecuteWebhookResult = DiscordActionResult<"execute_webhook", { webhookId: string; messageId: string | null }>;
export type GetWebhookMessageResult = DiscordActionResult<"get_webhook_message", { webhookId: string; messageId: string; message: Record<string, any> }>;
export type EditWebhookMessageResult = DiscordActionResult<"edit_webhook_message", { webhookId: string; messageId: string; message: Record<string, any> }>;
export type DeleteWebhookMessageResult = DiscordActionResult<"delete_webhook_message", { webhookId: string; messageId: string }>;

export type GetInviteResult = DiscordActionResult<"get_invite", { inviteCode: string; invite: Record<string, any> }>;
export type CreateInviteResult = DiscordActionResult<"create_invite", { channelId: string; code: string; invite: Record<string, any> }>;
export type DeleteInviteResult = DiscordActionResult<"delete_invite", { inviteCode: string }>;

export type ListScheduledEventsResult = DiscordActionResult<"list_scheduled_events", { guildId: string; events: Record<string, any>[] }>;
export type GetScheduledEventResult = DiscordActionResult<"get_scheduled_event", { guildId: string; scheduledEventId: string; event: Record<string, any> }>;
export type CreateScheduledEventResult = DiscordActionResult<"create_scheduled_event", { guildId: string; scheduledEventId: string; event: Record<string, any> }>;
export type ModifyScheduledEventResult = DiscordActionResult<"modify_scheduled_event", { guildId: string; scheduledEventId: string; event: Record<string, any> }>;
export type DeleteScheduledEventResult = DiscordActionResult<"delete_scheduled_event", { guildId: string; scheduledEventId: string }>;
export type GetScheduledEventUsersResult = DiscordActionResult<"get_scheduled_event_users", { guildId: string; scheduledEventId: string; users: Record<string, any>[]; hasMore: boolean }>;

export type ListEmojisResult = DiscordActionResult<"list_emojis", { guildId: string; emojis: Record<string, any>[] }>;
export type GetEmojiResult = DiscordActionResult<"get_emoji", { guildId: string; emojiId: string; emoji: Record<string, any> }>;
export type CreateEmojiResult = DiscordActionResult<"create_emoji", { guildId: string; emojiId: string; emoji: Record<string, any> }>;
export type ModifyEmojiResult = DiscordActionResult<"modify_emoji", { guildId: string; emojiId: string; emoji: Record<string, any> }>;
export type DeleteEmojiResult = DiscordActionResult<"delete_emoji", { guildId: string; emojiId: string }>;

export type ListGuildStickersResult = DiscordActionResult<"list_guild_stickers", { guildId: string; stickers: Record<string, any>[] }>;
export type GetGuildStickerResult = DiscordActionResult<"get_guild_sticker", { guildId: string; stickerId: string; sticker: Record<string, any> }>;
export type ModifyStickerResult = DiscordActionResult<"modify_sticker", { guildId: string; stickerId: string; sticker: Record<string, any> }>;
export type DeleteStickerResult = DiscordActionResult<"delete_sticker", { guildId: string; stickerId: string }>;
export type GetStickerResult = DiscordActionResult<"get_sticker", { stickerId: string; sticker: Record<string, any> }>;
export type ListStickerPacksResult = DiscordActionResult<"list_sticker_packs", { stickerPacks: Record<string, any>[] }>;

export type ListAutoModerationRulesResult = DiscordActionResult<"list_auto_moderation_rules", { guildId: string; rules: Record<string, any>[] }>;
export type GetAutoModerationRuleResult = DiscordActionResult<"get_auto_moderation_rule", { guildId: string; ruleId: string; rule: Record<string, any> }>;
export type CreateAutoModerationRuleResult = DiscordActionResult<"create_auto_moderation_rule", { guildId: string; ruleId: string; rule: Record<string, any> }>;
export type ModifyAutoModerationRuleResult = DiscordActionResult<"modify_auto_moderation_rule", { guildId: string; ruleId: string; rule: Record<string, any> }>;
export type DeleteAutoModerationRuleResult = DiscordActionResult<"delete_auto_moderation_rule", { guildId: string; ruleId: string }>;

export type CreateStageInstanceResult = DiscordActionResult<"create_stage_instance", { channelId: string; stageInstance: Record<string, any> }>;
export type GetStageInstanceResult = DiscordActionResult<"get_stage_instance", { channelId: string; stageInstance: Record<string, any> }>;
export type ModifyStageInstanceResult = DiscordActionResult<"modify_stage_instance", { channelId: string; stageInstance: Record<string, any> }>;
export type DeleteStageInstanceResult = DiscordActionResult<"delete_stage_instance", { channelId: string }>;

export type ListGuildCommandsResult = DiscordActionResult<"list_guild_commands", { applicationId: string; guildId: string; commands: Record<string, any>[] }>;
export type CreateGuildCommandResult = DiscordActionResult<"create_guild_command", { applicationId: string; guildId: string; commandId: string; command: Record<string, any> }>;
export type GetGuildCommandResult = DiscordActionResult<"get_guild_command", { applicationId: string; guildId: string; commandId: string; command: Record<string, any> }>;
export type EditGuildCommandResult = DiscordActionResult<"edit_guild_command", { applicationId: string; guildId: string; commandId: string; command: Record<string, any> }>;
export type DeleteGuildCommandResult = DiscordActionResult<"delete_guild_command", { applicationId: string; guildId: string; commandId: string }>;
export type BulkOverwriteGuildCommandsResult = DiscordActionResult<"bulk_overwrite_guild_commands", { applicationId: string; guildId: string; commands: Record<string, any>[] }>;

export type GetAuditLogResult = DiscordActionResult<"get_audit_log", { guildId: string; auditLog: Record<string, any>; hasMore: boolean }>;

export type DiscordToolResult =
  | SendMessageResult | GetMessageResult | EditMessageResult | DeleteMessageResult | BulkDeleteMessagesResult | ListChannelMessagesResult | CrosspostMessageResult
  | PinMessageResult | UnpinMessageResult | ListPinnedMessagesResult
  | AddReactionResult | RemoveReactionResult | RemoveUserReactionResult | GetReactionsResult | ClearReactionsResult | ClearReactionEmojiResult
  | GetChannelResult | ModifyChannelResult | DeleteChannelResult | CreateChannelResult | ListChannelsResult | FollowChannelResult
  | StartThreadFromMessageResult | StartThreadWithoutMessageResult | CreateForumThreadResult
  | JoinThreadResult | LeaveThreadResult | AddThreadMemberResult | RemoveThreadMemberResult | GetThreadMemberResult | ListThreadMembersResult
  | ListActiveThreadsResult | ListPublicArchivedThreadsResult | ListPrivateArchivedThreadsResult | ListJoinedArchivedThreadsResult
  | GetGuildResult | GetGuildPreviewResult | ModifyGuildResult | GetGuildPruneCountResult | BeginGuildPruneResult
  | GetGuildVoiceRegionsResult | GetGuildInvitesResult | GetGuildWidgetResult | GetGuildVanityUrlResult
  | GetGuildWelcomeScreenResult | UpdateGuildWelcomeScreenResult | GetGuildOnboardingResult | UpdateGuildOnboardingResult
  | GetMemberResult | ListMembersResult | SearchMembersResult | ModifyMemberResult | AddMemberRoleResult | RemoveMemberRoleResult
  | KickMemberResult | GetBansResult | GetBanResult | CreateBanResult | RemoveBanResult
  | GetUserResult | GetCurrentUserResult
  | GetRolesResult | CreateRoleResult | ModifyRoleResult | ModifyRolePositionsResult | DeleteRoleResult
  | CreateWebhookResult | GetChannelWebhooksResult | GetGuildWebhooksResult | GetWebhookResult | ModifyWebhookResult | DeleteWebhookResult
  | ExecuteWebhookResult | GetWebhookMessageResult | EditWebhookMessageResult | DeleteWebhookMessageResult
  | GetInviteResult | CreateInviteResult | DeleteInviteResult
  | ListScheduledEventsResult | GetScheduledEventResult | CreateScheduledEventResult | ModifyScheduledEventResult | DeleteScheduledEventResult | GetScheduledEventUsersResult
  | ListEmojisResult | GetEmojiResult | CreateEmojiResult | ModifyEmojiResult | DeleteEmojiResult
  | ListGuildStickersResult | GetGuildStickerResult | ModifyStickerResult | DeleteStickerResult | GetStickerResult | ListStickerPacksResult
  | ListAutoModerationRulesResult | GetAutoModerationRuleResult | CreateAutoModerationRuleResult | ModifyAutoModerationRuleResult | DeleteAutoModerationRuleResult
  | CreateStageInstanceResult | GetStageInstanceResult | ModifyStageInstanceResult | DeleteStageInstanceResult
  | ListGuildCommandsResult | CreateGuildCommandResult | GetGuildCommandResult | EditGuildCommandResult | DeleteGuildCommandResult | BulkOverwriteGuildCommandsResult
  | GetAuditLogResult;

export type DiscordAction = DiscordToolResult["action"];
