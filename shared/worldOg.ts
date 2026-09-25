import { cardBlobPathname } from "./cardBlobs";
import { worldPath } from "./worldPath";

export const SITE_NAME = "Impeccable Worlds";
export const WORLD_OG_DESCRIPTION_FALLBACK =
  "Choose a direction by eye. Copy the prompt.";

const DESCRIPTION_MAX = 160;

export type OgWorld = {
  id: string;
  name?: string;
  form?: string;
  spark?: string;
  cardHero?: string;
};

export type WorldOgSpec = {
  title: string;
  description: string;
  image: string;
  imageType: string;
  /** True only for the legacy 1200×630 png. Hero webps omit width and height. */
  imageSized: boolean;
  pageUrl: string | null;
};

type WorldOgOptions = {
  siteUrl: string;
  blobBase?: string | null;
  /** Request origin, used by the dev server so og:url matches the fetched host. */
  pageOrigin?: string | null;
};

export function worldOgTitle(world: Pick<OgWorld, "id" | "name">): string {
  const name = collapse(world.name) || world.id;
  return `${name} · ${SITE_NAME}`;
}

export function worldOgDescription(
  world: Pick<OgWorld, "spark" | "form">,
): string {
  const source = collapse(world.spark) || collapse(world.form);
  if (!source) return WORLD_OG_DESCRIPTION_FALLBACK;
  return clampDescription(source);
}

export function worldOgSpec(
  world: OgWorld,
  catalog: readonly { id: string; name?: string }[],
  options: WorldOgOptions,
): WorldOgSpec {
  const origin = httpOrigin(options.pageOrigin) ?? httpOrigin(options.siteUrl);
  const image = worldOgImage(world, options.blobBase, options.siteUrl);
  const title = worldOgTitle(world);
  const description = worldOgDescription(world);
  const pageUrl = origin ? `${origin}${worldPath(world, catalog)}` : null;
  return {
    title,
    description,
    image: image.url,
    imageType: image.type,
    imageSized: image.sized,
    pageUrl,
  };
}

/** Home share image: the brand card at /og.png, not a world hero. */
export function siteOgImage(siteUrl: string): {
  url: string;
  type: string;
  sized: boolean;
} {
  const origin = httpOrigin(siteUrl);
  return {
    url: origin ? `${origin}/og.png` : "/og.png",
    type: "image/png",
    sized: true,
  };
}

/** Inject world Open Graph tags into an SPA shell. Home HTML is left untouched. */
export function applyWorldOg(html: string, spec: WorldOgSpec): string {
  let next = html.replaceAll("<!--SEO_CANONICAL-->", "");
  next = next.replaceAll("<!--SEO_JSONLD-->", "");
  next = replaceTitle(next, spec.title);
  next = replaceMeta(next, "name", "description", spec.description);
  next = replaceMeta(next, "property", "og:title", spec.title);
  next = replaceMeta(next, "property", "og:description", spec.description);
  next = replaceMeta(next, "property", "og:image", spec.image);
  next = replaceMeta(next, "property", "og:image:type", spec.imageType);
  next = replaceMeta(next, "name", "twitter:card", "summary_large_image");
  next = replaceMeta(next, "name", "twitter:title", spec.title);
  next = replaceMeta(next, "name", "twitter:description", spec.description);
  next = replaceMeta(next, "name", "twitter:image", spec.image);
  next = spec.imageSized ? ensureImageSize(next) : stripImageSize(next);
  next = upsertPageUrl(next, spec.pageUrl);
  next = upsertJsonLd(next, spec);
  assertWorldOg(next, spec);
  return next;
}

function worldOgImage(
  world: Pick<OgWorld, "id" | "cardHero">,
  blobBase: string | null | undefined,
  siteUrl: string,
): { url: string; type: string; sized: boolean } {
  const blob = httpsOrigin(blobBase);
  if (blob) {
    try {
      return {
        url: `${blob}/${cardBlobPathname(world.id, "hero")}`,
        type: "image/webp",
        sized: false,
      };
    } catch {
      // Unsafe id. Fall through to the catalog hero.
    }
  }
  const hero = world.cardHero?.trim() ?? "";
  if (hero.startsWith("https://")) {
    return { url: hero, type: imageMime(hero), sized: false };
  }
  const origin = httpOrigin(siteUrl);
  return {
    url: origin ? `${origin}/og.png` : "/og.png",
    type: "image/png",
    sized: true,
  };
}

function clampDescription(text: string): string {
  if (text.length <= DESCRIPTION_MAX) return text;
  const ellipsis = "…";
  let cut = text.slice(0, DESCRIPTION_MAX - ellipsis.length);
  const space = cut.lastIndexOf(" ");
  if (space >= 80) cut = cut.slice(0, space);
  cut = cut.replace(/[\s,;:!.-]+$/u, "");
  if (!cut) cut = text.slice(0, DESCRIPTION_MAX - ellipsis.length).trimEnd();
  return `${cut}${ellipsis}`;
}

function collapse(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function httpsOrigin(value: string | null | undefined): string | null {
  const origin = httpOrigin(value);
  if (!origin || !origin.startsWith("https://")) return null;
  return origin;
}

function httpOrigin(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (url.pathname !== "/" && url.pathname !== "") return null;
    if (url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function imageMime(url: string): string {
  const pathname = url.split(/[?#]/, 1)[0]?.toLowerCase() ?? "";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg"))
    return "image/jpeg";
  if (pathname.endsWith(".gif")) return "image/gif";
  return "image/webp";
}

function replaceTitle(html: string, title: string): string {
  const tag = `<title>${escapeText(title)}</title>`;
  if (/<title>[\s\S]*?<\/title>/.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/, tag);
  }
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function replaceMeta(
  html: string,
  attr: "name" | "property",
  key: string,
  content: string,
): string {
  const tag = `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`;
  const pattern = new RegExp(
    `<meta\\s+${attr}="${escapeRegExp(key)}"\\s+content="[\\s\\S]*?"\\s*\\/?>`,
  );
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function ensureImageSize(html: string): string {
  if (html.includes('property="og:image:width"')) return html;
  const tags = [
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
  ].join("\n    ");
  if (/<meta\s+property="og:image:type"\s+content="[^"]*"\s*\/?>/.test(html)) {
    return html.replace(
      /(<meta\s+property="og:image:type"\s+content="[^"]*"\s*\/?>)/,
      `$1\n    ${tags}`,
    );
  }
  return html.replace("</head>", `    ${tags}\n  </head>`);
}

function stripImageSize(html: string): string {
  return html.replace(
    /\n?[ \t]*<meta\s+property="og:image:(?:width|height)"\s+content="[^"]*"\s*\/?>/g,
    "",
  );
}

function upsertPageUrl(html: string, pageUrl: string | null): string {
  if (!pageUrl) {
    return html
      .replace(/\n?[ \t]*<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/g, "")
      .replace(
        /\n?[ \t]*<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/g,
        "",
      );
  }
  const href = escapeAttr(pageUrl);
  const link = `<link rel="canonical" href="${href}" />`;
  const og = `<meta property="og:url" content="${href}" />`;
  if (/<link\s+rel="canonical"\s+href=/.test(html)) {
    html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/, link);
  } else {
    html = html.replace("</head>", `    ${link}\n  </head>`);
  }
  if (/<meta\s+property="og:url"\s+content=/.test(html)) {
    html = html.replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
      og,
    );
  } else {
    html = html.replace("</head>", `    ${og}\n  </head>`);
  }
  return html;
}

function upsertJsonLd(html: string, spec: WorldOgSpec): string {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: spec.title,
    description: spec.description,
    image: spec.image,
  };
  if (spec.pageUrl) data.url = spec.pageUrl;
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  const tag = `<script type="application/ld+json">${json}</script>`;
  const pattern = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function assertWorldOg(html: string, spec: WorldOgSpec): void {
  const expected: Array<[string, string, string]> = [
    ["name", "description", spec.description],
    ["property", "og:title", spec.title],
    ["property", "og:description", spec.description],
    ["property", "og:image", spec.image],
    ["property", "og:image:type", spec.imageType],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", spec.title],
    ["name", "twitter:description", spec.description],
    ["name", "twitter:image", spec.image],
  ];
  if (!html.includes(`<title>${escapeText(spec.title)}</title>`)) {
    throw new Error("world og: failed to set <title>");
  }
  for (const [attr, key, content] of expected) {
    const needle = `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`;
    if (!html.includes(needle)) {
      throw new Error(`world og: failed to set ${key}`);
    }
    if (countTags(html, needle) !== 1) {
      throw new Error(`world og: duplicate ${key}`);
    }
  }
  if (spec.pageUrl) {
    const href = escapeAttr(spec.pageUrl);
    for (const needle of [
      `<link rel="canonical" href="${href}" />`,
      `<meta property="og:url" content="${href}" />`,
    ]) {
      if (countTags(html, needle) !== 1) {
        throw new Error(`world og: failed to set ${needle}`);
      }
    }
  } else if (/property="og:url"|rel="canonical"/.test(html)) {
    throw new Error("world og: left a site-root canonical on a world page");
  }
  if (spec.imageSized) {
    if (!html.includes('property="og:image:width"')) {
      throw new Error("world og: dropped site image dimensions");
    }
  } else if (/property="og:image:(?:width|height)"/.test(html)) {
    throw new Error("world og: left site image dimensions on a hero");
  }
  if (
    !html.includes('"@type":"WebPage"') ||
    html.includes('"@type":"CollectionPage"')
  ) {
    throw new Error("world og: failed to replace JSON-LD");
  }
}

function countTags(html: string, needle: string): number {
  let count = 0;
  let from = 0;
  while (from < html.length) {
    const at = html.indexOf(needle, from);
    if (at < 0) break;
    count += 1;
    from = at + needle.length;
  }
  return count;
}

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
