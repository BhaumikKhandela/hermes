import { discordActions } from "./schema";

export const TOKEN_AUTH_ACTIONS: ReadonlySet<string> = new Set([
  "execute_webhook",
  "get_webhook_message",
  "edit_webhook_message",
  "delete_webhook_message",
]);

export const BOT_AUTH_ACTIONS: ReadonlySet<string> = new Set(
  discordActions.filter((a) => !TOKEN_AUTH_ACTIONS.has(a)),
);

export type AuthFamily = "bot" | "webhook_token";

export function getAuthFamily(action: string): AuthFamily {
  return TOKEN_AUTH_ACTIONS.has(action) ? "webhook_token" : "bot";
}

export function assertEveryActionClassified(): void {
  const all = new Set([...TOKEN_AUTH_ACTIONS]);
  for (const a of discordActions) all.add(a);
  if (all.size !== discordActions.length) {
    const unclassified = discordActions.filter((a) => !all.has(a));
    throw new Error(`Unclassified actions: ${unclassified.join(", ")}`);
  }
  const classified = new Set([...BOT_AUTH_ACTIONS, ...TOKEN_AUTH_ACTIONS]);
  const unclassifiedActions = discordActions.filter((a) => !classified.has(a));
  if (unclassifiedActions.length > 0) {
    throw new Error(`Unclassified actions: ${unclassifiedActions.join(", ")}`);
  }
}
