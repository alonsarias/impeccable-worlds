import { randomBytes } from "node:crypto";
import type { CollectRequest, CollectStats, WorldRecord } from "../shared/types";
import { DEFAULT_COLLECT_MODES } from "../shared/types";
import {
  collectProgress,
  flushStore,
  indexedCount,
  recordCoverage,
  setCollectProgress,
  upsertWorld,
} from "./store";

const ROLL_URL = "https://impeccable.style/api/roll";
const DELAY_MS = 1500;
const DEFAULT_MAX_ROLLS = 40;
const EMPTY_STREAK_LIMIT = 8;
const MAX_REROLL = 8;
const FETCH_TIMEOUT_MS = 20000;

function newKey(): string {
  return randomBytes(4).toString("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === "string");
  return items.length > 0 ? items : undefined;
}

function parseChallenger(raw: unknown, now: string, mode: string | undefined): WorldRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = asOptionalString(row.id);
  if (!id) return null;
  const modesSeen = mode ? [mode] : [];
  return {
    id,
    name: asOptionalString(row.name),
    form: asOptionalString(row.form),
    spark: asOptionalString(row.spark),
    system: asStringArray(row.system),
    webLeverage: asOptionalString(row.webLeverage),
    wellTier: asOptionalString(row.wellTier),
    cardBoard: asOptionalString(row.cardBoard),
    cardHero: asOptionalString(row.cardHero),
    firstSeenAt: now,
    lastSeenAt: now,
    modesSeen,
  };
}

async function fetchRoll(key: string, reroll: number, mode: string | undefined): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; stopReason: CollectStats["stopReason"]; error: string; status?: number }
> {
  const params = new URLSearchParams({
    scope: "surface",
    key,
    reroll: String(reroll),
  });
  if (mode) params.set("mode", mode);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${ROLL_URL}?${params}`, { signal: controller.signal });
    if (response.status === 429) {
      return { ok: false, stopReason: "rate_limited", error: "Roll API rate limited (429)." };
    }
    if (!response.ok) {
      let detail = "";
      try {
        const errBody = (await response.json()) as { error?: unknown };
        if (typeof errBody.error === "string") detail = errBody.error;
      } catch {
        /* ignore non-JSON error bodies */
      }
      return {
        ok: false,
        stopReason: "request_failed",
        error: detail || `Roll API returned ${response.status}.`,
        status: response.status,
      };
    }
    const data = (await response.json()) as Record<string, unknown>;
    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed.";
    return { ok: false, stopReason: "request_failed", error: message };
  } finally {
    clearTimeout(timer);
  }
}

function asFiniteInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function runCollector(request: CollectRequest = {}): Promise<CollectStats> {
  if (collectProgress?.inProgress) {
    return {
      rollsRun: collectProgress.rollsRun,
      newIds: collectProgress.newIds,
      indexedCount: collectProgress.indexedCount,
      stopReason: "already_running",
      error: "A collect is already running.",
    };
  }

  const maxRolls =
    typeof request.maxRolls === "number" && Number.isInteger(request.maxRolls) && request.maxRolls > 0
      ? request.maxRolls
      : DEFAULT_MAX_ROLLS;

  if (request.maxRolls !== undefined && (typeof request.maxRolls !== "number" || !Number.isInteger(request.maxRolls) || request.maxRolls < 1)) {
    return {
      rollsRun: 0,
      newIds: 0,
      indexedCount: indexedCount(),
      stopReason: "invalid_request",
      error: "maxRolls must be a positive integer.",
    };
  }

  if (request.modes !== undefined && !Array.isArray(request.modes)) {
    return {
      rollsRun: 0,
      newIds: 0,
      indexedCount: indexedCount(),
      stopReason: "invalid_request",
      error: "modes must be an array of strings.",
    };
  }

  const modes = request.modes === undefined
    ? [...DEFAULT_COLLECT_MODES]
    : request.modes.filter((mode): mode is string => typeof mode === "string" && mode.length > 0);

  let rollsRun = 0;
  let newIds = 0;
  let emptyStreak = 0;
  let keyIndex = 0;
  let key = newKey();
  let reroll = 0;
  let stopReason: CollectStats["stopReason"] = "max_rolls";
  let error: string | undefined;

  const modeForKey = (): string | undefined =>
    modes.length > 0 ? modes[keyIndex % modes.length] : undefined;

  const startFreshKey = (): void => {
    keyIndex += 1;
    key = newKey();
    reroll = 0;
  };

  setCollectProgress({
    inProgress: true,
    rollsRun: 0,
    newIds: 0,
    indexedCount: indexedCount(),
  });

  try {
    while (rollsRun < maxRolls) {
      const mode = modeForKey();
      const result = await fetchRoll(key, reroll, mode);
      if (!result.ok) {
        const chainEnded = result.status === 400 && reroll > 0;
        if (chainEnded) {
          rollsRun += 1;
          startFreshKey();
          setCollectProgress({
            inProgress: true,
            rollsRun,
            newIds,
            indexedCount: indexedCount(),
          });
          if (rollsRun >= maxRolls) {
            stopReason = "max_rolls";
            break;
          }
          await sleep(DELAY_MS);
          continue;
        }
        stopReason = result.stopReason;
        error = result.error;
        break;
      }

      const now = new Date().toISOString();
      const challengers = Array.isArray(result.data.challengers) ? result.data.challengers : [];
      let addedThisRoll = 0;
      for (const challenger of challengers) {
        const world = parseChallenger(challenger, now, mode);
        if (!world) continue;
        if (upsertWorld(world)) addedThisRoll += 1;
      }
      recordCoverage(asFiniteInt(result.data.approvedCount), asFiniteInt(result.data.catalogCount), now);
      await flushStore();

      rollsRun += 1;
      newIds += addedThisRoll;
      if (addedThisRoll > 0) {
        emptyStreak = 0;
        if (reroll >= MAX_REROLL) startFreshKey();
        else reroll += 1;
      } else {
        emptyStreak += 1;
        startFreshKey();
      }

      setCollectProgress({
        inProgress: true,
        rollsRun,
        newIds,
        indexedCount: indexedCount(),
      });

      if (emptyStreak >= EMPTY_STREAK_LIMIT) {
        stopReason = "no_new_ids";
        break;
      }
      if (rollsRun >= maxRolls) {
        stopReason = "max_rolls";
        break;
      }
      await sleep(DELAY_MS);
    }
  } finally {
    const stats: CollectStats = {
      rollsRun,
      newIds,
      indexedCount: indexedCount(),
      stopReason,
      error,
    };
    setCollectProgress({
      inProgress: false,
      rollsRun,
      newIds,
      indexedCount: stats.indexedCount,
      stopReason,
      error,
    });
  }

  return {
    rollsRun,
    newIds,
    indexedCount: indexedCount(),
    stopReason,
    error,
  };
}
