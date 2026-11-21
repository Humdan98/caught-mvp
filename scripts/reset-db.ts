// Deletes the local SQLite database so `npm run db:reset` starts clean. Cross-platform.
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const file = resolve(process.cwd(), url.replace(/^file:/, ""));
try {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    rmSync(file + suffix, { force: true });
  }
} catch (err) {
  // Windows locks the file while the app is running.
  if ((err as NodeJS.ErrnoException).code === "EBUSY" || (err as NodeJS.ErrnoException).code === "EPERM") {
    console.error("The database is in use. Stop `npm run dev` / `npm start` first, then run this again.");
    process.exit(1);
  }
  throw err;
}
console.log(`Removed ${file}`);
