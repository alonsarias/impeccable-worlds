import { useEffect, useId, useRef, useState } from "react";
import type { World } from "../../shared/types";
import { blobCardUrl } from "../lib/cardImages";
import { copyText } from "../lib/clipboard";
import { buildDirectionPrompt } from "../lib/directionPrompt";
import { displayValue } from "../lib/display";
import { useCardSource } from "../lib/useCardSource";
import { worldShareUrl } from "../lib/worldPath";
import { CompareMark } from "./CompareMark";
import { MoreLikeThis } from "./MoreLikeThis";
import { StarMark } from "./StarMark";
import { WorldNotes } from "./WorldNotes";

interface DetailDrawerProps {
  world: World | null;
  requestedId: string | null;
  queue: World[];
  catalog: World[];
  compareFull: boolean;
  inCompare: (id: string) => boolean;
  suspendKeys: boolean;
  onClose: () => void;
  onFavorite: (id: string) => void;
  onSelect: (id: string) => void;
  onCompare: (id: string) => void;
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
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
  );
  return [...nodes].filter(
    (el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0,
  );
}

export function DetailDrawer({
  world,
  requestedId,
  queue,
  catalog,
  compareFull,
  inCompare,
  suspendKeys,
  onClose,
  onFavorite,
  onSelect,
  onCompare,
}: DetailDrawerProps) {
  const titleId = useId();
  const descId = useId();
  const paneRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const previewBtnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<CopiedKind>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const index = world ? queue.findIndex((entry) => entry.id === world.id) : -1;
  const canStep = Boolean(world) && queue.length > 1;

  const open = requestedId !== null;
  const shareId = world?.id ?? requestedId;
  const previewUpstream = world
    ? (world.cardHero ?? world.cardBoard)
    : undefined;
  const previewFallback = world
    ? blobCardUrl(world.id, world.cardHero ? "hero" : "board")
    : null;
  const boardUpstream =
    world?.cardBoard && world.cardBoard !== previewUpstream
      ? world.cardBoard
      : undefined;
  const boardFallback =
    world && boardUpstream ? blobCardUrl(world.id, "board") : null;
  const previewImage = useCardSource(previewUpstream, previewFallback);
  const boardImage = useCardSource(boardUpstream, boardFallback);
  const viewerPreview = useCardSource(previewUpstream, previewFallback);
  const viewerBoard = useCardSource(boardUpstream, boardFallback);
  const viewerImages = [
    previewUpstream ? viewerPreview : null,
    boardUpstream ? viewerBoard : null,
  ].filter((source): source is typeof viewerPreview => source !== null);

  useEffect(() => {
    setCopied(null);
    setViewerIndex(null);
    scrollRef.current?.scrollTo(0, 0);
  }, [requestedId, world?.id]);

  useEffect(() => {
    if (!open) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    paneRef.current?.focus();
    return () => {
      opener?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (viewerIndex === null) return;
    viewerRef.current?.focus();
  }, [viewerIndex]);

  function closeViewer() {
    const from = viewerIndex;
    setViewerIndex(null);
    requestAnimationFrame(() => {
      if (from !== null) previewBtnRefs.current[from]?.focus();
    });
  }

  function stepViewer(delta: number) {
    if (viewerImages.length < 2) return;
    setViewerIndex((current) => {
      if (current === null) return current;
      return (current + delta + viewerImages.length) % viewerImages.length;
    });
  }

  useEffect(() => {
    if (!open) return;

    const step = (delta: number) => {
      if (!world || queue.length === 0) return;
      const current = queue.findIndex((entry) => entry.id === world.id);
      const from = current >= 0 ? current : delta > 0 ? -1 : 0;
      onSelect(queue[(from + delta + queue.length) % queue.length].id);
    };

    const onKey = (event: KeyboardEvent) => {
      if (suspendKeys) return;
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;

      const trapRoot =
        viewerIndex !== null ? viewerRef.current : paneRef.current;
      if (event.key === "Tab") {
        if (!trapRoot) return;
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
        return;
      }

      if (isTypingTarget(event.target)) return;
      if (viewerIndex !== null) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeViewer();
          return;
        }
        if (viewerImages.length < 2) return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          stepViewer(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          stepViewer(1);
        }
        return;
      }
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
  }, [
    open,
    world,
    queue,
    canStep,
    onClose,
    onSelect,
    viewerIndex,
    viewerImages.length,
    suspendKeys,
  ]);

  if (!open) return null;

  async function copyLink() {
    if (!shareId) return;
    const ok = await copyText(
      worldShareUrl(world ?? shareId, undefined, catalog),
    );
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
        inert={suspendKeys ? true : undefined}
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
      inert={suspendKeys ? true : undefined}
    >
      <div className="detail" inert={viewerIndex !== null ? true : undefined}>
        <header className="detail-head">
          <div className="detail-title">
            <p className={`tier tier-${selected.wellTier ?? "unknown"}`}>
              {displayValue(selected.wellTier)}
            </p>
            <h2 id={titleId}>{name}</h2>
            <p className="detail-spark">{displayValue(selected.spark)}</p>
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
          move between worlds. Open an image to view it full size.
        </p>

        <div className="detail-scroll" ref={scrollRef}>
          <div className="previews">
            {previewImage.src ? (
              <div className="preview-stage">
                <button
                  ref={(node) => {
                    previewBtnRefs.current[0] = node;
                  }}
                  type="button"
                  className="preview-open"
                  onClick={() => setViewerIndex(0)}
                  aria-haspopup="dialog"
                  aria-label={`View ${name} full size`}
                >
                  <img
                    src={previewImage.src}
                    alt=""
                    onError={previewImage.onError}
                  />
                </button>
              </div>
            ) : (
              <div className="missing-block">No value</div>
            )}
            {boardUpstream ? (
              boardImage.src ? (
                <div className="preview-stage">
                  <button
                    ref={(node) => {
                      previewBtnRefs.current[1] = node;
                    }}
                    type="button"
                    className="preview-open"
                    onClick={() => setViewerIndex(1)}
                    aria-haspopup="dialog"
                    aria-label={`View ${name} board full size`}
                  >
                    <img
                      src={boardImage.src}
                      alt=""
                      onError={boardImage.onError}
                    />
                  </button>
                </div>
              ) : (
                <div className="missing-block">No value</div>
              )
            ) : null}
          </div>

          <WorldNotes world={selected} />

          <MoreLikeThis
            world={selected}
            catalog={catalog}
            compareFull={compareFull}
            inCompare={inCompare}
            onOpen={onSelect}
            onCompare={onCompare}
          />
        </div>

        <footer className="detail-actions">
          <button
            type="button"
            className="btn primary"
            onClick={() => void copyPrompt()}
          >
            {copied === "prompt" ? "Copied prompt" : "Copy direction prompt"}
          </button>
          <div className="detail-actions-secondary">
            <button
              type="button"
              className="btn ghost detail-copy-link"
              onClick={() => void copyLink()}
            >
              {copied === "link" ? "Copied link" : "Copy link"}
            </button>
            <button
              type="button"
              className={`btn ghost detail-fav${world.favorite ? " is-on" : ""}`}
              onClick={() => onFavorite(world.id)}
              aria-pressed={world.favorite}
            >
              <StarMark filled={world.favorite} />
              <span className="detail-action-label">
                {world.favorite ? "Favorited" : "Favorite"}
              </span>
            </button>
            <button
              type="button"
              className={`btn ghost detail-compare${inCompare(selected.id) ? " is-on" : ""}`}
              aria-pressed={inCompare(selected.id)}
              aria-label={
                inCompare(selected.id)
                  ? `Remove ${name} from compare`
                  : compareFull
                    ? `Add ${name} to compare, replacing the other side`
                    : `Add ${name} to compare`
              }
              onClick={() => onCompare(selected.id)}
            >
              <CompareMark />
              <span className="detail-action-label">Compare</span>
            </button>
          </div>
        </footer>
      </div>

      {viewerIndex !== null && viewerImages[viewerIndex] ? (
        <div
          ref={viewerRef}
          className="image-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={`${name}, full size`}
          tabIndex={-1}
        >
          <div className="image-viewer-bar">
            {viewerImages.length > 1 ? (
              <>
                <p className="detail-index" aria-live="polite">
                  {viewerIndex + 1} / {viewerImages.length}
                </p>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => stepViewer(-1)}
                  aria-label="Previous image"
                  title="Previous image"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => stepViewer(1)}
                  aria-label="Next image"
                  title="Next image"
                >
                  →
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="icon-btn"
              onClick={closeViewer}
              aria-label="Close full size"
            >
              ×
            </button>
          </div>
          <div className="image-viewer-stage" onClick={closeViewer}>
            {viewerImages[viewerIndex].src ? (
              <img
                src={viewerImages[viewerIndex].src}
                alt={name}
                onError={viewerImages[viewerIndex].onError}
                onClick={(event) => event.stopPropagation()}
              />
            ) : (
              <span className="missing">No value</span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
