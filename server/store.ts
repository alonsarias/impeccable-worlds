import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CollectProgress, Coverage, World, WorldRecord, WorldsStoreFile } from "../shared/types";

const dataDir = path.resolve(process.cwd(), "data");
const worldsPath = path.join(dataDir, "worlds.json");
const favoritesPath = path.join(dataDir, "favorites.json");

const emptyStore = (): WorldsStoreFile => ({
  worlds: {},
  lastApprovedCount: null,
  lastCatalogCount: null,
  lastCollectAt: null,
});

let store: WorldsStoreFile = emptyStore();
let favorites = new Set<string>();
let loaded = false;
let writeQueue: Promise<void> = Promise.resolve();

export let collectProgress: CollectProgress | null = null;

export function setCollectProgress(next: CollectProgress | null): void {
  collectProgress = next;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tmp, file);
}

function persist(): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    await writeJson(worldsPath, store);
    await writeJson(favoritesPath, [...favorites]);
  });
  return writeQueue;
}

export async function loadStore(): Promise<void> {
  if (loaded) return;
  const parsed = await readJson<WorldsStoreFile>(worldsPath, emptyStore());
  store = {
    worlds: parsed.worlds ?? {},
    lastApprovedCount: parsed.lastApprovedCount ?? null,
    lastCatalogCount: parsed.lastCatalogCount ?? null,
    lastCollectAt: parsed.lastCollectAt ?? null,
  };
  const favs = await readJson<string[]>(favoritesPath, []);
  favorites = new Set(Array.isArray(favs) ? favs.filter((id) => typeof id === "string") : []);
  loaded = true;
}

export function listWorlds(): World[] {
  return Object.values(store.worlds)
    .map((world) => ({ ...world, favorite: favorites.has(world.id) }))
    .sort((a, b) => {
      const seen = b.lastSeenAt.localeCompare(a.lastSeenAt);
      if (seen !== 0) return seen;
      return (a.name ?? a.id).localeCompare(b.name ?? b.id);
    });
}

export function indexedCount(): number {
  return Object.keys(store.worlds).length;
}

export function getCoverage(): Coverage {
  return {
    indexedCount: indexedCount(),
    lastApprovedCount: store.lastApprovedCount,
    lastCatalogCount: store.lastCatalogCount,
    lastCollectAt: store.lastCollectAt,
    collecting: collectProgress,
  };
}

export function upsertWorld(incoming: WorldRecord): boolean {
  const existing = store.worlds[incoming.id];
  if (!existing) {
    store.worlds[incoming.id] = incoming;
    return true;
  }
  store.worlds[incoming.id] = {
    ...existing,
    ...incoming,
    firstSeenAt: existing.firstSeenAt,
    lastSeenAt: incoming.lastSeenAt,
    modesSeen: [...new Set([...existing.modesSeen, ...incoming.modesSeen])],
    system: incoming.system ?? existing.system,
  };
  return false;
}

export function recordCoverage(approvedCount: number | null, catalogCount: number | null, collectedAt: string): void {
  if (typeof approvedCount === "number") store.lastApprovedCount = approvedCount;
  if (typeof catalogCount === "number") store.lastCatalogCount = catalogCount;
  store.lastCollectAt = collectedAt;
}

export async function flushStore(): Promise<void> {
  await persist();
}

export function toggleFavorite(id: string): boolean {
  if (favorites.has(id)) {
    favorites.delete(id);
    return false;
  }
  favorites.add(id);
  return true;
}
