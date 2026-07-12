import { z } from "zod";

export const slackActions = [
  "send_message", "update_message", "delete_message", "get_message",
  "list_channel_history", "get_thread_replies", "get_permalink",
  "schedule_message", "list_scheduled_messages", "delete_scheduled_message",
  "add_reaction", "remove_reaction", "get_reactions",
  "pin_message", "unpin_message", "list_pins",
  "list_conversations", "get_conversation_info", "open_conversation",
  "create_conversation", "rename_conversation", "set_topic", "set_purpose",
  "archive_conversation", "unarchive_conversation", "invite_users", "kick_user",
  "join_conversation", "leave_conversation", "get_members",
  "list_users", "get_user_info", "lookup_user_by_email", "get_user_presence",
  "search_messages", "search_files",
  "upload_file", "get_file_info", "delete_file", "list_files",
  "add_bookmark", "remove_bookmark", "list_bookmarks",
  "create_canvas", "edit_canvas", "delete_canvas", "sections_lookup",
] as const;

export const partialSlackSchema = z.object({
  action: z.enum(slackActions).optional(),

  // Composition
  compositionMode: z.enum(["text", "blocks"]).optional(),
  text: z.string().optional(),
  mrkdwn: z.boolean().optional(),
  blocks: z.string().optional(),
  fallbackText: z.string().optional(),

  // Common
  channelId: z.string().optional(),
  messageTs: z.string().optional(),
  threadTs: z.string().optional(),
  replyBroadcast: z.boolean().optional(),
  linkNames: z.boolean().optional(),
  unfurlLinks: z.boolean().optional(),
  unfurlMedia: z.boolean().optional(),

  // Scheduled messages
  postAt: z.number().optional(),
  scheduledMessageId: z.string().optional(),

  // Reactions
  reaction: z.string().optional(),

  // Conversations
  types: z.string().optional(),
  excludeArchived: z.boolean().optional(),
  includeNumMembers: z.boolean().optional(),
  name: z.string().optional(),
  isPrivate: z.boolean().optional(),
  topic: z.string().optional(),
  purpose: z.string().optional(),
  users: z.string().optional(),
  userId: z.string().optional(),
  force: z.boolean().optional(),
  returnIm: z.boolean().optional(),
  preventCreation: z.boolean().optional(),

  // History / thread
  limit: z.number().min(1).max(999).optional(),
  oldest: z.string().optional(),
  latest: z.string().optional(),
  inclusive: z.boolean().optional(),
  includeAllMetadata: z.boolean().optional(),
  returnAll: z.boolean().optional(),
  maxItems: z.number().min(1).max(10000).optional(),

  // Search
  query: z.string().optional(),
  sort: z.enum(["score", "timestamp"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  count: z.number().optional(),
  highlight: z.boolean().optional(),
  page: z.number().optional(),

  // Files
  filename: z.string().optional(),
  content: z.string().optional(),
  initialComment: z.string().optional(),
  altText: z.string().optional(),
  title: z.string().optional(),
  fileId: z.string().optional(),
  tsFrom: z.string().optional(),
  tsTo: z.string().optional(),

  // Bookmarks
  link: z.string().optional(),
  emoji: z.string().optional(),
  bookmarkId: z.string().optional(),

  // Canvases
  canvasId: z.string().optional(),
  canvasContent: z.string().optional(),

  // Users
  email: z.string().email().optional(),
  presence: z.string().optional(),
});
