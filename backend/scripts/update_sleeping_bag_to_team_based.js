const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envLocalPath = path.join(__dirname, '../.env.local');
const envPath = path.join(__dirname, '../.env');

if (require('fs').existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
    console.log('Loaded .env.local');
} else if (require('fs').existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Loaded .env');
} else {
    dotenv.config();
}

const Resource = require('../models/Resource');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

async function updateSleepingBagToTeamBased() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Find sleeping bag resource
        const bagResource = await Resource.findOne({
            $or: [
                { name: { $regex: /bag/i } },
                { name: { $regex: /sleep/i } },
                { category: 'accommodation' }
            ]
        });

        if (!bagResource) {
            console.log('❌ Sleeping bag resource not found');
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log('📦 Current Sleeping Bag Resource:');
        console.log(`   Name: ${bagResource.name}`);
        console.log(`   ID: ${bagResource._id}`);
        console.log(`   Current Total Quantity: ${bagResource.totalQuantity}`);
        console.log(`   Distributed Quantity: ${bagResource.distributedQuantity}`);

        // Count unique teams (from participants with teamId)
        const teams = await User.distinct('teamId', { 
            role: 'participant',
            teamId: { $exists: true, $ne: null, $ne: '' }
        });

        const teamCount = teams.length;
        console.log(`\n📊 Found ${teamCount} unique teams`);

        // Delete all existing sleeping bag transactions
        const transactionCount = await Transaction.countDocuments({
            resourceId: bagResource._id
        });
        
        if (transactionCount > 0) {
            console.log(`\n🗑️  Deleting ${transactionCount} existing sleeping bag transactions...`);
            await Transaction.deleteMany({
                resourceId: bagResource._id
            });
            console.log('✅ All transactions deleted');
        }

        // Update resource to team-based (one per team)
        bagResource.totalQuantity = teamCount;
        bagResource.distributedQuantity = 0;
        await bagResource.save();

        console.log(`\n✅ Sleeping bag resource updated to team-based:`);
        console.log(`   New Total Quantity: ${bagResource.totalQuantity} (one per team)`);
        console.log(`   Distributed Quantity: ${bagResource.distributedQuantity}`);

        await mongoose.disconnect();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

updateSleepingBagToTeamBased();
