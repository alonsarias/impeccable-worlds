# Impeccable Worlds

A local, browsable catalog of Impeccable design worlds. Roll the public API, index unique worlds by `id`, then search, filter, favorite, and copy a direction prompt into Cursor.

This is a personal/lab tool. It is **not** an official Impeccable product and it does **not** contain a complete catalog. There is no official dump; coverage only grows by collecting rolls and deduping.

## Run

```bash
npm install
npm run dev
```

Open the printed local URL (Vite, usually `http://localhost:5173`). The API is served from the same process at `/api/*`.

## Use

1. Click **Collect** / **Collect more** to fetch rolls from `https://impeccable.style/api/roll`.
2. Browse the grid. Search name, form, spark, and system text. Filter by `wellTier` or favorites.
3. Open a world to read the full direction. **Copy direction prompt** puts paste-ready text on the clipboard.
4. Favorites persist in `data/favorites.json` across reloads.

Worlds are stored in `data/worlds.json`. Missing fields render as `No value` — nothing is invented.

## Collector politeness

The collector is deliberately slow and incomplete:

- About **1.5s** between roll requests.
- Default cap of **40** rolls per collect, or stop after **8** consecutive rolls that add no new ids.
- Each roll key is chained with `reroll` 0–8 (the API’s max), then a new key is minted.
- Optional `mode` rotation (`persuade`, `operate`, `read`, `experience`) to widen the pool. Send `{ "modes": [] }` on `POST /api/collect` to omit `mode`.
- On `429` or network failure it stops and the UI shows the error. It does not retry in a tight loop.

`GET /api/coverage` reports `indexedCount` vs the last seen API `approvedCount`. Those numbers will not match a “full deck,” and the UI does not claim they do.

## Attribution

World names, direction text, and card images come from [Impeccable](https://impeccable.style). Cards are hotlinked from `impeccable.style`. Use this index to choose a direction by eye; then paste the copied prompt into Cursor when you run Impeccable.
