import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { coverageFromStore, worldsFromStore } from "../shared/catalog";
import type { CollectProgress, Coverage, World, WorldRecord, WorldsStoreFile } from "../shared/types";

const dataDir = path.resolve(process.cwd(), "data");
const worldsPath = path.join(dataDir, "worlds.json");

const emptyStore = (): WorldsStoreFile => ({
  worlds: {},
  lastApprovedCount: null,
  lastCatalogCount: null,
  lastCollectAt: null,
});

let store: WorldsStoreFile = emptyStore();
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
  loaded = true;
}

export function listWorlds(): World[] {
  return worldsFromStore(store);
}

export function indexedCount(): number {
  return Object.keys(store.worlds).length;
}

export function getCoverage(): Coverage {
  return coverageFromStore(store, collectProgress);
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
