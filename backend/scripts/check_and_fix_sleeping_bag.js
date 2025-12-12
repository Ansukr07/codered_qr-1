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
const Transaction = require('../models/Transaction');
const User = require('../models/User');

async function checkAndFixSleepingBag() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Find existing sleeping bag resource
        const bagResource = await Resource.findOne({
            $or: [
                { name: { $regex: /bag/i } },
                { name: { $regex: /sleep/i } },
                { category: 'accommodation' }
            ]
        });

        if (bagResource) {
            console.log('📦 Found existing sleeping bag resource:');
            console.log(`   Name: ${bagResource.name}`);
            console.log(`   ID: ${bagResource._id}`);
            console.log(`   Total Quantity: ${bagResource.totalQuantity}`);
            console.log(`   Distributed Quantity: ${bagResource.distributedQuantity}`);
            console.log(`   Category: ${bagResource.category}`);

            // Count transactions for this resource
            const transactionCount = await Transaction.countDocuments({
                resourceId: bagResource._id
            });
            console.log(`\n📊 Found ${transactionCount} transactions for this resource`);

            if (transactionCount > 0) {
                console.log('\n🗑️  Deleting all sleeping bag transactions...');
                const deleteResult = await Transaction.deleteMany({
                    resourceId: bagResource._id
                });
                console.log(`✅ Deleted ${deleteResult.deletedCount} transactions`);

                // Reset distributed quantity
                bagResource.distributedQuantity = 0;
                await bagResource.save();
                console.log('✅ Reset distributed quantity to 0');
            }

            // Delete the resource
            console.log('\n🗑️  Deleting sleeping bag resource...');
            await Resource.deleteOne({ _id: bagResource._id });
            console.log('✅ Sleeping bag resource deleted');
        } else {
            console.log('ℹ️  No existing sleeping bag resource found');
        }

        // Count total participants
        const participantCount = await User.countDocuments({ role: 'participant' });
        console.log(`\n📊 Total participants: ${participantCount}`);

        // Create new sleeping bag resource
        console.log('\n📦 Creating new sleeping bag resource...');
        const newBagResource = new Resource({
            name: 'Sleeping Bag',
            totalQuantity: participantCount, // One per participant
            distributedQuantity: 0,
            category: 'accommodation'
        });

        await newBagResource.save();
        console.log('✅ New sleeping bag resource created:');
        console.log(`   Name: ${newBagResource.name}`);
        console.log(`   ID: ${newBagResource._id}`);
        console.log(`   Total Quantity: ${newBagResource.totalQuantity}`);
        console.log(`   Distributed Quantity: ${newBagResource.distributedQuantity}`);
        console.log(`   Category: ${newBagResource.category}`);

        await mongoose.disconnect();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

checkAndFixSleepingBag();
