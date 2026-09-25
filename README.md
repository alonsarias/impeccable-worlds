# Impeccable Worlds

Browsable catalog of [Impeccable](https://impeccable.style) design worlds: search, preview, compare, and copy a direction into your coding agent.

🚀 **[Live Demo](https://impeccableworlds.vercel.app/)**

![Impeccable Worlds](https://github.com/user-attachments/assets/da44666b-9ccf-4872-8892-950ae9892bd3)
> Unofficial companion. Not an official Impeccable product.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [Card images](#card-images)
- [Share previews](#share-previews)
- [Attribution](#attribution)

## Overview

Impeccable’s own flow is a **roll**: random challengers from `impeccable.style/api/roll`. This app is the opposite mode: **browse** a growing index so you can pick a direction by eye and paste it into Cursor (or another coding agent).

### The Problem

- Rolling is great for surprise; bad when you already know the vibe you want
- There is no official full dump of worlds
- Direction text is hard to compare across many options without a catalog

### The Solution

- 🗂️ **Shipped catalog** — worlds indexed in `data/worlds.json` (grows via local Collect + git push)
- 🔍 **Search & filter** — name, form, spark, system text; `wellTier`; favorites
- 🃏 **Card grid + detail** — board/hero images, full direction, notes
- ⚖️ **Compare** — up to two worlds side by side
- ✨ **More like this** — related worlds by tier and form/spark overlap
- 📋 **Copy direction prompt** — paste-ready text for your agent
- ⭐ **Favorites** — per-browser `localStorage` (not synced)

Missing fields render as `No value`. Nothing is invented.

## Features

### Catalog

- Hundreds of worlds collected over time (incomplete by design)
- Search across name, form, spark, and system rules
- Filter by `wellTier` and favorites
- Card images from `impeccable.style`, with public Vercel Blob fallback

### Detail & share

- Full direction in a drawer / `/w/:id` routes
- Copy direction prompt to clipboard
- Per-world Open Graph / Twitter cards for link previews
- Local notes on a world (client-side)

### Compare & discovery

- Compare tray: max **2** worlds, side-by-side heroes + spark/form
- **More like this** under the direction body (wellTier first, then form/spark overlap)

### Local Collect (dev only)

- **Fetch new directions** calls Impeccable’s roll API from your machine
- Optional Direction pass and mode passes (`persuade`, `operate`, `read`, `experience`)
- Production hides Collect; `POST /api/collect` returns **403**

## How It Works

1. **Browse** the grid on the live site (or local after Collect)
2. **Open** a world to read form, spark, and system rules
3. **Compare** or follow **More like this** if you want alternatives
4. **Copy direction prompt** into Cursor / your agent
5. **Grow the catalog** only locally: Collect → sync card blobs → commit `data/worlds.json` → push

### Publish catalog (maintainers)

```text
1. npm run dev
2. Fetch new directions until satisfied
3. npm run sync:cards
4. git add data/worlds.json
5. git commit -m "chore: update worlds catalog"
6. git push   # Vercel redeploys the read-only site
```

Production never calls `impeccable.style/api/roll`.

## Installation

### Prerequisites

- Node.js 18+
- npm

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/alonsarias/impeccable-worlds.git
cd impeccable-worlds
```

2. **Install dependencies**

```bash
npm install
```

3. **Start development server**

```bash
npm run dev
```

4. **Open in browser**

```
http://localhost:5173
```

The Vite process also serves `/api/*` locally. Collect is enabled here.

### Optional env (`.env.local` or Vercel)

| Variable | Purpose |
| --- | --- |
| `VITE_GITHUB_REPO_URL` | Header “View on GitHub” (default: this repo) |
| `VITE_SITE_URL` | Public origin, no trailing slash (canonical + `og:url`) |
| `VITE_BLOB_CARDS_BASE_URL` | Public Blob origin for card image fallback + share heroes |
| `BLOB_READ_WRITE_TOKEN` | Local only — required for `npm run sync:cards` |

### Build for production

```bash
npm run build
npm run preview
```

## Usage

### Visitors (production)

1. Search or scroll the grid
2. Star worlds to favorite (stays in this browser)
3. Open a world → read → **Copy direction prompt**
4. Optionally **Compare** two worlds or browse **More like this**
5. Share `/w/{slug}` — link previews use per-world OG tags

### Maintainers (local Collect)

1. Run `npm run dev`
2. Click **Fetch new directions** (neutral surface pass)
3. Open **Coverage options** for Direction and optional modes
4. Collector politeness: ~1.5s between rolls, default 40 rolls/pass, stop after 8 empty rolls, `reroll` 0–8 then new key; stops on `429`
5. `npm run sync:cards` after new worlds
6. Commit and push `data/worlds.json`

## Project Structure

```
api/                     # Vercel serverless stubs (collect forbidden in prod)
data/
  worlds.json            # Shipped catalog
scripts/
  sync-card-blobs.ts     # Mirror card images to Vercel Blob
  generate-icons.mjs
  generate-og.mjs
server/                  # Local Vite API: collector, store, OG plugin
shared/                  # Types, catalog helpers, OG, collect passes
src/
  App.tsx                # Shell, routing, catalog UI state
  components/            # Grid, drawer, compare, more-like-this, coverage
  lib/                   # Favorites, prompts, similar worlds, card sources
  index.css
```

## Development

### Key technologies

- **React 19** — UI
- **TypeScript** — types
- **Vite 7** — app + local API plugins
- **Vercel** — static/SPA host + Blob for card mirrors
- **@vercel/analytics** — traffic

### Scripts

```bash
npm run dev         # Dev server + local Collect API
npm run build       # Typecheck + production build (incl. per-world OG HTML)
npm run preview     # Preview production build
npm run sync:cards  # Upload/refresh Blob card images (needs token in .env.local)
npm run icons       # Regenerate favicons
npm run og          # Regenerate site og.png
```

### Architecture notes

- **Catalog source of truth**: `data/worlds.json` in git; production reads the baked file (SPA). Collect writes through the local server store, then you commit.
- **Images**: prefer upstream `cardHero` / `cardBoard`; on error, client falls back to Blob pathnames `cards/{id}.webp` and `cards/{id}-hero.webp`.
- **Share**: build emits `dist/w/{slug}/index.html` with world-specific meta so crawlers get OG without running React.
- **Compare / Similar**: client-only; no backend.

## Card images

Grid, drawer, and lightbox request `impeccable.style` first; Blob is fallback. Share previews prefer the Blob hero when `VITE_BLOB_CARDS_BASE_URL` is an `https` origin.

Pathnames (not stored in JSON):

- `cards/{worldId}.webp` — board
- `cards/{worldId}-hero.webp` — hero

Store: public Blob store `impeccable-worlds-cards` (already on the Vercel project). Images stay out of git.

```bash
npx vercel link --yes --project impeccable-worlds
npx vercel env pull .env.local --environment development --yes
# add BLOB_READ_WRITE_TOKEN=... to .env.local (OIDC alone cannot upload in Development)
npm run sync:cards
```

Never commit `.env.local`. Never print the token.

## Share previews

`/w/{slug}` needs server/static HTML meta. The production build writes a static shell per catalog world. Each file sets title `{Name} · Impeccable Worlds`, spark/form description, `summary_large_image`, hero `og:image`, and `og:url` / canonical from `VITE_SITE_URL`.

Home keeps the site title. Its image is the brand card at `/og.png` (1200×630), not a world hero. Regenerate it with `npm run og`.

Quick check:

```bash
curl -s http://localhost:5173/w/miura-orbit-sheet | grep -E 'og:title|og:image|og:url'
```

After deploy, re-scrape with [opengraph.xyz](https://www.opengraph.xyz/) if the card is cached.

## Attribution

World names, direction text, and card images come from [Impeccable](https://impeccable.style). Use this index to choose a direction by eye; then paste the copied prompt when you run Impeccable in your agent.
