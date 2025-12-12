/**
 * Script to move all breakfast transactions to dinner
 * This fixes the issue where breakfast was scanned by mistake instead of dinner
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
const Transaction = require('../models/Transaction');
const User = require('../models/User');

async function moveBreakfastToDinner() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Find breakfast resource(s)
        const breakfastResources = await Resource.find({
            name: { $regex: /breakfast/i }
        });

        if (breakfastResources.length === 0) {
            console.log('⚠️  No breakfast resources found');
            await mongoose.disconnect();
            process.exit(0);
        }

        console.log(`Found ${breakfastResources.length} breakfast resource(s):`);
        breakfastResources.forEach(r => {
            console.log(`  - ${r.name} (ID: ${r._id}, Distributed: ${r.distributedQuantity})`);
        });

        // Find dinner resource(s)
        const dinnerResources = await Resource.find({
            name: { $regex: /dinner/i }
        });

        if (dinnerResources.length === 0) {
            console.log('\n⚠️  No dinner resources found');
            await mongoose.disconnect();
            process.exit(0);
        }

        console.log(`\nFound ${dinnerResources.length} dinner resource(s):`);
        dinnerResources.forEach(r => {
            console.log(`  - ${r.name} (ID: ${r._id}, Distributed: ${r.distributedQuantity})`);
        });

        // Use the first breakfast and dinner resources (or you can specify which ones)
        const breakfastResource = breakfastResources[0];
        const dinnerResource = dinnerResources[0];

        console.log(`\n📋 Using:`);
        console.log(`  Breakfast: ${breakfastResource.name} (${breakfastResource._id})`);
        console.log(`  Dinner: ${dinnerResource.name} (${dinnerResource._id})`);

        // Find all transactions with breakfast resourceId
        const breakfastTransactions = await Transaction.find({
            resourceId: breakfastResource._id,
            action: 'claim' // Only move claim transactions
        }).populate('userId', 'name email').populate('volunteerId', 'name');

        console.log(`\n📊 Found ${breakfastTransactions.length} breakfast claim transactions`);

        if (breakfastTransactions.length === 0) {
            console.log('No transactions to move');
            await mongoose.disconnect();
            process.exit(0);
        }

        // Show summary
        console.log('\n📝 Transactions to move:');
        breakfastTransactions.forEach((tx, index) => {
            console.log(`  ${index + 1}. ${tx.userId?.name || 'Unknown'} - ${new Date(tx.timestamp).toLocaleString()}`);
        });

        // Ask for confirmation (in a real scenario, you might want to add a prompt)
        console.log('\n🔄 Moving transactions...');

        let movedCount = 0;
        let errorCount = 0;

        for (const tx of breakfastTransactions) {
            try {
                // Update transaction to use dinner resourceId
                await Transaction.updateOne(
                    { _id: tx._id },
                    { $set: { resourceId: dinnerResource._id } }
                );
                movedCount++;
            } catch (error) {
                console.error(`Error moving transaction ${tx._id}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n✅ Moved ${movedCount} transactions`);
        if (errorCount > 0) {
            console.log(`❌ Errors: ${errorCount}`);
        }

        // Update resource quantities
        console.log('\n📊 Updating resource quantities...');

        // Decrement breakfast distributedQuantity
        const breakfastCount = breakfastTransactions.length;
        if (breakfastResource.distributedQuantity >= breakfastCount) {
            breakfastResource.distributedQuantity -= breakfastCount;
            await breakfastResource.save();
            console.log(`  ✅ Breakfast: ${breakfastResource.name} - Decremented by ${breakfastCount} (now: ${breakfastResource.distributedQuantity})`);
        } else {
            console.log(`  ⚠️  Breakfast: ${breakfastResource.name} - Cannot decrement (current: ${breakfastResource.distributedQuantity}, trying to remove: ${breakfastCount})`);
            breakfastResource.distributedQuantity = 0;
            await breakfastResource.save();
            console.log(`  ✅ Breakfast: ${breakfastResource.name} - Set to 0`);
        }

        // Increment dinner distributedQuantity
        dinnerResource.distributedQuantity += breakfastCount;
        await dinnerResource.save();
        console.log(`  ✅ Dinner: ${dinnerResource.name} - Incremented by ${breakfastCount} (now: ${dinnerResource.distributedQuantity})`);

        // Verify the move
        const verifyBreakfast = await Transaction.countDocuments({
            resourceId: breakfastResource._id,
            action: 'claim'
        });
        const verifyDinner = await Transaction.countDocuments({
            resourceId: dinnerResource._id,
            action: 'claim'
        });

        console.log('\n🔍 Verification:');
        console.log(`  Breakfast transactions: ${verifyBreakfast}`);
        console.log(`  Dinner transactions: ${verifyDinner}`);

        await mongoose.disconnect();
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

moveBreakfastToDinner();

