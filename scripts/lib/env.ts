import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * `--env <file>` loads variables from a file (e.g. .env.turso) before anything reads them.
 * Values already set in the environment win, so Vercel's own variables are never overridden.
 */
export function loadEnvFromArgs(argv = process.argv) {
  const i = argv.indexOf("--env");
  if (i === -1) return;
  const file = resolve(process.cwd(), argv[i + 1] ?? "");
  if (!argv[i + 1] || !existsSync(file)) {
    console.error(`Env file not found: ${argv[i + 1] ?? "(missing)"}. Copy .env.example to it and fill in the Turso values.`);
    process.exit(1);
  }
  process.loadEnvFile(file);
}
