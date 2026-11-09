import { coverageFromStore } from "../shared/catalog";
import { readShippedStore } from "../shared/shippedStore";

export function GET(): Response {
  return Response.json(coverageFromStore(readShippedStore()));
}
