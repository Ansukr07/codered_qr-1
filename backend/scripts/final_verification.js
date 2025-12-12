/**
 * Final verification of Bytewave/Databaes split
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
} else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const User = require('../models/User');

async function finalVerification() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Expected teams
        const expectedBytewave = ['Meghana Kiranchand', 'Obana Pujar', 'Gayatri P', 'Kavana P R'];
        const expectedDatabaes = ['Srushti K', 'Sameer kedilaya', 'Ayushman sharma', 'Parinitha V'];

        console.log('='.repeat(80));
        console.log('FINAL VERIFICATION - BYTEWAVE/DATABAES SPLIT');
        console.log('='.repeat(80));
        console.log('');

        // Check Bytewave
        const bytewaveUsers = await User.find({
            teamId: { $regex: /^bytewave$/i }
        }).sort({ name: 1 });

        console.log(`Bytewave team (${bytewaveUsers.length} members):`);
        let bytewaveCorrect = true;
        bytewaveUsers.forEach((user, index) => {
            const isExpected = expectedBytewave.some(name => 
                user.name.toLowerCase().trim() === name.toLowerCase().trim()
            );
            const status = isExpected ? '✅' : '❌';
            console.log(`  ${status} ${index + 1}. ${user.name} - QR: ${user.qrCode}`);
            if (!isExpected) bytewaveCorrect = false;
        });
        console.log('');

        // Check Databaes
        const databaesUsers = await User.find({
            teamId: { $regex: /^databaes$/i }
        }).sort({ name: 1 });

        console.log(`Databaes team (${databaesUsers.length} members):`);
        let databaesCorrect = true;
        databaesUsers.forEach((user, index) => {
            const isExpected = expectedDatabaes.some(name => 
                user.name.toLowerCase().trim() === name.toLowerCase().trim()
            );
            const status = isExpected ? '✅' : '❌';
            console.log(`  ${status} ${index + 1}. ${user.name} - QR: ${user.qrCode}`);
            if (!isExpected) databaesCorrect = false;
        });
        console.log('');

        // Summary
        console.log('='.repeat(80));
        console.log('SUMMARY');
        console.log('='.repeat(80));
        console.log('');
        if (bytewaveCorrect && databaesCorrect && bytewaveUsers.length === 4 && databaesUsers.length === 4) {
            console.log('✅ All teams correctly split!');
            console.log(`   Bytewave: ${bytewaveUsers.length} members`);
            console.log(`   Databaes: ${databaesUsers.length} members`);
        } else {
            console.log('⚠️  Issues found:');
            if (!bytewaveCorrect) console.log('   - Bytewave team has incorrect members');
            if (!databaesCorrect) console.log('   - Databaes team has incorrect members');
            if (bytewaveUsers.length !== 4) console.log(`   - Bytewave should have 4 members, found ${bytewaveUsers.length}`);
            if (databaesUsers.length !== 4) console.log(`   - Databaes should have 4 members, found ${databaesUsers.length}`);
        }
        console.log('');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

finalVerification();


