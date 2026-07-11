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

export const partialCalendarSchema = z.object({
  summary: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timeZone: z.string().optional(),
  calendarId: z.string().optional(),
});

export const createCalendarTool: ToolFactory = (config) => {
  return tool(
    async (input) => {
      const parsed = partialCalendarSchema.parse(input);
      const summary = parsed.summary || config?.summary || "New Event";
      const description = parsed.description || config?.description;
      const startTime = parsed.startTime || config?.startTime;
      const endTime = parsed.endTime || config?.endTime;
      const timeZone = parsed.timeZone || config?.timeZone || "UTC";
      const calendarId = parsed.calendarId || config?.calendarId || "primary";

      const client = createCalendarClient(config);
      const res = await client.events.insert({
        calendarId,
        requestBody: {
          summary,
          description,
          start: {
            dateTime: startTime,
            timeZone,
          },
          end: {
            dateTime: endTime,
            timeZone,
          },
        },
      });
      return `Event created: ${res.data.htmlLink || res.data.id}`;
    },
    {
      name: "calendarEvent",
      description:
        "Create a Google Calendar event with configurable defaults. Falls back to configured values when arguments are omitted.",
      schema: z.object({
        summary: z.string().optional().describe("Event title"),
        description: z.string().optional().describe("Event description"),
        startTime: z
          .string()
          .optional()
          .describe(
            "Start time in ISO 8601 format (e.g. 2025-01-01T10:00:00Z)",
          ),
        endTime: z
          .string()
          .optional()
          .describe(
            "End time in ISO 8601 format (e.g. 2025-01-01T11:00:00Z)",
          ),
        timeZone: z
          .string()
          .optional()
          .describe("IANA timezone (default: UTC)"),
        calendarId: z
          .string()
          .optional()
          .describe("Calendar ID (default: primary)"),
      }),
    },
  );
};
