/**
 * Build public/og.png: four catalog worlds chosen for the share card.
 * Gameboy Four Shade Field · Art Paul Magazine Program · Crouwel Grid Specimen · Midnight Transit Diagram.
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
  "digital-design-canon-gameboy-four-shade-field",
  "brand-identity-canon-art-paul-magazine-program",
  "crouwel-grid-specimen",
  "wayfinding-cartography-signage-midnight-transit-diagram",
];

const WIDTH = 1200;
const HEIGHT = 630;
const BORDER = 3;
const RAIL = 80;
const GAP = 24;
const TILE_W = 440;
const TILE_H = Math.round((TILE_W * 1152) / 2048);

const store = JSON.parse(readFileSync(join(root, "data/worlds.json"), "utf8"));
mkdirSync(srcDir, { recursive: true });

const ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

for (const id of HANG_IDS) {
  const world = store.worlds[id];
  if (!world?.cardBoard) {
    throw new Error(`OG hang is missing from the catalog: ${id}`);
  }
  const dest = join(srcDir, `${id}.webp`);
  const res = await fetch(world.cardBoard, { headers: { "user-agent": ua } });
  if (!res.ok) {
    throw new Error(`Could not fetch ${world.cardBoard}: ${res.status}`);
  }
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`og-src/${id}.webp`);
}

const tiles = await Promise.all(
  HANG_IDS.map((id) =>
    sharp(join(srcDir, `${id}.webp`))
      .resize(TILE_W - 2, TILE_H - 2, { fit: "fill" })
      .png()
      .toBuffer(),
  ),
);

const innerW = WIDTH - BORDER * 2;
const salonW = TILE_W * 2 + GAP;
const salonH = TILE_H * 2 + GAP;
const salonX = BORDER + Math.round((innerW - salonW) / 2);
const salonY = BORDER + 12;
const railY = HEIGHT - BORDER - RAIL;
const markPath = pathToFileURL(join(publicDir, "favicon.svg")).href;
const mark = await sharp(join(publicDir, "favicon.svg"))
  .resize(36, 36)
  .png()
  .toBuffer();

const chrome = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${BORDER}" y="${railY}" width="${innerW}" height="${RAIL}" fill="#ffffff"/>
  <rect x="${BORDER}" y="${railY}" width="${innerW}" height="2" fill="#000000"/>
  <text x="79" y="${railY + 50}" fill="#000000" font-family="Helvetica, Arial, sans-serif" font-size="36" font-weight="700" letter-spacing="-1.2">Impeccable Worlds</text>
  <text x="${WIDTH - BORDER - 28}" y="${railY + 48}" fill="#000000" font-family="Helvetica, Arial, sans-serif" font-size="20" text-anchor="end">Choose a direction by eye. Copy the prompt.</text>
  <rect x="${salonX}" y="${salonY}" width="${TILE_W}" height="${TILE_H}" fill="none" stroke="#000000" stroke-width="1"/>
  <rect x="${salonX + TILE_W + GAP}" y="${salonY}" width="${TILE_W}" height="${TILE_H}" fill="none" stroke="#000000" stroke-width="1"/>
  <rect x="${salonX}" y="${salonY + TILE_H + GAP}" width="${TILE_W}" height="${TILE_H}" fill="none" stroke="#000000" stroke-width="1"/>
  <rect x="${salonX + TILE_W + GAP}" y="${salonY + TILE_H + GAP}" width="${TILE_W}" height="${TILE_H}" fill="none" stroke="#000000" stroke-width="1"/>
  <rect x="1.5" y="1.5" width="${WIDTH - 3}" height="${HEIGHT - 3}" fill="none" stroke="#000000" stroke-width="3"/>
</svg>
`;

const composites = [
  { input: tiles[0], left: salonX + 1, top: salonY + 1 },
  { input: tiles[1], left: salonX + TILE_W + GAP + 1, top: salonY + 1 },
  { input: tiles[2], left: salonX + 1, top: salonY + TILE_H + GAP + 1 },
  {
    input: tiles[3],
    left: salonX + TILE_W + GAP + 1,
    top: salonY + TILE_H + GAP + 1,
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
    { input: mark, left: 31, top: railY + 22 },
  ])
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

writeFileSync(join(publicDir, "og.png"), png);
console.log(`public/og.png ${WIDTH}×${HEIGHT} ${png.length} bytes`);
console.log(`Source mark: ${markPath}`);
