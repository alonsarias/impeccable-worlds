import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function worldsJsonPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), "data", "worlds.json"),
    path.join(here, "..", "data", "worlds.json"),
    path.join(here, "data", "worlds.json"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    `worlds.json not found (cwd=${process.cwd()}, here=${here})`,
  );
}

export function GET(): Response {
  try {
    const file = worldsJsonPath();
    const raw = readFileSync(file, "utf8");
    const shipped = JSON.parse(raw) as { worlds?: unknown };
    const worlds = Array.isArray(shipped.worlds) ? shipped.worlds : [];
    return Response.json({
      probe: "fs",
      file,
      count: worlds.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message, cwd: process.cwd() }, { status: 500 });
  }
}
