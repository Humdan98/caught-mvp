/**
 * Where the database lives. One place, shared by the app, the Prisma config and the scripts.
 *
 *   Local dev   → nothing set → SQLite file at ./prisma/dev.db
 *   Production  → TURSO_DATABASE_URL (libsql://…) + TURSO_AUTH_TOKEN
 *
 * DATABASE_URL / DATABASE_AUTH_TOKEN are accepted as fallbacks. The token is only ever read
 * on the server and is never logged.
 */
export const LOCAL_DATABASE_URL = "file:./prisma/dev.db";

export type DatabaseConfig = { url: string; authToken?: string; remote: boolean };

export function getDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const url = (env.TURSO_DATABASE_URL || env.DATABASE_URL || LOCAL_DATABASE_URL).trim();
  const authToken = (env.TURSO_AUTH_TOKEN || env.DATABASE_AUTH_TOKEN || "").trim() || undefined;
  const remote = !url.startsWith("file:");

  if (!/^(file|libsql|https?|wss?):/.test(url)) {
    throw new Error("Database URL must start with file:, libsql://, https:// or wss://");
  }
  // Vercel's filesystem is read-only and per-instance: a SQLite file there would silently lose data.
  if (env.VERCEL && !remote) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. On Vercel the app needs a Turso database (libsql://…); a local SQLite file won't work.",
    );
  }
  return { url, authToken, remote };
}

/** For logs: the host only, never the token or query string. */
export function describeDatabase({ url, remote }: DatabaseConfig): string {
  if (!remote) return url;
  try {
    return new URL(url).host;
  } catch {
    return "remote database";
  }
}
