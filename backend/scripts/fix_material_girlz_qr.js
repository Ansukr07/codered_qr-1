/**
 * Script to check and fix Material Girlz QR codes
 * The seed data shows CRU-T75-P01 but database might have CR-T75-P01
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

async function fixMaterialGirlzQR() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Check Material Girlz users
        console.log('='.repeat(80));
        console.log('CHECKING MATERIAL GIRLZ QR CODES');
        console.log('='.repeat(80));
        console.log('');

        const materialGirlzUsers = await User.find({
            teamId: { $regex: /material.*girl/i }
        });

        if (materialGirlzUsers.length === 0) {
            console.log('⚠️  No users found for Material Girlz\n');
        } else {
            console.log(`Found ${materialGirlzUsers.length} user(s) for Material Girlz:\n`);
            
            // Expected QR codes from seed data (CRU track)
            const expectedQRCodes = {
                'Nishika': 'CRU-T75-P01',
                'Parvathy C': 'CRU-T75-P02',
                'Shreeya': 'CRU-T75-P03'
            };

            for (const user of materialGirlzUsers) {
                console.log(`Checking: ${user.name}`);
                console.log(`  Current QR Code: ${user.qrCode}`);
                console.log(`  Current Track: ${user.track || 'N/A'}`);
                console.log(`  Team: ${user.teamId}`);
                
                const expectedQR = expectedQRCodes[user.name];
                if (expectedQR) {
                    console.log(`  Expected QR Code: ${expectedQR}`);
                    
                    if (user.qrCode !== expectedQR) {
                        console.log(`  ⚠️  QR Code mismatch!`);
                        
                        // Check if expected QR code already exists
                        const existingUser = await User.findOne({ qrCode: expectedQR });
                        if (existingUser) {
                            console.log(`  ❌ Expected QR code ${expectedQR} is already taken by: ${existingUser.name} (Team: ${existingUser.teamId})`);
                        } else {
                            console.log(`  ✅ Expected QR code ${expectedQR} is available`);
                            console.log(`  🔄 Updating QR code from ${user.qrCode} to ${expectedQR}...`);
                            user.qrCode = expectedQR;
                            user.track = 'CRU'; // Update track to match
                            await user.save();
                            console.log(`  ✅ Updated successfully`);
                        }
                    } else {
                        console.log(`  ✅ QR Code matches expected value`);
                    }
                }
                console.log('');
            }
        }

        // Also check for any users with CR-T75-* QR codes that might be Material Girlz
        console.log('='.repeat(80));
        console.log('CHECKING FOR CR-T75-* QR CODES (might be Material Girlz)');
        console.log('='.repeat(80));
        console.log('');

        const crT75Users = await User.find({
            qrCode: { $regex: /^CR-T75-/i }
        });

        if (crT75Users.length > 0) {
            console.log(`Found ${crT75Users.length} user(s) with CR-T75-* QR codes:\n`);
            crT75Users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Team: ${user.teamId}`);
                console.log(`   QR Code: ${user.qrCode}`);
                console.log(`   Track: ${user.track || 'N/A'}`);
                console.log('');
            });
        } else {
            console.log('✅ No users found with CR-T75-* QR codes\n');
        }

        await mongoose.disconnect();
        console.log('✅ Check completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

fixMaterialGirlzQR();

