/** Serverless-only catalog helpers (inlined so Vercel traces them into each API function). */

type ShippedWorld = Record<string, unknown> & { id: string; name?: string };

export type ShippedStore = {
  worlds: Record<string, ShippedWorld>;
  lastApprovedCount?: number;
  lastCatalogCount?: number;
  lastCollectAt?: string | null;
};

function compareByName(a: ShippedWorld, b: ShippedWorld): number {
  return (a.name ?? a.id).localeCompare(b.name ?? b.id, undefined, {
    sensitivity: "base",
  });
}

export function worldsFromShippedStore(store: ShippedStore) {
  return Object.values(store.worlds)
    .map((world) => ({ ...world, favorite: false }))
    .sort(compareByName);
}

export function coverageFromShippedStore(store: ShippedStore) {
  return {
    indexedCount: Object.keys(store.worlds).length,
    lastApprovedCount: store.lastApprovedCount,
    lastCatalogCount: store.lastCatalogCount,
    lastCollectAt: store.lastCollectAt,
    collecting: null,
  };
}
