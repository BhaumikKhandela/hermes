import { describe, it, expect } from "vitest";
import { discordActions, partialDiscordSchema } from "../schema";
import { handlerMap } from "../index";
import { getAllSelectableActions, verifyActionCoverage } from "../actionGroups";
import { discordActions as exportedActions } from "../schema";

describe("Action taxonomy completeness", () => {
  it("discordActions is exactly 100 entries", () => {
    expect(discordActions.length).toBe(100);
  });

  it("discordActions has no duplicate values", () => {
    expect(new Set(discordActions).size).toBe(discordActions.length);
  });

  it("handlerMap keys exactly match discordActions", () => {
    const handlerKeys = Object.keys(handlerMap);
    expect(handlerKeys.length).toBe(discordActions.length);
    expect(new Set(handlerKeys).size).toBe(handlerKeys.length);
    expect([...handlerKeys].sort()).toEqual([...discordActions].sort());
  });
});

describe("Schema action enum alignment", () => {
  it("z.enum(discordActions) accepts every discordActions value", () => {
    for (const action of discordActions) {
      const parsed = partialDiscordSchema.safeParse({ action });
      expect(parsed.success).toBe(true);
    }
  });

  it("z.enum rejects known-invalid action", () => {
    const parsed = partialDiscordSchema.safeParse({ action: "this_is_not_a_real_action" });
    expect(parsed.success).toBe(false);
  });

  it("z.enum rejects empty action string", () => {
    const parsed = partialDiscordSchema.safeParse({ action: "" });
    expect(parsed.success).toBe(false);
  });
});

describe("UI action reachability", () => {
  it("every discordActions value is selectable from UI exactly once", () => {
    const uiActions = getAllSelectableActions();
    expect(uiActions.length).toBe(discordActions.length);
    expect(new Set(uiActions).size).toBe(uiActions.length);
    expect(uiActions.sort()).toEqual([...discordActions].sort());
  });

  it("UI action groups cover all 98 actions without duplicates or omissions", () => {
    expect(() => verifyActionCoverage()).not.toThrow();
  });

  it("no UI action is absent from discordActions", () => {
    const uiActions = getAllSelectableActions();
    for (const a of uiActions) {
      expect(discordActions).toContain(a);
    }
  });

  it("no discordActions value is absent from UI", () => {
    const uiActions = getAllSelectableActions();
    for (const a of discordActions) {
      expect(uiActions).toContain(a);
    }
  });
});
