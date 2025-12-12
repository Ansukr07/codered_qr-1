/**
 * Script to debug Bytewave vs Delusion QR code issue
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

async function debugBytewaveDelusion() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Check Bytewave team
        console.log('='.repeat(80));
        console.log('BYTEWAVE TEAM (QR codes: CR-T38-P01 to CR-T38-P08)');
        console.log('='.repeat(80));
        console.log('');

        const bytewaveUsers = await User.find({
            teamId: { $regex: /bytewave/i }
        }).sort({ qrCode: 1 });

        if (bytewaveUsers.length === 0) {
            console.log('⚠️  No users found for Bytewave\n');
        } else {
            console.log(`Found ${bytewaveUsers.length} user(s) for Bytewave:\n`);
            bytewaveUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Team: ${user.teamId}`);
                console.log(`   QR Code: ${user.qrCode}`);
                console.log(`   Track: ${user.track || 'N/A'}`);
                console.log('');
            });
        }

        // Check Delusion team
        console.log('='.repeat(80));
        console.log('DELUSION TEAM');
        console.log('='.repeat(80));
        console.log('');

        const delusionUsers = await User.find({
            teamId: { $regex: /delusion/i }
        }).sort({ qrCode: 1 });

        if (delusionUsers.length === 0) {
            console.log('⚠️  No users found for Delusion\n');
        } else {
            console.log(`Found ${delusionUsers.length} user(s) for Delusion:\n`);
            delusionUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Team: ${user.teamId}`);
                console.log(`   QR Code: ${user.qrCode}`);
                console.log(`   Track: ${user.track || 'N/A'}`);
                console.log('');
            });
        }

        // Check for any users with CR-T38-* QR codes
        console.log('='.repeat(80));
        console.log('ALL USERS WITH CR-T38-* QR CODES');
        console.log('='.repeat(80));
        console.log('');

        const t38Users = await User.find({
            qrCode: { $regex: /^CR-T38-/i }
        }).sort({ qrCode: 1 });

        if (t38Users.length === 0) {
            console.log('⚠️  No users found with CR-T38-* QR codes\n');
        } else {
            console.log(`Found ${t38Users.length} user(s) with CR-T38-* QR codes:\n`);
            t38Users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Team: ${user.teamId}`);
                console.log(`   QR Code: ${user.qrCode}`);
                console.log(`   Track: ${user.track || 'N/A'}`);
                console.log('');
            });
        }

        // Check for duplicate QR codes
        console.log('='.repeat(80));
        console.log('CHECKING FOR DUPLICATE QR CODES');
        console.log('='.repeat(80));
        console.log('');

        const allUsers = await User.find({ role: 'participant' });
        const qrCodeMap = new Map();
        
        allUsers.forEach(user => {
            const qr = user.qrCode?.toLowerCase();
            if (qr) {
                if (!qrCodeMap.has(qr)) {
                    qrCodeMap.set(qr, []);
                }
                qrCodeMap.get(qr).push(user);
            }
        });

        const duplicates = Array.from(qrCodeMap.entries()).filter(([qr, users]) => users.length > 1);
        
        if (duplicates.length === 0) {
            console.log('✅ No duplicate QR codes found\n');
        } else {
            console.log(`⚠️  Found ${duplicates.length} duplicate QR code(s):\n`);
            duplicates.forEach(([qr, users]) => {
                console.log(`QR Code: ${qr}`);
                users.forEach(user => {
                    console.log(`  - ${user.name} (Team: ${user.teamId})`);
                });
                console.log('');
            });
        }

        // Test specific QR code lookups
        console.log('='.repeat(80));
        console.log('TESTING QR CODE LOOKUPS');
        console.log('='.repeat(80));
        console.log('');

        const testQRCodes = [
            'CR-T38-P01',
            'CR-T38-P02',
            'CR-T38-P03',
            'CR-T38-P04',
            'CR-T38-P05',
            'CR-T38-P06',
            'CR-T38-P07',
            'CR-T38-P08'
        ];

        for (const qrCode of testQRCodes) {
            console.log(`Testing QR Code: ${qrCode}`);
            
            // Test exact match
            let found = await User.findOne({ qrCode: qrCode });
            if (found) {
                console.log(`  ✅ Found (exact): ${found.name} - Team: ${found.teamId}`);
            } else {
                console.log(`  ❌ Not found (exact match)`);
                
                // Test case-insensitive
                found = await User.findOne({
                    qrCode: { $regex: new RegExp(`^${qrCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                });
                if (found) {
                    console.log(`  ✅ Found (case-insensitive): ${found.name} - Team: ${found.teamId}`);
                } else {
                    console.log(`  ❌ Not found (case-insensitive)`);
                }
            }
            console.log('');
        }

        await mongoose.disconnect();
        console.log('✅ Debug completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

debugBytewaveDelusion();


