---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/index.css","src/components/WorldCard.tsx","src/components/WaveField.tsx","src/components/WorldGrid.tsx","src/components/DetailDrawer.tsx","src/components/ComparePanel.tsx","src/components/CompareTray.tsx","src/components/CoverageStrip.tsx","src/components/EmptyState.tsx","src/components/ResultsBar.tsx","src/components/HowItWorksDialog.tsx","src/components/MoreLikeThis.tsx"]
---

# Catalog

- Mode: Operate
- Audience: UX/UI designers, frontend developers, design engineers, programmers choosing a visual direction
- Job: browse the index, filter, open a world, copy the direction prompt
- Constraints: redesign the room from scratch; keep every existing word; do not treat the incumbent look as an anti-reference; keep card images and every control; do not invent official status or completeness
- Direction: user-pinned Riley Moire Gallery (`design-canon-riley-moire-gallery`), code-led
- Memorable moment: Vantage — scroll and approach retune wave frequency so a still canvas seems to tip
- Unresolved: no product-specific accessibility standard

## Direction contract

THESIS: The index is a white gallery hung with the catalog’s canvases. Visitors choose a direction by changing viewing distance, not by reading a dashboard laid over cards.

OWN-WORLD: Matte black and gallery white only. Contrast is line frequency — wide, medium, fine, accent — never gray. Host Grotesk sits in white margins, one caption per canvas. Controls are ruled fields; the tightest interval marks whatever wants attention.

STORY: A designer reads the room, sets search and filters as a change of interval, then approaches a canvas. Opening it is the near reading. Copy direction prompt is the black wave action. Favorite and compare are frequencies, not badges.

FIRST VIEWPORT: Full-bleed white, split by one vertical rule. Left: “Impeccable Worlds” at display scale, the lede and How it works in the margin, GitHub on the top rule. Right: a control rule (Search, Direction type, Sort, Layout, Favorites only) with a wave endcap on the focused field, the results caption, then three hung canvases — real card image, white margin, name and tier as the single caption. Opening a canvas is the primary act; the copy action sits at the near reading.

Signature interaction: Vantage. Scroll position and IntersectionObserver retune SVG wave frequency against devicePixelRatio. Far canvases breathe wide; a canvas at center, or a control with focus, tightens toward the accent. The wall flexes; the paintings hold still.

FORM: Riley Moire Gallery, catalog id `design-canon-riley-moire-gallery`. User-pinned. No roll seed.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
