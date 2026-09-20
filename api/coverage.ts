import shipped from "../data/worlds.json";
import { coverageFromStore } from "../shared/catalog";
import type { WorldsStoreFile } from "../shared/types";

export function GET(): Response {
  return Response.json(coverageFromStore(shipped as WorldsStoreFile));
}
