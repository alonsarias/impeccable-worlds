import type { CollectStats, Coverage } from "../../shared/types";
import { WELL_TIERS } from "../../shared/types";

const STOP_COPY: Record<string, string> = {
  max_rolls: "Stopped after the roll limit.",
  no_new_ids: "Stopped after several rolls with no new directions.",
  rate_limited: "The roll API rate-limited the request.",
  request_failed: "A roll request failed.",
  already_running: "A fetch is already running.",
  invalid_request: "The fetch request was invalid.",
};

export function titleCaseTier(tier: string): string {
  if (!tier) return tier;
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function directionNoun(count: number): string {
  return count === 1 ? "direction" : "directions";
}

export function formatResultsCount(args: {
  count: number;
  query: string;
  tier: string;
  favoritesOnly: boolean;
}): string {
  const { count, query, tier, favoritesOnly } = args;
  const bits = [`${count}`];
  if (favoritesOnly) bits.push("favorite");
  if (tier !== "all") bits.push(tier);
  bits.push(directionNoun(count));
  const q = query.trim();
  return q ? `${bits.join(" ")} for “${q}”` : bits.join(" ");
}

export function formatEmptyEcho(args: {
  query: string;
  tier: string;
  favoritesOnly: boolean;
}): string {
  const q = args.query.trim();
  const filters: string[] = [];
  if (q) filters.push(`search “${q}”`);
  if (args.tier !== "all")
    filters.push(`${titleCaseTier(args.tier)} directions`);
  if (args.favoritesOnly) filters.push("favorites only");
  if (filters.length === 0) {
    return "Nothing in the local index matches this search or filter.";
  }
  return `Nothing matches ${filters.join(" · ")}.`;
}

export function humanizeStopReason(reason: string): string {
  return STOP_COPY[reason] ?? reason.replaceAll("_", " ");
}

export const COLLECT_LOCAL_BANNER =
  "Local only — collect isn’t available on the public site.";

export const COLLECT_COVERAGE_HELPER =
  "Direction and Modes explore more dealer pools. This still isn’t 100% of Impeccable — and it doesn’t replace using Impeccable.";

export function humanizeCollectError(message: string): string {
  if (/collect failed/i.test(message)) return "Could not fetch new directions.";
  return message;
}

export function formatCatalogStatus(coverage: Coverage | null): {
  primary: string;
  note: string;
  detail: string;
} {
  const indexed = coverage?.indexedCount ?? 0;
  const approved = coverage?.lastApprovedCount;
  const catalog = coverage?.lastCatalogCount;
  const primary =
    approved == null
      ? `${indexed} ${directionNoun(indexed)} in this catalog`
      : `${indexed} ${directionNoun(indexed)} · ${approved} approved in library`;

  const note =
    "This catalog is local. Approved is the last count from Impeccable’s API — not a complete deck.";

  const detail = [
    `${indexed} ${directionNoun(indexed)} collected in this local catalog.`,
    approved == null
      ? "No approved-library count has been seen from Impeccable’s API yet."
      : `${approved} is the last approved count from Impeccable’s API — not what is stored here.`,
    catalog == null ? null : `Last catalog count from the API: ${catalog}.`,
    "Neither figure is a complete deck.",
    coverage?.collecting?.stopReason && !coverage.collecting.inProgress
      ? humanizeStopReason(coverage.collecting.stopReason)
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return { primary, note, detail };
}

export function formatCollectProgress(coverage: Coverage | null): string {
  const progress = coverage?.collecting;
  if (!progress?.inProgress) return "Surface (neutral)…";
  return progress.passLabel ?? "Surface (neutral)…";
}

export function formatCollectOutcome(stats: CollectStats): {
  tone: "success" | "error";
  text: string;
} {
  if (
    stats.error ||
    stats.stopReason === "rate_limited" ||
    stats.stopReason === "request_failed"
  ) {
    return {
      tone: "error",
      text: humanizeCollectError(
        stats.error ?? "Could not fetch new directions.",
      ),
    };
  }
  if (stats.stopReason === "already_running") {
    return { tone: "error", text: humanizeStopReason("already_running") };
  }
  if (stats.newIds > 0) {
    return {
      tone: "success",
      text: `+${stats.newIds} new · ${stats.duplicatesSkipped ?? 0} duplicates skipped`,
    };
  }
  return { tone: "success", text: "No new worlds this pass." };
}

export const TIER_LEGEND = WELL_TIERS.map((tier) => {
  const gloss =
    tier === "graphic"
      ? "composition and type"
      : tier === "atmosphere"
        ? "mood and space"
        : "motion and use";
  return { tier, label: titleCaseTier(tier), gloss };
});
