---
name: Impeccable Worlds
description: A white gallery of design-world canvases, contrasted by wave frequency in matte black and gallery white.
colors:
  matte-black: "#000000"
  gallery-white: "#ffffff"
  gallery-veil: "rgb(255 255 255 / 0.86)"
typography:
  display:
    fontFamily: "Host Grotesk, Helvetica, Arial, sans-serif"
    fontSize: "clamp(3.25rem, 5.4vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.86
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Host Grotesk, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.2rem)"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Host Grotesk, Helvetica, Arial, sans-serif"
    fontSize: "0.98rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Host Grotesk, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Host Grotesk, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0.04em"
rounded:
  none: "0px"
spacing:
  field: "4px"
  inline: "8px"
  control: "12px"
  hang: "14px"
  room: "18px"
  split: "36px"
components:
  button-primary:
    backgroundColor: "{colors.matte-black}"
    textColor: "{colors.gallery-white}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.matte-black}"
    textColor: "{colors.gallery-white}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.gallery-white}"
    textColor: "{colors.matte-black}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.gallery-white}"
    textColor: "{colors.matte-black}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  button-solid:
    backgroundColor: "{colors.matte-black}"
    textColor: "{colors.gallery-white}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  button-disabled:
    backgroundColor: "{colors.gallery-white}"
    textColor: "{colors.matte-black}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  text-link:
    backgroundColor: "transparent"
    textColor: "{colors.matte-black}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 6px"
    height: "44px"
  text-link-hover:
    backgroundColor: "{colors.matte-black}"
    textColor: "{colors.gallery-white}"
    rounded: "{rounded.none}"
    padding: "0 6px"
    height: "44px"
  field:
    backgroundColor: "{colors.gallery-white}"
    textColor: "{colors.matte-black}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  field-focus:
    backgroundColor: "{colors.gallery-white}"
    textColor: "{colors.matte-black}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  card:
    backgroundColor: "{colors.gallery-white}"
    textColor: "{colors.matte-black}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "12px 12px 0"
  mark:
    backgroundColor: "{colors.gallery-white}"
    textColor: "{colors.matte-black}"
    rounded: "{rounded.none}"
    size: "44px"
  mark-on:
    backgroundColor: "{colors.matte-black}"
    textColor: "{colors.gallery-white}"
    rounded: "{rounded.none}"
    size: "44px"
---

# Design System: Impeccable Worlds

## Overview

**Creative North Star: "Riley Moire Gallery"**

The catalog is a white gallery hung with canvases. Visitors choose a direction by changing viewing distance. Matte black and gallery white are the only inks. Contrast is the interval of an SVG wave — far, mid, near, accent — never a gray. Host Grotesk is self-hosted and sits in the white margin. One caption per canvas names the world and its tier.

The room splits on a wide viewport. The display title and lede occupy the left margin. Search, filters, the results caption, and the hung card images occupy the right. A full-bleed wall wave sits behind the room and is hidden when the visitor prefers reduced motion. Opening a canvas is the near reading. Copy direction prompt is the black wave action. Fetch new directions is an outline button.

Card images are hotlinked from impeccable.style, with an optional blob URL only as a load fallback. This build did not generate shipping rasters. Critique references under the quality bar are not page assets.

**Key Characteristics:**

- Two inks only: matte black and gallery white.
- Contrast is wave frequency, retuned by scroll, intersection, and devicePixelRatio.
- Split gallery: title and lede in the left white margin; controls and canvases on the right.
- Square corners, hairline rules, no shadows.
- Card caption is the name plus the tier, unboxed.
- Favorite and compare on-states are wave-filled marks.

## Colors

The palette is two opaque inks. Every role token in the stylesheet — ink, line, muted, surface, graphic, atmosphere, interaction, unknown — resolves to one of them.

### Primary
- **Matte Black** (`{colors.matte-black}`): Type, rules, the wall wave, focus rings, selection, the caret, scrollbars, and the filled primary action. On a primary button the wave is drawn in gallery white over this ground.

### Neutral
- **Gallery White** (`{colors.gallery-white}`): The page, the left margin, hung cards, fields, outline buttons, and the dialog ground. Selection inverts to matte black with white type.
- **Gallery Veil** (`{colors.gallery-veil}`): The How it works backdrop only. White at partial opacity so the wall can show through. It is not a third hue.

### Named Rules
**The Two Inks Rule.** Interface color is matte black or gallery white. Tier names do not introduce a third color. Muted copy is the same black as display type, set smaller.

**The Frequency Rule.** Hierarchy that would otherwise be gray is a change of wave interval: wall (widest), far, mid, near, then accent (tightest). A focused field, a checked Favorites only control, a hovered outline button, and a primary action each tighten the interval.

## Typography

**Display Font:** Host Grotesk (self-hosted woff2, weights 400, 500, and 700; Helvetica, Arial, sans-serif only if the file fails)
**Body Font:** Host Grotesk
**Label/Mono Font:** Host Grotesk for labels. `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` appears only inside How it works code blocks.

**Character:** One grotesque. Display is heavy and tightly tracked. Everything else is medium or regular, still slightly tight. Uppercase labels carry the small tracking.

### Hierarchy
- **Display** (700, `clamp(3.25rem, 5.4vw, 6rem)`, line-height 0.86, tracking -0.04em): The catalog title in the left margin, capped at 8ch from 960px up. Below 960px the size is `clamp(2.6rem, 14vw, 4.2rem)` and the measure cap drops.
- **Headline** (500, `clamp(1.6rem, 3vw, 2.2rem)`, tracking -0.03em): The open world and the compare heading. Compare column names step down to `clamp(1.25rem, 2vw, 1.7rem)`.
- **Title** (500, 0.98rem, tracking -0.02em): The hung card name. Similar-card names are 0.92rem. “More like this” is 1.15rem.
- **Body** (400, inherited 1rem, line-height 1.45): The lede, at 36ch in the margin and 52ch elsewhere. Legal and coverage notes sit at 0.8–0.82rem and may run to 72ch. Counts use tabular numerals.
- **Label** (400, 0.75rem, tracking 0.04em, uppercase): Search, Direction type, Sort, Layout. The tier caption is 0.72rem, tracking 0.06em, uppercase, and sits on the same line as the name. Fact labels match that caption size at 0.06em.

### Named Rules
**The One Face Rule.** Host Grotesk is the voice. Do not introduce a second text family for display, labels, or captions. Monospace stays inside code samples.

**The Caption Rule.** A card’s visible label is the world name plus its tier, in one line, with no box around the tier. The detail title uses the same pairing.

## Layout

From 960px the room is a two-column gallery. The left column is `minmax(17rem, 24rem)` and sticky, with a 1px right rule. The right column hangs the controls, the results caption, and the cards. Column gap is 36px. The page width is `min(1480px, calc(100% - 48px))`. The GitHub control sits on a full-width bottom rule above both columns. Legal copy spans both columns under a top rule.

Below 960px the room stacks. The title can run past 8ch. Below 721px, search and filters collapse into a ruled summary, controls go full width, comfortable cards become one column, and dense cards become two. List rows keep a fixed thumb.

Comfortable hang is three columns from 960px (`minmax(280px, 1fr)` below that). Dense hang is four columns from 960px (`minmax(200px, 1fr)` below that, two columns under 721px). List is one column. Card grid gap is 14px, 8px in list.

The open world and compare are full-viewport white sheets on the same page width, `min(1180px, calc(100% - 32px))` inside the sheet. Facts split to two columns from 800px. Previews do the same when a second image exists.

Rhythm that repeats: 4px between a label and its field, 8px inside action rows, 12px between controls and as the card inset, 14px under the control rule and between cards, 18px in the room stack, 36px between the margin and the hang. Hit targets for buttons, fields, the GitHub link, and card marks are 44px.

## Elevation & Depth

The system is flat. `--shadow` is `none`, and no surface uses a box shadow. Depth is a rule, a sheet, or a change in wave frequency. Sticky white bars (the control stack, the detail head, the detail actions) cover the wall by being opaque white. Dialogs and the image viewer are white sheets. How it works lays the gallery veil over the page. The compare tray is a fixed white bar with a top rule.

The signature motion is Vantage. Scroll and an IntersectionObserver retune each card among far, mid, and near. A card whose center is within 0.22 of the viewport midpoint is near; within 0.55 is mid; otherwise far, including cards outside the viewport. Pattern tiles are divided by `devicePixelRatio` capped at 3. Base tiles before that division: far 36×56 with two columns, mid 18×32 with three, near 9×16 with three, accent 5×10 with three, wall 48×72 with three. Stroke width is `max(0.6, 1 / dpr)`. The wall pattern shifts with scroll at 0.35× scroll position unless reduced motion is set, in which case the wall is not shown.

State motion, when motion is allowed, uses `cubic-bezier(0.22, 1, 0.36, 1)`: 180ms for mark reveal and for sheet and toast entrance, 160ms for mark color, wave-ground color, and disclosure chevrons. Sheets fade in. The toast also rises 4px.

### Named Rules
**The Flat Wall Rule.** Do not add shadows. A nearer reading is a tighter wave, a 1px rule, or a white sheet, not a lift.

## Shapes

Corners are square (`{rounded.none}`) on buttons, fields, cards, dialogs, trays, and marks. Rules are 1px solid matte black: the mast, the control underline, the margin’s right edge, preview frames, the detail action bar, the compare tray. Empty states and the local collect banner use a 1px dashed rule. Disabled buttons switch to a dashed border on a white ground. Hung cards have no border; the image sits in a 12px white margin with a 64px wave strip above it. Card marks are square pads, 32px at rest and 40px when wave-filled, inside a 44px hit target.

## Components

### Buttons
- **Shape:** Square corners.
- **Primary:** Matte black ground, gallery-white type, 1px black border, 44px tall, padding 0 12px. A repeating white wave at 10×14 covers the ground. Copy direction prompt uses this, in the open world and in compare. Open compare in the tray uses the same treatment. Hover and focus-visible tighten the wave to 6×8. The prompt button’s minimum width is 13rem.
- **Outline:** White ground, black type, 1px black border, same padding and height. Fetch new directions uses this. Hover, focus-visible, and the pressed on-state keep the white ground and add a black wave at 12×16. Coverage option chips are this button.
- **Solid:** The unmarked `.btn` is matte black with white type and no wave. Retry, Clear search and filters, Undo, and Back to catalog use it.
- **Disabled:** White ground, black type, dashed border, full opacity.
- **Text link:** Transparent, inherited type, underline offset 0.18em, 44px tall. Hover fills matte black and drops the underline. How it works uses this.

### Cards / Containers
- **Corner Style:** Square.
- **Background:** Gallery white. No border on the hung card.
- **Shadow Strategy:** None. See Elevation.
- **Internal Padding:** 12px on the sides and top; the caption block is 10px 12px 12px.
- **Wave strip:** A 64px band above the image shows far, mid, or near. The image is the hotlinked card, or “No value” if it fails.
- **Caption:** Name at title size, tier inline at label size, uppercase, no chip border.

### Marks
Favorite (star) and compare (two offset rectangles) are 16px strokes in current color. At rest the pad behind them is white with a 1px black border. On, the pad is 40px, matte black, filled with a white wave at 10×14, and the mark turns white. They stay visible on the card. In the detail sheet the same on-state wave arrives through the outline button, and the label remains beside the mark until the narrow layout hides the words.

### Inputs / Fields
- **Style:** 1px solid black, white ground, 44px, square. Placeholder text is black at full opacity. Labels above the field are uppercase.
- **Focus:** 2px solid black outline, 2px offset, on buttons, fields, summaries, and links. Focused search and selects also tile a black wave at 14×20. Checked Favorites only tiles a tighter black wave at 8×12. Card marks use the same 2px ring with a -4px offset.
- **Error / Disabled:** Collect errors use a solid black rule. Empty and loading states use the dashed frame, left-aligned, padding 28px (16px under 721px).

### Navigation
The mast is one GitHub mark, 22px in a 44px target, aligned to the end of a bottom rule. Hover inverts to a black square with a white mark. The open world steps with previous, next, and close controls at 44px. The compare tray is a fixed white bar; a focused slot takes a 1px black outline 2px outside the frame.

## Do's and Don'ts

### Do:
- **Do** keep the palette to matte black `#000000` and gallery white `#ffffff`, plus the gallery veil only as a dialog scrim.
- **Do** make emphasis a tighter SVG wave: wall, far, mid, near, accent.
- **Do** set the catalog title in self-hosted Host Grotesk at display weight 700.
- **Do** hang the name and tier as one unboxed caption.
- **Do** give Copy direction prompt the black wave fill, and Fetch new directions the outline button.
- **Do** fill favorite and compare on-states with the accent wave.
- **Do** treat card images as hotlinked impeccable.style assets, with a blob URL only as an optional load fallback.

### Don't:
- **Don't** introduce gray, tinted tiers, or a second accent.
- **Don't** add box shadows or rounded corners.
- **Don't** box the tier into a chip.
- **Don't** put the black wave fill on Fetch new directions.
- **Don't** generate or invent provenance for card images. Quality-bar PNGs are critique references, not shipping rasters.
