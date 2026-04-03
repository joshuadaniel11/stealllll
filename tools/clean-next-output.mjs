import { rmSync } from "node:fs";
import { resolve } from "node:path";

const nextDir = resolve(process.cwd(), ".next");

try {
  rmSync(nextDir, { recursive: true, force: true });
} catch {
  // Ignore cache cleanup failures and let Next attempt the build anyway.
}
