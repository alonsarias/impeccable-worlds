import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
import {
  catalogSearchString,
  readCatalogQuery,
  type CatalogQuery,
} from "./lib/catalogQuery";
import { resolveWorld, worldKeyFromPathname, worldPath } from "./lib/worldPath";
import { ComparePanel } from "./components/ComparePanel";
import { CompareToast, CompareTray } from "./components/CompareTray";
import {
  clearCompare,
  createCompareState,
  dismissCompareUndo,
  focusCompareSlot,
  removeFromCompare,
  toggleCompare,
  undoCompareReplace,
  type SlotIndex,
} from "./lib/compare";

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

const WIDE_CATALOG = "(min-width: 721px)";

function useWideCatalog() {
  const [wide, setWide] = useState(
    () => window.matchMedia(WIDE_CATALOG).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(WIDE_CATALOG);
    const update = () => setWide(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return wide;
}

function MobileFold({
  label,
  wide,
  className,
  children,
}: {
  label: string;
  wide: boolean;
  className?: string;
  children: ReactNode;
}) {
  const buttonId = useId();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const expanded = wide || open;
  const foldClass = ["fold", expanded ? "is-open" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={foldClass}>
      <button
        type="button"
        id={buttonId}
        className="fold-toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!expanded}
      >
        {children}
      </div>
    </div>
  );
}

function catalogFromLocation(): CatalogQuery {
  return readCatalogQuery(window.location.search);
}

export function App() {
  const initialCatalog = catalogFromLocation();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [query, setQuery] = useState(initialCatalog.q);
  const [tier, setTier] = useState(initialCatalog.type);
  const [sort, setSort] = useState<WorldSort>(initialCatalog.sort);
  const [layout, setLayout] = useState<CardLayout>(initialCatalog.layout);
  const [favoritesOnly, setFavoritesOnly] = useState(initialCatalog.favorites);
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
  const [compare, setCompare] = useState(createCompareState);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareLimitNote, setCompareLimitNote] = useState(false);
  const [trayMinimized, setTrayMinimized] = useState(true);
  const wide = useWideCatalog();
  const searchRef = useRef<HTMLInputElement>(null);
  const openCompareRef = useRef<HTMLButtonElement>(null);
  const compareOpenerRef = useRef<HTMLElement | null>(null);
  const restoreCompareFocus = useRef(false);
  const worldOpenerRef = useRef<HTMLElement | null>(null);
  const restoreWorldFocus = useRef(false);
  const catalogReady = useRef(false);
  const skipCatalogWrite = useRef(false);
  const catalogTimer = useRef(0);

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
      const nextPath = `${
        world ? worldPath(world, worlds) : id ? worldPath(id) : "/"
      }${window.location.search}`;
      if (`${window.location.pathname}${window.location.search}` === nextPath) {
        return;
      }
      const state = { worldId: world?.id ?? id };
      if (mode === "replace") history.replaceState(state, "", nextPath);
      else history.pushState(state, "", nextPath);
    },
    [worlds],
  );

  const openWorld = useCallback(
    (id: string, opener?: HTMLElement | null) => {
      const active = document.activeElement;
      worldOpenerRef.current =
        opener ?? (active instanceof HTMLElement ? active : null);
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

  const catalogNow = useRef({ query, tier, sort, layout, favoritesOnly });
  catalogNow.current = { query, tier, sort, layout, favoritesOnly };
  const compareRef = useRef(compare);
  compareRef.current = compare;

  useEffect(() => {
    const onPop = () => {
      const catalog = readCatalogQuery(window.location.search);
      const current = catalogNow.current;
      if (
        current.query !== catalog.q ||
        current.tier !== catalog.type ||
        current.sort !== catalog.sort ||
        current.layout !== catalog.layout ||
        current.favoritesOnly !== catalog.favorites
      ) {
        skipCatalogWrite.current = true;
      }
      setQuery(catalog.q);
      setTier(catalog.type);
      setSort(catalog.sort);
      setLayout(catalog.layout);
      setFavoritesOnly(catalog.favorites);
      setSelectedId(worldKeyFromPathname(window.location.pathname));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const catalogSnapshot = useRef({ query, tier, sort, layout, favoritesOnly });
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  useEffect(() => {
    if (!catalogReady.current) {
      catalogReady.current = true;
      catalogSnapshot.current = { query, tier, sort, layout, favoritesOnly };
      return;
    }
    if (skipCatalogWrite.current) {
      skipCatalogWrite.current = false;
      catalogSnapshot.current = { query, tier, sort, layout, favoritesOnly };
      return;
    }
    const prev = catalogSnapshot.current;
    const queryOnly =
      prev.query !== query &&
      prev.tier === tier &&
      prev.sort === sort &&
      prev.layout === layout &&
      prev.favoritesOnly === favoritesOnly;
    window.clearTimeout(catalogTimer.current);
    catalogTimer.current = window.setTimeout(() => {
      const current = catalogNow.current;
      catalogSnapshot.current = current;
      const search = catalogSearchString({
        q: current.query,
        type: current.tier,
        sort: current.sort,
        layout: current.layout,
        favorites: current.favoritesOnly,
      });
      const next = `${window.location.pathname}${search}`;
      const here = `${window.location.pathname}${window.location.search}`;
      if (next === here) return;
      history.pushState(
        { ...(history.state ?? {}), worldId: selectedIdRef.current },
        "",
        next,
      );
    }, queryOnly ? 120 : 0);
    return () => window.clearTimeout(catalogTimer.current);
  }, [query, tier, sort, layout, favoritesOnly]);

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
    const nextPath = `${worldPath(world, worlds)}${window.location.search}`;
    if (`${window.location.pathname}${window.location.search}` === nextPath) return;
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

  const compareWorlds: [World | null, World | null] = [
    compare.slots[0] ? (resolveWorld(worlds, compare.slots[0]) ?? null) : null,
    compare.slots[1] ? (resolveWorld(worlds, compare.slots[1]) ?? null) : null,
  ];
  const compareFull = compare.slots[0] !== null && compare.slots[1] !== null;
  const trayVisible =
    !compareOpen && (compare.slots[0] !== null || compare.slots[1] !== null);
  const undoWorld = compare.undo
    ? resolveWorld(worlds, compare.undo.previousId)
    : undefined;
  const undoMessage = compare.undo
    ? `Replaced ${undoWorld?.name?.trim() || "the other world"}.`
    : "";

  function inCompare(id: string) {
    return compare.slots[0] === id || compare.slots[1] === id;
  }

  function openCompare(opener?: HTMLElement | null) {
    const active = document.activeElement;
    compareOpenerRef.current =
      opener ?? (active instanceof HTMLElement ? active : null);
    setCompareOpen(true);
  }

  function closeCompare() {
    setCompareOpen(false);
  }

  function flushCatalogQuery() {
    window.clearTimeout(catalogTimer.current);
    const current = catalogNow.current;
    const prev = catalogSnapshot.current;
    if (
      prev.query === current.query &&
      prev.tier === current.tier &&
      prev.sort === current.sort &&
      prev.layout === current.layout &&
      prev.favoritesOnly === current.favoritesOnly
    ) {
      return;
    }
    catalogSnapshot.current = current;
    const search = catalogSearchString({
      q: current.query,
      type: current.tier,
      sort: current.sort,
      layout: current.layout,
      favorites: current.favoritesOnly,
    });
    const next = `${window.location.pathname}${search}`;
    const here = `${window.location.pathname}${window.location.search}`;
    if (next === here) return;
    history.pushState(
      { ...(history.state ?? {}), worldId: selectedIdRef.current },
      "",
      next,
    );
  }

  function onClearCompare() {
    setCompareLimitNote(false);
    setCompare((prev) => clearCompare(prev));
  }

  function onCardCompare(id: string) {
    const prev = compareRef.current;
    const already = prev.slots[0] === id || prev.slots[1] === id;
    const full = prev.slots[0] !== null && prev.slots[1] !== null;
    if (!already && full) {
      setCompareLimitNote(true);
      return;
    }
    const next = toggleCompare(prev, id);
    compareRef.current = next;
    setCompareLimitNote(false);
    setCompare(next);
  }

  function onRemoveCompare(index: SlotIndex) {
    setCompare((prev) => removeFromCompare(prev, index));
  }

  useEffect(() => {
    if (!ready) return;
    setCompare((prev) => {
      let changed = false;
      const slots = prev.slots.map((id) => {
        if (id && !resolveWorld(worlds, id)) {
          changed = true;
          return null;
        }
        return id;
      }) as [string | null, string | null];
      if (!changed) return prev;
      const focusedSlot: SlotIndex =
        slots[prev.focusedSlot] !== null
          ? prev.focusedSlot
          : slots[0]
            ? 0
            : slots[1]
              ? 1
              : 0;
      return { ...prev, slots, focusedSlot, undo: null };
    });
  }, [ready, worlds]);

  useEffect(() => {
    document.body.classList.toggle("has-compare-tray", trayVisible);
    document.body.classList.toggle("has-compare-toast", compare.undo !== null);
    document.body.classList.toggle(
      "has-compare-limit",
      compareLimitNote && trayVisible,
    );
    return () => {
      document.body.classList.remove("has-compare-tray");
      document.body.classList.remove("has-compare-toast");
      document.body.classList.remove("has-compare-limit");
    };
  }, [trayVisible, compare.undo, compareLimitNote]);

  useEffect(() => {
    document.body.style.overflow = drawerId || compareOpen ? "hidden" : "";
  }, [drawerId, compareOpen]);

  useEffect(() => {
    if (compareOpen && compare.slots[0] === null && compare.slots[1] === null) {
      setCompareOpen(false);
    }
  }, [compareOpen, compare.slots]);

  useEffect(() => {
    if (compareOpen) {
      restoreCompareFocus.current = true;
      return;
    }
    if (!restoreCompareFocus.current) return;
    restoreCompareFocus.current = false;
    const opener = compareOpenerRef.current;
    compareOpenerRef.current = null;
    if (opener && document.contains(opener)) {
      opener.focus();
      return;
    }
    (openCompareRef.current ?? searchRef.current)?.focus();
  }, [compareOpen]);

  useEffect(() => {
    if (!compareLimitNote) return;
    if (compare.slots[0] === null || compare.slots[1] === null) {
      setCompareLimitNote(false);
    }
  }, [compare.slots, compareLimitNote]);

  useEffect(() => {
    if (drawerId) setTrayMinimized(true);
  }, [drawerId]);

  useEffect(() => {
    if (drawerId) {
      restoreWorldFocus.current = true;
      return;
    }
    if (!restoreWorldFocus.current) return;
    restoreWorldFocus.current = false;
    const opener = worldOpenerRef.current;
    worldOpenerRef.current = null;
    if (opener && document.contains(opener)) {
      opener.focus();
      return;
    }
    searchRef.current?.focus();
  }, [drawerId]);

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
    setSort("name");
    setLayout("comfortable");
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
        <div
          className="catalog"
          inert={drawerId || compareOpen ? true : undefined}
        >
          <div className="room">
            <div className="room-caption">
              <h1>Impeccable Worlds</h1>
              <div className="purpose">
                <p className="lede">
                  A browsable catalog of Impeccable design worlds. Search,
                  preview, and copy a direction into your coding agent.
                </p>
                <div className="caption-actions">
                  <button
                    type="button"
                    className="btn primary how-cta"
                    aria-haspopup="dialog"
                    aria-expanded={howItWorksOpen}
                    aria-controls={HOW_IT_WORKS_DIALOG_ID}
                    onClick={() => setHowItWorksOpen(true)}
                  >
                    How it works
                  </button>
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
              </div>
            </div>
            <div className="room-hang">
            <div className="catalog-stick">
              <MobileFold label="Search and filters" wide={wide}>
                <div className="controls">
                  <label className="search">
                    <span>Search</span>
                    <input
                      ref={searchRef}
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onBlur={() => flushCatalogQuery()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") flushCatalogQuery();
                      }}
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
                      onChange={(event) =>
                        setSort(event.target.value as WorldSort)
                      }
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
                      onChange={(event) =>
                        setFavoritesOnly(event.target.checked)
                      }
                    />
                    Favorites only
                  </label>
                </div>
              </MobileFold>
            </div>

            {isCollectAllowed() ? (
                <MobileFold className="collect-fold" label="Collect" wide={wide}>
                <CoverageStrip
                  coverage={coverage}
                  collecting={collecting}
                  error={
                    collectFeedback?.tone === "error"
                      ? collectFeedback.text
                      : null
                  }
                  includeDirection={includeDirection}
                  selectedModes={selectedModes}
                  onToggleDirection={() => setIncludeDirection((on) => !on)}
                  onToggleMode={toggleMode}
                  onCollect={() => void onCollect()}
                />
              </MobileFold>
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
              compareFull={compareFull}
              inCompare={inCompare}
              onOpen={openWorld}
              onFavorite={onFavorite}
              onCompare={onCardCompare}
            />
          )}
            </div>

          <footer className="legal">
            <p>
              World names, direction text, and card images come from{" "}
              <a
                href="https://impeccable.style"
                target="_blank"
                rel="noopener noreferrer"
              >
                Impeccable
              </a>. This is a personal/lab index for choosing a
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
          compareFull={compareFull}
          inCompare={inCompare}
          suspendKeys={compareOpen}
          onClose={closeWorld}
          onFavorite={onFavorite}
          onSelect={stepWorld}
          onCompare={onCardCompare}
        />

        {trayVisible ? (
          <CompareTray
            slots={compareWorlds}
            focusedSlot={compare.focusedSlot}
            minimized={!wide && trayMinimized}
            onMinimizedChange={
              wide ? undefined : (next) => setTrayMinimized(next)
            }
            onFocus={(index) =>
              setCompare((prev) => focusCompareSlot(prev, index))
            }
            onRemove={onRemoveCompare}
            onClear={onClearCompare}
            onOpen={(opener) => openCompare(opener)}
            openButtonRef={openCompareRef}
            limitNote={compareLimitNote}
          />
        ) : null}

        {compare.undo && !compareOpen ? (
          <CompareToast
            message={undoMessage}
            onUndo={() => setCompare((prev) => undoCompareReplace(prev))}
            onDismiss={() => setCompare((prev) => dismissCompareUndo(prev))}
          />
        ) : null}

        <ComparePanel
          open={compareOpen}
          slots={compareWorlds}
          notice={
            compareLimitNote ? (
              <p className="compare-limit is-embedded" role="status">
                Compare is limited to two. Remove one to add another.
              </p>
            ) : compare.undo ? (
              <CompareToast
                embedded
                message={undoMessage}
                onUndo={() => setCompare((prev) => undoCompareReplace(prev))}
                onDismiss={() => setCompare((prev) => dismissCompareUndo(prev))}
              />
            ) : null
          }
          onClose={closeCompare}
          onClear={onClearCompare}
          onRemove={onRemoveCompare}
        />
      </div>
    </>
  );
}
