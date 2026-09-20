import { DEFAULT_COLLECT_MODES } from "./types";

export const COLLECT_SCOPES = ["surface", "direction"] as const;
export type CollectScope = (typeof COLLECT_SCOPES)[number];

export interface CollectPass {
  id: string;
  label: string;
  scope: CollectScope;
  mode?: string;
}

export function isCollectMode(value: string): boolean {
  return (DEFAULT_COLLECT_MODES as readonly string[]).includes(value);
}

export function selectedCollectModes(
  modes: readonly string[] | undefined,
): string[] {
  const selected = new Set((modes ?? []).filter((mode) => isCollectMode(mode)));
  return DEFAULT_COLLECT_MODES.filter((mode) => selected.has(mode));
}

export function buildCollectPasses(input: {
  direction?: boolean;
  modes?: readonly string[];
}): CollectPass[] {
  const passes: CollectPass[] = [
    { id: "neutral", label: "Surface (neutral)", scope: "surface" },
  ];

  if (input.direction) {
    passes.push({ id: "direction", label: "Direction", scope: "direction" });
  }

  for (const mode of selectedCollectModes(input.modes)) {
    passes.push({
      id: `mode:${mode}`,
      label: `Modes · ${mode}`,
      scope: "surface",
      mode,
    });
  }

  return passes;
}

export function collectPassProgress(pass: CollectPass): string {
  return `${pass.label}…`;
}
