import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDiscordTool } from "../index";
import { validateMessageComponents, parseJSONField, requireField } from "../utils";

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
function tool() { return createDiscordTool(BOT_CONFIG); }
beforeEach(() => { vi.clearAllMocks(); });

describe("validateMessageComponents", () => {
  it("valid Action Row passes", () => {
    const valid = JSON.stringify([
      { type: 1, components: [{ type: 2, label: "Click", style: 1, custom_id: "btn1" }] },
    ]);
    expect(() => validateMessageComponents(valid)).not.toThrow();
  });

  it("multiple valid Action Rows pass", () => {
    const valid = JSON.stringify([
      { type: 1, components: [{ type: 2, label: "A", style: 1, custom_id: "a" }] },
      { type: 1, components: [{ type: 2, label: "B", style: 2, custom_id: "b" }] },
    ]);
    expect(() => validateMessageComponents(valid)).not.toThrow();
  });

  it("TextInput component (type 4) is rejected", () => {
    const invalid = JSON.stringify([
      { type: 1, components: [{ type: 4, custom_id: "input1", style: 1, label: "Name" }] },
    ]);
    expect(() => validateMessageComponents(invalid)).toThrow("TextInput components (type 4) are not supported");
  });

  it("non-array input is rejected", () => {
    const invalid = JSON.stringify({ type: 1, components: [] });
    expect(() => validateMessageComponents(invalid)).toThrow("Components must be an array");
  });

  it("Action Row count limit (5) is enforced", () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({
      type: 1,
      components: [{ type: 2, label: `B${i}`, style: 1, custom_id: `b${i}` }],
    }));
    expect(() => validateMessageComponents(JSON.stringify(rows))).toThrow("Maximum of 5 action rows");
  });

  it("row without type 1 is rejected", () => {
    const invalid = JSON.stringify([
      { type: 2, components: [{ type: 2, label: "X", style: 1, custom_id: "x" }] },
    ]);
    expect(() => validateMessageComponents(invalid)).toThrow("Each component row must have type 1");
  });

  it("null/undefined input returns undefined", () => {
    expect(validateMessageComponents(null)).toBeUndefined();
    expect(validateMessageComponents(undefined)).toBeUndefined();
    expect(validateMessageComponents("")).toBeUndefined();
  });
});

describe("parseJSONField error context", () => {
  it("embeds field identifies field name on malformed JSON", async () => {
    mockPost.mockResolvedValue({ id: "msg1" });
    await expect(tool().invoke({
      action: "send_message", channelId: "123", content: "Hi",
      embeds: "{bad json}",
    })).rejects.toThrow("embeds");
  });

  it("embeds field identifies action context", async () => {
    mockPost.mockResolvedValue({ id: "msg1" });
    await expect(tool().invoke({
      action: "send_message", channelId: "123", content: "Hi",
      embeds: "{bad json}",
    })).rejects.toThrow("send_message");
  });

  it("components field identifies field name on malformed JSON", async () => {
    mockPost.mockResolvedValue({ id: "msg1" });
    await expect(tool().invoke({
      action: "send_message", channelId: "123", content: "Hi",
      components: "[invalid",
    })).rejects.toThrow("components");
  });

  it("allowedMentions field identifies field name on malformed JSON", async () => {
    mockPost.mockResolvedValue({ id: "msg1" });
    await expect(tool().invoke({
      action: "send_message", channelId: "123", content: "Hi",
      allowedMentions: "{bad json}",
    })).rejects.toThrow("allowed_mentions");
  });

  it("poll field identifies field name on malformed JSON", async () => {
    mockPost.mockResolvedValue({ id: "msg1" });
    await expect(tool().invoke({
      action: "send_message", channelId: "123", content: "Hi",
      poll: "{bad json}",
    })).rejects.toThrow("poll");
  });

  it("permissionOverwrites field identifies field name", async () => {
    mockPost.mockResolvedValue({ id: "ch1" });
    await expect(tool().invoke({
      action: "modify_channel", channelId: "123",
      permissionOverwrites: "{bad",
    })).rejects.toThrow("permission_overwrites");
  });

  it("commandOptions field identifies field name", async () => {
    mockPost.mockResolvedValue({ id: "cmd1" });
    await expect(tool().invoke({
      action: "create_global_command", applicationId: "app1", name: "ping",
      description: "Ping", options: "{bad}",
    })).rejects.toThrow("options");
  });

  it("auto mod metadata field identifies field name", async () => {
    mockPost.mockResolvedValue({ id: "rule1" });
    await expect(tool().invoke({
      action: "create_auto_mod_rule", guildId: "123", name: "Rule",
      eventType: 1, triggerType: 1,
      triggerMetadata: "{bad",
      actions: JSON.stringify([{ type: 1 }]),
    })).rejects.toThrow("trigger_metadata");
  });

  it("auto mod actions field identifies field name", async () => {
    mockPost.mockResolvedValue({ id: "rule1" });
    await expect(tool().invoke({
      action: "create_auto_mod_rule", guildId: "123", name: "Rule",
      eventType: 1, triggerType: 1,
      triggerMetadata: JSON.stringify({}),
      actions: "{bad",
    })).rejects.toThrow("actions");
  });

  it("raw JSON.parse syntax error is not the only context", async () => {
    mockPost.mockResolvedValue({ id: "msg1" });
    try {
      await tool().invoke({
        action: "send_message", channelId: "123", content: "Hi",
        embeds: "{bad json}",
      });
    } catch (e: any) {
      expect(e.message).not.toBe('Unexpected token b, "bad json" is not valid JSON');
      expect(e.message).toContain("embeds");
      expect(e.message).toContain("send_message");
      expect(e.message).toContain("Invalid embeds JSON");
    }
  });
});

describe("requireField", () => {
  it("throws contextual error for missing field", () => {
    expect(() => requireField(undefined, "test_action", "FieldName")).toThrow("FieldName is required");
    expect(() => requireField(undefined, "test_action", "FieldName")).toThrow("test_action");
    expect(() => requireField(null, "test_action", "FieldName")).toThrow("FieldName is required");
    expect(() => requireField("", "test_action", "FieldName")).toThrow("FieldName is required");
  });

  it("returns string for valid input", () => {
    expect(requireField("abc", "test", "Field")).toBe("abc");
    expect(requireField(123, "test", "Field")).toBe("123");
  });
});
