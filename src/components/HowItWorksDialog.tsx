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
  const openerRef = useRef<HTMLElement | null>(null);

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
      return;
    }
    if (dialog.open) dialog.close();
    const opener = openerRef.current;
    if (opener && document.contains(opener)) opener.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <dialog
      ref={dialogRef}
      id={HOW_IT_WORKS_DIALOG_ID}
      className="how-dialog"
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
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="how-body">
          <p id={descId} className="how-lede">
            This catalog helps you pick a visual direction by eye, then build
            with Impeccable — even if you have never used Impeccable before.
          </p>

          <ol className="how-steps">
            <li>
              <div className="how-step">
                <p>In the project you will build, install Impeccable:</p>
                <pre>
                  <code>npx impeccable install</code>
                </pre>
                <p>
                  Run <code>/impeccable init</code> once (product context only —
                  not the look).
                </p>
              </div>
            </li>
            <li>
              <div className="how-step">
                <p>
                  Browse this site, open a world, click Copy direction prompt.
                </p>
                <p>That text tells the agent to keep the world you chose.</p>
              </div>
            </li>
            <li>
              <div className="how-step">
                <p>
                  In your coding agent, send one message: load Impeccable, say
                  what to build, paste the prompt. Example:
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
                Impeccable may still show a “Choose a direction” screen with
                several options. Keep the world you pasted (confirm it). You do
                not need a new random set unless you want a different look.
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
