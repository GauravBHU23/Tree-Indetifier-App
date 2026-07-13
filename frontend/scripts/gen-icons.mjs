// One-off: rasterize public/app-icon.svg into the PNG icons the PWA manifest needs.
// Run with: node scripts/gen-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public", "app-icon.svg"));

const outputs = [
  { file: "pwa-192x192.png", size: 192 },
  { file: "pwa-512x512.png", size: 512 },
  // Maskable: same art (icon already has safe padding via rounded square bg).
  { file: "pwa-maskable-512x512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of outputs) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(join(root, "public", file));
  console.log(`✓ ${file} (${size}x${size})`);
}
console.log("Done.");
