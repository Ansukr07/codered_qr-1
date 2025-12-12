/**
 * Script to revert Material Girlz QR codes back to CR format
 * (if physical QR codes are CR-T75-P01 format)
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

async function revertMaterialGirlzToCR() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Revert Material Girlz QR codes to CR format
        console.log('='.repeat(80));
        console.log('REVERTING MATERIAL GIRLZ QR CODES TO CR FORMAT');
        console.log('='.repeat(80));
        console.log('');

        const materialGirlzUsers = await User.find({
            teamId: { $regex: /material.*girl/i }
        });

        if (materialGirlzUsers.length === 0) {
            console.log('⚠️  No users found for Material Girlz\n');
        } else {
            console.log(`Found ${materialGirlzUsers.length} user(s) for Material Girlz:\n`);
            
            // Map to CR format
            const crFormatMap = {
                'Nishika': 'CR-T75-P01',
                'Parvathy C': 'CR-T75-P02',
                'Shreeya': 'CR-T75-P03'
            };

            for (const user of materialGirlzUsers) {
                console.log(`Checking: ${user.name}`);
                console.log(`  Current QR Code: ${user.qrCode}`);
                
                const crFormatQR = crFormatMap[user.name];
                if (crFormatQR) {
                    if (user.qrCode !== crFormatQR) {
                        console.log(`  🔄 Reverting QR code from ${user.qrCode} to ${crFormatQR}...`);
                        
                        // Check if CR format QR code already exists
                        const existingUser = await User.findOne({ qrCode: crFormatQR });
                        if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                            console.log(`  ❌ QR code ${crFormatQR} is already taken by: ${existingUser.name} (Team: ${existingUser.teamId})`);
                        } else {
                            user.qrCode = crFormatQR;
                            user.track = 'CR'; // Set track to CR
                            await user.save();
                            console.log(`  ✅ Reverted successfully`);
                        }
                    } else {
                        console.log(`  ✅ QR Code already in CR format`);
                    }
                }
                console.log('');
            }
        }

        await mongoose.disconnect();
        console.log('✅ Revert completed!');
        console.log('');
        console.log('Note: If physical QR codes are in CRU format, you may need to update them manually.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

revertMaterialGirlzToCR();

