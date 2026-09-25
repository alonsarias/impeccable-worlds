/**
 * Rasterize scripts/og-card.html to public/og.png (1200×630).
 * Home share card: wordmark and wave wall. Not a world hero.
 *
 * Run: npm run og
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const card = join(root, "scripts/og-card.html");
const out = join(root, "public/og.png");

const chromeCandidates = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

const chrome = chromeCandidates.find((path) => existsSync(path));
if (!chrome) {
  throw new Error(
    "Google Chrome is required to rasterize the share card. Install Chrome and rerun npm run og.",
  );
}

execFileSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1200,630",
    "--default-background-color=FFFFFFFF",
    "--virtual-time-budget=8000",
    `--screenshot=${out}`,
    pathToFileURL(card).href,
  ],
  { stdio: "inherit" },
);

console.log(`public/og.png`);
