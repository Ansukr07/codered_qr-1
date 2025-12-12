/**
 * Script to check QR codes for teams that changed names
 * Checking: bytewave (was databaes), Material Girlz
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

async function checkTeamQRCodes() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Check for bytewave team (was databaes)
        console.log('='.repeat(80));
        console.log('CHECKING BYTEWAVE TEAM (was databaes)');
        console.log('='.repeat(80));
        console.log('');

        const bytewaveUsers = await User.find({
            $or: [
                { teamId: { $regex: /bytewave/i } },
                { teamId: { $regex: /databaes/i } },
                { name: { $regex: /bytewave/i } }
            ]
        }).select('name email teamId qrCode');

        if (bytewaveUsers.length === 0) {
            console.log('⚠️  No users found for bytewave/databaes\n');
        } else {
            console.log(`Found ${bytewaveUsers.length} user(s) for bytewave/databaes:\n`);
            bytewaveUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Email: ${user.email || 'N/A'}`);
                console.log(`   Team ID: ${user.teamId || 'N/A'}`);
                console.log(`   QR Code: ${user.qrCode || 'N/A'}`);
                if (user.qrCode && user.qrCode.toLowerCase().includes('databaes')) {
                    console.log(`   ⚠️  QR Code contains old team name "databaes"`);
                }
                console.log('');
            });
        }

        // Check for Material Girlz team
        console.log('='.repeat(80));
        console.log('CHECKING MATERIAL GIRLZ TEAM');
        console.log('='.repeat(80));
        console.log('');

        const materialGirlzUsers = await User.find({
            $or: [
                { teamId: { $regex: /material/i } },
                { name: { $regex: /material/i } }
            ]
        }).select('name email teamId qrCode');

        if (materialGirlzUsers.length === 0) {
            console.log('⚠️  No users found for Material Girlz\n');
        } else {
            console.log(`Found ${materialGirlzUsers.length} user(s) for Material Girlz:\n`);
            materialGirlzUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Email: ${user.email || 'N/A'}`);
                console.log(`   Team ID: ${user.teamId || 'N/A'}`);
                console.log(`   QR Code: ${user.qrCode || 'N/A'}`);
                console.log('');
            });
        }

        // Also check for any users with databaes in QR code but different team name
        console.log('='.repeat(80));
        console.log('CHECKING FOR QR CODES WITH "DATABAES" (old name)');
        console.log('='.repeat(80));
        console.log('');

        const databaesQrUsers = await User.find({
            qrCode: { $regex: /databaes/i }
        }).select('name email teamId qrCode');

        if (databaesQrUsers.length === 0) {
            console.log('✅ No QR codes found with "databaes" in them\n');
        } else {
            console.log(`Found ${databaesQrUsers.length} user(s) with "databaes" in QR code:\n`);
            databaesQrUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Email: ${user.email || 'N/A'}`);
                console.log(`   Team ID: ${user.teamId || 'N/A'}`);
                console.log(`   QR Code: ${user.qrCode || 'N/A'}`);
                console.log(`   ⚠️  QR Code contains old team name "databaes" but current team is "${user.teamId || 'N/A'}"`);
                console.log('');
            });
        }

        // Check Supabase participants table structure (if accessible)
        console.log('='.repeat(80));
        console.log('SUMMARY');
        console.log('='.repeat(80));
        console.log('');
        console.log('The QR codes are stored in MongoDB User collection.');
        console.log('If QR codes contain old team names, they need to be updated.');
        console.log('QR codes are typically in format like: CR-T##-P##');
        console.log('');

        await mongoose.disconnect();
        console.log('✅ Check completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

checkTeamQRCodes();

