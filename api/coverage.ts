import { readShippedStore } from "../shared/shippedStore";

export async function GET(): Promise<Response> {
  const { coverageFromStore } = await import("../shared/catalog");
  return Response.json(coverageFromStore(readShippedStore()));
}
