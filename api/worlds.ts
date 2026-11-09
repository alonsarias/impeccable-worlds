import { worldsFromStore } from "../shared/catalog";
import { readShippedStore } from "../shared/shippedStore";

export function GET(): Response {
  return Response.json({ worlds: worldsFromStore(readShippedStore()) });
}
