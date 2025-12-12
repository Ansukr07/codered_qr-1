/**
 * Script to fix team names and verify QR codes
 * - Update "Databaes" to "Bytewave" for bytewave team
 * - Verify Material Girlz QR codes
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

async function fixTeamNamesAndQR() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Fix 1: Update Databaes to Bytewave
        console.log('='.repeat(80));
        console.log('FIXING BYTEWAVE TEAM (updating from Databaes)');
        console.log('='.repeat(80));
        console.log('');

        const databaesUsers = await User.find({
            teamId: { $regex: /^databaes$/i }
        });

        if (databaesUsers.length === 0) {
            console.log('⚠️  No users found with teamId "Databaes"\n');
        } else {
            console.log(`Found ${databaesUsers.length} user(s) with teamId "Databaes":\n`);
            
            for (const user of databaesUsers) {
                console.log(`  Before: ${user.name} - Team: ${user.teamId} - QR: ${user.qrCode}`);
                user.teamId = 'Bytewave';
                await user.save();
                console.log(`  After:  ${user.name} - Team: ${user.teamId} - QR: ${user.qrCode}`);
                console.log('');
            }
            console.log(`✅ Updated ${databaesUsers.length} user(s) from "Databaes" to "Bytewave"\n`);
        }

        // Fix 2: Verify Material Girlz QR codes
        console.log('='.repeat(80));
        console.log('VERIFYING MATERIAL GIRLZ QR CODES');
        console.log('='.repeat(80));
        console.log('');

        const materialGirlzUsers = await User.find({
            teamId: { $regex: /material.*girl/i }
        });

        if (materialGirlzUsers.length === 0) {
            console.log('⚠️  No users found for Material Girlz\n');
        } else {
            console.log(`Found ${materialGirlzUsers.length} user(s) for Material Girlz:\n`);
            
            for (const user of materialGirlzUsers) {
                console.log(`  ${user.name}`);
                console.log(`    Team: ${user.teamId}`);
                console.log(`    QR Code: ${user.qrCode}`);
                
                // Test if QR code can be found
                const foundByQr = await User.findOne({ qrCode: user.qrCode });
                if (foundByQr) {
                    console.log(`    ✅ QR code found in database`);
                } else {
                    console.log(`    ❌ QR code NOT found in database!`);
                }
                
                // Test case-insensitive lookup
                const foundByQrCaseInsensitive = await User.findOne({
                    qrCode: { $regex: new RegExp(`^${user.qrCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                });
                if (foundByQrCaseInsensitive) {
                    console.log(`    ✅ QR code found with case-insensitive search`);
                }
                console.log('');
            }
        }

        // Fix 3: Test specific QR codes that might be failing
        console.log('='.repeat(80));
        console.log('TESTING SPECIFIC QR CODES');
        console.log('='.repeat(80));
        console.log('');

        const testQRCodes = [
            'CR-T38-P01', // Bytewave team member
            'CR-T38-P02',
            'CR-T75-P01', // Material Girlz team member
            'CR-T75-P02',
            'CR-T75-P03'
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
                    
                    // Test with whitespace
                    const trimmed = qrCode.trim();
                    found = await User.findOne({ qrCode: trimmed });
                    if (found) {
                        console.log(`  ✅ Found (with trim): ${found.name} - Team: ${found.teamId}`);
                    } else {
                        console.log(`  ❌ Not found (with trim)`);
                    }
                }
            }
            console.log('');
        }

        // Summary
        console.log('='.repeat(80));
        console.log('SUMMARY');
        console.log('='.repeat(80));
        console.log('');
        console.log('1. Updated team name from "Databaes" to "Bytewave"');
        console.log('2. Verified Material Girlz QR codes');
        console.log('3. Tested specific QR codes for lookup issues');
        console.log('');
        console.log('If QR codes are still showing as invalid, the issue might be:');
        console.log('- QR codes not matching exactly (whitespace, case, etc.)');
        console.log('- QR codes not in the database');
        console.log('- API endpoint not finding the QR codes');
        console.log('');

        await mongoose.disconnect();
        console.log('✅ Fix completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

fixTeamNamesAndQR();


