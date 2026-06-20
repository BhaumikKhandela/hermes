import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { google } from "googleapis";
import { ToolFactory } from "../types";

function createCalendarClient(config?: Record<string, any>) {
  const email = config?.clientEmail || "";
  const privateKey = config?.privateKey || "";

  if (!email || !privateKey) {
    throw new Error(
      "Calendar tool is not configured. Double-click the node and provide Service Account credentials.",
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar.events"],
  });
  return google.calendar({ version: "v3", auth });
}

export const createCalendarTool: ToolFactory = (config) => {
  return tool(
    async ({ summary, description, startTime, endTime, timeZone }) => {
      const client = createCalendarClient(config);
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
