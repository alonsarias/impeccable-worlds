export const WORLD_PATH_PREFIX = "/w/";

export function worldPath(id: string): string {
  return `${WORLD_PATH_PREFIX}${encodeURIComponent(id)}`;
}

export function worldIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/w\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    const id = decodeURIComponent(match[1]).trim();
    return id || null;
  } catch {
    return null;
  }
}

export function worldShareUrl(
  id: string,
  origin: string = window.location.origin,
): string {
  return new URL(worldPath(id), origin).href;
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
