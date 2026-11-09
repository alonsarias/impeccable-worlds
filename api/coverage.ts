import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ShippedStore = {
  worlds: Record<string, unknown>;
  lastApprovedCount?: number;
  lastCatalogCount?: number;
  lastCollectAt?: string | null;
};

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
  const store = readShippedStore();
  return Response.json({
    indexedCount: Object.keys(store.worlds).length,
    lastApprovedCount: store.lastApprovedCount,
    lastCatalogCount: store.lastCatalogCount,
    lastCollectAt: store.lastCollectAt,
    collecting: null,
  });
}
