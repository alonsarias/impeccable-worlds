import { worldsFromStore } from "../shared/catalog";
import { readShippedStore } from "../shared/shippedStore";

export function GET(): Response {
  try {
    return Response.json({ worlds: worldsFromStore(readShippedStore()) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
