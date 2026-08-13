import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "linkedin-assets");
const url = process.env.TP_URL || "https://tech-polygon.vercel.app";

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  recordVideo: {
    dir: outDir,
    size: { width: 1920, height: 1080 },
  },
});

const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(2800);

// Best LinkedIn still: full hero composition
await page.screenshot({
  path: path.join(outDir, "linkedin-hero-1920x1080.png"),
  type: "png",
});

// Link-preview crop ratio ~1.91:1 (1200x627)
await page.setViewportSize({ width: 1200, height: 627 });
await page.waitForTimeout(900);
await page.screenshot({
  path: path.join(outDir, "linkedin-preview-1200x627.png"),
  type: "png",
});

// Square post
await page.setViewportSize({ width: 1080, height: 1080 });
await page.waitForTimeout(900);
await page.screenshot({
  path: path.join(outDir, "linkedin-square-1080.png"),
  type: "png",
});

// Scroll into mesh for a second cinematic beat, then back
await page.setViewportSize({ width: 1920, height: 1080 });
await page.waitForTimeout(600);
await page.evaluate(() =>
  document.getElementById("mesh")?.scrollIntoView({ behavior: "smooth" }),
);
await page.waitForTimeout(3200);
await page.screenshot({
  path: path.join(outDir, "linkedin-mesh-1920x1080.png"),
  type: "png",
});
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
await page.waitForTimeout(2200);

await context.close();
await browser.close();

console.log(`LinkedIn assets written to ${outDir}`);
