import { useCallback, useEffect, useMemo, useState } from "react";
import type { Coverage, World } from "../shared/types";
import { WELL_TIERS } from "../shared/types";
import { CoverageStrip } from "./components/CoverageStrip";
import { DetailDrawer } from "./components/DetailDrawer";
import { EmptyState } from "./components/EmptyState";
import { WorldGrid } from "./components/WorldGrid";
import { collectWorlds, fetchCoverage, fetchWorlds, toggleFavorite } from "./lib/api";
import { isCollectAllowed } from "./lib/collectAllowed";

function matches(world: World, query: string, tier: string, favoritesOnly: boolean): boolean {
  if (favoritesOnly && !world.favorite) return false;
  if (tier !== "all" && world.wellTier !== tier) return false;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [world.name, world.form, world.spark, ...(world.system ?? [])]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  return haystack.includes(needle);
}

export function App() {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [nextWorlds, nextCoverage] = await Promise.all([fetchWorlds(), fetchCoverage()]);
    setWorlds(nextWorlds);
    setCoverage(nextCoverage);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      setLoadError(err instanceof Error ? err.message : "Could not load the catalog.");
      setReady(true);
    });
  }, [refresh]);

  useEffect(() => {
    if (!collecting) return;
    const timer = window.setInterval(() => {
      void fetchCoverage().then(setCoverage);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [collecting]);

  const visible = useMemo(
    () => worlds.filter((world) => matches(world, query, tier, favoritesOnly)),
    [worlds, query, tier, favoritesOnly],
  );

  const selected = worlds.find((world) => world.id === selectedId) ?? null;

  async function onCollect() {
    setError(null);
    setCollecting(true);
    try {
      const stats = await collectWorlds();
      if (stats.error || stats.stopReason === "rate_limited" || stats.stopReason === "request_failed") {
        setError(stats.error ?? "Collect failed.");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Collect failed.");
    } finally {
      setCollecting(false);
    }
  }

  function onFavorite(id: string) {
    const favorite = toggleFavorite(id);
    setWorlds((current) => current.map((world) => (world.id === id ? { ...world, favorite } : world)));
  }

  const emptyKind = !ready
    ? "loading"
    : loadError || (error && worlds.length === 0)
      ? "error"
      : worlds.length === 0
        ? "none"
        : visible.length === 0
          ? "filtered"
          : null;

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>Impeccable Worlds</h1>
          <p className="lede">Browse, filter, and copy a direction — not an official or complete deck.</p>
        </div>
        <div className="controls">
          <label className="search">
            <span>Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, form, spark, system"
            />
          </label>
          <label>
            <span>wellTier</span>
            <select value={tier} onChange={(event) => setTier(event.target.value)}>
              <option value="all">All</option>
              {WELL_TIERS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(event) => setFavoritesOnly(event.target.checked)}
            />
            Favorites only
          </label>
        </div>
      </header>

      {isCollectAllowed() ? (
        <CoverageStrip coverage={coverage} collecting={collecting} onCollect={() => void onCollect()} />
      ) : null}

      {error && worlds.length > 0 ? (
        <p className="banner" role="alert">
          {error}
        </p>
      ) : null}

      {emptyKind ? (
        <EmptyState
          kind={emptyKind}
          message={loadError ?? error ?? undefined}
          onCollect={emptyKind === "none" && isCollectAllowed() ? () => void onCollect() : undefined}
          collecting={collecting}
        />
      ) : (
        <WorldGrid worlds={visible} onOpen={setSelectedId} onFavorite={onFavorite} />
      )}

      <footer className="legal">
        World names, direction text, and card images come from Impeccable (impeccable.style). This is a personal/lab
        index for choosing a direction by eye. It is not an official Impeccable product, and it does not claim a complete
        catalog.
      </footer>

      <DetailDrawer world={selected} onClose={() => setSelectedId(null)} onFavorite={onFavorite} />
    </div>
  );
}
