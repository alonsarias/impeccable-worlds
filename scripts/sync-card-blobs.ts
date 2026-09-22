/**
 * Mirror catalog card images into the linked public Vercel Blob store.
 *
 * Reads data/worlds.json, downloads each cardHero and cardBoard, and uploads:
 *   cards/{worldId}.webp       ← board
 *   cards/{worldId}-hero.webp  ← hero
 *
 * Re-runs overwrite the same pathnames. Image bytes are not written into the repo.
 *
 * Auth, first match:
 *   BLOB_READ_WRITE_TOKEN               explicit token; wins over OIDC
 *   VERCEL_OIDC_TOKEN + BLOB_STORE_ID   when the store connection includes that environment
 *
 * This store's connection is Preview and Production. Development OIDC cannot write
 * to it, and Vercel will not copy the sensitive read-write token into Development.
 * Put `BLOB_READ_WRITE_TOKEN` in gitignored `.env.local` for local sync.
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";
import {
  cardBlobPathname,
  type CardBlobKind,
} from "../shared/cardBlobs.ts";
import type { WorldRecord, WorldsStoreFile } from "../shared/types.ts";

const CONCURRENCY = 6;
const DOWNLOAD_TIMEOUT_MS = 45_000;
const MAX_ATTEMPTS = 4;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "data", "worlds.json");

interface ImageJob {
  kind: CardBlobKind;
  sourceUrl: string;
  pathname: string;
}

interface WorldJob {
  id: string;
  images: ImageJob[];
}

class SyncError extends Error {
  readonly auth: boolean;
  readonly retryable: boolean;

  constructor(message: string, auth: boolean, retryable = false) {
    super(message);
    this.name = "SyncError";
    this.auth = auth;
    this.retryable = retryable;
  }
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/vercel_blob_rw_[A-Za-z0-9_]+/g, "[redacted]")
    .replace(
      /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
      "[redacted]",
    );
}

function isAuthFailure(error: unknown): boolean {
  if (error instanceof SyncError) return error.auth;
  if (typeof error === "object" && error && "status" in error) {
    const status = (error as { status?: number }).status;
    if (status === 401 || status === 403) return true;
  }
  const message = safeError(error).toLowerCase();
  return (
    message.includes("access denied") ||
    message.includes("not authorized") ||
    message.includes("invalid token") ||
    message.includes("oidc")
  );
}

function resolveAuth(): { token?: string } {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("auth: read-write token");
    return { token: process.env.BLOB_READ_WRITE_TOKEN };
  }
  if (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID) {
    console.log("auth: oidc");
    return {};
  }
  console.error(
    "Missing Blob credentials. Add BLOB_READ_WRITE_TOKEN to .env.local (gitignored), then run npm run sync:cards.",
  );
  console.error(
    "Do not commit that file. Development OIDC cannot write to this store.",
  );
  process.exit(1);
}

function assertHttps(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new SyncError("invalid image url", false);
  }
  if (parsed.protocol !== "https:") {
    throw new SyncError("image url must be https", false);
  }
}

function isWebp(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 12) return false;
  const head = String.fromCharCode(...bytes.subarray(0, 4));
  const kind = String.fromCharCode(...bytes.subarray(8, 12));
  return head === "RIFF" && kind === "WEBP";
}

function retryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await run();
    } catch (error) {
      last = error;
      const retryable = error instanceof SyncError && error.retryable;
      if (!retryable || attempt === MAX_ATTEMPTS || isAuthFailure(error)) {
        throw error;
      }
      await sleep(400 * 2 ** (attempt - 1));
    }
  }
  throw last;
}

async function download(url: string): Promise<Uint8Array> {
  assertHttps(url);
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  } catch {
    throw new SyncError("download failed", false, true);
  }
  if (!response.ok) {
    const retryable = retryableStatus(response.status);
    throw new SyncError(`download HTTP ${response.status}`, false, retryable);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!isWebp(bytes)) {
    throw new SyncError("download was not a webp", false);
  }
  return bytes;
}

async function upload(job: ImageJob, token?: string): Promise<string> {
  return withRetry(async () => {
    const bytes = await download(job.sourceUrl);
    try {
      const blob = await put(job.pathname, Buffer.from(bytes), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "image/webp",
        ...(token ? { token } : {}),
      });
      const url = new URL(blob.url);
      const path = decodeURIComponent(url.pathname.replace(/^\//, ""));
      if (path !== job.pathname) {
        throw new SyncError(`blob pathname mismatch: ${path}`, false);
      }
      if (!url.hostname.endsWith(".public.blob.vercel-storage.com")) {
        throw new SyncError(`blob host is not public: ${url.hostname}`, false);
      }
      return url.origin;
    } catch (error) {
      if (error instanceof SyncError) throw error;
      const auth = isAuthFailure(error);
      throw new SyncError(safeError(error), auth, !auth);
    }
  });
}

function imageJob(
  world: WorldRecord,
  kind: CardBlobKind,
  sourceUrl: string | undefined,
): ImageJob {
  if (!sourceUrl) {
    throw new SyncError(`${world.id} missing ${kind} url`, false);
  }
  return {
    kind,
    sourceUrl,
    pathname: cardBlobPathname(world.id, kind),
  };
}

function loadJobs(file: WorldsStoreFile): WorldJob[] {
  const worlds = file.worlds;
  if (!worlds || typeof worlds !== "object") {
    throw new SyncError("data/worlds.json is missing worlds", false);
  }
  return Object.values(worlds)
    .map((world) => ({
      id: world.id,
      images: [
        imageJob(world, "board", world.cardBoard),
        imageJob(world, "hero", world.cardHero),
      ],
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function mapPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  async function run(): Promise<void> {
    while (index < items.length) {
      const current = index;
      index += 1;
      await worker(items[current]);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    run(),
  );
  await Promise.all(workers);
}

async function main(): Promise<void> {
  const auth = resolveAuth();
  const raw = await readFile(catalogPath, "utf8");
  let jobs: WorldJob[];
  try {
    jobs = loadJobs(JSON.parse(raw) as WorldsStoreFile);
  } catch (error) {
    console.error(safeError(error));
    process.exit(1);
  }

  let stopped = false;
  let failedWorlds = 0;
  let failedImages = 0;
  let uploaded = 0;
  let baseUrl: string | null = null;

  await mapPool(jobs, CONCURRENCY, async (job) => {
    if (stopped) {
      failedWorlds += 1;
      console.error(`fail ${job.id} skipped`);
      return;
    }
    const results: string[] = [];
    for (const image of job.images) {
      if (stopped) {
        results.push(`${image.kind}: skipped`);
        failedImages += 1;
        continue;
      }
      try {
        const origin = await upload(image, auth.token);
        if (baseUrl && baseUrl !== origin) {
          throw new SyncError(`blob origin changed: ${origin}`, false);
        }
        baseUrl = origin;
        uploaded += 1;
        results.push(`${image.kind}: ok`);
      } catch (error) {
        failedImages += 1;
        results.push(`${image.kind}: ${safeError(error)}`);
        if (isAuthFailure(error)) {
          stopped = true;
          console.error("stopping: blob auth failed");
        }
      }
    }
    const ok = results.every((line) => line.endsWith(": ok"));
    if (!ok) failedWorlds += 1;
    const line = `${ok ? "ok" : "fail"} ${job.id} ${results.join("; ")}`;
    if (ok) console.log(line);
    else console.error(line);
  });

  console.log(
    `done worlds=${jobs.length} uploaded=${uploaded} failedWorlds=${failedWorlds} failedImages=${failedImages}`,
  );
  if (baseUrl) console.log(`public base: ${baseUrl}`);
  if (failedWorlds > 0 || failedImages > 0 || uploaded === 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(safeError(error));
  process.exit(1);
});
