/**
 * Seeds the demo account only when the database has no users yet, so the first deploy gets a
 * working demo and later deploys never touch real data. Set CAUGHT_SEED_DEMO=false to skip.
 */
import { seedDemo } from "../prisma/seed";
import { db } from "../src/lib/db";
import { describeDatabase, getDatabaseConfig } from "../src/lib/db-config";
import { loadEnvFromArgs } from "./lib/env";

async function main() {
  loadEnvFromArgs();
  if (process.env.CAUGHT_SEED_DEMO === "false") {
    console.log("CAUGHT_SEED_DEMO=false, skipping demo data.");
    return;
  }
  const users = await db.user.count();
  if (users > 0) {
    console.log(`Database already has ${users} user(s); not seeding.`);
    return;
  }
  console.log(`Empty database (${describeDatabase(getDatabaseConfig())}); adding the demo account…`);
  await seedDemo();
}

main()
  .catch((err) => {
    console.error(`Seeding failed: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
