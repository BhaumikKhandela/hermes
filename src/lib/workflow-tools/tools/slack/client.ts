import { WebClient, WebAPIPlatformError, WebAPIRateLimitedError, WebAPIHTTPError, WebAPIRequestError } from "@slack/web-api";

export function createSlackClient(config?: Record<string, any>): WebClient {
  const token = config?.token;
  if (!token) {
    throw new Error("Slack tool is not configured. Add a Slack credential with a Bot or User OAuth Token.");
  }
  return new WebClient(token);
}

export function handleSlackError(action: string, error: unknown): never {
  if (error instanceof WebAPIPlatformError) {
    const msg = error.data?.error || "unknown_error";
    const needs = error.data?.needed ? ` (needs scope: ${error.data.needed})` : "";
    throw new Error(`Slack ${action} failed: ${msg}${needs}`);
  }
  if (error instanceof WebAPIRateLimitedError) {
    throw new Error(`Slack rate limited: retry after ${error.retryAfter}s`);
  }
  if (error instanceof WebAPIHTTPError) {
    throw new Error(`Slack HTTP error: ${error.message}`);
  }
  if (error instanceof WebAPIRequestError) {
    throw new Error(`Slack request failed: ${error.message}`);
  }
  throw error;
}
