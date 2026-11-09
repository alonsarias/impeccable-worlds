export function GET(): Response {
  return Response.json({ worlds: [], probe: "minimal" });
}
