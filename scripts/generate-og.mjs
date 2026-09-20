/**
 * Build public/og.png: four catalog worlds chosen for the share card.
 * Angura Theatre Poster · Antialiased Racing League · Alphabet Storm · CRT Arcade Pixel Glow.
 * Hung faces are each world's landing hero crop (cardHero), not the styleguide board.
 * Raster is 2400×1260 (1200×630 at 2×) so the salon stays sharp on retina unfurls.
 *
 * Run: node scripts/generate-og.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const srcDir = join(publicDir, "og-src");

const HANG_IDS = [
  "posters-covers-sleeves-angura-theatre-poster",
  "digital-design-canon-antialiased-racing-league",
  "dream-surreal-impossible-worlds-alphabet-storm",
  "medium-native-crt-arcade-pixel-glow",
];

const SCALE = 2;
const WIDTH = 1200 * SCALE;
const HEIGHT = 630 * SCALE;
const BORDER = 3 * SCALE;
const RAIL = 80 * SCALE;
const GAP = 24 * SCALE;
const INSET = 1 * SCALE;
const TILE_W = 440 * SCALE;
const TILE_H = Math.round((440 * 1152) / 2048) * SCALE;

const store = JSON.parse(readFileSync(join(root, "data/worlds.json"), "utf8"));
mkdirSync(srcDir, { recursive: true });

const ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

for (const id of HANG_IDS) {
  const world = store.worlds[id];
  if (!world?.cardHero) {
    throw new Error(`OG hang is missing a landing hero: ${id}`);
  }
  const dest = join(srcDir, `${id}.webp`);
  const res = await fetch(world.cardHero, { headers: { "user-agent": ua } });
  if (!res.ok) {
    throw new Error(`Could not fetch ${world.cardHero}: ${res.status}`);
  }
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`og-src/${id}.webp`);
}

const tileInnerW = TILE_W - INSET * 2;
const tileInnerH = TILE_H - INSET * 2;
const tiles = await Promise.all(
  HANG_IDS.map((id) =>
    sharp(join(srcDir, `${id}.webp`), { failOn: "none" })
      .resize(tileInnerW, tileInnerH, {
        fit: "cover",
        position: "centre",
        kernel: sharp.kernel.lanczos3,
        fastShrinkOnLoad: false,
      })
      .png()
      .toBuffer(),
  ),
);

const innerW = WIDTH - BORDER * 2;
const salonW = TILE_W * 2 + GAP;
const salonX = BORDER + Math.round((innerW - salonW) / 2);
const salonY = BORDER + 12 * SCALE;
const railY = HEIGHT - BORDER - RAIL;
const markPath = pathToFileURL(join(publicDir, "favicon.svg")).href;
const mark = await sharp(join(publicDir, "favicon.svg"))
  .resize(36 * SCALE, 36 * SCALE)
  .png()
  .toBuffer();

const chrome = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${BORDER}" y="${railY}" width="${innerW}" height="${RAIL}" fill="#ffffff"/>
  <rect x="${BORDER}" y="${railY}" width="${innerW}" height="${2 * SCALE}" fill="#000000"/>
  <text x="${79 * SCALE}" y="${railY + 50 * SCALE}" fill="#000000" font-family="Helvetica, Arial, sans-serif" font-size="${36 * SCALE}" font-weight="700" letter-spacing="${-1.2 * SCALE}">Impeccable Worlds</text>
  <text x="${WIDTH - BORDER - 28 * SCALE}" y="${railY + 48 * SCALE}" fill="#000000" font-family="Helvetica, Arial, sans-serif" font-size="${20 * SCALE}" text-anchor="end">Choose a direction by eye. Copy the prompt.</text>
  <rect x="${salonX}" y="${salonY}" width="${TILE_W}" height="${TILE_H}" fill="none" stroke="#000000" stroke-width="${SCALE}"/>
  <rect x="${salonX + TILE_W + GAP}" y="${salonY}" width="${TILE_W}" height="${TILE_H}" fill="none" stroke="#000000" stroke-width="${SCALE}"/>
  <rect x="${salonX}" y="${salonY + TILE_H + GAP}" width="${TILE_W}" height="${TILE_H}" fill="none" stroke="#000000" stroke-width="${SCALE}"/>
  <rect x="${salonX + TILE_W + GAP}" y="${salonY + TILE_H + GAP}" width="${TILE_W}" height="${TILE_H}" fill="none" stroke="#000000" stroke-width="${SCALE}"/>
  <rect x="${1.5 * SCALE}" y="${1.5 * SCALE}" width="${WIDTH - 3 * SCALE}" height="${HEIGHT - 3 * SCALE}" fill="none" stroke="#000000" stroke-width="${3 * SCALE}"/>
</svg>
`;

const composites = [
  { input: tiles[0], left: salonX + INSET, top: salonY + INSET },
  { input: tiles[1], left: salonX + TILE_W + GAP + INSET, top: salonY + INSET },
  { input: tiles[2], left: salonX + INSET, top: salonY + TILE_H + GAP + INSET },
  {
    input: tiles[3],
    left: salonX + TILE_W + GAP + INSET,
    top: salonY + TILE_H + GAP + INSET,
  },
];

const png = await sharp({
  create: {
    width: WIDTH,
    height: HEIGHT,
    channels: 3,
    background: "#ffffff",
  },
})
  .composite([
    ...composites,
    { input: Buffer.from(chrome), left: 0, top: 0 },
    { input: mark, left: 31 * SCALE, top: railY + 22 * SCALE },
  ])
  .flatten({ background: "#ffffff" })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

writeFileSync(join(publicDir, "og.png"), png);
console.log(`public/og.png ${WIDTH}×${HEIGHT} ${png.length} bytes`);
console.log(`Source mark: ${markPath}`);
