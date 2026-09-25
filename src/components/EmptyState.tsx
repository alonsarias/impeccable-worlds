interface EmptyStateProps {
  kind: "none" | "filtered" | "error" | "loading";
  heading?: string;
  message?: string;
  onCollect?: () => void;
  onRetry?: () => void;
  onClear?: () => void;
  collecting?: boolean;
}

export function EmptyState({
  kind,
  heading,
  message,
  onCollect,
  onRetry,
  onClear,
  collecting,
}: EmptyStateProps) {
  if (kind === "loading") {
    return (
      <div className="empty">
        <h2>Loading</h2>
        <p>Reading the local index…</p>
      </div>
    );
  }

  if (kind === "error") {
    return (
      <div className="empty" role="alert">
        <h2>{heading ?? "Could not load the catalog"}</h2>
        <p>{message ?? "The catalog could not be reached."}</p>
        {onRetry ? (
          <button
            type="button"
            className="btn"
            onClick={onRetry}
            disabled={collecting}
            aria-busy={collecting}
          >
            {collecting ? "Fetching…" : "Retry"}
          </button>
        ) : null}
      </div>
    );
  }

  if (kind === "filtered") {
    return (
      <div className="empty">
        <h2>No matching worlds</h2>
        <p>
          {message ??
            "Nothing in the local index matches this search or filter."}
        </p>
        {onClear ? (
          <button type="button" className="btn" onClick={onClear}>
            Clear search and filters
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="empty">
      <h2>No worlds yet</h2>
      <p>
        {onCollect
          ? "Fetch from Impeccable’s public roll API to start a local index. Coverage grows by unique ids — this is never a complete catalog."
          : "This deploy has no shipped worlds. Fetch locally, then git push data/worlds.json."}
      </p>
      {onCollect ? (
        <button
          type="button"
          className="btn ghost"
          onClick={onCollect}
          disabled={collecting}
          aria-busy={collecting}
        >
          {collecting ? "Fetching…" : "Fetch new directions"}
        </button>
      ) : null}
    </div>
  );
}
