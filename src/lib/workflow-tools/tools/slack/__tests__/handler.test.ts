import { vi, describe, it, expect, beforeEach } from "vitest";

const {
  mockChatPostMessage, mockChatUpdate, mockChatDelete,
  mockChatScheduleMessage, mockChatScheduledMessagesList, mockChatDeleteScheduledMessage,
  mockChatGetPermalink,
  mockConversationsHistory, mockConversationsReplies,
  mockConversationsList, mockConversationsInfo, mockConversationsOpen,
  mockConversationsCreate, mockConversationsRename, mockConversationsSetTopic,
  mockConversationsSetPurpose, mockConversationsArchive, mockConversationsUnarchive,
  mockConversationsInvite, mockConversationsKick, mockConversationsJoin,
  mockConversationsLeave, mockConversationsMembers,
  mockUsersList, mockUsersInfo, mockUsersLookupByEmail, mockUsersGetPresence,
  mockSearchMessages, mockSearchFiles,
  mockFilesUploadV2, mockFilesInfo, mockFilesDelete, mockFilesList,
  mockBookmarksAdd, mockBookmarksRemove, mockBookmarksList, mockBookmarksEdit,
  mockReactionsAdd, mockReactionsRemove, mockReactionsGet,
  mockPinsAdd, mockPinsRemove, mockPinsList,
  mockCanvasesCreate, mockCanvasesEdit, mockCanvasesDelete, mockCanvasesSectionsLookup,
  mockPaginate,
} = vi.hoisted(() => {
  const mockPaginate = vi.fn<any, any>();
  const callMethod = (mocks: Record<string, vi.Mock>) => (method: string, params: any) => {
    const fn = mocks[method];
    return fn ? fn(params) : Promise.resolve({});
  };
  const convMocks = {
    "conversations.list": vi.fn<any, any>(),
    "conversations.history": vi.fn<any, any>(),
    "conversations.members": vi.fn<any, any>(),
  };
  mockPaginate.mockImplementation(async function* (method: string, params: any) {
    const fn = callMethod({ "conversations.list": convMocks["conversations.list"], "conversations.history": convMocks["conversations.history"], "conversations.members": convMocks["conversations.members"] });
    const page = await fn(method, params);
    yield page;
    let nextCursor = page?.response_metadata?.next_cursor;
    while (nextCursor) {
      const nextPage = await fn(method, { ...params, cursor: nextCursor });
      yield nextPage;
      nextCursor = nextPage?.response_metadata?.next_cursor;
    }
  });
  return {
    mockChatPostMessage: vi.fn<any, any>(),
    mockChatUpdate: vi.fn<any, any>(),
    mockChatDelete: vi.fn<any, any>(),
    mockChatScheduleMessage: vi.fn<any, any>(),
    mockChatScheduledMessagesList: vi.fn<any, any>(),
    mockChatDeleteScheduledMessage: vi.fn<any, any>(),
    mockChatGetPermalink: vi.fn<any, any>(),
    mockConversationsHistory: convMocks["conversations.history"],
    mockConversationsReplies: vi.fn<any, any>(),
    mockConversationsList: convMocks["conversations.list"],
    mockConversationsInfo: vi.fn<any, any>(),
    mockConversationsOpen: vi.fn<any, any>(),
    mockConversationsCreate: vi.fn<any, any>(),
    mockConversationsRename: vi.fn<any, any>(),
    mockConversationsSetTopic: vi.fn<any, any>(),
    mockConversationsSetPurpose: vi.fn<any, any>(),
    mockConversationsArchive: vi.fn<any, any>(),
    mockConversationsUnarchive: vi.fn<any, any>(),
    mockConversationsInvite: vi.fn<any, any>(),
    mockConversationsKick: vi.fn<any, any>(),
    mockConversationsJoin: vi.fn<any, any>(),
    mockConversationsLeave: vi.fn<any, any>(),
    mockConversationsMembers: convMocks["conversations.members"],
    mockUsersList: vi.fn<any, any>(),
    mockUsersInfo: vi.fn<any, any>(),
    mockUsersLookupByEmail: vi.fn<any, any>(),
    mockUsersGetPresence: vi.fn<any, any>(),
    mockSearchMessages: vi.fn<any, any>(),
    mockSearchFiles: vi.fn<any, any>(),
    mockFilesUploadV2: vi.fn<any, any>(),
    mockFilesInfo: vi.fn<any, any>(),
    mockFilesDelete: vi.fn<any, any>(),
    mockFilesList: vi.fn<any, any>(),
    mockBookmarksAdd: vi.fn<any, any>(),
    mockBookmarksRemove: vi.fn<any, any>(),
    mockBookmarksList: vi.fn<any, any>(),
    mockBookmarksEdit: vi.fn<any, any>(),
    mockReactionsAdd: vi.fn<any, any>(),
    mockReactionsRemove: vi.fn<any, any>(),
    mockReactionsGet: vi.fn<any, any>(),
    mockPinsAdd: vi.fn<any, any>(),
    mockPinsRemove: vi.fn<any, any>(),
    mockPinsList: vi.fn<any, any>(),
    mockCanvasesCreate: vi.fn<any, any>(),
    mockCanvasesEdit: vi.fn<any, any>(),
    mockCanvasesDelete: vi.fn<any, any>(),
    mockCanvasesSectionsLookup: vi.fn<any, any>(),
    mockPaginate,
  };
});

vi.mock("../client", () => {
  return {
    handleSlackError(action: string, error: unknown): never {
      if (error instanceof Error) throw error;
      throw new Error(String(error));
    },
    createSlackClient: vi.fn(() => ({
      chat: {
        postMessage: mockChatPostMessage,
        update: mockChatUpdate,
        delete: mockChatDelete,
        scheduleMessage: mockChatScheduleMessage,
        scheduledMessages: { list: mockChatScheduledMessagesList },
        deleteScheduledMessage: mockChatDeleteScheduledMessage,
        getPermalink: mockChatGetPermalink,
      },
      conversations: {
        history: mockConversationsHistory,
        replies: mockConversationsReplies,
        list: mockConversationsList,
        info: mockConversationsInfo,
        open: mockConversationsOpen,
        create: mockConversationsCreate,
        rename: mockConversationsRename,
        setTopic: mockConversationsSetTopic,
        setPurpose: mockConversationsSetPurpose,
        archive: mockConversationsArchive,
        unarchive: mockConversationsUnarchive,
        invite: mockConversationsInvite,
        kick: mockConversationsKick,
        join: mockConversationsJoin,
        leave: mockConversationsLeave,
        members: mockConversationsMembers,
      },
      users: {
        list: mockUsersList,
        info: mockUsersInfo,
        lookupByEmail: mockUsersLookupByEmail,
        getPresence: mockUsersGetPresence,
      },
      search: {
        messages: mockSearchMessages,
        files: mockSearchFiles,
      },
      filesUploadV2: mockFilesUploadV2,
      files: {
        info: mockFilesInfo,
        delete: mockFilesDelete,
        list: mockFilesList,
      },
      bookmarks: {
        add: mockBookmarksAdd,
        remove: mockBookmarksRemove,
        list: mockBookmarksList,
        edit: mockBookmarksEdit,
      },
      reactions: {
        add: mockReactionsAdd,
        remove: mockReactionsRemove,
        get: mockReactionsGet,
      },
      pins: {
        add: mockPinsAdd,
        remove: mockPinsRemove,
        list: mockPinsList,
      },
      canvases: {
        create: mockCanvasesCreate,
        edit: mockCanvasesEdit,
        delete: mockCanvasesDelete,
        sections: { lookup: mockCanvasesSectionsLookup },
      },
      paginate: mockPaginate,
    })),
  };
});

import {
  handleSendMessage,
  handleUpdateMessage,
  handleDeleteMessage,
  handleGetMessage,
  handleListChannelHistory,
  handleGetThreadReplies,
  handleGetPermalink,
  handleScheduleMessage,
  handleListScheduledMessages,
  handleDeleteScheduledMessage,
  handleAddReaction,
  handleRemoveReaction,
  handleGetReactions,
  handlePinMessage,
  handleUnpinMessage,
  handleListPins,
  handleListConversations,
  handleGetConversationInfo,
  handleOpenConversation,
  handleCreateConversation,
  handleRenameConversation,
  handleSetTopic,
  handleSetPurpose,
  handleArchiveConversation,
  handleUnarchiveConversation,
  handleInviteUsers,
  handleKickUser,
  handleJoinConversation,
  handleLeaveConversation,
  handleGetMembers,
  handleListUsers,
  handleGetUserInfo,
  handleLookupUserByEmail,
  handleGetUserPresence,
  handleSearchMessages,
  handleSearchFiles,
  handleUploadFile,
  handleGetFileInfo,
  handleDeleteFile,
  handleListFiles,
  handleAddBookmark,
  handleRemoveBookmark,
  handleListBookmarks,
  handleCreateCanvas,
  handleEditCanvas,
  handleDeleteCanvas,
  handleSectionsLookup,
} from "../handler";

const FAKE_CONFIG = { token: "xoxb-test-token" };

beforeEach(() => {
  vi.clearAllMocks();
  mockChatPostMessage.mockResolvedValue({ ok: true, ts: "1712000000.000100", channel: "C123" });
  mockChatUpdate.mockResolvedValue({ ok: true, ts: "1712000000.000100", channel: "C123" });
  mockChatDelete.mockResolvedValue({ ok: true, ts: "1712000000.000100", channel: "C123" });
  mockChatScheduleMessage.mockResolvedValue({ ok: true, scheduled_message_id: "Q123", post_at: 1712000000, message: {} });
  mockChatScheduledMessagesList.mockResolvedValue({ ok: true, scheduled_messages: [] });
  mockChatDeleteScheduledMessage.mockResolvedValue({ ok: true });
  mockChatGetPermalink.mockResolvedValue({ ok: true, permalink: "https://slack.com/archives/C123/p1712000000000100" });
  mockConversationsHistory.mockResolvedValue({ ok: true, messages: [], has_more: false });
  mockConversationsReplies.mockResolvedValue({ ok: true, messages: [], has_more: false });
  mockConversationsList.mockResolvedValue({ ok: true, channels: [] });
  mockConversationsInfo.mockResolvedValue({ ok: true, channel: { id: "C123", name: "general" } });
  mockConversationsOpen.mockResolvedValue({ ok: true, channel: { id: "D123" } });
  mockConversationsCreate.mockResolvedValue({ ok: true, channel: { id: "C456", name: "new-channel" } });
  mockConversationsRename.mockResolvedValue({ ok: true, channel: { id: "C123", name: "renamed" } });
  mockConversationsSetTopic.mockResolvedValue({ ok: true, topic: "test" });
  mockConversationsSetPurpose.mockResolvedValue({ ok: true, purpose: "test" });
  mockConversationsArchive.mockResolvedValue({ ok: true });
  mockConversationsUnarchive.mockResolvedValue({ ok: true });
  mockConversationsInvite.mockResolvedValue({ ok: true });
  mockConversationsKick.mockResolvedValue({ ok: true });
  mockConversationsJoin.mockResolvedValue({ ok: true, channel: { id: "C123" } });
  mockConversationsLeave.mockResolvedValue({ ok: true });
  mockConversationsMembers.mockResolvedValue({ ok: true, members: ["U1", "U2"] });
  mockUsersList.mockResolvedValue({ ok: true, members: [] });
  mockUsersInfo.mockResolvedValue({ ok: true, user: { id: "U1", name: "testuser" } });
  mockUsersLookupByEmail.mockResolvedValue({ ok: true, user: { id: "U1", email: "test@example.com" } });
  mockUsersGetPresence.mockResolvedValue({ ok: true, presence: "active", online: true, auto_away: false });
  mockSearchMessages.mockResolvedValue({ ok: true, messages: { matches: [] }, total: 0 });
  mockSearchFiles.mockResolvedValue({ ok: true, files: { matches: [] }, total: 0 });
  mockFilesUploadV2.mockResolvedValue({ ok: true, file: { id: "F123", name: "test.txt", size: 42 }, files: [{ id: "F123" }] });
  mockFilesInfo.mockResolvedValue({ ok: true, file: { id: "F123", name: "test.txt" } });
  mockFilesDelete.mockResolvedValue({ ok: true });
  mockFilesList.mockResolvedValue({ ok: true, files: [] });
  mockBookmarksAdd.mockResolvedValue({ ok: true, bookmark: { id: "Bk123", title: "Link", link: "https://example.com" } });
  mockBookmarksRemove.mockResolvedValue({ ok: true });
  mockBookmarksList.mockResolvedValue({ ok: true, bookmarks: [] });
  mockReactionsAdd.mockResolvedValue({ ok: true });
  mockReactionsRemove.mockResolvedValue({ ok: true });
  mockReactionsGet.mockResolvedValue({ ok: true, message: { type: "message", text: "test" } });
  mockPinsAdd.mockResolvedValue({ ok: true });
  mockPinsRemove.mockResolvedValue({ ok: true });
  mockPinsList.mockResolvedValue({ ok: true, items: [] });
  mockCanvasesCreate.mockResolvedValue({ ok: true, canvas: { id: "Cvs123", title: "My Canvas" } });
  mockCanvasesEdit.mockResolvedValue({ ok: true, canvas: { id: "Cvs123" } });
  mockCanvasesDelete.mockResolvedValue({ ok: true });
  mockCanvasesSectionsLookup.mockResolvedValue({ ok: true, sections: [] });
});

describe("handleSendMessage", () => {
  it("sends a text message with channelId from input", async () => {
    const result = await handleSendMessage({ channelId: "C123", text: "Hello" }, FAKE_CONFIG);
    expect(mockChatPostMessage).toHaveBeenCalledWith({
      channel: "C123", text: "Hello", mrkdwn: undefined,
      link_names: undefined, unfurl_links: undefined, unfurl_media: undefined,
      thread_ts: undefined, reply_broadcast: undefined, blocks: undefined,
    });
    expect(result).toEqual({ action: "send_message", data: { channelId: "C123", messageTs: "1712000000.000100", message: expect.any(Object) } });
  });

  it("sends blocks when compositionMode is blocks", async () => {
    const result = await handleSendMessage(
      { channelId: "C123", compositionMode: "blocks", blocks: JSON.stringify([{ type: "section", text: { type: "mrkdwn", text: "hi" } }]), fallbackText: "hi" },
      FAKE_CONFIG,
    );
    expect(mockChatPostMessage).toHaveBeenCalledWith(expect.objectContaining({
      channel: "C123", text: "hi", blocks: expect.any(Array),
    }));
  });

  it("falls back to config channelId", async () => {
    await handleSendMessage({ text: "Hello" }, { ...FAKE_CONFIG, channelId: "C456" });
    expect(mockChatPostMessage).toHaveBeenCalledWith(expect.objectContaining({ channel: "C456" }));
  });
});

describe("handleUpdateMessage", () => {
  it("updates a message with ts", async () => {
    await handleUpdateMessage({ channelId: "C123", messageTs: "1712000000.000100", text: "Updated" }, FAKE_CONFIG);
    expect(mockChatUpdate).toHaveBeenCalledWith(expect.objectContaining({ channel: "C123", ts: "1712000000.000100", text: "Updated" }));
  });
});

describe("handleGetMessage", () => {
  it("retrieves a specific message via conversations.history", async () => {
    mockConversationsHistory.mockResolvedValue({ ok: true, messages: [{ ts: "1712000000.000100", text: "hello" }], has_more: false });
    const result = await handleGetMessage({ channelId: "C123", messageTs: "1712000000.000100" }, FAKE_CONFIG);
    expect(mockConversationsHistory).toHaveBeenCalledWith({ channel: "C123", latest: "1712000000.000100", inclusive: true, limit: 1 });
    expect(result).toEqual({ action: "get_message", data: { channelId: "C123", messageTs: "1712000000.000100", message: expect.any(Object) } });
  });

  it("throws if messages array is empty", async () => {
    mockConversationsHistory.mockResolvedValue({ ok: true, messages: [], has_more: false });
    await expect(handleGetMessage({ channelId: "C123", messageTs: "1712000000.000100" }, FAKE_CONFIG)).rejects.toThrow("message_not_found");
  });
});

describe("handleListChannelHistory", () => {
  it("returns messages with count and hasMore", async () => {
    const result = await handleListChannelHistory({ channelId: "C123", limit: 10 }, FAKE_CONFIG);
    expect(mockConversationsHistory).toHaveBeenCalledWith(expect.objectContaining({ channel: "C123", limit: 10 }));
    expect(result).toEqual({ action: "list_channel_history", data: { channelId: "C123", messages: [], count: 0, hasMore: false } });
  });

  it("auto-paginates when returnAll is true", async () => {
    const page1 = { ok: true, messages: [{ ts: "1" }, { ts: "2" }], has_more: true, response_metadata: { next_cursor: "x" } };
    const page2 = { ok: true, messages: [{ ts: "3" }], has_more: false };
    mockConversationsHistory
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);
    const result = await handleListChannelHistory({ channelId: "C123", returnAll: true, maxItems: 10 }, FAKE_CONFIG);
    expect(result.data.messages).toHaveLength(3);
  });
});

describe("handleGetPermalink", () => {
  it("returns the permalink", async () => {
    const result = await handleGetPermalink({ channelId: "C123", messageTs: "1712000000.000100" }, FAKE_CONFIG);
    expect(mockChatGetPermalink).toHaveBeenCalledWith({ channel: "C123", message_ts: "1712000000.000100" });
    expect(result).toEqual({ action: "get_permalink", data: { channelId: "C123", messageTs: "1712000000.000100", permalink: "https://slack.com/archives/C123/p1712000000000100" } });
  });
});

describe("handleScheduleMessage", () => {
  it("schedules a message", async () => {
    const result = await handleScheduleMessage({ channelId: "C123", text: "Later", postAt: 1712000000 }, FAKE_CONFIG);
    expect(mockChatScheduleMessage).toHaveBeenCalledWith(expect.objectContaining({ channel: "C123", text: "Later", post_at: 1712000000 }));
    expect(result).toEqual({ action: "schedule_message", data: { channelId: "C123", scheduledMessageId: "Q123", postAt: 1712000000, message: expect.any(Object) } });
  });
});

describe("handleAddReaction", () => {
  it("adds a reaction", async () => {
    await handleAddReaction({ channelId: "C123", messageTs: "1712000000.000100", reaction: "thumbsup" }, FAKE_CONFIG);
    expect(mockReactionsAdd).toHaveBeenCalledWith({ channel: "C123", timestamp: "1712000000.000100", name: "thumbsup" });
  });
});

describe("handleSearchMessages", () => {
  it("searches messages", async () => {
    mockSearchMessages.mockResolvedValue({ ok: true, messages: { matches: [{ ts: "1" }], total: 1 } });
    const result = await handleSearchMessages({ query: "hello", count: 20, sort: "timestamp", sortDir: "asc" }, FAKE_CONFIG);
    expect(mockSearchMessages).toHaveBeenCalledWith({ query: "hello", count: 20, sort: "timestamp", sort_dir: "asc" });
    expect(result).toEqual({ action: "search_messages", data: { query: "hello", messages: [{ ts: "1" }], count: 1, total: 1 } });
  });
});

describe("handleListConversations", () => {
  it("lists conversations without pagination", async () => {
    mockConversationsList.mockResolvedValue({ ok: true, channels: [{ id: "C1" }, { id: "C2" }] });
    const result = await handleListConversations({}, FAKE_CONFIG);
    expect(mockConversationsList).toHaveBeenCalled();
    expect(result).toEqual({ action: "list_conversations", data: { conversations: [{ id: "C1" }, { id: "C2" }], count: 2 } });
  });

  it("auto-paginates conversations when returnAll is true", async () => {
    const page1 = { ok: true, channels: [{ id: "C1" }, { id: "C2" }], response_metadata: { next_cursor: "x" } };
    const page2 = { ok: true, channels: [{ id: "C3" }] };
    mockConversationsList
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);
    const result = await handleListConversations({ returnAll: true, maxItems: 10 }, FAKE_CONFIG);
    expect(result.data.conversations).toHaveLength(3);
  });
});

describe("handleUploadFile", () => {
  it("uploads file content", async () => {
    mockFilesUploadV2.mockResolvedValue({ ok: true, file: { id: "F123", name: "test.txt", size: 42 }, files: [{ id: "F123" }] });
    await handleUploadFile({ channelId: "C123", filename: "test.txt", content: "hello" }, FAKE_CONFIG);
    expect(mockFilesUploadV2).toHaveBeenCalledWith(expect.objectContaining({
      channel_id: "C123", filename: "test.txt", content: "hello",
    }));
  });
});

describe("Error propagation", () => {
  it("wraps platform errors with action context", async () => {
    mockConversationsHistory.mockRejectedValue(Object.assign(new Error("An API error occurred"), { data: { error: "not_in_channel", needed: "channels:history" } }));
    await expect(handleListChannelHistory({ channelId: "C123" }, FAKE_CONFIG)).rejects.toThrow("An API error occurred");
  });

  it("propagates unknown errors", async () => {
    mockChatPostMessage.mockRejectedValue(new Error("network error"));
    await expect(handleSendMessage({ channelId: "C123", text: "Hi" }, FAKE_CONFIG)).rejects.toThrow("network error");
  });
});

describe("All 47 handlers exist and return structured results", () => {
  it("cover all actions", async () => {
    const testCases: { action: string; handler: Function; args: Record<string, any> }[] = [
      { action: "send_message", handler: handleSendMessage, args: { channelId: "C1", text: "t" } },
      { action: "update_message", handler: handleUpdateMessage, args: { channelId: "C1", messageTs: "1.1", text: "t" } },
      { action: "delete_message", handler: handleDeleteMessage, args: { channelId: "C1", messageTs: "1.1" } },
      { action: "get_message", handler: handleGetMessage, args: { channelId: "C1", messageTs: "1.1" } },
      { action: "list_channel_history", handler: handleListChannelHistory, args: { channelId: "C1", limit: 1 } },
      { action: "get_thread_replies", handler: handleGetThreadReplies, args: { channelId: "C1", threadTs: "1.1", messageTs: "1.1" } },
      { action: "get_permalink", handler: handleGetPermalink, args: { channelId: "C1", messageTs: "1.1" } },
      { action: "schedule_message", handler: handleScheduleMessage, args: { channelId: "C1", text: "t", postAt: 1712000000 } },
      { action: "list_scheduled_messages", handler: handleListScheduledMessages, args: { channelId: "C1" } },
      { action: "delete_scheduled_message", handler: handleDeleteScheduledMessage, args: { channelId: "C1", scheduledMessageId: "Q1" } },
      { action: "add_reaction", handler: handleAddReaction, args: { channelId: "C1", messageTs: "1.1", reaction: "thumbsup" } },
      { action: "remove_reaction", handler: handleRemoveReaction, args: { channelId: "C1", messageTs: "1.1", reaction: "thumbsup" } },
      { action: "get_reactions", handler: handleGetReactions, args: { channelId: "C1", messageTs: "1.1" } },
      { action: "pin_message", handler: handlePinMessage, args: { channelId: "C1", messageTs: "1.1" } },
      { action: "unpin_message", handler: handleUnpinMessage, args: { channelId: "C1", messageTs: "1.1" } },
      { action: "list_pins", handler: handleListPins, args: { channelId: "C1" } },
      { action: "list_conversations", handler: handleListConversations, args: {} },
      { action: "get_conversation_info", handler: handleGetConversationInfo, args: { channelId: "C1" } },
      { action: "open_conversation", handler: handleOpenConversation, args: { users: "U1" } },
      { action: "create_conversation", handler: handleCreateConversation, args: { name: "test" } },
      { action: "rename_conversation", handler: handleRenameConversation, args: { channelId: "C1", name: "new" } },
      { action: "set_topic", handler: handleSetTopic, args: { channelId: "C1", topic: "t" } },
      { action: "set_purpose", handler: handleSetPurpose, args: { channelId: "C1", purpose: "p" } },
      { action: "archive_conversation", handler: handleArchiveConversation, args: { channelId: "C1" } },
      { action: "unarchive_conversation", handler: handleUnarchiveConversation, args: { channelId: "C1" } },
      { action: "invite_users", handler: handleInviteUsers, args: { channelId: "C1", users: "U1,U2" } },
      { action: "kick_user", handler: handleKickUser, args: { channelId: "C1", userId: "U1" } },
      { action: "join_conversation", handler: handleJoinConversation, args: { channelId: "C1" } },
      { action: "leave_conversation", handler: handleLeaveConversation, args: { channelId: "C1" } },
      { action: "get_members", handler: handleGetMembers, args: { channelId: "C1" } },
      { action: "list_users", handler: handleListUsers, args: {} },
      { action: "get_user_info", handler: handleGetUserInfo, args: { userId: "U1" } },
      { action: "lookup_user_by_email", handler: handleLookupUserByEmail, args: { email: "test@example.com" } },
      { action: "get_user_presence", handler: handleGetUserPresence, args: { userId: "U1" } },
      { action: "search_messages", handler: handleSearchMessages, args: { query: "test" } },
      { action: "search_files", handler: handleSearchFiles, args: { query: "test" } },
      { action: "upload_file", handler: handleUploadFile, args: { channelId: "C1", filename: "t.txt", content: "hi" } },
      { action: "get_file_info", handler: handleGetFileInfo, args: { fileId: "F1" } },
      { action: "delete_file", handler: handleDeleteFile, args: { fileId: "F1" } },
      { action: "list_files", handler: handleListFiles, args: {} },
      { action: "add_bookmark", handler: handleAddBookmark, args: { channelId: "C1", title: "L", link: "https://x.com" } },
      { action: "remove_bookmark", handler: handleRemoveBookmark, args: { channelId: "C1", bookmarkId: "Bk1" } },
      { action: "list_bookmarks", handler: handleListBookmarks, args: { channelId: "C1" } },
      { action: "create_canvas", handler: handleCreateCanvas, args: { title: "C" } },
      { action: "edit_canvas", handler: handleEditCanvas, args: { canvasId: "Cvs1", canvasContent: "{}" } },
      { action: "delete_canvas", handler: handleDeleteCanvas, args: { canvasId: "Cvs1" } },
      { action: "sections_lookup", handler: handleSectionsLookup, args: { canvasId: "Cvs1" } },
    ];

    for (const { action, handler, args } of testCases) {
      mockConversationsHistory.mockResolvedValue({ ok: true, messages: [{ ts: "1.1", text: "test" }], has_more: false });
      mockConversationsMembers.mockResolvedValue({ ok: true, members: ["U1", "U2"] });
      mockSearchMessages.mockResolvedValue({ ok: true, messages: { matches: [{ ts: "1" }] }, total: 1 });
      mockFilesUploadV2.mockResolvedValue({ ok: true, file: { id: "F123", name: "t.txt", size: 42 }, files: [{ id: "F123" }] });
      const result = await handler(args, FAKE_CONFIG);
      expect(result).toHaveProperty("action", action);
      expect(result).toHaveProperty("data");
    }
  });
});
