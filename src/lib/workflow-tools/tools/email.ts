import { tool } from "@langchain/core/tools";
import { z } from "zod";
import nodemailer from "nodemailer";
import { ToolFactory } from "../types";

function createTransporter(config?: Record<string, any>) {
  const host = config?.smtpHost || "";
  const port = parseInt(config?.smtpPort || "587", 10);
  const user = config?.smtpUser || "";
  const pass = config?.smtpPass || "";

  if (!host || !user || !pass) {
    throw new Error(
      "Email tool is not configured. Double-click the node and provide SMTP host, user, and password.",
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export const createEmailTool: ToolFactory = (config) => {
  return tool(
    async ({ to, subject, body }) => {
      const resolvedTo = to || config?.to;
      const resolvedSubject = subject || config?.subject;
      const resolvedBody = body || config?.body;

      if (!resolvedTo || !resolvedSubject || !resolvedBody) {
        return "SendMail is missing required fields (to, subject, or body). Configure them in the node settings or pass them as tool arguments.";
      }

      const t = createTransporter(config);
      const info = await t.sendMail({
        to: resolvedTo,
        subject: resolvedSubject,
        text: resolvedBody,
      });
      return `Email sent to ${resolvedTo}: ${info.messageId}`;
    },
    {
      name: "sendMail",
      description:
        "Send an email via SMTP. Provide recipient, subject, and body. Falls back to configured defaults if omitted.",
      schema: z.object({
        to: z.string().email().optional().describe("Recipient email address. Falls back to configured value if omitted."),
        subject: z.string().optional().describe("Email subject line. Falls back to configured value if omitted."),
        body: z.string().optional().describe("Email body text. Falls back to configured value if omitted."),
      }),
    },
  );
};
