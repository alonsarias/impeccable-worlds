export const WELL_TIERS = ["graphic", "atmosphere", "interaction"] as const;
export type WellTier = (typeof WELL_TIERS)[number];

export const DEFAULT_COLLECT_MODES = [
  "persuade",
  "operate",
  "read",
  "experience",
] as const;

export interface WorldRecord {
  id: string;
  name?: string;
  form?: string;
  spark?: string;
  system?: string[];
  webLeverage?: string;
  wellTier?: string;
  cardBoard?: string;
  cardHero?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  modesSeen: string[];
}

export interface World extends WorldRecord {
  favorite: boolean;
}

export interface CollectRequest {
  maxRolls?: number;
  modes?: string[];
}

export type CollectStopReason =
  | "max_rolls"
  | "no_new_ids"
  | "rate_limited"
  | "request_failed"
  | "already_running"
  | "invalid_request";

export interface CollectStats {
  rollsRun: number;
  newIds: number;
  indexedCount: number;
  stopReason: CollectStopReason | string;
  error?: string;
}

export interface CollectProgress {
  inProgress: boolean;
  rollsRun: number;
  newIds: number;
  indexedCount: number;
  stopReason?: string;
  error?: string;
}

export interface Coverage {
  indexedCount: number;
  lastApprovedCount: number | null;
  lastCatalogCount: number | null;
  lastCollectAt: string | null;
  collecting: CollectProgress | null;
}

export interface WorldsStoreFile {
  worlds: Record<string, WorldRecord>;
  lastApprovedCount: number | null;
  lastCatalogCount: number | null;
  lastCollectAt: string | null;
}
