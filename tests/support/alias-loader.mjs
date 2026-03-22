import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith("@/")) {
    const basePath = path.resolve(process.cwd(), specifier.slice(2));
    const candidatePath =
      [basePath, `${basePath}.ts`, `${basePath}.tsx`, path.join(basePath, "index.ts"), path.join(basePath, "index.tsx")].find((candidate) =>
        fs.existsSync(candidate),
      ) ?? basePath;
    return defaultResolve(pathToFileURL(candidatePath).href, context, defaultResolve);
  }

  return defaultResolve(specifier, context, defaultResolve);
}
