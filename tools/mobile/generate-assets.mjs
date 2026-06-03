/**
 * Builds resources/icon.png and resources/splash.png from public/pwa-icon.svg,
 * then runs @capacitor/assets to generate Android and iOS launcher icons.
 */
import { execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const resourcesDir = path.join(root, "resources");
const iconSvg = path.join(root, "public", "pwa-icon.svg");
const iconPng = path.join(resourcesDir, "icon.png");
const splashPng = path.join(resourcesDir, "splash.png");

const background = "#1a1a2e";

await mkdir(resourcesDir, { recursive: true });

const iconBuffer = await sharp(iconSvg)
  .resize(1024, 1024, { fit: "contain", background })
  .png()
  .toBuffer();

await sharp(iconBuffer).toFile(iconPng);

await sharp({
  create: {
    width: 2732,
    height: 2732,
    channels: 4,
    background,
  },
})
  .composite([{ input: iconBuffer, gravity: "center" }])
  .png()
  .toFile(splashPng);

console.log("Wrote resources/icon.png and resources/splash.png");

execSync(
  'npx @capacitor/assets generate --iconBackgroundColor "#1a1a2e" --splashBackgroundColor "#1a1a2e" --assetPath resources',
  { cwd: root, stdio: "inherit" }
);

console.log("Native launcher icons and splash screens updated.");
