/**
 * Script to verify all fixes are in place
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env.local first, then .env as fallback
const envLocalPath = path.join(__dirname, '../.env.local');
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
    console.log('Loaded .env.local');
} else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Loaded .env');
} else {
    dotenv.config();
}

const User = require('../models/User');

async function verifyFixes() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Verify Bytewave
        console.log('='.repeat(80));
        console.log('VERIFYING BYTEWAVE TEAM');
        console.log('='.repeat(80));
        console.log('');

        const bytewaveUsers = await User.find({
            teamId: { $regex: /bytewave/i }
        }).sort({ qrCode: 1 });

        console.log(`Found ${bytewaveUsers.length} user(s) for Bytewave:\n`);
        bytewaveUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   Team: ${user.teamId}`);
            console.log(`   QR Code: ${user.qrCode}`);
            if (user.teamId !== 'Bytewave') {
                console.log(`   ⚠️  Team name mismatch!`);
            }
            console.log('');
        });

        // Verify Material Girlz
        console.log('='.repeat(80));
        console.log('VERIFYING MATERIAL GIRLZ TEAM (should be CRU format)');
        console.log('='.repeat(80));
        console.log('');

        const materialGirlzUsers = await User.find({
            teamId: { $regex: /material.*girl/i }
        }).sort({ qrCode: 1 });

        console.log(`Found ${materialGirlzUsers.length} user(s) for Material Girlz:\n`);
        materialGirlzUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   Team: ${user.teamId}`);
            console.log(`   QR Code: ${user.qrCode}`);
            if (!user.qrCode.startsWith('CRU-T75-')) {
                console.log(`   ⚠️  QR code should be CRU format!`);
            }
            console.log('');
        });

        // Verify Delusion
        console.log('='.repeat(80));
        console.log('VERIFYING DELUSION TEAM');
        console.log('='.repeat(80));
        console.log('');

        const delusionUsers = await User.find({
            teamId: { $regex: /delusion/i }
        }).sort({ qrCode: 1 });

        console.log(`Found ${delusionUsers.length} user(s) for Delusion:\n`);
        delusionUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   Team: ${user.teamId}`);
            console.log(`   QR Code: ${user.qrCode}`);
            console.log('');
        });

        // Test QR code lookups
        console.log('='.repeat(80));
        console.log('TESTING QR CODE LOOKUPS');
        console.log('='.repeat(80));
        console.log('');

        const testCodes = [
            { qr: 'CR-T38-P01', expectedTeam: 'Bytewave' },
            { qr: 'CR-T38-P05', expectedTeam: 'Bytewave' },
            { qr: 'CRU-T75-P01', expectedTeam: 'Material Girlz' },
            { qr: 'CR-T39-P01', expectedTeam: 'Delusion' }
        ];

        for (const test of testCodes) {
            const user = await User.findOne({ qrCode: test.qr });
            if (user) {
                const match = user.teamId === test.expectedTeam;
                console.log(`QR: ${test.qr}`);
                console.log(`  Found: ${user.name} - Team: ${user.teamId}`);
                console.log(`  Expected Team: ${test.expectedTeam}`);
                console.log(`  ${match ? '✅ Match' : '❌ Mismatch!'}`);
            } else {
                console.log(`QR: ${test.qr} - ❌ Not found!`);
            }
            console.log('');
        }

        await mongoose.disconnect();
        console.log('✅ Verification completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

verifyFixes();


