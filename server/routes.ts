import type { IncomingMessage, ServerResponse } from "node:http";
import type { CollectRequest } from "../shared/types";
import { runCollector } from "./collector";
import { flushStore, getCoverage, listWorlds, loadStore, toggleFavorite } from "./store";

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  const raw = await readBody(req);
  if (!raw.trim()) return {};
  return JSON.parse(raw) as unknown;
}

export async function handleApi(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `http://${host}`);
  if (!url.pathname.startsWith("/api/")) return false;

  await loadStore();
  const method = req.method ?? "GET";

  if (method === "GET" && url.pathname === "/api/worlds") {
    sendJson(res, 200, { worlds: listWorlds() });
    return true;
  }

  if (method === "GET" && url.pathname === "/api/coverage") {
    sendJson(res, 200, getCoverage());
    return true;
  }

  if (method === "POST" && url.pathname === "/api/favorites") {
    let body: unknown;
    try {
      body = await parseJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body." });
      return true;
    }
    const id = body && typeof body === "object" ? (body as { id?: unknown }).id : undefined;
    if (typeof id !== "string" || id.trim() === "") {
      sendJson(res, 400, { error: "id is required." });
      return true;
    }
    const favorite = toggleFavorite(id);
    await flushStore();
    sendJson(res, 200, { id, favorite });
    return true;
  }

  if (method === "POST" && url.pathname === "/api/collect") {
    let body: unknown;
    try {
      body = await parseJsonBody(req);
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body." });
      return true;
    }
    const request = (body && typeof body === "object" ? body : {}) as CollectRequest;
    const stats = await runCollector(request);
    const status = stats.stopReason === "already_running" ? 409 : stats.stopReason === "invalid_request" ? 400 : 200;
    sendJson(res, status, stats);
    return true;
  }

  sendJson(res, 404, { error: "Not found." });
  return true;
}
