import { neon } from "@neondatabase/serverless";

// Required environment variables — add to .env.local, never .env
// DATABASE_URL=postgresql://user:pass@host/carebridge?sslmode=require
//
// For local development use the Neon "dev branch" connection string.
// For production use the main branch connection string.
// Never share or commit either string.

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local — " +
      "see Neon dashboard → Connection Details.",
  );
}

export const sql = neon(process.env.DATABASE_URL);

export type DbRow = Record<string, unknown>;
export type SqlTemplate = typeof sql;

export async function db<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  return sql(strings, ...values) as Promise<T[]>;
}

// Note: Neon's HTTP driver does not support interactive transactions
// by default. Use neon({ fullResults: false }) with the standard
// driver. For true multi-statement transactions, the caller should
// use BEGIN / COMMIT / ROLLBACK inside the fn body as raw sql calls.
export async function dbTransaction<T>(
  fn: (txSql: typeof sql) => Promise<T>,
): Promise<T> {
  return fn(sql);
}
