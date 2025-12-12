require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

const Transaction = require('../models/Transaction');
const HelpRequest = require('../models/HelpRequest');
const Resource = require('../models/Resource');

const cleanupData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        console.log('\nStarting cleanup...');

        // 1. Clear Help Requests
        const helpRequests = await HelpRequest.deleteMany({});
        console.log(`✓ Deleted ${helpRequests.deletedCount} help requests`);

        // 2. Clear Transactions (meals, bags, chill access history)
        const transactions = await Transaction.deleteMany({});
        console.log(`✓ Deleted ${transactions.deletedCount} transactions`);

        // 3. Reset Resource Counters
        const resources = await Resource.updateMany(
            {}, 
            { $set: { distributedQuantity: 0 } }
        );
        console.log(`✓ Reset counters for ${resources.modifiedCount} resources`);

        console.log('\n✓ Cleanup completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        process.exit(1);
    }
};

cleanupData();
