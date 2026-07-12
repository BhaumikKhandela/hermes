export type SlackActionResult<T extends string, D> = { action: T; data: D };

export type SendMessageResult = SlackActionResult<"send_message", { channelId: string; messageTs: string; message: Record<string, any> }>;
export type UpdateMessageResult = SlackActionResult<"update_message", { channelId: string; messageTs: string; message: Record<string, any> }>;
export type DeleteMessageResult = SlackActionResult<"delete_message", { channelId: string; messageTs: string }>;
export type GetMessageResult = SlackActionResult<"get_message", { channelId: string; messageTs: string; message: Record<string, any> }>;
export type ListChannelHistoryResult = SlackActionResult<"list_channel_history", { channelId: string; messages: Record<string, any>[]; count: number; hasMore: boolean }>;
export type GetThreadRepliesResult = SlackActionResult<"get_thread_replies", { channelId: string; threadTs: string; messages: Record<string, any>[]; count: number; hasMore: boolean }>;
export type GetPermalinkResult = SlackActionResult<"get_permalink", { channelId: string; messageTs: string; permalink: string }>;
export type ScheduleMessageResult = SlackActionResult<"schedule_message", { channelId: string; scheduledMessageId: string; postAt: number; message: Record<string, any> }>;
export type ListScheduledMessagesResult = SlackActionResult<"list_scheduled_messages", { scheduledMessages: Record<string, any>[]; count: number }>;
export type DeleteScheduledMessageResult = SlackActionResult<"delete_scheduled_message", { channelId: string; scheduledMessageId: string }>;

export type AddReactionResult = SlackActionResult<"add_reaction", { channelId: string; messageTs: string; reaction: string }>;
export type RemoveReactionResult = SlackActionResult<"remove_reaction", { channelId: string; messageTs: string; reaction: string }>;
export type GetReactionsResult = SlackActionResult<"get_reactions", { channelId: string; messageTs: string; message: Record<string, any> }>;

export type PinMessageResult = SlackActionResult<"pin_message", { channelId: string; messageTs: string }>;
export type UnpinMessageResult = SlackActionResult<"unpin_message", { channelId: string; messageTs: string }>;
export type ListPinsResult = SlackActionResult<"list_pins", { channelId: string; pinnedItems: Record<string, any>[]; count: number }>;

export type ListConversationsResult = SlackActionResult<"list_conversations", { conversations: Record<string, any>[]; count: number }>;
export type GetConversationInfoResult = SlackActionResult<"get_conversation_info", { channelId: string; conversation: Record<string, any> }>;
export type OpenConversationResult = SlackActionResult<"open_conversation", { channelId: string; conversation: Record<string, any> }>;
export type CreateConversationResult = SlackActionResult<"create_conversation", { channelId: string; conversation: Record<string, any> }>;
export type RenameConversationResult = SlackActionResult<"rename_conversation", { channelId: string; name: string }>;
export type SetTopicResult = SlackActionResult<"set_topic", { channelId: string; topic: string }>;
export type SetPurposeResult = SlackActionResult<"set_purpose", { channelId: string; purpose: string }>;
export type ArchiveConversationResult = SlackActionResult<"archive_conversation", { channelId: string }>;
export type UnarchiveConversationResult = SlackActionResult<"unarchive_conversation", { channelId: string }>;
export type InviteUsersResult = SlackActionResult<"invite_users", { channelId: string; userIds: string[] }>;
export type KickUserResult = SlackActionResult<"kick_user", { channelId: string; userId: string }>;
export type JoinConversationResult = SlackActionResult<"join_conversation", { channelId: string }>;
export type LeaveConversationResult = SlackActionResult<"leave_conversation", { channelId: string }>;
export type GetMembersResult = SlackActionResult<"get_members", { channelId: string; memberIds: string[]; count: number }>;

export type ListUsersResult = SlackActionResult<"list_users", { users: Record<string, any>[]; count: number }>;
export type GetUserInfoResult = SlackActionResult<"get_user_info", { userId: string; user: Record<string, any> }>;
export type LookupUserByEmailResult = SlackActionResult<"lookup_user_by_email", { userId: string; email: string; user: Record<string, any> }>;
export type GetUserPresenceResult = SlackActionResult<"get_user_presence", { userId: string; presence: string; online: boolean; autoAway: boolean }>;

export type SearchMessagesResult = SlackActionResult<"search_messages", { query: string; messages: Record<string, any>[]; count: number; total: number }>;
export type SearchFilesResult = SlackActionResult<"search_files", { query: string; files: Record<string, any>[]; count: number; total: number }>;

export type UploadFileResult = SlackActionResult<"upload_file", { fileId: string; fileName: string; fileSize: number; channelId: string }>;
export type GetFileInfoResult = SlackActionResult<"get_file_info", { fileId: string; file: Record<string, any> }>;
export type DeleteFileResult = SlackActionResult<"delete_file", { fileId: string }>;
export type ListFilesResult = SlackActionResult<"list_files", { files: Record<string, any>[]; count: number }>;

export type AddBookmarkResult = SlackActionResult<"add_bookmark", { channelId: string; bookmarkId: string; title: string; link: string }>;
export type RemoveBookmarkResult = SlackActionResult<"remove_bookmark", { channelId: string; bookmarkId: string }>;
export type ListBookmarksResult = SlackActionResult<"list_bookmarks", { channelId: string; bookmarks: Record<string, any>[]; count: number }>;

export type CreateCanvasResult = SlackActionResult<"create_canvas", { canvasId: string; title: string }>;
export type EditCanvasResult = SlackActionResult<"edit_canvas", { canvasId: string }>;
export type DeleteCanvasResult = SlackActionResult<"delete_canvas", { canvasId: string }>;
export type SectionsLookupResult = SlackActionResult<"sections_lookup", { canvasId: string; sections: Record<string, any>[] }>;

export type SlackToolResult =
  | SendMessageResult | UpdateMessageResult | DeleteMessageResult | GetMessageResult
  | ListChannelHistoryResult | GetThreadRepliesResult | GetPermalinkResult
  | ScheduleMessageResult | ListScheduledMessagesResult | DeleteScheduledMessageResult
  | AddReactionResult | RemoveReactionResult | GetReactionsResult
  | PinMessageResult | UnpinMessageResult | ListPinsResult
  | ListConversationsResult | GetConversationInfoResult | OpenConversationResult
  | CreateConversationResult | RenameConversationResult | SetTopicResult | SetPurposeResult
  | ArchiveConversationResult | UnarchiveConversationResult | InviteUsersResult | KickUserResult
  | JoinConversationResult | LeaveConversationResult | GetMembersResult
  | ListUsersResult | GetUserInfoResult | LookupUserByEmailResult | GetUserPresenceResult
  | SearchMessagesResult | SearchFilesResult
  | UploadFileResult | GetFileInfoResult | DeleteFileResult | ListFilesResult
  | AddBookmarkResult | RemoveBookmarkResult | ListBookmarksResult
  | CreateCanvasResult | EditCanvasResult | DeleteCanvasResult | SectionsLookupResult;

export type SlackAction = SlackToolResult["action"];
