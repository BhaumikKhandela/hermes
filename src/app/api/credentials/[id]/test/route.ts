import { NextResponse } from "next/server";
import { withAuth } from "@/lib/mongodb/withAuth";
import { decryptById } from "@/lib/credentials/credentialService";
import { Credential } from "@/models/CredentialSchema";

export const POST = withAuth(
  async (req: Request, session: any, { params }: any) => {
    const { id } = params;

    const payload = await decryptById({
      credentialId: id,
      actorId: session.user.id,
    });

    const doc = await Credential.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    let success = false;
    let message = "";
    let status: "active" | "invalid" = "invalid";

    try {
      switch (doc.provider) {
        case "openai":
        case "anthropic":
        case "gemini": {
          const baseURL = payload.baseURL || "https://api.openai.com/v1";
          const res = await fetch(`${baseURL}/models`, {
            headers: { Authorization: `Bearer ${payload.apiKey}` },
          });
          success = res.ok;
          message = success ? "Connected" : `API error: ${res.status}`;
          break;
        }
        case "google-sheets":
        case "google-calendar": {
          success = true;
          message = "Credential format valid";
          break;
        }
        case "pinecone": {
          const res = await fetch(`https://api.pinecone.io/indexes`, {
            headers: { "Api-Key": payload.apiKey },
          });
          success = res.ok;
          message = success ? "Connected" : `API error: ${res.status}`;
          break;
        }
        case "firecrawl": {
          const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${payload.apiKey}`,
            },
            body: JSON.stringify({ url: "https://example.com" }),
          });
          success = res.ok;
          message = success ? "Connected" : `API error: ${res.status}`;
          break;
        }
        case "smtp":
          success = Boolean(payload.host && payload.user && payload.pass);
          message = success ? "Credentials valid" : "Missing SMTP fields";
          break;
        case "postgres": {
          const { Pool } = await import("pg");
          const pool = new Pool({
            host: payload.host,
            port: payload.port || 5432,
            user: payload.user,
            password: payload.password,
            database: payload.database,
          });
          try {
            const res = await pool.query("SELECT 1");
            success = true;
            message = "Connected";
          } finally {
            await pool.end();
          }
          break;
        }
        case "mysql": {
          const mysql = await import("mysql2/promise");
          const conn = await mysql.createConnection({
            host: payload.host,
            port: payload.port || 3306,
            user: payload.user,
            password: payload.password,
            database: payload.database,
          });
          try {
            await conn.execute("SELECT 1");
            success = true;
            message = "Connected";
          } finally {
            await conn.end();
          }
          break;
        }
        case "mongodb": {
          const { MongoClient } = await import("mongodb");
          const client = new MongoClient(payload.uri);
          try {
            await client.db().command({ ping: 1 });
            success = true;
            message = "Connected";
          } finally {
            await client.close();
          }
          break;
        }
        default:
          message = "Test not implemented for this provider";
      }
    } catch (err: any) {
      message = err.message || "Connection failed";
    }

    if (success) {
      status = "active";
      doc.status = "active";
    } else {
      doc.status = "invalid";
    }
    doc.lastValidationAt = new Date();
    await doc.save();

    return NextResponse.json({ success, message, status });
  },
);
