import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { google, calendar_v3 } from "googleapis";
import { ToolFactory } from "../types";

let calendarClient: calendar_v3.Calendar | null = null;

function getCalendarClient(config?: Record<string, any>) {
  if (calendarClient) return calendarClient;

  const email = config?.clientEmail || process.env.GOOGLE_CLIENT_EMAIL || "";
  const privateKey =
    config?.privateKey || process.env.GOOGLE_PRIVATE_KEY || "";

  if (!email || !privateKey) {
    throw new Error(
      "Calendar requires GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY env vars",
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  });
  calendarClient = google.calendar({ version: "v3", auth });
  return calendarClient;
}

export const createCalendarTool: ToolFactory = (config) => {
  return tool(
    async ({ summary, description, startTime, endTime, timeZone }) => {
      const client = getCalendarClient(config);
      const res = await client.events.insert({
        calendarId: "primary",
        requestBody: {
          summary,
          description,
          start: {
            dateTime: startTime,
            timeZone: timeZone || "UTC",
          },
          end: {
            dateTime: endTime,
            timeZone: timeZone || "UTC",
          },
        },
      });
      return `Event created: ${res.data.htmlLink || res.data.id}`;
    },
    {
      name: "calendarEvent",
      description:
        "Create a Google Calendar event with title, time, and optional description.",
      schema: z.object({
        summary: z.string().describe("Event title"),
        description: z.string().optional().describe("Event description"),
        startTime: z
          .string()
          .describe(
            "Start time in ISO 8601 format (e.g. 2025-01-01T10:00:00Z)",
          ),
        endTime: z
          .string()
          .describe(
            "End time in ISO 8601 format (e.g. 2025-01-01T11:00:00Z)",
          ),
        timeZone: z
          .string()
          .optional()
          .describe("IANA timezone (default: UTC)"),
      }),
    },
  );
};
