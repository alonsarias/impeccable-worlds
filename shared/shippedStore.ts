import shipped from "../data/worlds.json";
import type { WorldsStoreFile } from "./types";

const store = shipped as WorldsStoreFile;

/** Shipped catalog baked into the serverless bundle (Vercel traces the JSON import). */
export function readShippedStore(): WorldsStoreFile {
  return store;
}
