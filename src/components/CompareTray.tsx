import { useId, useLayoutEffect, useRef, type Ref } from "react";
import type { World } from "../../shared/types";
import { blobCardUrl } from "../lib/cardImages";
import type { SlotIndex } from "../lib/compare";
import { displayValue } from "../lib/display";
import { useCardSource } from "../lib/useCardSource";

interface CompareTrayProps {
  slots: [World | null, World | null];
  focusedSlot: SlotIndex;
  minimized: boolean;
  onMinimizedChange?: (next: boolean) => void;
  onFocus: (index: SlotIndex) => void;
  onRemove: (index: SlotIndex) => void;
  onClear: () => void;
  onOpen: (opener: HTMLButtonElement) => void;
  openButtonRef: Ref<HTMLButtonElement>;
  limitNote?: boolean;
}

function TrayThumb({ world }: { world: World }) {
  const upstream = world.cardHero ?? world.cardBoard;
  const image = useCardSource(
    upstream,
    blobCardUrl(world.id, world.cardHero ? "hero" : "board"),
  );
  if (!image.src) return <span className="compare-slot-missing">No value</span>;
  return <img src={image.src} alt="" onError={image.onError} />;
}

export function CompareTray({
  slots,
  focusedSlot,
  minimized,
  onMinimizedChange,
  onFocus,
  onRemove,
  onClear,
  onOpen,
  openButtonRef,
  limitNote = false,
}: CompareTrayProps) {
  const trayRef = useRef<HTMLDivElement>(null);
  const slotsId = useId();
  const bothFull = slots[0] !== null && slots[1] !== null;
  const count = slots.filter((slot) => slot !== null).length;

  useLayoutEffect(() => {
    const node = trayRef.current;
    if (!node) return;
    const apply = () => {
      const height = `${Math.ceil(node.getBoundingClientRect().height)}px`;
      document.documentElement.style.setProperty("--compare-tray-space", height);
      document.body.style.setProperty("--compare-tray-space", height);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--compare-tray-space");
      document.body.style.removeProperty("--compare-tray-space");
    };
  }, []);

  return (
    <div
      ref={trayRef}
      className={`compare-tray${minimized ? " is-minimized" : ""}`}
      role="region"
      aria-label="Compare"
    >
      <p className="sr-only" aria-live="polite">
        {count} of 2 in compare
      </p>
      {limitNote ? (
        <p className="compare-limit" role="status">
          Compare is limited to two. Remove one to add another.
        </p>
      ) : null}
      {minimized ? (
        <p className="compare-tray-summary">{count} in compare</p>
      ) : null}
      <div id={slotsId} className="compare-tray-slots" hidden={minimized}>
        {([0, 1] as const).map((index) => {
          const world = slots[index];
          if (!world) return null;
          const name = displayValue(world.name);
          const focused = focusedSlot === index;
          return (
            <div
              key={world.id}
              className={`compare-slot${focused ? " is-focused" : ""}`}
            >
              <button
                type="button"
                className="compare-slot-main"
                aria-pressed={focused}
                aria-label={
                  focused
                    ? `${name}, kept in compare`
                    : `${name}, keep this side`
                }
                title={
                  focused ? "Stays when you add another" : "Keep this side"
                }
                onClick={() => onFocus(index)}
              >
                <span className="compare-slot-thumb">
                  <TrayThumb world={world} />
                  {bothFull && focused ? (
                    <span className="compare-kept">Kept</span>
                  ) : null}
                </span>
                <span className="compare-slot-name">{name}</span>
              </button>
              <button
                type="button"
                className="compare-slot-remove"
                aria-label={`Remove ${name} from compare`}
                onClick={() => onRemove(index)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      <div className="compare-tray-actions">
        {onMinimizedChange ? (
          <button
            type="button"
            className="btn ghost"
            aria-expanded={!minimized}
            aria-controls={slotsId}
            onClick={() => onMinimizedChange(!minimized)}
          >
            {minimized ? "Expand" : "Minimize"}
          </button>
        ) : null}
        <button type="button" className="btn ghost" onClick={onClear}>
          Clear all
        </button>
        <button
          ref={openButtonRef}
          type="button"
          className="btn primary compare-open"
          onClick={(event) => onOpen(event.currentTarget)}
        >
          Open compare
        </button>
      </div>
    </div>
  );
}

interface CompareToastProps {
  message: string;
  embedded?: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

export function CompareToast({
  message,
  embedded = false,
  onUndo,
  onDismiss,
}: CompareToastProps) {
  return (
    <div className={`compare-toast${embedded ? " is-embedded" : ""}`}>
      <p role="status">{message}</p>
      <button type="button" className="btn" onClick={onUndo}>
        Undo
      </button>
      <button
        type="button"
        className="icon-btn"
        aria-label="Dismiss"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
}
