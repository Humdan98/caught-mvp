import assert from "node:assert/strict";
import { test } from "node:test";
import { describeDatabase, getDatabaseConfig, LOCAL_DATABASE_URL } from "../src/lib/db-config";
import { splitStatements } from "../scripts/db-migrate";

test("defaults to the local SQLite file", () => {
  const c = getDatabaseConfig({} as NodeJS.ProcessEnv);
  assert.deepEqual(c, { url: LOCAL_DATABASE_URL, authToken: undefined, remote: false });
});

test("Turso variables win over DATABASE_URL", () => {
  const c = getDatabaseConfig({
    DATABASE_URL: "file:./prisma/dev.db",
    TURSO_DATABASE_URL: "libsql://caught-me.turso.io",
    TURSO_AUTH_TOKEN: " tok ",
  } as unknown as NodeJS.ProcessEnv);
  assert.deepEqual(c, { url: "libsql://caught-me.turso.io", authToken: "tok", remote: true });
});

test("refuses a SQLite file on Vercel", () => {
  assert.throws(() => getDatabaseConfig({ VERCEL: "1" } as unknown as NodeJS.ProcessEnv), /TURSO_DATABASE_URL/);
  assert.doesNotThrow(() =>
    getDatabaseConfig({ VERCEL: "1", TURSO_DATABASE_URL: "libsql://x.turso.io" } as unknown as NodeJS.ProcessEnv),
  );
});

test("rejects unknown URL schemes", () => {
  assert.throws(() => getDatabaseConfig({ TURSO_DATABASE_URL: "postgres://x" } as unknown as NodeJS.ProcessEnv));
});

test("logs show the host only, never the token", () => {
  const c = getDatabaseConfig({ TURSO_DATABASE_URL: "libsql://caught-me.turso.io?authToken=secret" } as unknown as NodeJS.ProcessEnv);
  assert.equal(describeDatabase(c), "caught-me.turso.io");
});

test("migration SQL splits into statements, comments dropped", () => {
  const sql = '-- CreateTable\nCREATE TABLE "A" (\n  "id" TEXT\n);\n\n-- CreateIndex\nCREATE INDEX "A_i" ON "A"("id");\n';
  assert.deepEqual(splitStatements(sql), ['CREATE TABLE "A" (\n  "id" TEXT\n)', 'CREATE INDEX "A_i" ON "A"("id")']);
});
