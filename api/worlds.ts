import shipped from "../data/worlds.json";
import { worldsFromStore } from "../shared/catalog";
import type { WorldsStoreFile } from "../shared/types";

export function GET(): Response {
  return Response.json({ worlds: worldsFromStore(shipped as WorldsStoreFile) });
}
