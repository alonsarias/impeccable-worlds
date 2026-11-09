import { readFileSync } from "node:fs";
import path from "node:path";
import type { WorldsStoreFile } from "./types";

let cache: WorldsStoreFile | null = null;

/** Read the shipped catalog from disk (Vercel functions include data/worlds.json). */
export function readShippedStore(): WorldsStoreFile {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "worlds.json");
  cache = JSON.parse(readFileSync(file, "utf8")) as WorldsStoreFile;
  return cache;
}
