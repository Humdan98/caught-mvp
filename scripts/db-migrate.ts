/**
 * Applies prisma/migrations to the configured database — Turso in production, or the local file.
 *
 * Prisma Migrate can't connect to Turso, so this applies the same SQL files through the libSQL
 * client and records them in Prisma's own `_prisma_migrations` table (same columns, same sha256
 * checksums). Each migration runs in one transaction. Safe to run on every deploy: already-applied
 * migrations are skipped.
 *
 *   npm run db:deploy                 # uses the current environment (what Vercel runs)
 *   npm run turso:migrate             # loads .env.turso first
 */
import { createHash, randomUUID } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describeDatabase, getDatabaseConfig } from "../src/lib/db-config";
import { loadEnvFromArgs } from "./lib/env";

const MIGRATIONS_DIR = join(process.cwd(), "prisma", "migrations");

// Prisma's DDL for its bookkeeping table on SQLite.
const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
)`;

/** Prisma-generated SQL: `--` comment lines and statements ending in `;`. */
export function splitStatements(sql: string): string[] {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  loadEnvFromArgs();
  const config = getDatabaseConfig();
  const { url, authToken, remote } = config;
  console.log(`Migrating ${remote ? "remote" : "local"} database: ${describeDatabase(config)}`);
  if (remote && !authToken) console.warn("Warning: no TURSO_AUTH_TOKEN set; Turso will reject the connection.");

  // Web/HTTP client for Turso (no native module), Node client for a local file.
  const { createClient } = remote ? await import("@libsql/client/web") : await import("@libsql/client");
  const client = createClient({ url, authToken });

  try {
    await client.execute(CREATE_TABLE);
    const rows = await client.execute(
      `SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"`,
    );
    const failed = rows.rows.filter((r) => r.finished_at === null && r.rolled_back_at === null);
    if (failed.length) {
      throw new Error(
        `Migration ${failed.map((r) => r.migration_name).join(", ")} failed earlier and needs fixing by hand before more can run.`,
      );
    }
    const applied = new Map(
      rows.rows.filter((r) => r.finished_at !== null && r.rolled_back_at === null).map((r) => [String(r.migration_name), String(r.checksum)]),
    );

    const dirs = readdirSync(MIGRATIONS_DIR)
      .filter((d) => statSync(join(MIGRATIONS_DIR, d)).isDirectory())
      .sort();

    if (applied.size === 0) {
      const tables = await client.execute(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'User'`);
      if (tables.rows.length) {
        throw new Error(
          "The database already has Caught's tables but no migration history. Use an empty Turso database (or drop the tables) and run this again.",
        );
      }
    }

    let ran = 0;
    for (const name of dirs) {
      const sql = readFileSync(join(MIGRATIONS_DIR, name, "migration.sql"), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      if (applied.has(name)) {
        if (applied.get(name) !== checksum) console.warn(`  ! ${name} was edited after it was applied (checksum differs); leaving it alone`);
        continue;
      }
      const statements = splitStatements(sql);
      const started = new Date().toISOString();
      // One transaction: the schema change and its bookkeeping row land together or not at all.
      await client.batch(
        [
          ...statements,
          {
            sql: `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
                  VALUES (?, ?, ?, ?, ?, 1)`,
            args: [randomUUID(), checksum, new Date().toISOString(), name, started],
          },
        ],
        "write",
      );
      console.log(`  ✓ ${name} (${statements.length} statements)`);
      ran++;
    }
    console.log(ran ? `Applied ${ran} migration(s).` : "Database schema is up to date.");
  } finally {
    client.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Migration failed: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  });
}
