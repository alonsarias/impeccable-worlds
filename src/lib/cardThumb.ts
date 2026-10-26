/** Intrinsic dimensions for card hero thumbs (4∶3). Used for layout reserve before decode. */
export const CARD_THUMB_INTRINSIC_WIDTH = 1200;
export const CARD_THUMB_INTRINSIC_HEIGHT = 900;

export type CardImagePriority = "high" | "eager" | "lazy";

export function cardImagePriority(
  index: number,
  columns: number,
): CardImagePriority {
  if (index >= columns) return "lazy";
  return index === 0 ? "high" : "eager";
}
