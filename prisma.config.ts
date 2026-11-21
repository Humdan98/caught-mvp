import { defineConfig } from "prisma/config";
import { LOCAL_DATABASE_URL } from "./src/lib/db-config";

// Prisma CLI (generate, and `migrate` for the local file). Prisma Migrate can't talk to Turso,
// so remote databases are migrated by scripts/db-migrate.ts instead.
// Prisma 7 resolves SQLite paths relative to this file, which matches the app's cwd.
const url = process.env.DATABASE_URL?.startsWith("file:") ? process.env.DATABASE_URL : LOCAL_DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url },
});
