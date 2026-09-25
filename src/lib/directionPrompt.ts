import type { World } from "../../shared/types";
import { NO_VALUE } from "./display";

function field(label: string, value: string | undefined): string {
  return `${label}: ${value && value.trim() !== "" ? value : NO_VALUE}`;
}

function systemLines(system: string[] | undefined): string {
  if (!system || system.length === 0) return `- ${NO_VALUE}`;
  return system.map((rule) => `- ${rule}`).join("\n");
}

export function buildDirectionPrompt(world: World): string {
  const catalogId = world.id.trim() !== "" ? world.id : NO_VALUE;
  const system = systemLines(world.system);

  return [
    "## PIN",
    "",
    "This is a **user-pinned** Impeccable catalog world. It **beats the roll**.",
    "",
    "Do **not** run `concept-seed`, a direction tournament, or re-roll unless the human explicitly asks for a new look.",
    "",
    `If \`/impeccable\` still opens a "Choose a direction" UI, confirm and lock **this world id only** (\`id: ${catalogId}\`), then continue.`,
    "",
    "Acknowledging this paste is not done. Next actions: open QUALITY BAR, then write the Direction contract.",
    "",
    "## WHAT TO BUILD",
    "",
    "Build target: <describe the surface / route / artifact — ask once if missing>",
    "",
    "## WORLD PAYLOAD",
    "",
    field("id", world.id),
    field("name", world.name),
    field("form", world.form),
    field("spark", world.spark),
    field("wellTier", world.wellTier),
    "",
    "system:",
    system,
    "",
    field("webLeverage", world.webLeverage),
    "",
    "## QUALITY BAR",
    "",
    "Mandatory first action after the pin.",
    "",
    field("cardBoard", world.cardBoard),
    field("cardHero", world.cardHero),
    "",
    "Download these into the workspace if the viewer is sandboxed, then **open both images now**. Sandboxed viewers reject absolute paths outside the workspace. If a line says No value, there is no URL — do not invent one.",
    "",
    "They set craft level (finish, commitment, art direction), not the composition of this product's page. Build this product's first viewport in this world's grammar.",
    "",
    "## PREREQS",
    "",
    "If PRODUCT.md is missing: run Impeccable init / the product ask only, then continue. Do not invent product facts.",
    "",
    "If Impeccable is not installed: tell the human to run `npx impeccable install`. Do not fake CLI success.",
    "",
    "Mode: if unknown, ask once among persuade | operate | read | experience; then proceed.",
    "",
    "## BEFORE ANY UI CODE — Direction contract",
    "",
    "Before any UI code, write the direction under `## Direction contract` in the relevant surface brief (Impeccable `surface-brief write`). Do not write it into HTML or source comments.",
    "",
    "Six short blocks, about 150 words total. That length is guidance, not a word-count ritual:",
    "",
    "- THESIS",
    "- OWN-WORLD: translate this world's system grammar to this product; recognizable with the content removed",
    "- STORY",
    "- FIRST VIEWPORT",
    `- FORM: this catalog world; cite \`id: ${catalogId}\`. No Impeccable seed key — Worlds does not store roll keys; use the catalog id.`,
    '- FINISH: unreviewed and undocumented is unfinished. End with the finish review, the verdict, DESIGN.md on a new or replacement world, and provenance on shipping rasters.',
    "",
    "Fuse: the world supplies form and system grammar; PRODUCT.md supplies every fact; clarity wins. Skeleton and grammar, not clothes. One world owns the page.",
    "",
    "## BUILD PATH",
    "",
    "Read `.impeccable/config.json` `buildPath` if present.",
    "",
    "If image generation exists and the default is unset: prefer comp-led, per Impeccable.",
    "",
    "If there is no image generation: code-led only. Put ambition in FIRST VIEWPORT plus a named signature interaction. Still use QUALITY BAR for finish calibration.",
    "",
    "Comp-led: visualize, the approved comp, and build-phase gates as the Impeccable skill requires when they are available.",
    "",
    "Code-led: do not silently skip commitment. The finish reviewer audits behavior against the contract.",
    "",
    "## BUILD + FINISH",
    "",
    'Build the pinned direction fully. Commit every atom: nav, controls, and states in the form\'s vocabulary. No stock chrome costume.',
    "",
    "Then run the finish reviewer and the documenter per Impeccable. A new or replacement world needs DESIGN.md.",
    "",
    'Stopping after "theme tokens look nicer" is a failed handoff.',
  ].join("\n");
}
