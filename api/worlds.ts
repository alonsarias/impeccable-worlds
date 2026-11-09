import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { worldsFromShippedStore, type ShippedStore } from "./shippedCatalog";

function readShippedStore(): ShippedStore {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = [path.join(process.cwd(), "data", "worlds.json"), path.join(here, "..", "data", "worlds.json")].find(
    existsSync,
  );
  if (!file) {
    throw new Error(`data/worlds.json is missing (cwd=${process.cwd()})`);
  }
  return JSON.parse(readFileSync(file, "utf8")) as ShippedStore;
}

export function GET(): Response {
  return Response.json({ worlds: worldsFromShippedStore(readShippedStore()) });
}
