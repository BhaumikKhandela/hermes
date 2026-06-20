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
      const t = createTransporter(config);
      const info = await t.sendMail({
        to,
        subject,
        text: body,
      });
      return `Email sent to ${to}: ${info.messageId}`;
    },
    {
      name: "sendMail",
      description:
        "Send an email via SMTP. Provide recipient, subject, and body.",
      schema: z.object({
        to: z.string().email().describe("Recipient email address"),
        subject: z.string().describe("Email subject line"),
        body: z.string().describe("Email body text"),
      }),
    },
  );
};
