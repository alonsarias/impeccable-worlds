import type { World } from "../../shared/types";

export const MORE_LIKE_CAP = 12;

const STOP = new Set([
  "a",
  "an",
  "the",
  "of",
  "and",
  "or",
  "to",
  "in",
  "on",
  "for",
  "with",
  "from",
  "by",
  "as",
  "at",
  "it",
  "its",
  "is",
  "be",
  "this",
  "that",
  "into",
  "over",
  "under",
  "where",
  "when",
  "what",
  "which",
  "who",
  "than",
  "then",
  "so",
  "if",
  "not",
  "no",
  "nor",
  "but",
  "about",
  "across",
  "after",
  "before",
  "between",
  "through",
  "during",
  "without",
  "within",
  "one",
  "two",
  "onto",
  "off",
  "up",
  "down",
  "out",
  "our",
  "your",
  "their",
  "them",
  "they",
  "we",
  "you",
  "are",
  "was",
  "were",
  "been",
  "being",
  "can",
  "may",
  "per",
  "via",
  "each",
  "both",
  "few",
  "more",
  "most",
  "other",
  "such",
  "only",
  "own",
  "same",
  "very",
  "just",
  "also",
  "too",
  "all",
  "any",
  "some",
  "while",
  "whose",
  "whom",
  "these",
  "those",
  "there",
  "here",
  "have",
  "has",
  "had",
  "make",
  "makes",
  "made",
  "like",
]);

function tierOf(world: World): string | null {
  const tier = world.wellTier?.trim();
  return tier ? tier : null;
}

function tokensOf(world: World): Set<string> {
  const raw = `${world.form ?? ""}\n${world.spark ?? ""}`.toLowerCase();
  const tokens = new Set<string>();
  for (const token of raw.split(/[^a-z0-9]+/)) {
    if (token.length < 3 || STOP.has(token)) continue;
    tokens.add(token);
  }
  return tokens;
}

function label(world: World): string {
  return world.name?.trim() || world.id;
}

/**
 * Same well tier outranks text overlap. A neighbor is included when it shares
 * the tier and at least one distinctive token, or when the text overlap itself
 * is strong. Weak same-tier rows are not used to fill the cap.
 */
export function moreLikeThis(
  world: World,
  catalog: readonly World[],
  cap = MORE_LIKE_CAP,
): World[] {
  const others = catalog.filter((entry) => entry.id !== world.id);
  if (others.length === 0) return [];

  const docs = [world, ...others];
  const tokenSets = new Map<string, Set<string>>();
  const df = new Map<string, number>();
  for (const entry of docs) {
    const tokens = tokensOf(entry);
    tokenSets.set(entry.id, tokens);
    for (const token of tokens) df.set(token, (df.get(token) ?? 0) + 1);
  }

  const n = docs.length;
  const source = tokenSets.get(world.id) ?? new Set<string>();
  const sourceTier = tierOf(world);
  const ubiquitous = Math.max(6, Math.ceil(n * 0.08));

  const ranked: {
    entry: World;
    sameTier: boolean;
    score: number;
    shared: number;
  }[] = [];

  for (const entry of others) {
    const tokens = tokenSets.get(entry.id) ?? new Set<string>();
    let shared = 0;
    let rare = 0;
    let score = 0;
    for (const token of source) {
      if (!tokens.has(token)) continue;
      const freq = df.get(token) ?? 1;
      if (freq > ubiquitous) continue;
      shared += 1;
      if (freq <= 4) rare += 1;
      score += Math.log((n + 1) / freq);
    }
    const sameTier = Boolean(sourceTier && tierOf(entry) === sourceTier);
    const solid =
      (sameTier && shared >= 2) || shared >= 3 || (rare >= 1 && shared >= 2);
    if (!solid) continue;
    ranked.push({ entry, sameTier, score, shared });
  }

  ranked.sort((a, b) => {
    if (a.sameTier !== b.sameTier) return a.sameTier ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    if (b.shared !== a.shared) return b.shared - a.shared;
    return label(a.entry).localeCompare(label(b.entry));
  });

  return ranked.slice(0, cap).map((row) => row.entry);
}
