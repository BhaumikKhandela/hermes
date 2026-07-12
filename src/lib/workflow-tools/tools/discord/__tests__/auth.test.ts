import { describe, it, expect, vi, beforeEach } from "vitest";
import { REST } from "@discordjs/rest";
import { createDiscordClient, createWebhookClient, createWebhookContext } from "../client";
import { discordActions } from "../schema";
import { getAuthFamily, TOKEN_AUTH_ACTIONS, BOT_AUTH_ACTIONS } from "../auth";

vi.mock("@discordjs/rest", () => {
  function MockREST() {
    return {
      setToken: vi.fn().mockReturnThis(),
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
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

describe("Bot credential contract", () => {
  it("createDiscordClient with apiKey calls REST.setToken", () => {
    const client = createDiscordClient({ apiKey: "MTE.bot-token.ABC" });
    expect(client.setToken).toHaveBeenCalledWith("MTE.bot-token.ABC");
  });

  it("createDiscordClient without apiKey throws contextual error", () => {
    expect(() => createDiscordClient({}, "send_message")).toThrow("Discord send_message requires a Discord bot credential");
  });

  it("createDiscordClient without apiKey or config throws", () => {
    expect(() => createDiscordClient(undefined, "get_channel")).toThrow("Discord get_channel requires a Discord bot credential");
  });

  it("createDiscordClient with apiKey but no action works", () => {
    const client = createDiscordClient({ apiKey: "MTE.bot-token.ABC" });
    expect(client).toBeDefined();
    expect(client.setToken).toHaveBeenCalled();
  });

  it("token alone is NOT accepted as bot auth", () => {
    expect(() => createDiscordClient({ token: "MTE.bot-token.ABC" }, "send_message")).toThrow("Discord send_message requires a Discord bot credential");
    expect(() => createDiscordClient({ token: "MTE.bot-token.ABC" }, "send_message")).toThrow("valid Bot Token");
  });
});

describe("Webhook token-auth contract", () => {
  it("createWebhookClient requires webhookId and webhookToken", () => {
    expect(() => createWebhookClient({}, "execute_webhook")).toThrow("Webhook ID and Webhook Token");
  });

  it("createWebhookClient does not call setToken", () => {
    const client = createWebhookClient({ webhookId: "wh1", webhookToken: "secret" }, "execute_webhook");
    expect(client.setToken).not.toHaveBeenCalled();
  });

  it("createWebhookContext returns rest, webhookId, webhookToken", () => {
    const ctx = createWebhookContext({ webhookId: "wh1", webhookToken: "secret" }, "execute_webhook");
    expect(ctx.webhookId).toBe("wh1");
    expect(ctx.webhookToken).toBe("secret");
    expect(ctx.rest).toBeDefined();
    expect(ctx.rest.setToken).not.toHaveBeenCalled();
  });

  it("createWebhookClient without webhookId throws contextual error", () => {
    expect(() => createWebhookClient({ webhookToken: "secret" }, "execute_webhook")).toThrow("Webhook ID and Webhook Token");
  });

  it("createWebhookClient without webhookToken throws contextual error", () => {
    expect(() => createWebhookClient({ webhookId: "wh1" }, "execute_webhook")).toThrow("Webhook ID and Webhook Token");
  });
});

describe("Auth family completeness", () => {
  it("every discordActions action belongs to exactly one auth family", () => {
    for (const action of discordActions) {
      const family = getAuthFamily(action);
      expect(["bot", "webhook_token"]).toContain(family);
    }
  });

  it("BOT_AUTH_ACTIONS and TOKEN_AUTH_ACTIONS partition discordActions", () => {
    const tokenInDiscord = [...TOKEN_AUTH_ACTIONS].filter((a: string) => discordActions.includes(a as any));
    const expectedBotCount = discordActions.length - tokenInDiscord.length;
    expect(BOT_AUTH_ACTIONS.size).toBe(expectedBotCount);
    const union = new Set([...BOT_AUTH_ACTIONS, ...TOKEN_AUTH_ACTIONS]);
    expect(union.size).toBeGreaterThanOrEqual(discordActions.length);
    const intersection = [...BOT_AUTH_ACTIONS].filter((a) => TOKEN_AUTH_ACTIONS.has(a));
    expect(intersection).toEqual([]);
  });

  it("TOKEN_AUTH_ACTIONS contains exactly the 4 webhook token actions", () => {
    const expected = new Set(["execute_webhook", "get_webhook_message", "edit_webhook_message", "delete_webhook_message"]);
    expect(TOKEN_AUTH_ACTIONS).toEqual(expected);
  });

  it("getAuthFamily returns 'webhook_token' for execute_webhook", () => {
    expect(getAuthFamily("execute_webhook")).toBe("webhook_token");
  });

  it("getAuthFamily returns 'webhook_token' for get_webhook_message", () => {
    expect(getAuthFamily("get_webhook_message")).toBe("webhook_token");
  });

  it("getAuthFamily returns 'webhook_token' for edit_webhook_message", () => {
    expect(getAuthFamily("edit_webhook_message")).toBe("webhook_token");
  });

  it("getAuthFamily returns 'webhook_token' for delete_webhook_message", () => {
    expect(getAuthFamily("delete_webhook_message")).toBe("webhook_token");
  });

  it("getAuthFamily returns 'bot' for send_message", () => {
    expect(getAuthFamily("send_message")).toBe("bot");
  });

  it("getAuthFamily returns 'bot' for create_webhook", () => {
    expect(getAuthFamily("create_webhook")).toBe("bot");
  });
});
