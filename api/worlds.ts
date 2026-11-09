import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function readWorldsFile(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = [path.join(process.cwd(), "data", "worlds.json"), path.join(here, "..", "data", "worlds.json")].find(
    existsSync,
  );
  if (!file) {
    throw new Error(`data/worlds.json is missing (cwd=${process.cwd()})`);
  }
  return readFileSync(file, "utf8");
}

export function GET(): Response {
  const store = JSON.parse(readWorldsFile()) as { worlds: Record<string, unknown> };
  const worlds = Object.values(store.worlds).map((world) => ({
    ...(world as Record<string, unknown>),
    favorite: false,
  }));
  worlds.sort((a, b) =>
    String((a as { name?: string; id: string }).name ?? (a as { id: string }).id).localeCompare(
      String((b as { name?: string; id: string }).name ?? (b as { id: string }).id),
      undefined,
      { sensitivity: "base" },
    ),
  );
  return Response.json({ worlds });
}
