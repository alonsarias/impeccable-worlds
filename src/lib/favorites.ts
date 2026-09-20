const KEY = "impeccable-worlds:favorites";

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function loadFavoriteIds(): Set<string> {
  return new Set(readIds());
}

export function toggleFavoriteId(id: string): boolean {
  const next = loadFavoriteIds();
  if (next.has(id)) next.delete(id);
  else next.add(id);
  localStorage.setItem(KEY, JSON.stringify([...next]));
  return next.has(id);
}

export function applyFavorites<T extends { id: string; favorite: boolean }>(worlds: T[]): T[] {
  const favorites = loadFavoriteIds();
  return worlds.map((world) => ({ ...world, favorite: favorites.has(world.id) }));
}
