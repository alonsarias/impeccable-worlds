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
- `VITE_SITE_URL` — public origin for the canonical URL and absolute Open Graph / Twitter image (`/og.png`). No trailing slash. Example: `https://your-deployment.vercel.app`. If unset, canonical and `og:url` are omitted and the share image is the relative path `/og.png`.
- `VITE_BLOB_CARDS_BASE_URL` — public Blob origin used only when an upstream card image fails. No trailing slash. See [Card images](#card-images).

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

The grid, detail drawer, and lightbox request `cardHero` / `cardBoard` from `impeccable.style` first. If that image fails to load, the client retries the public Blob copy. Blob is not the primary source.

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

## Attribution

World names, direction text, and card images come from [Impeccable](https://impeccable.style). Cards are loaded from `impeccable.style`, with a public Blob copy used only when an upstream image fails. Use this index to choose a direction by eye; then paste the copied prompt into Cursor when you run Impeccable.
