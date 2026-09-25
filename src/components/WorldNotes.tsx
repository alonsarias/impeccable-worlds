import { useId, useState } from "react";
import type { World } from "../../shared/types";
import { displayValue } from "../lib/display";

export function WorldNotes({ world }: { world: World }) {
  const buttonId = useId();
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className={`world-notes${open ? " is-open" : ""}`}>
      <button
        type="button"
        id={buttonId}
        className="disclosure"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        Details
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
      >
        <dl className="facts">
          <div>
            <dt>Form</dt>
            <dd>{displayValue(world.form)}</dd>
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
    </div>
  );
}
