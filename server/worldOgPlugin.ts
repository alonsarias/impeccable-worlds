import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { worldsFromStore } from "../shared/catalog";
import type { World, WorldsStoreFile } from "../shared/types";
import { applyWorldOg, worldOgSpec } from "../shared/worldOg";
import {
  buildWorldSlugs,
  resolveWorld,
  worldKeyFromPathname,
} from "../shared/worldPath";

const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Next = (error?: unknown) => void;

export function worldOgPlugin(options: {
  siteUrl: string;
  blobBase: string;
}): Plugin {
  let root = process.cwd();
  let outDir = path.resolve(process.cwd(), "dist");
  let command: "build" | "serve" = "serve";
  let catalogCache: { file: string; mtimeMs: number; worlds: World[] } | null =
    null;

  const siteUrl = options.siteUrl;
  const blobBase = options.blobBase;

  function catalog(): World[] {
    const file = path.join(root, "data", "worlds.json");
    const mtimeMs = fs.statSync(file).mtimeMs;
    if (
      catalogCache &&
      catalogCache.file === file &&
      catalogCache.mtimeMs === mtimeMs
    ) {
      return catalogCache.worlds;
    }
    const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!isStore(parsed)) {
      throw new Error("world og: data/worlds.json is missing a worlds object");
    }
    const worlds = worldsFromStore(parsed);
    catalogCache = { file, mtimeMs, worlds };
    return worlds;
  }

  return {
    name: "world-og",
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
      command = config.command;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!isPageGet(req)) return next();
        const key = keyFromUrl(req.url);
        if (!key) return next();
        void serveDevWorld(server, req, res, next, key, () => catalog()).catch(
          next,
        );
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!isPageGet(req)) return next();
        const key = keyFromUrl(req.url);
        if (!key) return next();
        const file = worldHtmlFile(outDir, key);
        if (!file) return next();
        sendHtml(res, req.method, fs.readFileSync(file));
      });
    },
    writeBundle(options, bundle) {
      if (command !== "build") return;
      const asset = bundle["index.html"];
      if (!asset || asset.type !== "asset") return;
      const shell =
        typeof asset.source === "string"
          ? asset.source
          : new TextDecoder().decode(asset.source);
      const worlds = catalog();
      const dir = options.dir ?? outDir;
      const files = writeWorldPages(dir, shell, worlds, siteUrl, blobBase);
      const sample = worlds[0];
      const spec = sample
        ? worldOgSpec(sample, worlds, { siteUrl, blobBase })
        : null;
      if (sample && spec && !spec.pageUrl) {
        this.warn(
          "VITE_SITE_URL is unset, so world pages omit absolute og:url and canonical",
        );
      }
      if (
        sample &&
        spec &&
        blobBase.trim() &&
        !spec.image.includes(`/cards/${sample.id}-hero.webp`)
      ) {
        this.warn(
          "VITE_BLOB_CARDS_BASE_URL is not an https origin; world previews use catalog cardHero URLs",
        );
      }
      this.info(
        `wrote ${files} world share pages for ${worlds.length} catalog worlds`,
      );
    },
  };

  function serveDevWorld(
    server: ViteDevServer,
    req: IncomingMessage,
    res: ServerResponse,
    next: Next,
    key: string,
    readCatalog: () => World[],
  ): Promise<void> {
    const worlds = readCatalog();
    const world = resolveWorld(worlds, key);
    if (!world) {
      next();
      return Promise.resolve();
    }
    const raw = fs.readFileSync(path.join(root, "index.html"), "utf8");
    return server
      .transformIndexHtml("/index.html", raw, req.url)
      .then((transformed) => {
        const html = applyWorldOg(
          transformed,
          worldOgSpec(world, worlds, {
            siteUrl,
            blobBase,
            pageOrigin: originFrom(req),
          }),
        );
        sendHtml(res, req.method, html);
      });
  }
}

function writeWorldPages(
  outDir: string,
  shell: string,
  worlds: readonly World[],
  siteUrl: string,
  blobBase: string,
): number {
  const slugs = buildWorldSlugs(worlds);
  let files = 0;
  for (const world of worlds) {
    const html = applyWorldOg(
      shell,
      worldOgSpec(world, worlds, { siteUrl, blobBase }),
    );
    const slug = slugs.get(world.id) ?? world.id;
    for (const segment of segmentsFor(slug, world.id)) {
      const dir = path.join(outDir, "w", segment);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "index.html"), html);
      files += 1;
    }
  }
  return files;
}

function segmentsFor(slug: string, id: string): string[] {
  const segments: string[] = [];
  for (const segment of [slug, id]) {
    if (!SEGMENT.test(segment) || segments.includes(segment)) continue;
    segments.push(segment);
  }
  return segments;
}

function worldHtmlFile(outDir: string, key: string): string | null {
  if (!SEGMENT.test(key)) return null;
  const base = path.resolve(outDir, "w");
  const file = path.resolve(base, key, "index.html");
  const relative = path.relative(base, file);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  if (!fs.existsSync(file)) return null;
  return file;
}

function isStore(value: unknown): value is WorldsStoreFile {
  if (!value || typeof value !== "object") return false;
  return (
    "worlds" in value &&
    typeof value.worlds === "object" &&
    value.worlds !== null
  );
}

function isPageGet(req: IncomingMessage): boolean {
  return req.method === "GET" || req.method === "HEAD";
}

function keyFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return worldKeyFromPathname(new URL(url, "http://localhost").pathname);
  } catch {
    return null;
  }
}

function originFrom(req: IncomingMessage): string | null {
  const hostHeader = req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (!host) return null;
  const forwarded = req.headers["x-forwarded-proto"];
  const protoHeader = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const proto = protoHeader?.split(",")[0]?.trim() || "http";
  if (proto !== "http" && proto !== "https") return null;
  return `${proto}://${host}`;
}

function sendHtml(
  res: ServerResponse,
  method: string | undefined,
  html: string | Buffer,
): void {
  const body = typeof html === "string" ? Buffer.from(html) : html;
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Length", body.length);
  res.end(method === "HEAD" ? undefined : body);
}
