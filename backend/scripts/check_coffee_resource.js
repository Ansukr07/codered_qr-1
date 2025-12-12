/**
 * Script to check if coffee resource exists
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

async function checkCoffeeResource() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Find all coffee resources
        const coffeeResources = await Resource.find({
            $or: [
                { category: 'coffee' },
                { name: { $regex: /coffee/i } }
            ]
        });

        console.log(`Found ${coffeeResources.length} coffee resource(s):\n`);
        
        if (coffeeResources.length === 0) {
            console.log('❌ No coffee resources found!\n');
            console.log('💡 You need to create a coffee resource. Options:');
            console.log('   1. Go to Admin Panel → Create Resource');
            console.log('   2. Set category to "coffee" or name containing "coffee"');
            console.log('   3. Or run a script to create it automatically\n');
        } else {
            coffeeResources.forEach((resource, index) => {
                console.log(`${index + 1}. ${resource.name}`);
                console.log(`   ID: ${resource._id}`);
                console.log(`   Category: ${resource.category}`);
                console.log(`   Total Quantity: ${resource.totalQuantity}`);
                console.log(`   Distributed: ${resource.distributedQuantity}`);
                console.log('');
            });
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

checkCoffeeResource();

