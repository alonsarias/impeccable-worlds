import { useEffect, useRef, type RefObject } from "react";

type Axis = "x" | "y";

const LOCK_PX = 10;
const MIN_PX = 56;
const MIN_RATIO = 0.16;
const FLICK = 0.5;
const EASE = "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)";

export function useSwipeNavigate(
  rootRef: RefObject<HTMLElement | null>,
  args: {
    enabled: boolean;
    onStep: (delta: -1 | 1) => void;
  },
) {
  const onStepRef = useRef(args.onStep);
  onStepRef.current = args.onStep;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !args.enabled) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startT = 0;
    let lastX = 0;
    let lastT = 0;
    let axis: Axis | null = null;
    let dragging = false;

    const motion = () =>
      root.querySelector<HTMLElement>("[data-swipe-motion]") ?? root;

    const clearMotion = (animate: boolean) => {
      const node = motion();
      node.style.willChange = "";
      if (reduceMotion || !animate) {
        node.style.transition = "";
        node.style.transform = "";
        return;
      }
      node.style.transition = EASE;
      node.style.transform = "";
      const done = () => {
        node.style.transition = "";
        node.removeEventListener("transitionend", done);
      };
      node.addEventListener("transitionend", done);
    };

    const dragTo = (dx: number) => {
      if (reduceMotion) return;
      const node = motion();
      const width = root.clientWidth || 1;
      const offset = Math.max(-width * 0.34, Math.min(width * 0.34, dx * 0.68));
      node.style.willChange = "transform";
      node.style.transition = "none";
      node.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    const suppressClick = () => {
      const onClick = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        root.removeEventListener("click", onClick, true);
      };
      root.addEventListener("click", onClick, true);
      window.setTimeout(
        () => root.removeEventListener("click", onClick, true),
        450,
      );
    };

    const resetPointer = () => {
      pointerId = null;
      axis = null;
      dragging = false;
      root.classList.remove("is-swiping");
    };

    const finish = () => {
      if (pointerId === null) return;
      const dx = lastX - startX;
      const dt = Math.max(1, lastT - startT);
      const width = root.clientWidth || window.innerWidth;
      const passed =
        Math.abs(dx) >= Math.min(MIN_PX, width * MIN_RATIO) ||
        Math.abs(dx) / dt >= FLICK;
      const committed = dragging && passed && Math.abs(dx) > 8;
      if (dragging) suppressClick();
      resetPointer();
      if (committed) {
        const node = motion();
        node.style.transition = "";
        node.style.transform = "";
        node.style.willChange = "";
        onStepRef.current(dx < 0 ? 1 : -1);
        return;
      }
      clearMotion(true);
    };

    const onDown = (event: PointerEvent) => {
      if (pointerId !== null) return;
      if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
      if (event.button !== 0) return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          "input, textarea, select, [contenteditable='true']",
        )
      ) {
        return;
      }
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      startY = event.clientY;
      startT = lastT = event.timeStamp;
      axis = null;
      dragging = false;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      lastX = event.clientX;
      lastT = event.timeStamp;
      if (axis === null) {
        if (Math.hypot(dx, dy) < LOCK_PX) return;
        axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? "x" : "y";
        if (axis === "x") {
          dragging = true;
          root.classList.add("is-swiping");
          try {
            root.setPointerCapture(event.pointerId);
          } catch {
            /* already released */
          }
        }
      }
      if (axis !== "x") return;
      event.preventDefault();
      dragTo(dx);
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      finish();
    };

    const onCancel = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      if (dragging) suppressClick();
      resetPointer();
      clearMotion(true);
    };

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove, { passive: false });
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onCancel);

    return () => {
      root.classList.remove("is-swiping");
      const node = motion();
      node.style.transition = "";
      node.style.transform = "";
      node.style.willChange = "";
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onCancel);
    };
  }, [rootRef, args.enabled]);
}
