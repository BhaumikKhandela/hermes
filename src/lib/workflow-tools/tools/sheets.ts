import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { google, sheets_v4 } from "googleapis";
import { ToolFactory } from "../types";

const sheetSchema = z.object({
  action: z
    .enum(["read", "update", "append"])
    .describe("Read cells, update cells, or append rows to the sheet"),
  spreadsheetId: z
    .string()
    .describe("Google Sheets spreadsheet ID"),
  range: z
    .string()
    .describe('Sheet range like "Sheet1!A1:B10"'),
  values: z
    .any()
    .optional()
    .describe("Values to write (array or 2D array, required for update and append)"),
  insertDataOption: z
    .enum(["INSERT_ROWS", "OVERWRITE"])
    .optional()
    .describe("How to handle existing rows when appending (default: INSERT_ROWS)"),
});

const partialSheetSchema = sheetSchema.partial();

type SheetInput = z.input<typeof partialSheetSchema>;

function createSheetsClient(config?: Record<string, any>): sheets_v4.Sheets {
  const key = config?.apiKey || "";
  const email = config?.clientEmail || "";
  const privateKey = config?.privateKey || "";

  if (email && privateKey) {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return google.sheets({ version: "v4", auth });
  }

  if (key) {
    return google.sheets({ version: "v4", auth: key });
  }

  throw new Error(
    "Sheets tool is not configured. Provide an API Key or Service Account credentials via the credential settings.",
  );
}

export const createSheetTool: ToolFactory = (config) => {
  return tool(
    async (input: SheetInput) => {
      const parsed = partialSheetSchema.parse(input);
      const action = parsed.action || config?.action || "read";
      const spreadsheetId = parsed.spreadsheetId || config?.spreadsheetId;
      const range = parsed.range || config?.range;
      const values = parsed.values || config?.values;
      const insertDataOption = parsed.insertDataOption || config?.insertDataOption || "INSERT_ROWS";

      if (!spreadsheetId) {
        return "No spreadsheetId provided. Pass it as a tool argument or configure it in the node settings.";
      }
      if (!range) {
        return "No range provided. Pass it as a tool argument or configure it in the node settings.";
      }

      const client = createSheetsClient(config);

      if (action === "update" || action === "append") {
        if (!values || (Array.isArray(values) && values.length === 0)) {
          return `values is required for ${action}. Pass it as a tool argument or configure it in the node settings.`;
        }
        const formattedValues = Array.isArray(values[0])
          ? values
          : values.map((v: any) => [v]);

        if (action === "update") {
          const res = await client.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: formattedValues },
          });
          return `Updated ${res.data.updatedCells} cells`;
        }

        const res = await client.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: "USER_ENTERED",
          insertDataOption,
          requestBody: { values: formattedValues },
        });
        return `Appended ${res.data.updates?.updatedCells || formattedValues.length} cells`;
      }

      const res = await client.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      const rows = res.data.values;
      if (!rows || rows.length === 0) {
        return "No data found";
      }
      return rows
        .map((row, i) => `${i + 1}. ${row.join(" | ")}`)
        .join("\n");
    },
    {
      name: "sheet",
      description:
        "Read, update, or append data to Google Sheets. Supports API key and Service Account authentication. Falls back to configured values when arguments are omitted.",
      schema: partialSheetSchema,
    },
  );
};
