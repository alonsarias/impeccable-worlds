export const WORLD_PATH_PREFIX = "/w/";

type WorldRef = { id: string; name?: string };

export function slugifyWorldName(name: string | undefined): string {
  return (name ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildWorldSlugs(
  worlds: readonly WorldRef[],
): Map<string, string> {
  const ids = new Set(worlds.map((world) => world.id));
  const rows = worlds.map((world) => ({
    id: world.id,
    nameSlug: slugifyWorldName(world.name),
  }));
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.nameSlug) continue;
    counts.set(row.nameSlug, (counts.get(row.nameSlug) ?? 0) + 1);
  }

  const slugs = new Map<string, string>();
  for (const row of rows) {
    const { id, nameSlug } = row;
    const ambiguous =
      !nameSlug ||
      (counts.get(nameSlug) ?? 0) > 1 ||
      (nameSlug !== id && ids.has(nameSlug));
    slugs.set(id, ambiguous ? id : nameSlug);
  }
  return slugs;
}

export function resolveWorld<T extends WorldRef>(
  worlds: readonly T[],
  key: string,
): T | undefined {
  const byId = worlds.find((world) => world.id === key);
  if (byId) return byId;
  const slugs = buildWorldSlugs(worlds);
  const matches = worlds.filter((world) => slugs.get(world.id) === key);
  return matches.length === 1 ? matches[0] : undefined;
}

export function worldPath(
  target: string | WorldRef,
  catalog?: readonly WorldRef[],
): string {
  const slug = pathSlug(target, catalog);
  return `${WORLD_PATH_PREFIX}${encodeURIComponent(slug)}`;
}

function pathSlug(
  target: string | WorldRef,
  catalog?: readonly WorldRef[],
): string {
  if (typeof target === "string") {
    if (!catalog) return target;
    const world = resolveWorld(catalog, target);
    return world
      ? (buildWorldSlugs(catalog).get(world.id) ?? world.id)
      : target;
  }
  if (!catalog) return slugifyWorldName(target.name) || target.id;
  return buildWorldSlugs(catalog).get(target.id) ?? target.id;
}

export function worldKeyFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/w\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    const key = decodeURIComponent(match[1]).trim();
    return key || null;
  } catch {
    return null;
  }
}

export function worldShareUrl(
  target: string | WorldRef,
  origin: string = window.location.origin,
  catalog?: readonly WorldRef[],
): string {
  return new URL(worldPath(target, catalog), origin).href;
}

export function shouldAllowNativeLink(
  event: Pick<
    MouseEvent,
    | "defaultPrevented"
    | "button"
    | "metaKey"
    | "ctrlKey"
    | "shiftKey"
    | "altKey"
  >,
): boolean {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}
