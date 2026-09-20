import { randomBytes } from "node:crypto";
import {
  buildCollectPasses,
  collectPassProgress,
  type CollectPass,
} from "../shared/collectPasses";
import type {
  CollectRequest,
  CollectStats,
  WorldRecord,
} from "../shared/types";
import { COLLECT_FORBIDDEN, isCollectAllowed } from "./collectAllowed";
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
  const items = value.filter(
    (item): item is string => typeof item === "string",
  );
  return items.length > 0 ? items : undefined;
}

function parseChallenger(
  raw: unknown,
  now: string,
  pass: CollectPass,
): WorldRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = asOptionalString(row.id);
  if (!id) return null;
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
    modesSeen: pass.mode ? [pass.mode] : [],
    scopesSeen: [pass.scope],
  };
}

async function fetchRoll(
  key: string,
  reroll: number,
  pass: CollectPass,
): Promise<
  | { ok: true; data: Record<string, unknown> }
  | {
      ok: false;
      stopReason: CollectStats["stopReason"];
      error: string;
      status?: number;
    }
> {
  const params = new URLSearchParams({
    scope: pass.scope,
    key,
    reroll: String(reroll),
  });
  if (pass.mode) params.set("mode", pass.mode);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${ROLL_URL}?${params}`, {
      signal: controller.signal,
    });
    if (response.status === 429) {
      return {
        ok: false,
        stopReason: "rate_limited",
        error: "Roll API rate limited (429).",
      };
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
    const message =
      error instanceof Error ? error.message : "Network request failed.";
    return { ok: false, stopReason: "request_failed", error: message };
  } finally {
    clearTimeout(timer);
  }
}

function asFiniteInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function emptyStats(
  stopReason: CollectStats["stopReason"],
  error: string,
  extras: Partial<CollectStats> = {},
): CollectStats {
  return {
    rollsRun: extras.rollsRun ?? 0,
    newIds: extras.newIds ?? 0,
    duplicatesSkipped: extras.duplicatesSkipped ?? 0,
    indexedCount: extras.indexedCount ?? indexedCount(),
    stopReason,
    error,
    passLabel: extras.passLabel,
  };
}

export async function runCollector(
  request: CollectRequest = {},
): Promise<CollectStats> {
  if (!isCollectAllowed()) {
    return emptyStats("invalid_request", COLLECT_FORBIDDEN.error);
  }
  if (collectProgress?.inProgress) {
    return emptyStats("already_running", "A collect is already running.", {
      rollsRun: collectProgress.rollsRun,
      newIds: collectProgress.newIds,
      duplicatesSkipped: collectProgress.duplicatesSkipped,
      indexedCount: collectProgress.indexedCount,
      passLabel: collectProgress.passLabel,
    });
  }

  if (
    request.maxRolls !== undefined &&
    (typeof request.maxRolls !== "number" ||
      !Number.isInteger(request.maxRolls) ||
      request.maxRolls < 1)
  ) {
    return emptyStats(
      "invalid_request",
      "maxRolls must be a positive integer.",
    );
  }

  if (request.modes !== undefined && !Array.isArray(request.modes)) {
    return emptyStats("invalid_request", "modes must be an array of strings.");
  }

  if (
    request.direction !== undefined &&
    typeof request.direction !== "boolean"
  ) {
    return emptyStats("invalid_request", "direction must be a boolean.");
  }

  const maxRolls =
    typeof request.maxRolls === "number" &&
    Number.isInteger(request.maxRolls) &&
    request.maxRolls > 0
      ? request.maxRolls
      : DEFAULT_MAX_ROLLS;

  const passes = buildCollectPasses({
    direction: request.direction === true,
    modes: request.modes,
  });

  let rollsRun = 0;
  let newIds = 0;
  let duplicatesSkipped = 0;
  let stopReason: CollectStats["stopReason"] = "max_rolls";
  let error: string | undefined;
  let passLabel = collectPassProgress(passes[0]);
  let needDelay = false;

  const publish = (
    inProgress: boolean,
    extra?: { stopReason?: string; error?: string },
  ) => {
    setCollectProgress({
      inProgress,
      rollsRun,
      newIds,
      duplicatesSkipped,
      indexedCount: indexedCount(),
      passLabel,
      stopReason: extra?.stopReason,
      error: extra?.error,
    });
  };

  publish(true);

  try {
    for (const pass of passes) {
      passLabel = collectPassProgress(pass);
      publish(true);

      let emptyStreak = 0;
      let passRolls = 0;
      let key = newKey();
      let reroll = 0;
      let passStop: CollectStats["stopReason"] = "max_rolls";

      const startFreshKey = (): void => {
        key = newKey();
        reroll = 0;
      };

      while (passRolls < maxRolls) {
        if (needDelay) await sleep(DELAY_MS);
        needDelay = true;

        const result = await fetchRoll(key, reroll, pass);
        if (!result.ok) {
          const chainEnded = result.status === 400 && reroll > 0;
          if (chainEnded) {
            rollsRun += 1;
            passRolls += 1;
            startFreshKey();
            publish(true);
            if (passRolls >= maxRolls) {
              passStop = "max_rolls";
              break;
            }
            continue;
          }
          stopReason = result.stopReason;
          error = result.error;
          publish(false, { stopReason, error });
          return {
            rollsRun,
            newIds,
            duplicatesSkipped,
            indexedCount: indexedCount(),
            stopReason,
            error,
            passLabel,
          };
        }

        const now = new Date().toISOString();
        const challengers = Array.isArray(result.data.challengers)
          ? result.data.challengers
          : [];
        const seenThisRoll = new Set<string>();
        let addedThisRoll = 0;
        for (const challenger of challengers) {
          const world = parseChallenger(challenger, now, pass);
          if (!world || seenThisRoll.has(world.id)) continue;
          seenThisRoll.add(world.id);
          if (upsertWorld(world)) addedThisRoll += 1;
          else duplicatesSkipped += 1;
        }
        recordCoverage(
          asFiniteInt(result.data.approvedCount),
          asFiniteInt(result.data.catalogCount),
          now,
        );
        await flushStore();

        rollsRun += 1;
        passRolls += 1;
        newIds += addedThisRoll;
        if (addedThisRoll > 0) {
          emptyStreak = 0;
          if (reroll >= MAX_REROLL) startFreshKey();
          else reroll += 1;
        } else {
          emptyStreak += 1;
          startFreshKey();
        }

        publish(true);

        if (emptyStreak >= EMPTY_STREAK_LIMIT) {
          passStop = "no_new_ids";
          break;
        }
        if (passRolls >= maxRolls) {
          passStop = "max_rolls";
          break;
        }
      }

      stopReason = passStop;
    }
  } finally {
    publish(false, { stopReason, error });
  }

  return {
    rollsRun,
    newIds,
    duplicatesSkipped,
    indexedCount: indexedCount(),
    stopReason,
    error,
    passLabel,
  };
}
