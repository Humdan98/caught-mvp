import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseConfig } from "./db-config";

type AdapterFactory = NonNullable<ConstructorParameters<typeof PrismaClient>[0]>["adapter"] & {};

/**
 * Picks the libSQL driver when Prisma first connects:
 *  - remote (Turso)  → the web/HTTP client: pure JS, no native binary (safe on Vercel)
 *  - local file      → the Node client, which embeds SQLite through a native module
 * Imported lazily so the native module is never loaded in production.
 */
function libsqlAdapter(): AdapterFactory {
  const { url, authToken, remote } = getDatabaseConfig();
  return {
    provider: "sqlite",
    adapterName: "@prisma/adapter-libsql",
    async connect() {
      const { PrismaLibSql } = remote
        ? await import("@prisma/adapter-libsql/web")
        : await import("@prisma/adapter-libsql");
      return new PrismaLibSql({ url, authToken }).connect();
    },
  } as AdapterFactory;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Reuse one client across hot reloads in development (and across requests on a warm instance).
export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter: libsqlAdapter() });
globalForPrisma.prisma = db;
