import type { Ref } from "react";
import type { World } from "../../shared/types";
import { blobCardUrl } from "../lib/cardImages";
import type { SlotIndex } from "../lib/compare";
import { displayValue } from "../lib/display";
import { useCardSource } from "../lib/useCardSource";

interface CompareTrayProps {
  slots: [World | null, World | null];
  focusedSlot: SlotIndex;
  onFocus: (index: SlotIndex) => void;
  onRemove: (index: SlotIndex) => void;
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
  onFocus,
  onRemove,
  onOpen,
  openButtonRef,
  limitNote = false,
}: CompareTrayProps) {
  const bothFull = slots[0] !== null && slots[1] !== null;
  const count = slots.filter((slot) => slot !== null).length;

  return (
    <div className="compare-tray" role="region" aria-label="Compare">
      <p className="sr-only" aria-live="polite">
        {count} of 2 in compare
      </p>
      {limitNote ? (
        <p className="compare-limit" role="status">
          Compare is limited to two. Remove one to add another.
        </p>
      ) : null}
      <div className="compare-tray-slots">
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
      <button
        ref={openButtonRef}
        type="button"
        className="btn primary compare-open"
        onClick={(event) => onOpen(event.currentTarget)}
      >
        Open compare
      </button>
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
