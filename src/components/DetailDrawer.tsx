import { useEffect, useId, useState } from "react";
import type { World } from "../../shared/types";
import { buildDirectionPrompt } from "../lib/directionPrompt";
import { displayValue } from "../lib/display";

interface DetailDrawerProps {
  world: World | null;
  onClose: () => void;
  onFavorite: (id: string) => void;
}

export function DetailDrawer({ world, onClose, onFavorite }: DetailDrawerProps) {
  const titleId = useId();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [world?.id]);

  useEffect(() => {
    if (!world) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [world, onClose]);

  if (!world) return null;
  const selected = world;

  const name = displayValue(selected.name);
  const preview = selected.cardHero ?? selected.cardBoard;
  const board = selected.cardBoard && selected.cardBoard !== selected.cardHero ? selected.cardBoard : null;

  async function copyPrompt() {
    const text = buildDirectionPrompt(selected);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      return;
    } catch {
      /* fall through to execCommand for restricted browsers */
    }
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    setCopied(ok);
  }

  return (
    <div className="drawer-root">
      <button type="button" className="drawer-backdrop" aria-label="Close detail" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="drawer-head">
          <div>
            <p className="kicker">{displayValue(world.wellTier)}</p>
            <h2 id={titleId}>{name}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

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

        <footer className="drawer-actions">
          <button type="button" className="btn primary" onClick={() => void copyPrompt()}>
            {copied ? "Copied" : "Copy direction prompt"}
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
      </aside>
    </div>
  );
}
