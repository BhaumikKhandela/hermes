import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Pool } from "pg";
import mysql from "mysql2/promise";
import mongoose from "mongoose";
import { ToolFactory } from "../types";

const dbSchema = z.object({
  action: z
    .enum([
      "query", "insert", "update", "delete",
      "createTable", "dropTable",
      "listTables", "listCollections",
      "createCollection", "dropCollection",
    ])
    .describe("Operation to perform"),
  sql: z
    .string()
    .optional()
    .describe("Raw SQL query with $1 / ? placeholders (SQL types only)"),
  values: z
    .array(z.any())
    .optional()
    .describe("Parameterized values for SQL query"),
  table: z
    .string()
    .optional()
    .describe("SQL table name (for insert/update/delete without raw SQL)"),
  collection: z
    .string()
    .optional()
    .describe("MongoDB collection name"),
  document: z
    .any()
    .optional()
    .describe("Document to insert (MongoDB) / row data (SQL insert)"),
  data: z
    .any()
    .optional()
    .describe("Values to set for SQL update"),
  where: z
    .any()
    .optional()
    .describe("Filter condition for update/delete (SQL) or query filter (MongoDB)"),
  limit: z
    .number()
    .optional()
    .describe("Max results to return"),
  columns: z
    .string()
    .optional()
    .describe("Column definitions string for createTable (SQL only), e.g. 'id SERIAL PRIMARY KEY, name TEXT NOT NULL'"),
});

function buildWhereClause(
  where: Record<string, any>,
  values: any[],
  paramIdx: number,
): string {
  return Object.entries(where)
    .map(([col, val]) => {
      values.push(val);
      return `${col} = $${paramIdx++}`;
    })
    .join(" AND ");
}

function buildInsertSQL(
  table: string,
  doc: Record<string, any>,
  values: any[],
): string {
  const cols = Object.keys(doc);
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  values.push(...Object.values(doc));
  return `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
}

function buildUpdateSQL(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>,
  values: any[],
): string {
  const setCols = Object.keys(data);
  const setClause = setCols.map((col, i) => `${col} = $${i + 1}`);
  values.push(...Object.values(data));
  let paramIdx = setCols.length + 1;
  const whereClause = buildWhereClause(where, values, paramIdx);
  return `UPDATE ${table} SET ${setClause.join(", ")} WHERE ${whereClause} RETURNING *`;
}

function buildDeleteSQL(
  table: string,
  where: Record<string, any>,
  values: any[],
): string {
  const whereClause = buildWhereClause(where, values, 1);
  return `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;
}

function buildSelectSQL(
  table: string,
  where: Record<string, any> | undefined,
  values: any[],
  limit: number | undefined,
): string {
  if (where && Object.keys(where).length > 0) {
    const whereClause = buildWhereClause(where, values, 1);
    const lim = limit ? ` LIMIT ${limit}` : "";
    return `SELECT * FROM ${table} WHERE ${whereClause}${lim}`;
  }
  const lim = limit ? ` LIMIT ${limit}` : "";
  return `SELECT * FROM ${table}${lim}`;
}

export const createPostgresTool: ToolFactory = (config) => {
  const host = config?.host || "localhost";
  const port = config?.port || 5432;
  const user = config?.user || "";
  const password = config?.password || "";
  const database = config?.database || "";
  const ssl = config?.ssl ?? false;

  return tool(
    async (input) => {
      const { action, sql, values, table, document, data, where, limit, columns } =
        dbSchema.parse(input);

      const pool = new Pool({ host, port, user, password, database, ssl });
      let result: any;

      try {
        const client = await pool.connect();
        try {
          switch (action) {
            case "query": {
              if (sql) {
                result = await client.query(sql, values || []);
              } else if (table) {
                const vals: any[] = [];
                const q = buildSelectSQL(table, where as Record<string, any> | undefined, vals, limit);
                result = await client.query(q, vals);
              } else {
                result = { rows: [], error: "Provide sql or table for query" };
              }
              break;
            }
            case "insert": {
              if (!table || !document) {
                result = { error: "table and document are required for insert" };
                break;
              }
              const vals: any[] = [];
              const q = buildInsertSQL(table, document as Record<string, any>, vals);
              result = await client.query(q, vals);
              break;
            }
            case "update": {
              if (!table || !data || !where) {
                result = { error: "table, data, and where are required for update" };
                break;
              }
              const vals: any[] = [];
              const q = buildUpdateSQL(table, data as Record<string, any>, where as Record<string, any>, vals);
              result = await client.query(q, vals);
              break;
            }
            case "delete": {
              if (!table || !where) {
                result = { error: "table and where are required for delete" };
                break;
              }
              const vals: any[] = [];
              const q = buildDeleteSQL(table, where as Record<string, any>, vals);
              result = await client.query(q, vals);
              break;
            }
            case "listTables": {
              const r = await client.query(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
              );
              result = { tables: r.rows.map((row: any) => row.table_name) };
              break;
            }
            case "createTable": {
              if (!table || !columns) {
                result = { error: "table and columns are required for createTable" };
                break;
              }
              await client.query(`CREATE TABLE ${table} (${columns})`);
              result = { message: `Table created: ${table}` };
              break;
            }
            case "dropTable": {
              if (!table) {
                result = { error: "table is required for dropTable" };
                break;
              }
              await client.query(`DROP TABLE IF EXISTS ${table}`);
              result = { message: `Table dropped: ${table}` };
              break;
            }
            default:
              result = { error: `Unknown action: ${action}` };
          }
        } finally {
          client.release();
        }
      } finally {
        await pool.end();
      }

      return JSON.stringify(result.rows || result, null, 2);
    },
    {
      name: "postgresDB",
      description:
        "Query a PostgreSQL database using your own credentials. Supports raw SQL with parameterized values, or structured insert/update/delete/query by table. Also supports createTable and dropTable with a columns string.",
      schema: dbSchema,
    },
  );
};

export const createMySQLTool: ToolFactory = (config) => {
  const host = config?.host || "localhost";
  const port = config?.port || 3306;
  const user = config?.user || "";
  const password = config?.password || "";
  const database = config?.database || "";
  const ssl = config?.ssl ?? false;

  return tool(
    async (input) => {
      const { action, sql, values, table, document, data, where, limit, columns } =
        dbSchema.parse(input);

      const conn = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
        ssl: ssl ? {} : undefined,
      });

      let result: any;

      try {
        switch (action) {
          case "query": {
            if (sql) {
              const [rows] = await conn.execute(sql, values || []);
              result = rows;
            } else if (table) {
              const vals: any[] = [];
              const q = buildSelectSQL(table, where as Record<string, any> | undefined, vals, limit);
              const [rows] = await conn.execute(q, vals);
              result = rows;
            } else {
              result = { error: "Provide sql or table for query" };
            }
            break;
          }
          case "insert": {
            if (!table || !document) {
              result = { error: "table and document are required for insert" };
              break;
            }
            const vals: any[] = [];
            const cols = Object.keys(document as Record<string, any>);
            const placeholders = cols.map(() => "?").join(", ");
            const sqlInsert = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`;
            vals.push(...Object.values(document as Record<string, any>));
            const [rows] = await conn.execute(sqlInsert, vals);
            result = rows;
            break;
          }
          case "update": {
            if (!table || !data || !where) {
              result = { error: "table, data, and where are required for update" };
              break;
            }
            const vals: any[] = [];
            const setClause = Object.keys(data as Record<string, any>)
              .map((col) => `${col} = ?`)
              .join(", ");
            vals.push(...Object.values(data as Record<string, any>));
            const whereClause = Object.entries(where as Record<string, any>)
              .map(([col, val]) => {
                vals.push(val);
                return `${col} = ?`;
              })
              .join(" AND ");
            const q = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
            const [rows] = await conn.execute(q, vals);
            result = rows;
            break;
          }
          case "delete": {
            if (!table || !where) {
              result = { error: "table and where are required for delete" };
              break;
            }
            const vals: any[] = [];
            const whereClause = Object.entries(where as Record<string, any>)
              .map(([col, val]) => {
                vals.push(val);
                return `${col} = ?`;
              })
              .join(" AND ");
            const q = `DELETE FROM ${table} WHERE ${whereClause}`;
            const [rows] = await conn.execute(q, vals);
            result = rows;
            break;
          }
            case "listTables": {
              const [rows] = await conn.execute(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
              );
              result = { tables: (rows as any[]).map((r: any) => r.table_name) };
              break;
            }
            case "createTable": {
              if (!table || !columns) {
                result = { error: "table and columns are required for createTable" };
                break;
              }
              await conn.execute(`CREATE TABLE ${table} (${columns})`);
              result = { message: `Table created: ${table}` };
              break;
            }
            case "dropTable": {
              if (!table) {
                result = { error: "table is required for dropTable" };
                break;
              }
              await conn.execute(`DROP TABLE IF EXISTS ${table}`);
              result = { message: `Table dropped: ${table}` };
              break;
            }
            default:
            result = { error: `Unknown action: ${action}` };
        }
      } finally {
        await conn.end();
      }

      return JSON.stringify(result, null, 2);
    },
    {
      name: "mysqlDB",
      description:
        "Query a MySQL database using your own credentials. Supports raw SQL with parameterized values, or structured insert/update/delete/query by table. Also supports createTable and dropTable with a columns string.",
      schema: dbSchema,
    },
  );
};

export const createMongoDBTool: ToolFactory = (config) => {
  const uri =
    config?.uri ||
    config?.connectionString ||
    process.env.MONGODB_URI ||
    "";

  if (!uri) {
    throw new Error(
      "MongoDB requires a connection URI. Set it in the node config or MONGODB_URI env var.",
    );
  }

  return tool(
    async (input) => {
      const { action, collection, document, data, where, limit } =
        dbSchema.parse(input);

      const conn = await mongoose.createConnection(uri).asPromise();
      let result: any;

      try {
        const db = conn.db;
        if (!db) {
          return "Failed to connect to database";
        }

        switch (action) {
          case "query": {
            const coll = db.collection(collection || "");
            const docs = where
              ? await coll.find(where).limit(limit || 50).toArray()
              : await coll.find({}).limit(limit || 50).toArray();
            result = docs;
            break;
          }
          case "insert": {
            const coll = db.collection(collection || "");
            const res = await coll.insertOne(document || {});
            result = { insertedId: res.insertedId.toString() };
            break;
          }
          case "update": {
            const coll = db.collection(collection || "");
            const res = await coll.updateMany(
              where || {},
              { $set: data || document || {} },
            );
            result = {
              matchedCount: res.matchedCount,
              modifiedCount: res.modifiedCount,
            };
            break;
          }
          case "delete": {
            const coll = db.collection(collection || "");
            const res = await coll.deleteMany(where || {});
            result = { deletedCount: res.deletedCount };
            break;
          }
            case "listCollections": {
              const colls = await db.listCollections().toArray();
              result = { collections: colls.map((c: any) => c.name) };
              break;
            }
            case "createCollection": {
              if (!collection) {
                result = { error: "collection is required for createCollection" };
                break;
              }
              await db.createCollection(collection);
              result = { message: `Collection created: ${collection}` };
              break;
            }
            case "dropCollection": {
              if (!collection) {
                result = { error: "collection is required for dropCollection" };
                break;
              }
              await db.collection(collection).drop();
              result = { message: `Collection dropped: ${collection}` };
              break;
            }
            default:
            result = { error: `Unknown action: ${action}` };
        }
      } finally {
        await conn.close();
      }

      return JSON.stringify(result, null, 2);
    },
    {
      name: "mongoDB",
      description:
        "Query a MongoDB database using your own connection URI. Supports finding documents, inserting, updating, deleting, listing collections, and creating/dropping collections.",
      schema: dbSchema,
    },
  );
};
