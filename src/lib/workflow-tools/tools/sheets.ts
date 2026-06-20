import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { google, sheets_v4 } from "googleapis";
import { ToolFactory } from "../types";

let sheetsClient: sheets_v4.Sheets | null = null;

function getSheetsClient(config?: Record<string, any>) {
  if (sheetsClient) return sheetsClient;

  const key = config?.apiKey || process.env.GOOGLE_API_KEY || "";
  const email = config?.clientEmail || process.env.GOOGLE_CLIENT_EMAIL || "";
  const privateKey = config?.privateKey || process.env.GOOGLE_PRIVATE_KEY || "";

  if (email && privateKey) {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    sheetsClient = google.sheets({ version: "v4", auth });
  } else if (key) {
    sheetsClient = google.sheets({ version: "v4", auth: key });
  } else {
    throw new Error(
      "Google Sheets requires GOOGLE_API_KEY or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY",
    );
  }

  return sheetsClient;
}

export const createSheetTool: ToolFactory = (config) => {
  return tool(
    async ({ spreadsheetId, range, values }) => {
      const client = getSheetsClient(config);
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
      const client = getSheetsClient(config);
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
