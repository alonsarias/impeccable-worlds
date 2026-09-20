/**
 * Rasterize public/favicon.svg into PNG / ICO.
 * Same mark at every size — do not invent a second logo.
 * Share card (public/og.png) is the same mark on scripts/og-card.html.
 *
 * Run: npm install --no-save sharp && node scripts/generate-icons.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const svgPath = join(publicDir, "favicon.svg");

function icoFromPngs(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  let offset = 6 + 16 * count;
  const dirs = [];
  for (const entry of entries) {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(entry.width >= 256 ? 0 : entry.width, 0);
    dir.writeUInt8(entry.height >= 256 ? 0 : entry.height, 1);
    dir.writeUInt8(0, 2);
    dir.writeUInt8(0, 3);
    dir.writeUInt16LE(1, 4);
    dir.writeUInt16LE(32, 6);
    dir.writeUInt32LE(entry.png.length, 8);
    dir.writeUInt32LE(offset, 12);
    dirs.push(dir);
    offset += entry.png.length;
  }

  return Buffer.concat([header, ...dirs, ...entries.map((entry) => entry.png)]);
}

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    throw new Error(
      "sharp is required to rasterize icons. Run: npm install --no-save sharp && node scripts/generate-icons.mjs",
    );
  }
}

const sharp = await loadSharp();
const svg = readFileSync(svgPath);

async function writePng(size, dest) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(join(publicDir, dest));
}

await writePng(32, "favicon-32x32.png");
await writePng(180, "apple-touch-icon.png");

const png16 = await sharp(svg, { density: 384 })
  .resize(16, 16)
  .png({ compressionLevel: 9 })
  .toBuffer();
const png32 = await sharp(svg, { density: 384 })
  .resize(32, 32)
  .png({ compressionLevel: 9 })
  .toBuffer();
writeFileSync(
  join(publicDir, "favicon.ico"),
  icoFromPngs([
    { width: 16, height: 16, png: png16 },
    { width: 32, height: 32, png: png32 },
  ]),
);

console.log(
  "Wrote public/favicon-32x32.png, apple-touch-icon.png, favicon.ico",
);
console.log(`Source: ${pathToFileURL(svgPath).href}`);
