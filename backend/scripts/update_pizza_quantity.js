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

async function updatePizzaQuantity() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Count total participants
        const participantCount = await User.countDocuments({ role: 'participant' });
        console.log(`📊 Total participants in system: ${participantCount}`);

        // Find pizza resource
        const pizzaResource = await Resource.findOne({
            name: { $regex: /^pizza$/i }
        });

        if (!pizzaResource) {
            console.log('❌ Pizza resource not found. Please create it first.');
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log(`\n📦 Current Pizza Resource:`);
        console.log(`   Name: ${pizzaResource.name}`);
        console.log(`   Current Total Quantity: ${pizzaResource.totalQuantity}`);
        console.log(`   Distributed Quantity: ${pizzaResource.distributedQuantity}`);

        // Update to match participant count (one pizza per participant)
        pizzaResource.totalQuantity = participantCount;
        await pizzaResource.save();

        console.log(`\n✅ Pizza resource updated!`);
        console.log(`   New Total Quantity: ${pizzaResource.totalQuantity} (one per participant)`);
        console.log(`   Distributed Quantity: ${pizzaResource.distributedQuantity}`);

        await mongoose.disconnect();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

updatePizzaQuantity();
