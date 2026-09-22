import {
  cardBlobPathname,
  type CardBlobKind,
} from "../../shared/cardBlobs";

/** Public Blob origin from `VITE_BLOB_CARDS_BASE_URL`, without a trailing slash. */
export function blobCardsBaseUrl(): string | null {
  const raw = import.meta.env.VITE_BLOB_CARDS_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export function blobCardUrl(
  worldId: string,
  kind: CardBlobKind,
): string | null {
  const base = blobCardsBaseUrl();
  if (!base) return null;
  try {
    return `${base}/${cardBlobPathname(worldId, kind)}`;
  } catch {
    return null;
  }
}
