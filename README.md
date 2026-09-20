# Impeccable Worlds

A browsable catalog of Impeccable design worlds. Collect rolls **only on a local machine**, then commit and push `data/worlds.json`. The Vercel site is **public and read-only**: visitors can explore the catalog; they cannot run Collect or call Impeccable’s roll API.

This is a personal/lab tool. It is **not** an official Impeccable product and it does **not** contain a complete catalog. There is no official dump; coverage only grows by collecting rolls and deduping.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL (Vite, usually `http://localhost:5173`). The API is served from the same process at `/api/*`. Collect more is enabled here.

## Use

1. Locally, click **Collect** / **Collect more** to fetch rolls from `https://impeccable.style/api/roll`.
2. Browse the grid. Search name, form, spark, and system text. Filter by `wellTier` or favorites.
3. Open a world to read the full direction. **Copy direction prompt** puts paste-ready text on the clipboard.
4. Favorites live in the browser (`localStorage`). They are per-visitor and do not need a git push.

Worlds are stored in `data/worlds.json`. Missing fields render as `No value` — nothing is invented. Card images stay hotlinked from `impeccable.style`.

## Publish catalog

Production reads the JSON shipped in git. After you collect locally:

```text
1. npm run dev
2. Click Collect more until satisfied
3. git add data/worlds.json
4. git commit -m "chore: update worlds catalog"
5. git push                  # Vercel redeploys the read-only site
```

Connect this repo to Vercel (Vite). The public deploy hides the coverage/Collect strip and `POST /api/collect` returns 403:

`{ "error": "Collect is local-only. Catalog is updated via git push." }`

No production route calls `impeccable.style/api/roll`.

## Collector politeness

The collector is deliberately slow and incomplete, and **local-only**:

- About **1.5s** between roll requests.
- Default cap of **40** rolls per collect, or stop after **8** consecutive rolls that add no new ids.
- Each roll key is chained with `reroll` 0–8 (the API’s max), then a new key is minted.
- Optional `mode` rotation (`persuade`, `operate`, `read`, `experience`) to widen the pool. Send `{ "modes": [] }` on `POST /api/collect` to omit `mode`.
- On `429` or network failure it stops and the UI shows the error. It does not retry in a tight loop.

`GET /api/coverage` reports `indexedCount` vs the last seen API `approvedCount` stored in the shipped JSON. Those numbers will not match a “full deck,” and the UI does not claim they do.

## Attribution

World names, direction text, and card images come from [Impeccable](https://impeccable.style). Cards are hotlinked from `impeccable.style`. Use this index to choose a direction by eye; then paste the copied prompt into Cursor when you run Impeccable.
