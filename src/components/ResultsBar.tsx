import { formatResultsCount, TIER_LEGEND } from "../lib/statusCopy";

interface ResultsBarProps {
  count: number;
  query: string;
  tier: string;
  favoritesOnly: boolean;
  ready: boolean;
}

export function ResultsBar({
  count,
  query,
  tier,
  favoritesOnly,
  ready,
}: ResultsBarProps) {
  return (
    <div className="results-bar">
      {ready ? (
        <p className="results">
          {formatResultsCount({ count, query, tier, favoritesOnly })}
        </p>
      ) : null}
      <p id="tier-legend" className="legend">
        {TIER_LEGEND.map((item, index) => (
          <span key={item.tier}>
            {index > 0 ? (
              <span className="dot" aria-hidden="true">
                {" "}
                ·{" "}
              </span>
            ) : null}
            <strong>{item.label}</strong> {item.gloss}
          </span>
        ))}
      </p>
    </div>
  );
}
