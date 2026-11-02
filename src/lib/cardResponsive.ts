import {
  cardResponsiveAttributes,
  type CardImageWidth,
} from "../../shared/cardImageOptimize";

export function useCardImageOptimize(): boolean {
  return import.meta.env.PROD;
}

export function responsiveCardImage(
  sourceUrl: string | undefined,
  sizes: string,
  widths?: readonly CardImageWidth[],
): ReturnType<typeof cardResponsiveAttributes> {
  return cardResponsiveAttributes(
    sourceUrl,
    sizes,
    widths,
    import.meta.env.PROD,
  );
}
