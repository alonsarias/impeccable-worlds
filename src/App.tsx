import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Coverage, World } from "../shared/types";
import { DEFAULT_COLLECT_MODES, WELL_TIERS } from "../shared/types";
import type { WorldSort } from "../shared/catalog";
import { sortWorlds } from "../shared/catalog";
import { CoverageStrip } from "./components/CoverageStrip";
import { DetailDrawer } from "./components/DetailDrawer";
import { EmptyState } from "./components/EmptyState";
import { GitHubMark } from "./components/GitHubMark";
import {
  HOW_IT_WORKS_DIALOG_ID,
  HowItWorksDialog,
} from "./components/HowItWorksDialog";
import { ResultsBar } from "./components/ResultsBar";
import { WaveField } from "./components/WaveField";
import type { CardLayout } from "./components/WorldGrid";
import { WorldGrid } from "./components/WorldGrid";
import {
  collectWorlds,
  fetchCoverage,
  fetchWorlds,
  toggleFavorite,
} from "./lib/api";
import { isCollectAllowed } from "./lib/collectAllowed";
import { GITHUB_REPO_URL } from "./lib/github";
import {
  formatCollectOutcome,
  formatCollectProgress,
  formatEmptyEcho,
  humanizeCollectError,
  titleCaseTier,
} from "./lib/statusCopy";
import { resolveWorld, worldKeyFromPathname, worldPath } from "./lib/worldPath";

type CollectFeedback = {
  tone: "progress" | "success" | "error";
  text: string;
} | null;

function matches(
  world: World,
  query: string,
  tier: string,
  favoritesOnly: boolean,
): boolean {
  if (favoritesOnly && !world.favorite) return false;
  if (tier !== "all" && world.wellTier !== tier) return false;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    world.name,
    world.form,
    world.spark,
    ...(world.system ?? []),
  ]
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
  const [sort, setSort] = useState<WorldSort>("name");
  const [layout, setLayout] = useState<CardLayout>("comfortable");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    worldKeyFromPathname(window.location.pathname),
  );
  const [collecting, setCollecting] = useState(false);
  const [collectFeedback, setCollectFeedback] = useState<CollectFeedback>(null);
  const [includeDirection, setIncludeDirection] = useState(false);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const [nextWorlds, nextCoverage] = await Promise.all([
      fetchWorlds(),
      fetchCoverage(),
    ]);
    setWorlds(nextWorlds);
    setCoverage(nextCoverage);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      setLoadError(
        err instanceof Error ? err.message : "Could not load the catalog.",
      );
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

  useEffect(() => {
    if (!collecting) return;
    setCollectFeedback({
      tone: "progress",
      text: formatCollectProgress(coverage),
    });
  }, [collecting, coverage]);

  const writeWorldLocation = useCallback(
    (id: string | null, mode: "push" | "replace") => {
      const world = id ? resolveWorld(worlds, id) : undefined;
      const nextPath = world
        ? worldPath(world, worlds)
        : id
          ? worldPath(id)
          : "/";
      if (window.location.pathname === nextPath) return;
      const state = { worldId: world?.id ?? id };
      if (mode === "replace") history.replaceState(state, "", nextPath);
      else history.pushState(state, "", nextPath);
    },
    [worlds],
  );

  const openWorld = useCallback(
    (id: string) => {
      setSelectedId(id);
      writeWorldLocation(id, "push");
    },
    [writeWorldLocation],
  );

  const stepWorld = useCallback(
    (id: string) => {
      setSelectedId(id);
      writeWorldLocation(id, "replace");
    },
    [writeWorldLocation],
  );

  const closeWorld = useCallback(() => {
    setSelectedId(null);
    writeWorldLocation(null, "push");
  }, [writeWorldLocation]);

  useEffect(() => {
    const onPop = () => {
      setSelectedId(worldKeyFromPathname(window.location.pathname));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const visible = useMemo(
    () =>
      sortWorlds(
        worlds.filter((world) => matches(world, query, tier, favoritesOnly)),
        sort,
      ),
    [worlds, query, tier, favoritesOnly, sort],
  );

  const selected = selectedId
    ? (resolveWorld(worlds, selectedId) ?? null)
    : null;
  const drawerId = ready && !loadError ? selectedId : null;

  useEffect(() => {
    if (!selectedId || worlds.length === 0) return;
    const world = resolveWorld(worlds, selectedId);
    if (!world) return;
    const nextPath = worldPath(world, worlds);
    if (window.location.pathname === nextPath) return;
    history.replaceState({ worldId: world.id }, "", nextPath);
  }, [selectedId, worlds]);

  useEffect(() => {
    const base = "Impeccable Worlds";
    if (selected?.name) {
      document.title = `${selected.name} · ${base}`;
      return () => {
        document.title = base;
      };
    }
    if (drawerId && !selected) {
      document.title = `Not in the index · ${base}`;
      return () => {
        document.title = base;
      };
    }
    document.title = base;
  }, [drawerId, selected]);

  function toggleMode(mode: string) {
    setSelectedModes((current) =>
      current.includes(mode)
        ? current.filter((item) => item !== mode)
        : DEFAULT_COLLECT_MODES.filter(
            (item) => item === mode || current.includes(item),
          ),
    );
  }

  async function onCollect() {
    setCollectFeedback({ tone: "progress", text: "Surface (neutral)…" });
    setCollecting(true);
    try {
      const stats = await collectWorlds({
        direction: includeDirection,
        modes: selectedModes,
      });
      setCollectFeedback(formatCollectOutcome(stats));
      await refresh();
    } catch (err) {
      setCollectFeedback({
        tone: "error",
        text: humanizeCollectError(
          err instanceof Error
            ? err.message
            : "Could not fetch new directions.",
        ),
      });
    } finally {
      setCollecting(false);
    }
  }

  function onFavorite(id: string) {
    const favorite = toggleFavorite(id);
    setWorlds((current) =>
      current.map((world) =>
        world.id === id ? { ...world, favorite } : world,
      ),
    );
  }

  function onClearFilters() {
    setQuery("");
    setTier("all");
    setFavoritesOnly(false);
    searchRef.current?.focus();
  }

  const emptyKind = !ready
    ? "loading"
    : loadError || (collectFeedback?.tone === "error" && worlds.length === 0)
      ? "error"
      : worlds.length === 0
        ? "none"
        : visible.length === 0
          ? "filtered"
          : null;

  const liveText = collectFeedback?.text ?? "";
  const liveClass =
    collectFeedback?.tone === "success" && emptyKind !== "error"
      ? "notice"
      : "sr-only";

  return (
    <>
      <WaveField
        token={`${layout}-${sort}-${visible.length}-${visible[0]?.id ?? ""}`}
      />
      <div className="app">
        <div className="catalog" inert={drawerId ? true : undefined}>
          <header className="top">
            <div className="masthead">
              <div>
                <h1>Impeccable Worlds</h1>
                <div className="purpose">
                  <p className="lede">
                    A browsable catalog of Impeccable design worlds. Search,
                    preview, and copy a direction into your coding agent.
                  </p>
                  <button
                    type="button"
                    className="text-link"
                    aria-haspopup="dialog"
                    aria-expanded={howItWorksOpen}
                    aria-controls={HOW_IT_WORKS_DIALOG_ID}
                    onClick={() => setHowItWorksOpen(true)}
                  >
                    How it works
                  </button>
                </div>
              </div>
              <a
                className="github-link"
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on GitHub"
                title="View on GitHub"
              >
                <GitHubMark />
              </a>
            </div>
            <div className="controls">
              <label className="search">
                <span>Search</span>
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, form, spark, system"
                />
              </label>
              <label>
                <span>Direction type</span>
                <select
                  value={tier}
                  onChange={(event) => setTier(event.target.value)}
                  aria-describedby="tier-legend"
                >
                  <option value="all">All</option>
                  {WELL_TIERS.map((value) => (
                    <option key={value} value={value}>
                      {titleCaseTier(value)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Sort</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as WorldSort)}
                >
                  <option value="name">Alphabetical</option>
                  <option value="newest">Newest</option>
                  <option value="tier">Direction type</option>
                </select>
              </label>
              <label>
                <span>Layout</span>
                <select
                  value={layout}
                  onChange={(event) =>
                    setLayout(event.target.value as CardLayout)
                  }
                >
                  <option value="comfortable">Larger cards</option>
                  <option value="compact">Dense cards</option>
                  <option value="list">List</option>
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
            <CoverageStrip
              coverage={coverage}
              collecting={collecting}
              error={
                collectFeedback?.tone === "error" ? collectFeedback.text : null
              }
              includeDirection={includeDirection}
              selectedModes={selectedModes}
              onToggleDirection={() => setIncludeDirection((on) => !on)}
              onToggleMode={toggleMode}
              onCollect={() => void onCollect()}
            />
          ) : null}

          <p
            className={liveClass}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {liveText}
          </p>

          {loadError ? null : (
            <ResultsBar
              count={visible.length}
              query={query}
              tier={tier}
              favoritesOnly={favoritesOnly}
              ready={ready}
            />
          )}

          {emptyKind ? (
            <EmptyState
              kind={emptyKind}
              heading={
                emptyKind === "error"
                  ? loadError
                    ? "Could not load the catalog"
                    : "Could not fetch new directions"
                  : undefined
              }
              message={
                emptyKind === "filtered"
                  ? formatEmptyEcho({ query, tier, favoritesOnly })
                  : (loadError ??
                    (collectFeedback?.tone === "error"
                      ? collectFeedback.text
                      : undefined))
              }
              onCollect={
                emptyKind === "none" && isCollectAllowed()
                  ? () => void onCollect()
                  : undefined
              }
              onRetry={
                emptyKind === "error" && !loadError && isCollectAllowed()
                  ? () => void onCollect()
                  : undefined
              }
              onClear={emptyKind === "filtered" ? onClearFilters : undefined}
              collecting={collecting}
            />
          ) : (
            <WorldGrid
              worlds={visible}
              catalog={worlds}
              layout={layout}
              onOpen={openWorld}
              onFavorite={onFavorite}
            />
          )}

          <footer className="legal">
            <p>
              World names, direction text, and card images come from Impeccable
              (impeccable.style). This is a personal/lab index for choosing a
              direction by eye. It is not an official Impeccable product, and it
              does not claim a complete catalog.
            </p>
            <button
              type="button"
              className="text-link"
              aria-haspopup="dialog"
              aria-expanded={howItWorksOpen}
              aria-controls={HOW_IT_WORKS_DIALOG_ID}
              onClick={() => setHowItWorksOpen(true)}
            >
              How it works
            </button>
          </footer>
        </div>

        <HowItWorksDialog
          open={howItWorksOpen}
          onClose={() => setHowItWorksOpen(false)}
        />

        <DetailDrawer
          world={selected}
          requestedId={drawerId}
          queue={visible}
          catalog={worlds}
          onClose={closeWorld}
          onFavorite={onFavorite}
          onSelect={stepWorld}
        />
      </div>
    </>
  );
}
