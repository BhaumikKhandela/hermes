import { describe, it, expect, vi, beforeEach } from "vitest";
import { Routes } from "discord-api-types/v10";
import { createDiscordTool, handlerMap } from "../index";

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

const BOT_CONFIG = { apiKey: "MTE.bot-token.ABC" };
const WH_CONFIG = { webhookId: "wh1", webhookToken: "secret-token" };

beforeEach(() => { vi.clearAllMocks(); });

function tool(config = BOT_CONFIG) {
  return createDiscordTool(config);
}

describe("send_message", () => {
  it("POST exact route with exact body", async () => {
    mockPost.mockResolvedValue({ id: "msg1", content: "Hello!" });
    await tool().invoke({ action: "send_message", channelId: "123", content: "Hello!" });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.channelMessages("123"),
      expect.objectContaining({ body: expect.objectContaining({ content: "Hello!" }) }),
    );
  });

  it("includes tts, embeds, allowed_mentions in body", async () => {
    mockPost.mockResolvedValue({ id: "msg1" });
    await tool().invoke({
      action: "send_message", channelId: "123", content: "Hi",
      tts: true,
      embeds: JSON.stringify([{ title: "Test" }]),
      allowedMentions: JSON.stringify({ parse: ["users"] }),
    });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.channelMessages("123"),
      expect.objectContaining({
        body: expect.objectContaining({
          content: "Hi",
          tts: true,
          embeds: [{ title: "Test" }],
          allowed_mentions: { parse: ["users"] },
        }),
      }),
    );
  });

  it("omits optional fields when not provided", async () => {
    mockPost.mockResolvedValue({ id: "msg1" });
    await tool().invoke({ action: "send_message", channelId: "123", content: "Hi" });
    const callBody = mockPost.mock.calls[0][1].body;
    expect(callBody.content).toBe("Hi");
    expect(callBody.tts).toBeUndefined();
    expect(callBody.embeds).toBeUndefined();
    expect(callBody.allowed_mentions).toBeUndefined();
    expect(callBody.components).toBeUndefined();
  });
});

describe("edit_message", () => {
  it("PATCH exact route with exact body", async () => {
    mockPatch.mockResolvedValue({ id: "msg1", content: "Edited" });
    await tool().invoke({ action: "edit_message", channelId: "123", messageId: "456", content: "Edited" });
    expect(mockPatch).toHaveBeenCalledWith(
      Routes.channelMessage("123", "456"),
      expect.objectContaining({ body: expect.objectContaining({ content: "Edited" }) }),
    );
  });

  it("content omitted: body has no content property", async () => {
    mockPatch.mockResolvedValue({ id: "msg1" });
    await tool().invoke({ action: "edit_message", channelId: "123", messageId: "456" });
    const callBody = mockPatch.mock.calls[0][1].body;
    expect(callBody).not.toHaveProperty("content");
  });

  it("content: null: body explicitly contains content: null", async () => {
    mockPatch.mockResolvedValue({ id: "msg1" });
    await tool().invoke({ action: "edit_message", channelId: "123", messageId: "456", content: null });
    const callBody = mockPatch.mock.calls[0][1].body;
    expect(callBody).toHaveProperty("content");
    expect(callBody.content).toBeNull();
  });

  it("content: '': body explicitly contains content: ''", async () => {
    mockPatch.mockResolvedValue({ id: "msg1" });
    await tool().invoke({ action: "edit_message", channelId: "123", messageId: "456", content: "" });
    const callBody = mockPatch.mock.calls[0][1].body;
    expect(callBody).toHaveProperty("content");
    expect(callBody.content).toBe("");
  });
});

describe("bulk_delete_messages", () => {
  it("POST exact route with body.messages array", async () => {
    mockPost.mockResolvedValue({});
    await tool().invoke({ action: "bulk_delete_messages", channelId: "123", messageIds: "abc,def,ghi" });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.channelBulkDelete("123"),
      expect.objectContaining({ body: { messages: ["abc", "def", "ghi"] } }),
    );
  });

  it("rejects fewer than 2 message IDs", async () => {
    await expect(tool().invoke({ action: "bulk_delete_messages", channelId: "123", messageIds: "single" })).rejects.toThrow("between 2 and 100");
  });
});

describe("get_reactions", () => {
  it("GET exact route with emoji encoded in path", async () => {
    mockGet.mockResolvedValue([{ id: "u1" }]);
    await tool().invoke({ action: "get_reactions", channelId: "123", messageId: "456", emoji: "👍" });
    expect(mockGet).toHaveBeenCalledWith(
      Routes.channelMessageReaction("123", "456", "👍"),
    );
  });

  it("encodes emoji in route", async () => {
    mockGet.mockResolvedValue([{ id: "u1" }]);
    await tool().invoke({ action: "get_reactions", channelId: "123", messageId: "456", emoji: "👋" });
    const route = mockGet.mock.calls[0][0];
    expect(route).toContain(encodeURIComponent("👋"));
  });
});

describe("create_ban", () => {
  it("PUT exact route with delete_message_seconds in body", async () => {
    mockPut.mockResolvedValue({});
    await tool().invoke({ action: "create_ban", guildId: "123", userId: "456", deleteMessageSeconds: 86400 });
    expect(mockPut).toHaveBeenCalledWith(
      Routes.guildBan("123", "456"),
      expect.objectContaining({ body: { delete_message_seconds: 86400 } }),
    );
  });

  it("PUT without optional body when not provided", async () => {
    mockPut.mockResolvedValue({});
    await tool().invoke({ action: "create_ban", guildId: "123", userId: "456" });
    const callBody = mockPut.mock.calls[0][1].body;
    expect(callBody).toEqual({});
  });
});

describe("begin_guild_prune", () => {
  it("POST exact route with days in body", async () => {
    mockPost.mockResolvedValue({ pruned: 42 });
    await tool().invoke({ action: "begin_guild_prune", guildId: "123", days: 7 });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.guildPrune("123"),
      expect.objectContaining({ body: { days: 7 } }),
    );
  });

  it("includes compute_prune_count and include_roles in body", async () => {
    mockPost.mockResolvedValue({ pruned: 10 });
    await tool().invoke({
      action: "begin_guild_prune", guildId: "123", days: 30,
      computePruneCount: true, includeRoles: "admin,mod",
    });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.guildPrune("123"),
      expect.objectContaining({
        body: { days: 30, compute_prune_count: true, include_roles: ["admin", "mod"] },
      }),
    );
  });
});

describe("modify_role_positions", () => {
  it("PATCH exact route with array of {id, position}", async () => {
    mockPatch.mockResolvedValue([{ id: "r1", position: 1 }]);
    await tool().invoke({
      action: "modify_role_positions",
      guildId: "123",
      rolePositions: JSON.stringify([{ id: "r1", position: 1 }, { id: "r2", position: 2 }]),
    });
    expect(mockPatch).toHaveBeenCalledWith(
      Routes.guildRoles("123"),
      expect.objectContaining({ body: [{ id: "r1", position: 1 }, { id: "r2", position: 2 }] }),
    );
  });

  it("rejects non-array input", async () => {
    await expect(tool().invoke({
      action: "modify_role_positions", guildId: "123",
      rolePositions: JSON.stringify({ id: "r1" }),
    })).rejects.toThrow("rolePositions must be a JSON array");
  });
});

describe("create_forum_thread", () => {
  it("POST exact route with thread fields + nested message", async () => {
    mockPost.mockResolvedValue({ id: "thread1", type: 11 });
    await tool().invoke({
      action: "create_thread",
      channelId: "123",
      name: "My Forum Thread",
      appliedTags: "tag1,tag2",
      autoArchiveDuration: 1440,
      content: "First post!",
      embeds: JSON.stringify([{ title: "Embed" }]),
      components: JSON.stringify([{ type: 1, components: [{ type: 2, label: "Click", style: 1, custom_id: "btn" }] }]),
      allowedMentions: JSON.stringify({ parse: ["users"] }),
      rateLimitPerUser: 5,
    });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.threads("123"),
      expect.objectContaining({
        body: {
          name: "My Forum Thread",
          auto_archive_duration: 1440,
          applied_tags: ["tag1", "tag2"],
          rate_limit_per_user: 5,
          message: {
            content: "First post!",
            embeds: [{ title: "Embed" }],
            components: [{ type: 1, components: [{ type: 2, label: "Click", style: 1, custom_id: "btn" }] }],
            allowed_mentions: { parse: ["users"] },
          },
        },
      }),
    );
  });

  it("forum thread without messageId and without appliedTags -> start without message", async () => {
    mockPost.mockResolvedValue({ id: "thread1", type: 11 });
    await tool().invoke({
      action: "create_thread", channelId: "123", name: "My Thread",
    });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.threads("123"),
      expect.objectContaining({ body: expect.objectContaining({ name: "My Thread" }) }),
    );
  });

  it("thread from message when messageId provided", async () => {
    mockPost.mockResolvedValue({ id: "thread1", type: 11 });
    await tool().invoke({
      action: "create_thread", channelId: "123", messageId: "456", name: "Thread from msg",
    });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.threads("123", "456"),
      expect.objectContaining({ body: expect.objectContaining({ name: "Thread from msg" }) }),
    );
  });
});

describe("create_scheduled_event", () => {
  it("POST exact route with snake_case body", async () => {
    mockPost.mockResolvedValue({ id: "evt1" });
    await tool().invoke({
      action: "create_scheduled_event",
      guildId: "123",
      name: "Test Event",
      scheduledStartTime: "2025-01-01T00:00:00Z",
      entityType: 3,
      description: "An event",
      channelId: "456",
      entityMetadata: JSON.stringify({ location: "Earth" }),
      scheduledEndTime: "2025-01-02T00:00:00Z",
      privacyLevel: 2,
    });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.guildScheduledEvents("123"),
      expect.objectContaining({
        body: {
          name: "Test Event",
          scheduled_start_time: "2025-01-01T00:00:00Z",
          entity_type: 3,
          description: "An event",
          channel_id: "456",
          entity_metadata: { location: "Earth" },
          scheduled_end_time: "2025-01-02T00:00:00Z",
          privacy_level: 2,
        },
      }),
    );
  });
});

describe("get_scheduled_event_users", () => {
  it("GET exact route with limit query", async () => {
    mockGet.mockResolvedValue([{ id: "u1" }]);
    await tool().invoke({
      action: "get_scheduled_event_users", guildId: "123", eventId: "evt1", limit: 25,
    });
    expect(mockGet).toHaveBeenCalledWith(
      Routes.guildScheduledEventUsers("123", "evt1"),
      expect.objectContaining({ query: expect.any(URLSearchParams) }),
    );
    const query = mockGet.mock.calls[0][1].query.toString();
    expect(query).toContain("limit=25");
  });
});

describe("create_auto_mod_rule", () => {
  it("POST exact route with snake_case body", async () => {
    mockPost.mockResolvedValue({ id: "rule1" });
    await tool().invoke({
      action: "create_auto_mod_rule",
      guildId: "123",
      name: "No Swearing",
      eventType: 1,
      triggerType: 1,
      triggerMetadata: JSON.stringify({ keyword_filter: ["bad"] }),
      actions: JSON.stringify([{ type: 1, metadata: { channel_id: "456", custom_message: "Nope" } }]),
      enabled: true,
    });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.guildAutoModerationRules("123"),
      expect.objectContaining({
        body: expect.objectContaining({
          name: "No Swearing",
          event_type: 1,
          trigger_type: 1,
          trigger_metadata: { keyword_filter: ["bad"] },
          actions: [{ type: 1, metadata: { channel_id: "456", custom_message: "Nope" } }],
          enabled: true,
        }),
      }),
    );
  });
});

describe("modify_auto_mod_rule", () => {
  it("PATCH exact route with updated fields", async () => {
    mockPatch.mockResolvedValue({ id: "rule1" });
    await tool().invoke({
      action: "modify_auto_mod_rule", guildId: "123", ruleId: "rule1",
      name: "Updated Rule", enabled: false,
    });
    expect(mockPatch).toHaveBeenCalledWith(
      Routes.guildAutoModerationRule("123", "rule1"),
      expect.objectContaining({ body: expect.objectContaining({ name: "Updated Rule", enabled: false }) }),
    );
  });
});

describe("create_global_command", () => {
  it("POST exact route with command body", async () => {
    mockPost.mockResolvedValue({ id: "cmd1" });
    await tool().invoke({
      action: "create_global_command",
      applicationId: "app1",
      name: "ping",
      description: "Ping pong",
      options: JSON.stringify([{ name: "msg", type: 3, description: "Message" }]),
      defaultMemberPermissions: JSON.stringify(["8"]),
      dmPermission: true,
    });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.applicationCommands("app1"),
      expect.objectContaining({
        body: {
          name: "ping",
          type: 1,
          description: "Ping pong",
          options: [{ name: "msg", type: 3, description: "Message" }],
          default_member_permissions: JSON.stringify(["8"]),
          dm_permission: true,
        },
      }),
    );
  });
});

describe("bulk_overwrite_commands", () => {
  it("PUT global route without guildId", async () => {
    mockPut.mockResolvedValue([{ id: "cmd1" }]);
    await tool().invoke({
      action: "bulk_overwrite_commands",
      applicationId: "app1",
      commands: JSON.stringify([{ name: "ping", type: 1, description: "Ping" }]),
    });
    expect(mockPut).toHaveBeenCalledWith(
      Routes.applicationCommands("app1"),
      expect.objectContaining({ body: [{ name: "ping", type: 1, description: "Ping" }] }),
    );
  });

  it("PUT guild-specific route with guildId", async () => {
    mockPut.mockResolvedValue([{ id: "cmd1" }]);
    await tool().invoke({
      action: "bulk_overwrite_commands",
      applicationId: "app1", guildId: "g1",
      commands: JSON.stringify([{ name: "gping", type: 1, description: "Guild Ping" }]),
    });
    expect(mockPut).toHaveBeenCalledWith(
      Routes.applicationGuildCommands("app1", "g1"),
      expect.objectContaining({ body: [{ name: "gping", type: 1, description: "Guild Ping" }] }),
    );
  });
});

describe("create_stage_instance", () => {
  it("POST exact route with channel_id and topic", async () => {
    mockPost.mockResolvedValue({ id: "si1" });
    await tool().invoke({ action: "create_stage_instance", channelId: "123", topic: "Town Hall" });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.stageInstances(),
      expect.objectContaining({ body: { channel_id: "123", topic: "Town Hall" } }),
    );
  });

  it("includes privacy_level in body", async () => {
    mockPost.mockResolvedValue({ id: "si1" });
    await tool().invoke({ action: "create_stage_instance", channelId: "123", topic: "Talk", privacyLevel: 2 });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.stageInstances(),
      expect.objectContaining({ body: { channel_id: "123", topic: "Talk", privacy_level: 2 } }),
    );
  });
});

describe("execute_webhook", () => {
  it("POST webhook route with auth:false and no setToken", async () => {
    mockPost.mockResolvedValue({ id: "msg1" });
    const tool = createDiscordTool(WH_CONFIG);
    await tool.invoke({ action: "execute_webhook", webhookId: "wh1", webhookToken: "secret-token", content: "Hello", wait: true });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.webhook("wh1", "secret-token") + "?wait=true",
      expect.objectContaining({ body: { content: "Hello" }, auth: false }),
    );
  });

  it("works without apiKey (webhook token auth)", async () => {
    mockPost.mockResolvedValue({ id: "msg1" });
    const tool = createDiscordTool(WH_CONFIG);
    const result = await tool.invoke({ action: "execute_webhook", webhookId: "wh1", webhookToken: "secret-token", content: "Hello" });
    expect(result).toContain("success");
  });
});

describe("webhook message operations", () => {
  it("create_webhook uses bot client", async () => {
    mockPost.mockResolvedValue({ id: "wh1" });
    await tool().invoke({ action: "create_webhook", channelId: "123", name: "My Webhook" });
    expect(mockPost).toHaveBeenCalledWith(
      Routes.channelWebhooks("123"),
      expect.objectContaining({ body: { name: "My Webhook" } }),
    );
  });
});

describe("archived thread pagination", () => {
  it("list_public_archived_threads GET with before query", async () => {
    mockGet.mockResolvedValue({ threads: [{ id: "t1", thread_metadata: { archive_timestamp: "2025-01-01T00:00:00Z" } }] });
    await tool().invoke({ action: "list_public_archived_threads", channelId: "123", limit: 10, before: "t0" });
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining("/channels/123/threads/archived/public"),
      expect.objectContaining({ query: expect.any(URLSearchParams) }),
    );
    const query = mockGet.mock.calls[0][1].query.toString();
    expect(query).toContain("limit=10");
    expect(query).toContain("before=t0");
  });

  it("list_private_archived_threads GET with correct route", async () => {
    mockGet.mockResolvedValue({ threads: [] });
    await tool().invoke({ action: "list_private_archived_threads", channelId: "123" });
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining("/channels/123/threads/archived/private"),
      expect.anything(),
    );
  });

  it("list_joined_archived_threads uses channelJoinedArchivedThreads route", async () => {
    mockGet.mockResolvedValue({ threads: [] });
    await tool().invoke({ action: "list_joined_archived_threads", channelId: "123" });
    expect(mockGet).toHaveBeenCalledWith(
      Routes.channelJoinedArchivedThreads("123"),
      expect.anything(),
    );
  });

  it("returnAll paginates using archive_timestamp as cursor", async () => {
    mockGet
      .mockResolvedValueOnce({ threads: [
        { id: "t1", thread_metadata: { archive_timestamp: "2025-01-01T00:00:00Z" } },
        { id: "t2", thread_metadata: { archive_timestamp: "2025-01-02T00:00:00Z" } },
      ] })
      .mockResolvedValueOnce({ threads: [] });
    await tool().invoke({ action: "list_public_archived_threads", channelId: "123", returnAll: true, maxItems: 100, limit: 2 });
    expect(mockGet).toHaveBeenCalledTimes(2);
    const secondQuery = decodeURIComponent(mockGet.mock.calls[1][1].query.toString());
    expect(secondQuery).toContain("before=2025-01-02T00:00:00Z");
  });

  it("non-advancing cursor terminates (same archive_timestamp repeated)", async () => {
    mockGet
      .mockResolvedValueOnce({ threads: [
        { id: "t1", thread_metadata: { archive_timestamp: "2025-01-01T00:00:00Z" } },
      ] })
      .mockResolvedValueOnce({ threads: [
        { id: "t2", thread_metadata: { archive_timestamp: "2025-01-01T00:00:00Z" } },
      ] });
    await tool().invoke({ action: "list_public_archived_threads", channelId: "123", returnAll: true, maxItems: 100, limit: 1 });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });
});
