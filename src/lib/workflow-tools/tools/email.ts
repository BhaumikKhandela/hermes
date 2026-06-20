import { tool } from "@langchain/core/tools";
import { z } from "zod";
import nodemailer from "nodemailer";
import { ToolFactory } from "../types";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(config?: Record<string, any>) {
  if (transporter) return transporter;

  const host = config?.smtpHost || process.env.SMTP_HOST || "";
  const port = parseInt(config?.smtpPort || process.env.SMTP_PORT || "587", 10);
  const user = config?.smtpUser || process.env.SMTP_USER || "";
  const pass = config?.smtpPass || process.env.SMTP_PASS || "";
  const fromName = config?.fromName || process.env.SMTP_FROM_NAME || "Workflow";

  if (!host || !user || !pass) {
    throw new Error(
      "Email requires SMTP_HOST, SMTP_USER, and SMTP_PASS env vars",
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    from: `"${fromName}" <${user}>`,
  });

  return transporter;
}

export const createEmailTool: ToolFactory = (config) => {
  return tool(
    async ({ to, subject, body }) => {
      const t = getTransporter(config);
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
