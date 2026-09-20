import type { Coverage } from "../../shared/types";
import { displayValue } from "../lib/display";

interface CoverageStripProps {
  coverage: Coverage | null;
  collecting: boolean;
  onCollect: () => void;
}

export function CoverageStrip({ coverage, collecting, onCollect }: CoverageStripProps) {
  const progress = coverage?.collecting;
  const approved = coverage ? displayValue(coverage.lastApprovedCount?.toString()) : displayValue(undefined);
  const indexed = coverage?.indexedCount ?? 0;

  let status = `Indexed ${indexed}`;
  if (collecting && progress) {
    status = `Collecting · ${progress.rollsRun} rolls · ${progress.newIds} new · indexed ${progress.indexedCount}`;
  } else if (progress?.stopReason && !progress.inProgress) {
    status = `Indexed ${indexed} · last stop: ${progress.stopReason}`;
  }

  return (
    <section className="coverage" aria-live="polite">
      <p className="coverage-meta">
        <span>{status}</span>
        <span className="dot" aria-hidden="true">
          ·
        </span>
        <span>API approved {approved} (last seen)</span>
      </p>
      <button type="button" className="btn" onClick={onCollect} disabled={collecting}>
        {collecting ? "Collecting…" : "Collect more"}
      </button>
    </section>
  );
}
