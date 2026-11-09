import shipped from "../data/worlds.json";

export function GET(): Response {
  const worlds =
    shipped && typeof shipped === "object" && "worlds" in shipped
      ? (shipped as { worlds: unknown }).worlds
      : null;
  return Response.json({
    probe: "json-only",
    hasWorlds: Boolean(worlds),
    count: Array.isArray(worlds) ? worlds.length : 0,
  });
}
