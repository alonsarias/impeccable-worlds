import { useSyncExternalStore } from "react";
import type { CardLayout } from "../components/WorldGrid";

const DESKTOP_MEDIA = "(min-width: 960px)";

/** Column count for the home catalog grid; matches layout breakpoints in index.css. */
export function gridColumnCount(layout: CardLayout, desktop: boolean): number {
  if (layout === "list") return 1;
  if (layout === "compact") return desktop ? 4 : 2;
  return desktop ? 3 : 1;
}

function subscribeDesktop(onChange: () => void): () => void {
  const media = window.matchMedia(DESKTOP_MEDIA);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function readDesktop(): boolean {
  return window.matchMedia(DESKTOP_MEDIA).matches;
}

/** SSR assumes mobile column counts so the first visible row stays eager. */
function readDesktopServer(): boolean {
  return false;
}

export function useGridColumnCount(layout: CardLayout): number {
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    readDesktop,
    readDesktopServer,
  );
  return gridColumnCount(layout, desktop);
}
