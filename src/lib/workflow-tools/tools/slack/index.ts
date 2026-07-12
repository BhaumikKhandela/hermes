import { tool } from "@langchain/core/tools";
import { ToolFactory } from "../../types";
import { partialSlackSchema, slackActions } from "./schema";
import {
  handleSendMessage, handleUpdateMessage, handleDeleteMessage, handleGetMessage,
  handleListChannelHistory, handleGetThreadReplies, handleGetPermalink,
  handleScheduleMessage, handleListScheduledMessages, handleDeleteScheduledMessage,
  handleAddReaction, handleRemoveReaction, handleGetReactions,
  handlePinMessage, handleUnpinMessage, handleListPins,
  handleListConversations, handleGetConversationInfo, handleOpenConversation,
  handleCreateConversation, handleRenameConversation, handleSetTopic, handleSetPurpose,
  handleArchiveConversation, handleUnarchiveConversation, handleInviteUsers, handleKickUser,
  handleJoinConversation, handleLeaveConversation, handleGetMembers,
  handleListUsers, handleGetUserInfo, handleLookupUserByEmail, handleGetUserPresence,
  handleSearchMessages, handleSearchFiles,
  handleUploadFile, handleGetFileInfo, handleDeleteFile, handleListFiles,
  handleAddBookmark, handleRemoveBookmark, handleListBookmarks,
  handleCreateCanvas, handleEditCanvas, handleDeleteCanvas, handleSectionsLookup,
} from "./handler";

const handlerMap: Record<string, (input: Record<string, any>, config?: Record<string, any>) => Promise<any>> = {
  send_message: handleSendMessage,
  update_message: handleUpdateMessage,
  delete_message: handleDeleteMessage,
  get_message: handleGetMessage,
  list_channel_history: handleListChannelHistory,
  get_thread_replies: handleGetThreadReplies,
  get_permalink: handleGetPermalink,
  schedule_message: handleScheduleMessage,
  list_scheduled_messages: handleListScheduledMessages,
  delete_scheduled_message: handleDeleteScheduledMessage,
  add_reaction: handleAddReaction,
  remove_reaction: handleRemoveReaction,
  get_reactions: handleGetReactions,
  pin_message: handlePinMessage,
  unpin_message: handleUnpinMessage,
  list_pins: handleListPins,
  list_conversations: handleListConversations,
  get_conversation_info: handleGetConversationInfo,
  open_conversation: handleOpenConversation,
  create_conversation: handleCreateConversation,
  rename_conversation: handleRenameConversation,
  set_topic: handleSetTopic,
  set_purpose: handleSetPurpose,
  archive_conversation: handleArchiveConversation,
  unarchive_conversation: handleUnarchiveConversation,
  invite_users: handleInviteUsers,
  kick_user: handleKickUser,
  join_conversation: handleJoinConversation,
  leave_conversation: handleLeaveConversation,
  get_members: handleGetMembers,
  list_users: handleListUsers,
  get_user_info: handleGetUserInfo,
  lookup_user_by_email: handleLookupUserByEmail,
  get_user_presence: handleGetUserPresence,
  search_messages: handleSearchMessages,
  search_files: handleSearchFiles,
  upload_file: handleUploadFile,
  get_file_info: handleGetFileInfo,
  delete_file: handleDeleteFile,
  list_files: handleListFiles,
  add_bookmark: handleAddBookmark,
  remove_bookmark: handleRemoveBookmark,
  list_bookmarks: handleListBookmarks,
  create_canvas: handleCreateCanvas,
  edit_canvas: handleEditCanvas,
  delete_canvas: handleDeleteCanvas,
  sections_lookup: handleSectionsLookup,
};

export const createSlackTool: ToolFactory = (config) => {
  return tool(
    async (input) => {
      const parsed = partialSlackSchema.parse(input);
      const action = parsed.action || config?.action || "send_message";
      const handler = handlerMap[action];
      if (!handler) {
        throw new Error(`Unknown Slack action: ${action}`);
      }
      const result = await handler(parsed as Record<string, any>, config);
      return JSON.stringify(result);
    },
    {
      name: "slack",
      description: "Send, update, delete, and retrieve Slack messages, reactions, pins, conversations, users, files, bookmarks, canvases, and search.",
      schema: partialSlackSchema,
    },
  );
};
