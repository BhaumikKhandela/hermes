import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { google, sheets_v4 } from "googleapis";
import { ToolFactory } from "../types";

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
    "Sheets tool is not configured. Double-click the node and provide an API Key or Service Account credentials.",
  );
}

export const createSheetTool: ToolFactory = (config) => {
  return tool(
    async ({ spreadsheetId, range, values }) => {
      const client = createSheetsClient(config);
      const res = await client.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: values.map((v: any) => [v]) },
      });
      return `Updated ${res.data.updatedCells} cells`;
    },
    {
      name: "sheet",
      description:
        "Write data to a Google Sheet. Provide the spreadsheet ID, range, and values.",
      schema: z.object({
        spreadsheetId: z.string().describe("Google Sheets spreadsheet ID"),
        range: z.string().describe('Sheet range like "Sheet1!A1:A10"'),
        values: z
          .array(z.any())
          .describe("Array of values to write"),
      }),
    },
  );
};

export const createReadSheetTool: ToolFactory = (config) => {
  return tool(
    async ({ spreadsheetId, range }) => {
      const client = createSheetsClient(config);
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
      name: "readSheet",
      description:
        "Read data from a Google Sheet. Provide the spreadsheet ID and range.",
      schema: z.object({
        spreadsheetId: z.string().describe("Google Sheets spreadsheet ID"),
        range: z.string().describe('Sheet range like "Sheet1!A1:B10"'),
      }),
    },
  );
};
