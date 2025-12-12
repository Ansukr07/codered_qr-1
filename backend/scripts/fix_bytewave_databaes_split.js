/**
 * Script to fix Bytewave/Databaes team split
 * Bytewave: Meghana, Obana, Gayatri, Kavana
 * Databaes: Srushti K, Sameer kedilaya, Ayushman sharma, Parinitha V
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

async function fixBytewaveDatabaesSplit() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Define team assignments
        const bytewaveMembers = [
            'Meghana Kiranchand',
            'Obana Pujar',
            'Gayatri P',
            'Kavana P R'
        ];

        const databaesMembers = [
            'Srushti K',
            'Sameer kedilaya',
            'Ayushman sharma',
            'Parinitha V'
        ];

        console.log('='.repeat(80));
        console.log('FIXING BYTEWAVE/DATABAES TEAM SPLIT');
        console.log('='.repeat(80));
        console.log('');

        // Update Bytewave members
        console.log('Updating Bytewave team members:\n');
        for (const memberName of bytewaveMembers) {
            const user = await User.findOne({ 
                name: { $regex: new RegExp(`^${memberName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            });
            
            if (user) {
                console.log(`  ${user.name}`);
                console.log(`    Before: Team = ${user.teamId}, QR = ${user.qrCode}`);
                user.teamId = 'Bytewave';
                await user.save();
                console.log(`    After:  Team = ${user.teamId}, QR = ${user.qrCode}`);
                console.log('');
            } else {
                console.log(`  ⚠️  User not found: ${memberName}\n`);
            }
        }

        // Update Databaes members
        console.log('Updating Databaes team members:\n');
        for (const memberName of databaesMembers) {
            const user = await User.findOne({ 
                name: { $regex: new RegExp(`^${memberName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            });
            
            if (user) {
                console.log(`  ${user.name}`);
                console.log(`    Before: Team = ${user.teamId}, QR = ${user.qrCode}`);
                user.teamId = 'Databaes';
                await user.save();
                console.log(`    After:  Team = ${user.teamId}, QR = ${user.qrCode}`);
                console.log('');
            } else {
                console.log(`  ⚠️  User not found: ${memberName}\n`);
            }
        }

        // Verify the changes
        console.log('='.repeat(80));
        console.log('VERIFICATION');
        console.log('='.repeat(80));
        console.log('');

        const bytewaveUsers = await User.find({
            teamId: { $regex: /^bytewave$/i }
        }).sort({ name: 1 });

        const databaesUsers = await User.find({
            teamId: { $regex: /^databaes$/i }
        }).sort({ name: 1 });

        console.log(`Bytewave team (${bytewaveUsers.length} members):`);
        bytewaveUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name} - QR: ${user.qrCode}`);
        });
        console.log('');

        console.log(`Databaes team (${databaesUsers.length} members):`);
        databaesUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name} - QR: ${user.qrCode}`);
        });
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

fixBytewaveDatabaesSplit();


