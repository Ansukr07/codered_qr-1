const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../generated_maps');
// Allow port configuration
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}/admin/seating-export`;

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

const tracks = ['CR', 'CRU'];

async function run() {
    console.log(`Connecting to ${BASE_URL}...`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setViewport({ width: 1400, height: 800, deviceScaleFactor: 2 });

    for (const track of tracks) {
        console.log(`Generating maps for track: ${track}`);
        try {
            await page.goto(`${BASE_URL}?track=${track}`, { waitUntil: 'networkidle0', timeout: 30000 });
        } catch (e) {
            console.error(`Failed to load ${track}: ${e.message}`);
            // Retry once
            console.log("Retrying...");
            await page.goto(`${BASE_URL}?track=${track}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        }

        // Wait for rendering
        await new Promise(r => setTimeout(r, 3000));

        // Generate 3 partial views
        // Left: 0-600
        await page.screenshot({
            path: path.join(OUTPUT_DIR, `${track}_1_left.png`),
            clip: { x: 0, y: 0, width: 600, height: 800 }
        });

        // Center: 400-1000
        await page.screenshot({
            path: path.join(OUTPUT_DIR, `${track}_2_center.png`),
            clip: { x: 400, y: 0, width: 600, height: 800 }
        });

        // Right: 800-1400
        await page.screenshot({
            path: path.join(OUTPUT_DIR, `${track}_3_right.png`),
            clip: { x: 800, y: 0, width: 600, height: 800 }
        });

        console.log(`Saved images for ${track}`);
    }

    await browser.close();
    console.log(`Done. Images saved to ${OUTPUT_DIR}`);
}

run().catch(console.error);
