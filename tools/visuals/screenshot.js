import fs from 'fs/promises';
import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const url = process.argv[2] || process.env.SCREENSHOT_URL || 'http://localhost:5173';
const outDir = process.env.SCREENSHOT_DIR || 'screenshots';

const viewports = [
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2 },
  { name: 'tablet', width: 768, height: 1024, deviceScaleFactor: 1 },
  { name: 'desktop', width: 1366, height: 768, deviceScaleFactor: 1 },
];

(async () => {
  try {
    await fs.mkdir(outDir, { recursive: true });
    const browser = await chromium.launch();

    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor });
      const page = await context.newPage();
      console.log(`Navigating to ${url} for ${vp.name}...`);
      await page.goto(url, { waitUntil: 'networkidle' });
      // allow animations to settle
      await page.waitForTimeout(600);
      const file = `${outDir}/${vp.name}.png`;
      await page.screenshot({ path: file, fullPage: true });
      console.log(`Saved ${file}`);
      await context.close();
    }

    await browser.close();
    console.log('Screenshots complete.');
  } catch (err) {
    console.error('Screenshot script failed:', err);
    process.exit(1);
  }
})();
