import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();
const mockPut = vi.fn();

vi.mock("@discordjs/rest", () => {
  function MockREST() {
    return {
      setToken: vi.fn().mockReturnThis(),
      get: mockGet,
      post: mockPost,
      patch: mockPatch,
      delete: mockDelete,
      put: mockPut,
    };
  }
  return {
    REST: MockREST,
    DiscordAPIError: class DiscordAPIError extends Error {
      constructor(msg?: string) { super(msg ?? "DiscordAPIError"); }
    },
    RateLimitError: class RateLimitError extends Error {
      constructor() { super("RateLimitError"); }
    },
  };
});

import { discordActions } from "../schema";
import { createDiscordTool, handlerMap, discordSchema } from "../index";

const FAKE_CONFIG = { apiKey: "MTE.bot-token.ABC" };

describe("Discord Tool Schema", () => {
  it("should export a valid schema", () => {
    expect(discordSchema).toBeDefined();
    const parsed = discordSchema.safeParse({ action: "send_message" });
    expect(parsed.success).toBe(true);
  });

  it("should reject invalid action", () => {
    const parsed = discordSchema.safeParse({ action: "invalid_action" });
    expect(parsed.success).toBe(false);
  });
});

describe("Discord Tool Factory", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should create a tool instance", () => {
    const tool = createDiscordTool(FAKE_CONFIG);
    expect(tool).toBeDefined();
    expect(tool.name).toBe("discord");
    expect(typeof tool.invoke).toBe("function");
  });

  it("discordActions has exactly 100 entries with no duplicates", () => {
    expect(discordActions.length).toBe(100);
    expect(new Set(discordActions).size).toBe(discordActions.length);
  });

  it("handlerMap keys exactly match discordActions with no duplicates", () => {
    const handlerKeys = Object.keys(handlerMap);
    expect(handlerKeys.length).toBe(discordActions.length);
    expect(new Set(handlerKeys).size).toBe(handlerKeys.length);
    expect([...handlerKeys].sort()).toEqual([...discordActions].sort());
  });

  it("should require action field", async () => {
    const tool = createDiscordTool(FAKE_CONFIG);
    await expect(tool.invoke({})).rejects.toThrow("action is required");
  });

  it("should reject invalid action via schema", async () => {
    const tool = createDiscordTool(FAKE_CONFIG);
    await expect(tool.invoke({ action: "nonexistent" })).rejects.toThrow("did not match expected schema");
  });
});

describe("Discord Tool - Messages", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("send_message should POST to channel", async () => {
    mockPost.mockResolvedValue({ id: "msg1", content: "Hello!" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "send_message", channelId: "123", content: "Hello!" });
    const data = JSON.parse(result);
    expect(data.action).toBe("send_message");
    expect(data.data.messageId).toBe("msg1");
  });

  it("send_message should require channelId", async () => {
    const tool = createDiscordTool(FAKE_CONFIG);
    await expect(tool.invoke({ action: "send_message", content: "Hello!" })).rejects.toThrow("Discord send_message");
  });

  it("get_message should GET message", async () => {
    mockGet.mockResolvedValue({ id: "msg1", content: "Hello" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_message", channelId: "123", messageId: "456" });
    const data = JSON.parse(result);
    expect(data.data.message.id).toBe("msg1");
  });

  it("edit_message should PATCH message", async () => {
    mockPatch.mockResolvedValue({ id: "msg1", content: "Edited" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "edit_message", channelId: "123", messageId: "456", content: "Edited" });
    const data = JSON.parse(result);
    expect(data.data.message.content).toBe("Edited");
  });

  it("delete_message should DELETE message", async () => {
    mockDelete.mockResolvedValue({});
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "delete_message", channelId: "123", messageId: "456" });
    const data = JSON.parse(result);
    expect(data.data.channelId).toBe("123");
  });

  it("get_channel_messages should GET list", async () => {
    mockGet.mockResolvedValue([{ id: "m1" }, { id: "m2" }]);
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_channel_messages", channelId: "123" });
    const data = JSON.parse(result);
    expect(data.data.messages).toHaveLength(2);
  });

  it("crosspost_message should POST crosspost", async () => {
    mockPost.mockResolvedValue({ id: "crossposted" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "crosspost_message", channelId: "123", messageId: "456" });
    const data = JSON.parse(result);
    expect(data.data.message.id).toBe("crossposted");
  });

  it("pin_message should PUT pin", async () => {
    mockPut.mockResolvedValue({});
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "pin_message", channelId: "123", messageId: "456" });
    const data = JSON.parse(result);
    expect(data.data.channelId).toBe("123");
  });

  it("unpin_message should DELETE pin", async () => {
    mockDelete.mockResolvedValue({});
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "unpin_message", channelId: "123", messageId: "456" });
    const data = JSON.parse(result);
    expect(data.data.channelId).toBe("123");
  });

  it("get_pinned_messages should GET pins", async () => {
    mockGet.mockResolvedValue([{ id: "p1" }]);
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_pinned_messages", channelId: "123" });
    const data = JSON.parse(result);
    expect(data.data.messages).toHaveLength(1);
  });
});

describe("Discord Tool - Reactions", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("create_reaction should PUT reaction", async () => {
    mockPut.mockResolvedValue({});
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "create_reaction", channelId: "123", messageId: "456", emoji: "👍" });
    const data = JSON.parse(result);
    expect(data.data.channelId).toBe("123");
  });

  it("delete_own_reaction should DELETE own", async () => {
    mockDelete.mockResolvedValue({});
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "delete_own_reaction", channelId: "123", messageId: "456", emoji: "👍" });
    const data = JSON.parse(result);
    expect(data.data.emoji).toBe("👍");
  });

  it("delete_user_reaction should DELETE user", async () => {
    mockDelete.mockResolvedValue({});
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "delete_user_reaction", channelId: "123", messageId: "456", emoji: "👍", userId: "789" });
    const data = JSON.parse(result);
    expect(data.data.userId).toBe("789");
  });

  it("get_reactions should GET reactions", async () => {
    mockGet.mockResolvedValue([{ id: "u1" }]);
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_reactions", channelId: "123", messageId: "456", emoji: "👍" });
    const data = JSON.parse(result);
    expect(data.data.users).toHaveLength(1);
  });

  it("clear_reactions should DELETE all", async () => {
    mockDelete.mockResolvedValue({});
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "clear_reactions", channelId: "123", messageId: "456" });
    const data = JSON.parse(result);
    expect(data.data.channelId).toBe("123");
  });
});

describe("Discord Tool - Threads & Channels", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("create_thread should POST thread", async () => {
    mockPost.mockResolvedValue({ id: "thread1", type: 11 });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "create_thread", channelId: "123", name: "My Thread" });
    const data = JSON.parse(result);
    expect(data.data.threadId).toBe("thread1");
  });

  it("get_channel should GET channel", async () => {
    mockGet.mockResolvedValue({ id: "ch1", name: "general" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_channel", channelId: "123" });
    const data = JSON.parse(result);
    expect(data.data.channel.name).toBe("general");
  });

  it("modify_channel should PATCH channel", async () => {
    mockPatch.mockResolvedValue({ id: "ch1", name: "updated" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "modify_channel", channelId: "123", name: "updated" });
    const data = JSON.parse(result);
    expect(data.data.channel.name).toBe("updated");
  });

  it("delete_channel should DELETE channel", async () => {
    mockDelete.mockResolvedValue({});
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "delete_channel", channelId: "123" });
    const data = JSON.parse(result);
    expect(data.data.channelId).toBe("123");
  });
});

describe("Discord Tool - Guilds", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("get_guild should GET guild", async () => {
    mockGet.mockResolvedValue({ id: "g1", name: "Test Guild" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_guild", guildId: "123" });
    const data = JSON.parse(result);
    expect(data.data.guild.name).toBe("Test Guild");
  });
});

describe("Discord Tool - Members & Bans", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("get_member should GET member", async () => {
    mockGet.mockResolvedValue({ user: { id: "u1" }, nick: "Test" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_member", guildId: "123", userId: "456" });
    const data = JSON.parse(result);
    expect(data.data.member.nick).toBe("Test");
  });

  it("list_members should GET members", async () => {
    mockGet.mockResolvedValue([{ user: { id: "u1" } }, { user: { id: "u2" } }]);
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "list_members", guildId: "123" });
    const data = JSON.parse(result);
    expect(data.data.members).toHaveLength(2);
  });

  it("add_member_role should PUT role", async () => {
    mockPut.mockResolvedValue({});
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "add_member_role", guildId: "123", userId: "456", roleId: "789" });
    const data = JSON.parse(result);
    expect(data.data.roleId).toBe("789");
  });

  it("kick_member should DELETE member", async () => {
    mockDelete.mockResolvedValue({});
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "kick_member", guildId: "123", userId: "456" });
    const data = JSON.parse(result);
    expect(data.data.userId).toBe("456");
  });

  it("create_ban should PUT ban", async () => {
    mockPut.mockResolvedValue({});
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "create_ban", guildId: "123", userId: "456" });
    const data = JSON.parse(result);
    expect(data.data.userId).toBe("456");
  });
});

describe("Discord Tool - Roles & Emojis", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("get_roles should GET roles", async () => {
    mockGet.mockResolvedValue([{ id: "r1", name: "Admin" }]);
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_roles", guildId: "123" });
    const data = JSON.parse(result);
    expect(data.data.roles).toHaveLength(1);
  });

  it("create_role should POST role", async () => {
    mockPost.mockResolvedValue({ id: "r1", name: "Mod" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "create_role", guildId: "123", name: "Mod" });
    const data = JSON.parse(result);
    expect(data.data.roleId).toBe("r1");
  });

  it("get_emojis should GET emojis", async () => {
    mockGet.mockResolvedValue([{ id: "em1", name: "smile" }]);
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_emojis", guildId: "123" });
    const data = JSON.parse(result);
    expect(data.data.emojis).toHaveLength(1);
  });
});

describe("Discord Tool - Webhooks", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("get_channel_webhooks should GET webhooks", async () => {
    mockGet.mockResolvedValue([{ id: "wh1", name: "Webhook" }]);
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_channel_webhooks", channelId: "123" });
    const data = JSON.parse(result);
    expect(data.data.webhooks).toHaveLength(1);
  });

  it("create_webhook should POST", async () => {
    mockPost.mockResolvedValue({ id: "wh1", name: "My Webhook" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "create_webhook", channelId: "123", name: "My Webhook" });
    const data = JSON.parse(result);
    expect(data.data.webhookId).toBe("wh1");
  });

  it("delete_webhook should DELETE", async () => {
    mockDelete.mockResolvedValue({});
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "delete_webhook", webhookId: "wh1" });
    const data = JSON.parse(result);
    expect(data.data.webhookId).toBe("wh1");
  });
});

describe("Discord Tool - Invites & Events", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("create_invite should POST invite", async () => {
    mockPost.mockResolvedValue({ code: "abc123" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "create_invite", channelId: "123" });
    const data = JSON.parse(result);
    expect(data.data.inviteCode).toBe("abc123");
  });

  it("list_scheduled_events should GET events", async () => {
    mockGet.mockResolvedValue([{ id: "e1", name: "Event 1" }]);
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "list_scheduled_events", guildId: "123" });
    const data = JSON.parse(result);
    expect(data.data.events).toHaveLength(1);
  });

  it("create_scheduled_event should POST event", async () => {
    mockPost.mockResolvedValue({ id: "e1", name: "Test Event" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({
      action: "create_scheduled_event", guildId: "123", name: "Test",
      scheduledStartTime: "2025-01-01T00:00:00Z", entityType: 3,
    });
    const data = JSON.parse(result);
    expect(data.data.eventId).toBe("e1");
  });
});

describe("Discord Tool - Moderation", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("list_auto_mod_rules should GET rules", async () => {
    mockGet.mockResolvedValue([{ id: "r1", name: "Rule 1" }]);
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "list_auto_mod_rules", guildId: "123" });
    const data = JSON.parse(result);
    expect(data.data.rules).toHaveLength(1);
  });

  it("get_audit_log should GET audit log", async () => {
    mockGet.mockResolvedValue({ audit_log_entries: [{ id: "entry1" }] });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_audit_log", guildId: "123" });
    const data = JSON.parse(result);
    expect(data.data.entries).toHaveLength(1);
  });
});

describe("Discord Tool - Application Commands", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("get_global_commands should GET commands", async () => {
    mockGet.mockResolvedValue([{ id: "c1", name: "ping" }]);
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_global_commands", applicationId: "app1" });
    const data = JSON.parse(result);
    expect(data.data.commands).toHaveLength(1);
  });

  it("create_global_command should POST command", async () => {
    mockPost.mockResolvedValue({ id: "c1", name: "ping" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "create_global_command", applicationId: "app1", name: "ping", description: "Ping pong" });
    const data = JSON.parse(result);
    expect(data.data.commandId).toBe("c1");
  });
});

describe("Discord Tool - Users & Stage", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("get_user should GET user", async () => {
    mockGet.mockResolvedValue({ id: "u1", username: "test" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_user", userId: "456" });
    const data = JSON.parse(result);
    expect(data.data.user.username).toBe("test");
  });

  it("get_current_user should GET @me", async () => {
    mockGet.mockResolvedValue({ id: "bot1", bot: true });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "get_current_user" });
    const data = JSON.parse(result);
    expect(data.data.user.bot).toBe(true);
  });

  it("create_stage_instance should POST", async () => {
    mockPost.mockResolvedValue({ id: "si1", topic: "Talk" });
    const tool = createDiscordTool(FAKE_CONFIG);
    const result = await tool.invoke({ action: "create_stage_instance", channelId: "123", topic: "Talk" });
    const data = JSON.parse(result);
    expect(data.data.stageInstance.topic).toBe("Talk");
  });
});

describe("Discord Tool - Config Fallback", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should fallback action from config", async () => {
    mockGet.mockResolvedValue([{ id: "m1" }]);
    const tool = createDiscordTool({ ...FAKE_CONFIG, action: "get_channel_messages", channelId: "ch1" });
    const result = await tool.invoke({});
    const data = JSON.parse(result);
    expect(data.data.messages).toHaveLength(1);
  });

  it("should prefer input over config", async () => {
    mockGet.mockResolvedValue({ id: "ch2", name: "custom" });
    const tool = createDiscordTool({ ...FAKE_CONFIG, channelId: "fallback" });
    const result = await tool.invoke({ action: "get_channel", channelId: "custom-channel" });
    const data = JSON.parse(result);
    expect(data.data.channel.name).toBe("custom");
  });
});

describe("Discord Tool - Error Handling", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("should throw on API error", async () => {
    mockGet.mockRejectedValue(new Error("Internal Server Error"));
    const tool = createDiscordTool(FAKE_CONFIG);
    await expect(tool.invoke({ action: "get_channel", channelId: "123" })).rejects.toThrow("Discord get_channel");
  });
});
