import type { CollectRequest, CollectStats, Coverage, World } from "../../shared/types";

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T;
  return data;
}

export async function fetchWorlds(): Promise<World[]> {
  const response = await fetch("/api/worlds");
  if (!response.ok) throw new Error("Could not load worlds.");
  const data = await readJson<{ worlds: World[] }>(response);
  return data.worlds;
}

export async function fetchCoverage(): Promise<Coverage> {
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

export async function toggleFavorite(id: string): Promise<boolean> {
  const response = await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error("Could not update favorite.");
  const data = await readJson<{ favorite: boolean }>(response);
  return data.favorite;
}
