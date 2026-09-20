import type { Coverage } from "../../shared/types";
import { formatCatalogStatus, formatCollectProgress } from "../lib/statusCopy";

interface CoverageStripProps {
  coverage: Coverage | null;
  collecting: boolean;
  onCollect: () => void;
}

export function CoverageStrip({
  coverage,
  collecting,
  onCollect,
}: CoverageStripProps) {
  const { primary, note, detail } = formatCatalogStatus(coverage);
  const progress = collecting ? formatCollectProgress(coverage) : null;

  return (
    <section className="coverage" aria-busy={collecting}>
      <div className="coverage-copy">
        <p className="coverage-meta" title={detail}>
          {progress ?? primary}
        </p>
        <p className="coverage-note">{note}</p>
      </div>
      <button
        type="button"
        className="btn"
        onClick={onCollect}
        disabled={collecting}
        aria-busy={collecting}
      >
        {collecting ? "Fetching…" : "Fetch new directions"}
      </button>
    </section>
  );
}
