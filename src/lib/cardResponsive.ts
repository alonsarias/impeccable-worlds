import {
  cardResponsiveAttributes,
  DETAIL_HERO_LCP_WIDTH,
  type CardImageWidth,
} from "../../shared/cardImageOptimize";

export function useCardImageOptimize(): boolean {
  return import.meta.env.PROD;
}

export function responsiveCardImage(
  sourceUrl: string | undefined,
  sizes: string,
  widths?: readonly CardImageWidth[],
  defaultWidth?: CardImageWidth,
): ReturnType<typeof cardResponsiveAttributes> {
  return cardResponsiveAttributes(
    sourceUrl,
    sizes,
    widths,
    import.meta.env.PROD,
    defaultWidth,
  );
}

export function responsiveDetailPreviewImage(
  sourceUrl: string | undefined,
  sizes: string,
): ReturnType<typeof cardResponsiveAttributes> {
  return responsiveCardImage(
    sourceUrl,
    sizes,
    undefined,
    DETAIL_HERO_LCP_WIDTH,
  );
}
