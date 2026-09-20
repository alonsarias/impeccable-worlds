import type { Coverage, World, WorldsStoreFile } from "./types";

export function sortWorldsByName<T extends { id: string; name?: string }>(worlds: T[]): T[] {
  return [...worlds].sort((a, b) =>
    (a.name ?? a.id).localeCompare(b.name ?? b.id, undefined, { sensitivity: "base" }),
  );
}

export function worldsFromStore(store: WorldsStoreFile): World[] {
  return sortWorldsByName(Object.values(store.worlds).map((world) => ({ ...world, favorite: false })));
}

export function coverageFromStore(
  store: WorldsStoreFile,
  collecting: Coverage["collecting"] = null,
): Coverage {
  return {
    indexedCount: Object.keys(store.worlds).length,
    lastApprovedCount: store.lastApprovedCount,
    lastCatalogCount: store.lastCatalogCount,
    lastCollectAt: store.lastCollectAt,
    collecting,
  };
}
