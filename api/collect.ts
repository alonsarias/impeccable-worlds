const body = { error: "Collect is local-only. Catalog is updated via git push." };

function forbidden(): Response {
  return Response.json(body, { status: 403 });
}

export function GET(): Response {
  return forbidden();
}

export function POST(): Response {
  return forbidden();
}
