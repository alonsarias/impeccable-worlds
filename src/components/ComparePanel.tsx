import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { World } from "../../shared/types";
import { blobCardUrl } from "../lib/cardImages";
import { copyText } from "../lib/clipboard";
import type { SlotIndex } from "../lib/compare";
import { buildDirectionPrompt } from "../lib/directionPrompt";
import { displayValue } from "../lib/display";
import { useCardSource } from "../lib/useCardSource";
import { WorldNotes } from "./WorldNotes";

interface ComparePanelProps {
  open: boolean;
  slots: [World | null, World | null];
  notice?: ReactNode;
  onClose: () => void;
  onRemove: (index: SlotIndex) => void;
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
  );
  return [...nodes].filter(
    (el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0,
  );
}

function CompareSide({
  world,
  side,
  onRemove,
}: {
  world: World | null;
  side: number;
  onRemove: () => void;
}) {
  const nameId = useId();
  const [copied, setCopied] = useState(false);
  const upstream = world ? (world.cardHero ?? world.cardBoard) : undefined;
  const image = useCardSource(
    upstream,
    world ? blobCardUrl(world.id, world.cardHero ? "hero" : "board") : null,
  );

  useEffect(() => {
    setCopied(false);
  }, [world?.id]);

  if (!world) {
    return (
      <section className="compare-side" aria-label={`Side ${side}, empty`}>
        <p className="compare-empty">Add another world from the catalog.</p>
      </section>
    );
  }

  const selected = world;
  const name = displayValue(selected.name);

  async function copyPrompt() {
    const ok = await copyText(buildDirectionPrompt(selected));
    setCopied(ok);
  }

  return (
    <section className="compare-side" aria-labelledby={nameId}>
      <div className="compare-hero">
        {image.src ? (
          <img src={image.src} alt="" onError={image.onError} />
        ) : (
          <span className="missing">No value</span>
        )}
      </div>
      <h3 id={nameId}>{name}</h3>
      <p className="detail-spark">{displayValue(selected.spark)}</p>
      <div className="compare-actions">
        <button
          type="button"
          className="btn primary"
          onClick={() => void copyPrompt()}
        >
          {copied ? "Copied prompt" : "Copy direction prompt"}
        </button>
        <button
          type="button"
          className="btn ghost"
          aria-label={`Remove ${name} from compare`}
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
      <WorldNotes world={selected} />
    </section>
  );
}

export function ComparePanel({
  open,
  slots,
  notice,
  onClose,
  onRemove,
}: ComparePanelProps) {
  const titleId = useId();
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    paneRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const trapRoot = paneRef.current;
      if (!trapRoot) return;
      event.stopPropagation();
      const focusable = getFocusable(trapRoot);
      if (focusable.length === 0) {
        event.preventDefault();
        trapRoot.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === trapRoot)) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !trapRoot.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={paneRef}
      className="compare-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <div className="compare-panel">
        <header className="compare-head">
          <h2 id={titleId}>Compare</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        {notice}
        <div className="compare-columns">
          {([0, 1] as const).map((index) => (
            <CompareSide
              key={slots[index]?.id ?? `empty-${index}`}
              world={slots[index]}
              side={index + 1}
              onRemove={() => onRemove(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
