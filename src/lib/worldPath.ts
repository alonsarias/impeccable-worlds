export {
  WORLD_PATH_PREFIX,
  buildWorldSlugs,
  resolveWorld,
  slugifyWorldName,
  worldKeyFromPathname,
  worldPath,
} from "../../shared/worldPath";

import { worldPath } from "../../shared/worldPath";

export function worldShareUrl(
  target: string | { id: string; name?: string },
  origin: string = window.location.origin,
  catalog?: readonly { id: string; name?: string }[],
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
