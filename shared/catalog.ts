import type { Coverage, World, WorldsStoreFile } from "./types";

export function worldsFromStore(store: WorldsStoreFile): World[] {
  return Object.values(store.worlds)
    .map((world) => ({ ...world, favorite: false }))
    .sort((a, b) => {
      const seen = b.lastSeenAt.localeCompare(a.lastSeenAt);
      if (seen !== 0) return seen;
      return (a.name ?? a.id).localeCompare(b.name ?? b.id);
    });
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
