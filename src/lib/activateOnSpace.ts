import type { KeyboardEvent as ReactKeyboardEvent } from "react";

function isPlainSpace(event: ReactKeyboardEvent<HTMLElement>): boolean {
  return (
    event.key === " " &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

export function preventSpaceScroll(event: ReactKeyboardEvent<HTMLElement>) {
  if (isPlainSpace(event)) event.preventDefault();
}

export function activateOnSpace(
  event: ReactKeyboardEvent<HTMLElement>,
  activate: () => void,
) {
  if (!isPlainSpace(event)) return;
  event.preventDefault();
  activate();
}
