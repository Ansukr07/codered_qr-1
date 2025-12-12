/**
 * Script to create a coffee resource
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

async function createCoffeeResource() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Check if coffee resource already exists
        const existingCoffee = await Resource.findOne({
            $or: [
                { category: 'coffee' },
                { name: { $regex: /coffee/i } }
            ]
        });

        if (existingCoffee) {
            console.log('✓ Coffee resource already exists:');
            console.log(`  Name: ${existingCoffee.name}`);
            console.log(`  ID: ${existingCoffee._id}`);
            console.log(`  Category: ${existingCoffee.category}`);
            console.log(`  Total Quantity: ${existingCoffee.totalQuantity}`);
            console.log(`  Distributed: ${existingCoffee.distributedQuantity}\n`);
        } else {
            console.log('Creating coffee resource...');
            
            const coffeeResource = await Resource.create({
                name: 'Coffee',
                totalQuantity: 1000, // High number since each participant can claim 3
                distributedQuantity: 0,
                category: 'coffee'
            });

            console.log('✓ Coffee resource created successfully:');
            console.log(`  Name: ${coffeeResource.name}`);
            console.log(`  ID: ${coffeeResource._id}`);
            console.log(`  Category: ${coffeeResource.category}`);
            console.log(`  Total Quantity: ${coffeeResource.totalQuantity}\n`);
        }

        await mongoose.disconnect();
        console.log('✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createCoffeeResource();


