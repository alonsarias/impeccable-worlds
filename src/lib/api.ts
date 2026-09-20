import shipped from "../../data/worlds.json";
import { coverageFromStore, worldsFromStore } from "../../shared/catalog";
import type { CollectRequest, CollectStats, Coverage, World, WorldsStoreFile } from "../../shared/types";
import { isCollectAllowed } from "./collectAllowed";
import { applyFavorites, toggleFavoriteId } from "./favorites";

const catalog = shipped as WorldsStoreFile;

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T;
  return data;
}

export async function fetchWorlds(): Promise<World[]> {
  if (!isCollectAllowed()) {
    return applyFavorites(worldsFromStore(catalog));
  }
  const response = await fetch("/api/worlds");
  if (!response.ok) throw new Error("Could not load worlds.");
  const data = await readJson<{ worlds: World[] }>(response);
  return applyFavorites(data.worlds);
}

export async function fetchCoverage(): Promise<Coverage> {
  if (!isCollectAllowed()) {
    return coverageFromStore(catalog);
  }
  const response = await fetch("/api/coverage");
  if (!response.ok) throw new Error("Could not load coverage.");
  return readJson<Coverage>(response);
}

export async function collectWorlds(body: CollectRequest = {}): Promise<CollectStats> {
  const response = await fetch("/api/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const stats = await readJson<CollectStats>(response);
  if (response.status === 409) return stats;
  if (!response.ok) {
    throw new Error(stats.error ?? "Collect failed.");
  }
  return stats;
}

export function toggleFavorite(id: string): boolean {
  return toggleFavoriteId(id);
}
