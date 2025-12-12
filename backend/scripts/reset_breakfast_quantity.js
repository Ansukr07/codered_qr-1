/**
 * Script to reset breakfast resource distributedQuantity to 0
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

const Resource = require('../models/Resource');

async function resetBreakfastQuantity() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Find breakfast resource
        const breakfastResource = await Resource.findOne({
            name: { $regex: /breakfast/i }
        });

        if (!breakfastResource) {
            console.log('⚠️  No breakfast resource found\n');
            await mongoose.disconnect();
            process.exit(0);
        }

        console.log('📋 Breakfast Resource (Before):');
        console.log(`   Name: ${breakfastResource.name}`);
        console.log(`   ID: ${breakfastResource._id}`);
        console.log(`   Total Quantity: ${breakfastResource.totalQuantity}`);
        console.log(`   Distributed Quantity: ${breakfastResource.distributedQuantity}\n`);

        // Reset distributedQuantity to 0
        breakfastResource.distributedQuantity = 0;
        await breakfastResource.save();

        console.log('✅ Reset breakfast distributedQuantity to 0\n');

        console.log('📋 Breakfast Resource (After):');
        console.log(`   Name: ${breakfastResource.name}`);
        console.log(`   Total Quantity: ${breakfastResource.totalQuantity}`);
        console.log(`   Distributed Quantity: ${breakfastResource.distributedQuantity}\n`);

        await mongoose.disconnect();
        console.log('✅ Reset completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

resetBreakfastQuantity();


