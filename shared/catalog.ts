import {
  WELL_TIERS,
  type Coverage,
  type WellTier,
  type World,
  type WorldsStoreFile,
} from "./types";

export type WorldSort = "name" | "newest" | "tier";

function compareByName(
  a: { id: string; name?: string },
  b: { id: string; name?: string },
): number {
  return (a.name ?? a.id).localeCompare(b.name ?? b.id, undefined, {
    sensitivity: "base",
  });
}

export function sortWorldsByName<T extends { id: string; name?: string }>(
  worlds: T[],
): T[] {
  return [...worlds].sort(compareByName);
}

export function sortWorlds<
  T extends {
    id: string;
    name?: string;
    wellTier?: string;
    firstSeenAt?: string;
  },
>(worlds: T[], sort: WorldSort): T[] {
  const list = [...worlds];
  if (sort === "newest") {
    return list.sort((a, b) => {
      const byDate = (b.firstSeenAt ?? "").localeCompare(a.firstSeenAt ?? "");
      return byDate !== 0 ? byDate : compareByName(a, b);
    });
  }
  if (sort === "tier") {
    return list.sort((a, b) => {
      const ai = WELL_TIERS.indexOf(a.wellTier as WellTier);
      const bi = WELL_TIERS.indexOf(b.wellTier as WellTier);
      const ao = ai < 0 ? WELL_TIERS.length : ai;
      const bo = bi < 0 ? WELL_TIERS.length : bi;
      return ao !== bo ? ao - bo : compareByName(a, b);
    });
  }
  return list.sort(compareByName);
}

export function worldsFromStore(store: WorldsStoreFile): World[] {
  return sortWorldsByName(
    Object.values(store.worlds).map((world) => ({ ...world, favorite: false })),
  );
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
