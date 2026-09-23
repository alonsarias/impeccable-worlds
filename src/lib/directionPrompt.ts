import type { World } from "../../shared/types";
import { NO_VALUE } from "./display";

function field(label: string, value: string | undefined): string {
  return `${label}: ${value && value.trim() !== "" ? value : NO_VALUE}`;
}

function oneLiner(world: World): string {
  const spark = world.spark?.trim();
  if (spark) return spark;
  const form = world.form?.trim();
  if (form) return form;
  return NO_VALUE;
}

function directionBody(world: World): string {
  const system =
    world.system && world.system.length > 0
      ? world.system.map((rule) => `- ${rule}`).join("\n")
      : `- ${NO_VALUE}`;

  return [
    "Use this Impeccable design world as the committed direction (do not re-roll):",
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
  ].join("\n");
}

export function buildDirectionPrompt(world: World): string {
  const name = world.name?.trim() ? world.name.trim() : NO_VALUE;
  return [name, oneLiner(world), "", directionBody(world)].join("\n");
}
