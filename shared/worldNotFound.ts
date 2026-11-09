import { SITE_NAME } from "./worldOg";

export const WORLD_NOT_FOUND_TITLE = `Not in the index · ${SITE_NAME}`;

const COPY =
  "This URL does not match a world in the catalog. The index is incomplete, so a shared link may not be collected yet.";

/** Lightweight HTML for unknown `/w/:slug` routes (no SPA bundle). */
export function worldNotFoundHtml(homeHref = "/"): string {
  const title = escapeHtml(WORLD_NOT_FOUND_TITLE);
  const copy = escapeHtml(COPY);
  const home = escapeHtml(homeHref);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="robots" content="noindex,nofollow" />
    <meta name="theme-color" content="#ffffff" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        font-family: system-ui, sans-serif;
        font-size: 1rem;
        line-height: 1.5;
        color: #111;
        background: #fff;
      }
      main { max-width: 28rem; text-align: center; }
      h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.75rem; }
      p { margin: 0 0 1.25rem; color: #333; }
      a {
        display: inline-block;
        padding: 0.5rem 1rem;
        border: 1px solid #111;
        border-radius: 0.25rem;
        color: #111;
        text-decoration: none;
        font-weight: 500;
      }
      a:hover { background: #f5f5f5; }
    </style>
  </head>
  <body>
    <main>
      <h1>This world is not in the index</h1>
      <p>${copy}</p>
      <a href="${home}">Back to catalog</a>
    </main>
  </body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
