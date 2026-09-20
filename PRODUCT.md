# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are UX designers, UI designers, frontend developers, design engineers, programmers, and anyone else who wants to build a beautiful site or app and needs a visual direction to work from.

A second confirmed audience is the local operator who grows the index: they collect rolls on a machine they control, then publish by committing `data/worlds.json`.

## Product Purpose

Impeccable Worlds is a personal/lab catalog of Impeccable design worlds. Visitors browse, filter, and open a world to copy a paste-ready direction prompt into Cursor. Success is choosing a direction by eye and leaving with the prompt — not completing an official or exhaustive deck.

## Positioning

This is an unofficial, incomplete index of worlds collected from Impeccable’s public roll API. There is no official dump. Coverage only grows by collecting unique ids and deduping. The public site is read-only; Collect exists only on a local machine.

## Operating Context

- Local: `npm run dev` serves the app and `/api/*`. Collect fetches `https://impeccable.style/api/roll` slowly (about 1.5s between requests, default cap 40 rolls, stop after 8 consecutive rolls with no new ids).
- Publish: commit and push `data/worlds.json`; Vercel redeploys a public read-only site. Production hides Collect and `POST /api/collect` returns 403.
- Favorites live in the visitor’s `localStorage` and do not need a git push.
- Worlds are stored in `data/worlds.json`. Missing fields render as `No value`. Card images are hotlinked from `impeccable.style`.

## Capabilities and Constraints

- Search name, form, spark, and system text; filter by `wellTier` or favorites; open a world; copy the direction prompt; favorite/unfavorite.
- Local-only Collect / Collect more. Production never calls the roll API.
- The catalog does not invent missing world fields, official status, completeness, or production collect.
- This restyle request: do not move existing elements and do not rewrite existing copy. Layout and copy may change in later work.
- Undecided: no product-specific accessibility standard was set.

## Brand Commitments

- Product name: Impeccable Worlds.
- Voice already in the UI: factual, incomplete-by-design, not official.
- Binding visual direction for this build, user-pinned, do not re-roll: Riley Moire Gallery (`design-canon-riley-moire-gallery`).
- Incumbent layout, copy, and card images are in-bounds to keep for this pass; do not treat the current look as an anti-reference.

## Evidence on Hand

- Catalog data: `data/worlds.json` (world names, forms, sparks, systems, tiers, card URLs from Impeccable).
- Card images: hotlinked from `impeccable.style` (`cardBoard`, `cardHero`).
- Default GitHub URL: `https://github.com/alonsarias/impeccable-worlds` (overridable via `VITE_GITHUB_REPO_URL`).
- No official testimonials, completeness claims, or first-party Impeccable endorsement exist. Future work must not fabricate them.

## Product Principles

- Choose by eye, leave with a prompt.
- Never invent a value the index does not have.
- Public visitors browse; only a local machine collects.
- Stay visibly unofficial and incomplete.
- This pass restyles in place: same regions, same words.
