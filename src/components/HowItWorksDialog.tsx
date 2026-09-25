import { useEffect, useId, useRef } from "react";

export const HOW_IT_WORKS_DIALOG_ID = "how-it-works-dialog";

interface HowItWorksDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HowItWorksDialog({ open, onClose }: HowItWorksDialogProps) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) {
        openerRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        dialog.showModal();
      }
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
      closeRef.current?.focus();
      return;
    }
    if (dialog.open) dialog.close();
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && document.contains(opener)) {
      requestAnimationFrame(() => opener.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onCloseRef.current();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      id={HOW_IT_WORKS_DIALOG_ID}
      className="how-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="how-panel">
        <header className="how-head">
          <h2 id={titleId}>How it works</h2>
          <button
            ref={closeRef}
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="how-body" ref={bodyRef}>
          <p id={descId} className="how-lede">
            This catalog helps you pick a visual direction by eye, then build
            with Impeccable — even if you have never used Impeccable before.
          </p>

          <ol className="how-steps">
            <li>
              <div className="how-step">
                <p>
                  In the project you will build, install Impeccable and init
                  product context only (not the look):
                </p>
                <pre>
                  <code>npx impeccable install</code>
                </pre>
                <p>
                  Then run <code>/impeccable init</code> once.
                </p>
              </div>
            </li>
            <li>
              <div className="how-step">
                <p>
                  Browse this site, open a world, and click Copy direction
                  prompt.
                </p>
                <p>
                  The paste includes this world’s QUALITY BAR image URLs and
                  the path to keep going after the pin.
                </p>
              </div>
            </li>
            <li>
              <div className="how-step">
                <p>
                  In your coding agent, send one message:{" "}
                  <code>/impeccable</code>, what to build, and the paste.
                  Prefer attaching or opening the board and hero. Example:
                </p>
                <pre>
                  <code>
                    {`/impeccable
Design a landing page for …
[paste the direction prompt]`}
                  </code>
                </pre>
              </div>
            </li>
            <li>
              <p>
                Expect this path: pin lock (no new roll) → QUALITY BAR →
                Direction contract → build → finish. If a “Choose a direction”
                screen appears, confirm the pasted world only.
              </p>
            </li>
          </ol>

          <div className="how-notes">
            <p>Each world has its own share link.</p>
            <p>This site does not install or replace Impeccable.</p>
            <p>The public site is read-only.</p>
            <p>Companion to Impeccable by Paul Bakaus — not affiliated.</p>
            <p>
              <a
                href="https://impeccable.style"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more about Impeccable
              </a>
            </p>
          </div>
        </div>
      </div>
    </dialog>
  );
}
