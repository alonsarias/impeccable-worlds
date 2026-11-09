import { readShippedStore } from "../shared/shippedStore";

export async function GET(): Promise<Response> {
  const { worldsFromStore } = await import("../shared/catalog");
  return Response.json({ worlds: worldsFromStore(readShippedStore()) });
}
