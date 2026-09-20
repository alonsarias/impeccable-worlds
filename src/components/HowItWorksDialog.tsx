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
          <ol id={descId} className="how-steps">
            <li>
              Browse design worlds — visual directions — with a preview and the
              system rules.
            </li>
            <li>
              Search or filter, open a world, and copy a direction prompt into
              your coding agent.
            </li>
            <li>
              This index helps you pick a direction. It does not install or
              replace Impeccable.
            </li>
            <li>
              A companion to Impeccable by Paul Bakaus — not affiliated.{" "}
              <a
                href="https://impeccable.style"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more about Impeccable
              </a>
            </li>
            <li>
              The public site is read-only. Collecting new worlds is a local git
              workflow.
            </li>
          </ol>

          <p className="how-soft">
            To apply a copied direction in an agent, use Impeccable in your
            project.
          </p>
        </div>
      </div>
    </dialog>
  );
}
