interface EmptyStateProps {
  kind: "none" | "filtered" | "error" | "loading";
  message?: string;
  onCollect?: () => void;
  collecting?: boolean;
}

export function EmptyState({ kind, message, onCollect, collecting }: EmptyStateProps) {
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
        <h2>Collect failed</h2>
        <p>{message ?? "The roll API could not be reached."}</p>
      </div>
    );
  }

  if (kind === "filtered") {
    return (
      <div className="empty">
        <h2>No matching worlds</h2>
        <p>Nothing in the local index matches this search or filter.</p>
      </div>
    );
  }

  return (
    <div className="empty">
      <h2>No worlds yet</h2>
      <p>Collect from Impeccable’s public roll API to start a local index. Coverage grows by unique ids — this is never a complete catalog.</p>
      {onCollect ? (
        <button type="button" className="btn primary" onClick={onCollect} disabled={collecting}>
          {collecting ? "Collecting…" : "Collect"}
        </button>
      ) : null}
    </div>
  );
}
