const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const User = require('../backend/models/User');

const OUTPUT_DIR = path.resolve(__dirname, '../../generated_maps');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Simple Grid Layout Generator
function generateHtml(hallName, seats) {
    // Sort seats
    const sortedSeatKeys = Object.keys(seats).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
    });

    const rows = [];
    let currentRow = [];
    const itemsPerRow = 4; // Configurable

    sortedSeatKeys.forEach((key, idx) => {
        currentRow.push({ id: key, ...seats[key] });
        if (currentRow.length >= itemsPerRow || idx === sortedSeatKeys.length - 1) {
            rows.push(currentRow);
            currentRow = [];
        }
    });

    // Create simple HTML
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${hallName}</title>
        <style>
            body { 
                font-family: 'Segoe UI', sans-serif; 
                background: #000; 
                color: #fff;
                margin: 0;
                padding: 40px;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
            }
            h1 { color: #facc15; margin-bottom: 40px; font-size: 48px; text-transform: uppercase; }
            .container {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .row {
                display: flex;
                gap: 20px;
                justify-content: center;
            }
            .seat-card {
                background: #18181b;
                border: 1px solid #333;
                border-radius: 12px;
                width: 220px;
                height: 140px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 16px;
                box-sizing: border-box;
                position: relative;
            }
            .seat-card.occupied {
                border-color: #facc15;
                background: linear-gradient(135deg, #18181b 0%, #362c00 100%);
            }
            .seat-number {
                font-size: 24px;
                font-weight: bold;
                color: #facc15;
            }
            .team-name {
                font-size: 16px;
                font-weight: 600;
                color: #fff;
                word-wrap: break-word;
                line-height: 1.2;
            }
            .track {
                font-size: 12px;
                color: #a1a1aa;
                align-self: flex-end;
                background: rgba(255,255,255,0.1);
                padding: 2px 6px;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <h1>${hallName}</h1>
        <div class="container">
            ${rows.map(row => `
                <div class="row">
                    ${row.map((s, idx) => {
        const spacer = (idx === 2) ? '<div style="width: 80px;"></div>' : '';
        return spacer + `
                        <div class="seat-card occupied">
                            <div class="seat-number">${s.id}</div>
                            <div class="team-name">${s.team}</div>
                            <div class="track">${s.track || 'CR'}</div>
                        </div>
                        `;
    }).join('')}
                </div>
            `).join('')}
        </div>
    </body>
    </html>
    `;
}

async function generateMaps() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const users = await User.find({ hall: { $exists: true, $ne: null } });

        // Group data
        const halls = {};
        users.forEach(u => {
            const hallName = u.hall || 'Unknown Hall';
            if (!halls[hallName]) halls[hallName] = {};
            const seat = u.seatNumber || 'Unassigned';
            // Simple conflict override - last one wins
            if (!halls[hallName][seat]) {
                halls[hallName][seat] = {
                    team: u.teamId || 'No Team',
                    track: u.track
                };
            }
        });

        const browser = await puppeteer.launch();

        for (const [hallName, seats] of Object.entries(halls)) {
            console.log(`Generating map for ${hallName}...`);
            const htmlContent = generateHtml(hallName, seats);

            const page = await browser.newPage();
            await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
            await page.setContent(htmlContent);

            // Wait a moment for layout
            // await new Promise(r => setTimeout(r, 1000));

            const safeName = hallName.replace(/[^a-zA-Z0-9]/g, "_");
            await page.screenshot({
                path: path.join(OUTPUT_DIR, `Map_${safeName}.png`),
                fullPage: true
            });
            await page.close();
        }

        await browser.close();
        console.log(`Maps generated in ${OUTPUT_DIR}`);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

generateMaps();
