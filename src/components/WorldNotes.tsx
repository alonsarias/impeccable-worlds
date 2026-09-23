import type { World } from "../../shared/types";
import { displayValue } from "../lib/display";

export function WorldNotes({ world }: { world: World }) {
  return (
    <details className="world-notes">
      <summary>Details</summary>
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
    </details>
  );
}
