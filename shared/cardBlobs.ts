export type CardBlobKind = "hero" | "board";

const WORLD_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Stable public pathname. Hero is `cards/{id}-hero.webp`; board is `cards/{id}.webp`. */
export function cardBlobPathname(worldId: string, kind: CardBlobKind): string {
  if (!WORLD_ID.test(worldId)) {
    throw new Error(`Unsafe world id for blob pathname: ${worldId}`);
  }
  return kind === "hero"
    ? `cards/${worldId}-hero.webp`
    : `cards/${worldId}.webp`;
}
