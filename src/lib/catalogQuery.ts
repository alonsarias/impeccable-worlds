import type { WorldSort } from "../../shared/catalog";
import { WELL_TIERS } from "../../shared/types";
import type { CardLayout } from "../components/WorldGrid";

export interface CatalogQuery {
  q: string;
  type: string;
  sort: WorldSort;
  layout: CardLayout;
  favorites: boolean;
}

const SORTS = new Set<WorldSort>(["name", "newest", "tier"]);
const LAYOUTS = new Set<CardLayout>(["comfortable", "compact", "list"]);
const TYPES = new Set<string>(["all", ...WELL_TIERS]);

export function readCatalogQuery(search: string): CatalogQuery {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const sort = params.get("sort") ?? "name";
  const layout = params.get("layout") ?? "comfortable";
  const type = params.get("type") ?? "all";
  return {
    q: params.get("q") ?? "",
    type: TYPES.has(type) ? type : "all",
    sort: SORTS.has(sort as WorldSort) ? (sort as WorldSort) : "name",
    layout: LAYOUTS.has(layout as CardLayout) ? (layout as CardLayout) : "comfortable",
    favorites: params.get("favorites") === "1",
  };
}

export function catalogSearchString(state: CatalogQuery): string {
  const params = new URLSearchParams();
  const q = state.q.trim();
  if (q) params.set("q", q);
  if (state.type !== "all") params.set("type", state.type);
  if (state.sort !== "name") params.set("sort", state.sort);
  if (state.layout !== "comfortable") params.set("layout", state.layout);
  if (state.favorites) params.set("favorites", "1");
  const value = params.toString();
  return value ? `?${value}` : "";
}
