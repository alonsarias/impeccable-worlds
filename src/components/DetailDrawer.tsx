import { useEffect, useId, useRef, useState } from "react";
import type { World } from "../../shared/types";
import { copyText } from "../lib/clipboard";
import { buildDirectionPrompt } from "../lib/directionPrompt";
import { displayValue } from "../lib/display";
import { worldShareUrl } from "../lib/worldPath";

interface DetailDrawerProps {
  world: World | null;
  requestedId: string | null;
  queue: World[];
  onClose: () => void;
  onFavorite: (id: string) => void;
  onSelect: (id: string) => void;
}

type CopiedKind = "prompt" | "link" | null;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  return [...nodes].filter(
    (el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0,
  );
}

export function DetailDrawer({
  world,
  requestedId,
  queue,
  onClose,
  onFavorite,
  onSelect,
}: DetailDrawerProps) {
  const titleId = useId();
  const descId = useId();
  const paneRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<CopiedKind>(null);
  const index = world ? queue.findIndex((entry) => entry.id === world.id) : -1;
  const canStep = Boolean(world) && queue.length > 1;

  const open = requestedId !== null;
  const shareId = world?.id ?? requestedId;

  useEffect(() => {
    setCopied(null);
    scrollRef.current?.scrollTo(0, 0);
  }, [requestedId, world?.id]);

  useEffect(() => {
    if (!open) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    paneRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const step = (delta: number) => {
      if (!world || queue.length === 0) return;
      const current = queue.findIndex((entry) => entry.id === world.id);
      const from = current >= 0 ? current : delta > 0 ? -1 : 0;
      onSelect(queue[(from + delta + queue.length) % queue.length].id);
    };

    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;

      if (event.key === "Tab") {
        const pane = paneRef.current;
        if (!pane) return;
        const focusable = getFocusable(pane);
        if (focusable.length === 0) {
          event.preventDefault();
          pane.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === pane)) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (active === last || !pane.contains(active))
        ) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      if (isTypingTarget(event.target)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (!canStep) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, world, queue, canStep, onClose, onSelect]);

  if (!open) return null;

  async function copyLink() {
    if (!shareId) return;
    const ok = await copyText(worldShareUrl(shareId));
    setCopied(ok ? "link" : null);
  }

  if (!world) {
    return (
      <div
        ref={paneRef}
        className="detail-root"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
      >
        <div className="detail">
          <header className="detail-head">
            <div>
              <h2 id={titleId}>This world is not in the index</h2>
            </div>
            <div className="detail-nav">
              <button
                type="button"
                className="icon-btn"
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </header>
          <p id={descId} className="missing-copy">
            The catalog is incomplete, so a shared id may not be collected yet.
          </p>
          <footer className="detail-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => void copyLink()}
            >
              {copied === "link" ? "Copied link" : "Copy link"}
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Back to catalog
            </button>
          </footer>
        </div>
      </div>
    );
  }

  const selected = world;

  const name = displayValue(selected.name);
  const preview = selected.cardHero ?? selected.cardBoard;
  const board =
    selected.cardBoard && selected.cardBoard !== selected.cardHero
      ? selected.cardBoard
      : null;
  const position =
    index >= 0 ? `${index + 1} / ${queue.length}` : `${queue.length} in view`;

  function step(delta: number) {
    if (queue.length === 0) return;
    const current = queue.findIndex((entry) => entry.id === selected.id);
    const from = current >= 0 ? current : delta > 0 ? -1 : 0;
    onSelect(queue[(from + delta + queue.length) % queue.length].id);
  }

  async function copyPrompt() {
    const ok = await copyText(buildDirectionPrompt(selected));
    setCopied(ok ? "prompt" : null);
  }

  return (
    <div
      ref={paneRef}
      className="detail-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      tabIndex={-1}
    >
      <div className="detail">
        <header className="detail-head">
          <div>
            <p className={`tier tier-${selected.wellTier ?? "unknown"}`}>
              {displayValue(selected.wellTier)}
            </p>
            <h2 id={titleId}>{name}</h2>
          </div>
          <div className="detail-nav">
            <p className="detail-index" aria-live="polite">
              {position}
            </p>
            <button
              type="button"
              className="icon-btn"
              onClick={() => step(-1)}
              disabled={!canStep}
              aria-label="Previous world"
              title="Previous world"
            >
              ←
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => step(1)}
              disabled={!canStep}
              aria-label="Next world"
              title="Next world"
            >
              →
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </header>
        <p id={descId} className="sr-only">
          {displayValue(selected.form)}. Use the left and right arrow keys to
          move between worlds.
        </p>

        <div className="detail-scroll" ref={scrollRef}>
          <div className="previews">
            {preview ? (
              <div className="preview-stage">
                <img src={preview} alt="" />
              </div>
            ) : (
              <div className="missing-block">No value</div>
            )}
            {board ? (
              <div className="preview-stage">
                <img src={board} alt="" />
              </div>
            ) : null}
          </div>

          <dl className="facts">
            <div>
              <dt>Form</dt>
              <dd>{displayValue(world.form)}</dd>
            </div>
            <div>
              <dt>Spark</dt>
              <dd>{displayValue(world.spark)}</dd>
            </div>
            <div>
              <dt>System</dt>
              <dd>
                {world.system && world.system.length > 0 ? (
                  <ul>
                    {world.system.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                ) : (
                  "No value"
                )}
              </dd>
            </div>
            <div>
              <dt>Web leverage</dt>
              <dd>{displayValue(world.webLeverage)}</dd>
            </div>
          </dl>
        </div>

        <footer className="detail-actions">
          <button
            type="button"
            className="btn primary"
            onClick={() => void copyPrompt()}
          >
            {copied === "prompt" ? "Copied prompt" : "Copy direction prompt"}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => void copyLink()}
          >
            {copied === "link" ? "Copied link" : "Copy link"}
          </button>
          <button
            type="button"
            className={`btn ghost ${world.favorite ? "is-on" : ""}`}
            onClick={() => onFavorite(world.id)}
            aria-pressed={world.favorite}
          >
            {world.favorite ? "Favorited" : "Favorite"}
          </button>
        </footer>
      </div>
    </div>
  );
}
