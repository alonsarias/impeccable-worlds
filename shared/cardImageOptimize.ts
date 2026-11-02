/** Widths allowed by vercel.json `images.sizes` and used in card srcset. */
export const CARD_IMAGE_WIDTHS = [320, 480, 640, 960, 1200] as const;

export const CARD_IMAGE_QUALITY = 75;

export type CardImageWidth = (typeof CARD_IMAGE_WIDTHS)[number];

export function vercelOptimizedImageUrl(
  sourceUrl: string,
  width: CardImageWidth,
): string {
  const params = new URLSearchParams({
    url: sourceUrl,
    w: String(width),
    q: String(CARD_IMAGE_QUALITY),
  });
  return `/_vercel/image?${params.toString()}`;
}

export function cardImageSrcSet(
  sourceUrl: string,
  widths: readonly CardImageWidth[] = CARD_IMAGE_WIDTHS,
): string {
  return widths
    .map((w) => `${vercelOptimizedImageUrl(sourceUrl, w)} ${w}w`)
    .join(", ");
}

/** Default `src` when srcset is present (middle density for ~1x). */
export function cardImageDefaultSrc(sourceUrl: string): string {
  return vercelOptimizedImageUrl(sourceUrl, 640);
}

export type CardLayoutKind = "comfortable" | "compact" | "list";

/** `sizes` for catalog grid card thumbs; matches layout breakpoints in index.css. */
export function cardGridImageSizes(layout: CardLayoutKind): string {
  switch (layout) {
    case "list":
      return "(min-width: 960px) 220px, 42vw";
    case "compact":
      return "(min-width: 960px) 25vw, 50vw";
    default:
      return "(min-width: 960px) 33vw, 100vw";
  }
}

export const DETAIL_PREVIEW_IMAGE_SIZES = "(min-width: 800px) 50vw, 100vw";
export const DETAIL_VIEWER_IMAGE_SIZES = "100vw";
export const COMPARE_THUMB_IMAGE_SIZES = "56px";

const LCP_PRELOAD_WIDTH: CardImageWidth = 640;
const WORLD_LCP_PRELOAD_WIDTH: CardImageWidth = 960;

export function cardResponsiveAttributes(
  sourceUrl: string | undefined,
  sizes: string,
  widths: readonly CardImageWidth[] = CARD_IMAGE_WIDTHS,
  optimize = true,
): { src?: string; srcSet?: string; sizes?: string } {
  if (!sourceUrl) return {};
  if (!optimize) {
    return { src: sourceUrl };
  }
  return {
    src: cardImageDefaultSrc(sourceUrl),
    srcSet: cardImageSrcSet(sourceUrl, widths),
    sizes,
  };
}

function escapePreloadAttr(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

/** Preload tag for the home grid lead card (first row LCP). */
export function homeLeadCardPreloadTag(
  heroUrl: string,
  gridSizes: string,
): string {
  const href = escapePreloadAttr(
    vercelOptimizedImageUrl(heroUrl, LCP_PRELOAD_WIDTH),
  );
  const srcset = escapePreloadAttr(cardImageSrcSet(heroUrl));
  const sizes = escapePreloadAttr(gridSizes);
  return `    <link rel="preload" as="image" href="${href}" imagesrcset="${srcset}" imagesizes="${sizes}" fetchpriority="high" />\n`;
}

/** Preload tag when landing directly on a world share URL (detail hero). */
export function worldHeroPreloadTag(heroUrl: string): string {
  const href = escapePreloadAttr(
    vercelOptimizedImageUrl(heroUrl, WORLD_LCP_PRELOAD_WIDTH),
  );
  return `    <link rel="preload" as="image" href="${href}" fetchpriority="high" />\n`;
}

export function stripLcpImagePreload(html: string): string {
  return html.replace(
    /\n?[ \t]*<link rel="preload" as="image"[^>]*\/>\n?/g,
    "\n",
  );
}
