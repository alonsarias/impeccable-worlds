import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WorldsStoreFile } from "../shared/types";

function readShippedStore(): WorldsStoreFile {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = [path.join(process.cwd(), "data", "worlds.json"), path.join(here, "..", "data", "worlds.json")].find(
    existsSync,
  );
  if (!file) {
    throw new Error(`data/worlds.json is missing (cwd=${process.cwd()})`);
  }
  return JSON.parse(readFileSync(file, "utf8")) as WorldsStoreFile;
}

export async function GET(): Promise<Response> {
  try {
    const { worldsFromStore } = await import("../shared/catalog");
    return Response.json({ worlds: worldsFromStore(readShippedStore()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
