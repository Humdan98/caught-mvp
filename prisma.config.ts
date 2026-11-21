import { defineConfig } from "prisma/config";

// Prisma 7 resolves SQLite paths relative to this file, which matches the app's cwd.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" },
});
