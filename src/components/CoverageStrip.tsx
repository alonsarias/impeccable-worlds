import { DEFAULT_COLLECT_MODES, type Coverage } from "../../shared/types";
import {
  COLLECT_COVERAGE_HELPER,
  COLLECT_LOCAL_BANNER,
  formatCatalogStatus,
  formatCollectProgress,
} from "../lib/statusCopy";

interface CoverageStripProps {
  coverage: Coverage | null;
  collecting: boolean;
  error: string | null;
  includeDirection: boolean;
  selectedModes: string[];
  onToggleDirection: () => void;
  onToggleMode: (mode: string) => void;
  onCollect: () => void;
}

export function CoverageStrip({
  coverage,
  collecting,
  error,
  includeDirection,
  selectedModes,
  onToggleDirection,
  onToggleMode,
  onCollect,
}: CoverageStripProps) {
  const { primary, detail } = formatCatalogStatus(coverage);
  const progress = collecting ? formatCollectProgress(coverage) : null;

  return (
    <section className="coverage" aria-busy={collecting}>
      <p className="coverage-banner">{COLLECT_LOCAL_BANNER}</p>

      <div className="coverage-main">
        <div className="coverage-copy">
          <p className="coverage-meta" title={detail}>
            {progress ?? primary}
          </p>
          <p className="coverage-note">{COLLECT_COVERAGE_HELPER}</p>
          {error ? <p className="coverage-error">{error}</p> : null}
        </div>
        <div className="coverage-actions">
          <button
            type="button"
            className="btn primary"
            onClick={onCollect}
            disabled={collecting}
            aria-busy={collecting}
          >
            {collecting ? "Fetching…" : "Fetch new directions"}
          </button>
          {error ? (
            <button
              type="button"
              className="btn ghost"
              onClick={onCollect}
              disabled={collecting}
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>

      <details className="coverage-options">
        <summary>Coverage options</summary>
        <div className="coverage-options-body">
          <div className="coverage-option-block">
            <div className="coverage-chips" role="group" aria-label="Direction">
              <button
                type="button"
                className={includeDirection ? "btn ghost is-on" : "btn ghost"}
                aria-pressed={includeDirection}
                disabled={collecting}
                onClick={onToggleDirection}
              >
                Direction
              </button>
            </div>
          </div>
          <div className="coverage-option-block">
            <span className="coverage-option-label" id="coverage-modes-label">
              Modes
            </span>
            <div
              className="coverage-chips"
              role="group"
              aria-labelledby="coverage-modes-label"
            >
              {DEFAULT_COLLECT_MODES.map((mode) => {
                const on = selectedModes.includes(mode);
                return (
                  <button
                    key={mode}
                    type="button"
                    className={on ? "btn ghost is-on" : "btn ghost"}
                    aria-pressed={on}
                    disabled={collecting}
                    onClick={() => onToggleMode(mode)}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}
