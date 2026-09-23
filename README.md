# Impeccable Worlds

A browsable catalog of Impeccable design worlds. Collect rolls **only on a local machine**, then commit and push `data/worlds.json`. The Vercel site is **public and read-only**: visitors can explore the catalog; they cannot run Collect or call Impeccable’s roll API.

This is a personal/lab tool. It is **not** an official Impeccable product and it does **not** contain a complete catalog. There is no official dump; coverage only grows by collecting rolls and deduping.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (Vite, usually `http://localhost:5173`). The API is served from the same process at `/api/*`. Fetch new directions is enabled here.

Optional public Vite keys go in `.env.local` (gitignored) or on Vercel:

- `VITE_GITHUB_REPO_URL` — header **View on GitHub** URL. Default: `https://github.com/alonsarias/impeccable-worlds`.
- `VITE_SITE_URL` — public https origin, no trailing slash. Home uses it for the canonical URL and `og:url`. World share pages use it for their own `og:url` and canonical. Example: `https://impeccableworlds.vercel.app`. If unset, those absolute URLs are omitted.
- `VITE_BLOB_CARDS_BASE_URL` — public Blob origin, no trailing slash. The page falls back to it when an upstream card image fails. Share previews prefer it for the hero image. See [Card images](#card-images) and [Share previews](#share-previews).

## Use

1. Locally, click **Fetch new directions** for a neutral surface pass. Open **Coverage options** to add a **Direction** pass and optional modes (`persuade`, `operate`, `read`, `experience`).
2. Browse the grid. Search name, form, spark, and system text. Filter by `wellTier` or favorites.
3. Open a world to read the full direction. **Copy direction prompt** puts paste-ready text on the clipboard.
4. Favorites live in the browser (`localStorage`). They are per-visitor and do not need a git push.

Worlds are stored in `data/worlds.json`. Missing fields render as `No value` — nothing is invented. Card images load from `impeccable.style` first, then fall back to the public Blob mirror.

## Publish catalog

Production reads the JSON shipped in git. After you collect locally:

```text
1. npm run dev
2. Click Fetch new directions until satisfied
3. npm run sync:cards        # mirror new card images; see Card images
4. git add data/worlds.json
5. git commit -m "chore: update worlds catalog"
6. git push                  # Vercel redeploys the read-only site
```

Connect this repo to Vercel (Vite). The public deploy hides the coverage/Collect strip and `POST /api/collect` returns 403:

`{ "error": "Collect is local-only. Catalog is updated via git push." }`

No production route calls `impeccable.style/api/roll`.

## Collector politeness

The collector is deliberately slow and incomplete, and **local-only**:

- About **1.5s** between roll requests.
- Default cap of **40** rolls **per pass**, or stop a pass after **8** consecutive rolls that add no new ids.
- Each roll key is chained with `reroll` 0–8 (the API’s max), then a new key is minted.
- Default POST `{}` is Neutral (`scope=surface`, no `mode`). `{ "direction": true }` adds a Direction pass (`scope=direction`). `{ "modes": ["persuade", "operate"] }` adds one surface pass per selected mode. Dedupe is by world `id`.
- On `429` or network failure it stops and the UI shows the error plus **Retry**. It does not retry in a tight loop.

`GET /api/coverage` reports `indexedCount` vs the last seen API `approvedCount` stored in the shipped JSON. Those numbers will not match a “full deck,” and the UI does not claim they do.

## Card images

The grid, detail drawer, and lightbox request `cardHero` / `cardBoard` from `impeccable.style` first. If that image fails to load, the client retries the public Blob copy. Blob is not the primary source on the page. Share previews are separate: they prefer the Blob hero. See [Share previews](#share-previews).

Pathnames are derived from the world id. They are not copied into `data/worlds.json`:

- `cards/{worldId}.webp` — board (`cardBoard`)
- `cards/{worldId}-hero.webp` — hero (`cardHero`)

`VITE_BLOB_CARDS_BASE_URL` is the store origin, with no trailing slash, for example `https://renu9ixtcf2ryqbz.public.blob.vercel-storage.com`. Leave it unset to skip the fallback.

The store is the existing public Blob store `impeccable-worlds-cards`, already connected to this Vercel project. Do not create another store and do not change its access mode. Image files stay out of git.

### Sync

Collect stays local-only. Image sync is a local script. It never prints credentials.

The Blob store stays public. Its project connection is Production and Preview, using OIDC plus a static read-write token. Development is not connected, so the OIDC token from `vercel env pull` cannot upload, and Vercel will not copy `BLOB_READ_WRITE_TOKEN` into Development. Add that token to `.env.local` without removing the pulled lines. The sync script uses the token when it is set.

```bash
npx vercel link --yes --project impeccable-worlds
npx vercel env pull .env.local --environment development --yes
# add BLOB_READ_WRITE_TOKEN=... to .env.local
npm run sync:cards
```

Run it once to fill the store. Run it again after a Collect that adds worlds (or changes card URLs). Re-runs overwrite the same pathnames. The script logs `ok` or `fail` per world id and exits non-zero if any image fails.

`.env.local` is gitignored. Do not commit it. `VITE_BLOB_CARDS_BASE_URL` is already set on Vercel for Production, Preview, and Development. Keep the same value in `.env.local` for local fallback.

## Share previews

Copy link shares `/w/{slug}`. Slack, iMessage, X, and LinkedIn read Open Graph tags from the first HTML response. They do not run the React app, so updating `document.title` in the client is not enough.

The production build writes a static copy of the SPA shell for every catalog world:

- `dist/w/{slug}/index.html`
- `dist/w/{id}/index.html` when the public slug is not the world id

Vercel checks the filesystem before the `/w/:id` rewrite in `vercel.json`, so a known world is served from that file. The JavaScript is still the same SPA: it opens that world, and copy link and favorites behave as they do on any other load. An id that is not in the catalog has no file, the rewrite serves the site shell, and the app still opens the missing-world drawer.

Each world file sets:

- `og:title`, `twitter:title`, and `<title>`: `{World name} · Impeccable Worlds`
- `og:description`, `twitter:description`, and `description`: the spark, collapsed to one line and cut at a word boundary so it stays within 160 characters. If the spark is empty, the form is used. If both are empty: `Choose a direction by eye. Copy the prompt.`
- `og:image` and `twitter:image`: `{VITE_BLOB_CARDS_BASE_URL}/cards/{worldId}-hero.webp` when that origin is `https`. Otherwise the catalog `cardHero` URL. The path uses the world id, not the slug. It is the hero only — not the board, and not `/og.png`.
- `twitter:card`: `summary_large_image`
- `og:url` and canonical: `{VITE_SITE_URL}/w/{slug}`

`/` keeps the site title, description, and URL. Its image is Alphabet Storm’s hero, the same kind of card as a world share: `{VITE_BLOB_CARDS_BASE_URL}/cards/dream-surreal-impossible-worlds-alphabet-storm-hero.webp` when that origin is `https`, otherwise the catalog `cardHero`.

`VITE_SITE_URL` has to be present at build time (it is set on Vercel) or world pages omit absolute `og:url` and canonical. `VITE_BLOB_CARDS_BASE_URL` has to be an `https` origin or the image falls back to `cardHero`.

In `npm run dev`, the same tags are injected on the fly. `og:url` uses the dev server origin so a local fetch matches the URL you requested. A production build bakes `VITE_SITE_URL` instead.

### Check a preview

With the dev server running:

```bash
curl -s http://localhost:5173/w/miura-orbit-sheet | grep -E 'og:title|og:description|og:image"|og:url|twitter:card'
curl -s http://localhost:5173/ | grep 'og:image'
```

The world response should include `Miura Orbit Sheet · Impeccable Worlds` and a hero `og:image` ending in `paper-folds-pleats-deployable-miura-orbit-sheet-hero.webp`. The home response should keep the title `Impeccable Worlds` and an `og:image` ending in `dream-surreal-impossible-worlds-alphabet-storm-hero.webp`.

To inspect the files Vercel will serve, build with the public origin and start the preview server:

```bash
VITE_SITE_URL=https://impeccableworlds.vercel.app npm run build
npm run preview
```

Then:

```bash
curl -s http://127.0.0.1:4173/w/miura-orbit-sheet | grep og:url
```

Vite prints the preview port; 4173 is the default. `og:url` should be `https://impeccableworlds.vercel.app/w/miura-orbit-sheet`.

After deploy, fetch `https://impeccableworlds.vercel.app/w/miura-orbit-sheet` the same way, then paste that URL into [opengraph.xyz](https://www.opengraph.xyz/) or the Facebook Sharing Debugger. Those tools cache cards. Scrape again after a new deploy.

## Attribution

World names, direction text, and card images come from [Impeccable](https://impeccable.style). Cards are loaded from `impeccable.style`, with a public Blob copy used only when an upstream image fails. Use this index to choose a direction by eye; then paste the copied prompt into Cursor when you run Impeccable.
