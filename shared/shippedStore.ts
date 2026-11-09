import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WorldsStoreFile } from "./types";

let cache: WorldsStoreFile | null = null;

function worldsJsonPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), "data", "worlds.json"),
    path.join(here, "..", "data", "worlds.json"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    `data/worlds.json is missing from the serverless bundle (cwd=${process.cwd()})`,
  );
}

/** Read the shipped catalog from disk (includeFiles in vercel.json copies data/). */
export function readShippedStore(): WorldsStoreFile {
  if (cache) return cache;
  const file = worldsJsonPath();
  cache = JSON.parse(readFileSync(file, "utf8")) as WorldsStoreFile;
  return cache;
}
