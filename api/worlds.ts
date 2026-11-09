import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ShippedStore = {
  worlds: Record<string, Record<string, unknown> & { id: string; name?: string }>;
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

function worldsFromStore(store: ShippedStore) {
  return Object.values(store.worlds)
    .map((world) => ({ ...world, favorite: false }))
    .sort((a, b) =>
      (a.name ?? a.id).localeCompare(b.name ?? b.id, undefined, { sensitivity: "base" }),
    );
}

export function GET(): Response {
  return Response.json({ worlds: worldsFromStore(readShippedStore()) });
}
