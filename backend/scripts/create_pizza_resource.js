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

async function createPizzaResource() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Check if pizza resource already exists
        const existingPizza = await Resource.findOne({
            name: { $regex: /^pizza$/i }
        });

        if (existingPizza) {
            console.log('⚠️  Pizza resource already exists:');
            console.log(`   Name: ${existingPizza.name}`);
            console.log(`   ID: ${existingPizza._id}`);
            console.log(`   Total Quantity: ${existingPizza.totalQuantity}`);
            console.log(`   Distributed Quantity: ${existingPizza.distributedQuantity}`);
            console.log(`   Category: ${existingPizza.category}`);
            await mongoose.disconnect();
            process.exit(0);
        }

        // Create pizza resource
        const pizzaResource = new Resource({
            name: 'Pizza',
            totalQuantity: 500, // Adjust this based on your needs
            distributedQuantity: 0,
            category: 'food'
        });

        await pizzaResource.save();
        console.log('✅ Pizza resource created successfully!');
        console.log(`   Name: ${pizzaResource.name}`);
        console.log(`   ID: ${pizzaResource._id}`);
        console.log(`   Total Quantity: ${pizzaResource.totalQuantity}`);
        console.log(`   Distributed Quantity: ${pizzaResource.distributedQuantity}`);
        console.log(`   Category: ${pizzaResource.category}`);

        await mongoose.disconnect();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createPizzaResource();
