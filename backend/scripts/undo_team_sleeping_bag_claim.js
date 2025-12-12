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

async function undoTeamClaim() {
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

        console.log('📦 Sleeping Bag Resource:');
        console.log(`   Name: ${bagResource.name}`);
        console.log(`   Current Distributed Quantity: ${bagResource.distributedQuantity}\n`);

        // Team to undo
        const teamName = 'ElectroEdge';

        // Find team members
        const teamMembers = await User.find({
            role: 'participant',
            teamId: { $regex: new RegExp(`^${teamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        if (teamMembers.length === 0) {
            console.log(`❌ Team "${teamName}" not found`);
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log(`📋 Found team "${teamName}" with ${teamMembers.length} members`);

        // Find claim transactions for this team
        const teamMemberIds = teamMembers.map(m => m._id);
        const claimTransactions = await Transaction.find({
            userId: { $in: teamMemberIds },
            resourceId: bagResource._id,
            action: 'claim'
        });

        if (claimTransactions.length === 0) {
            console.log(`ℹ️  No claim transactions found for team "${teamName}"`);
            await mongoose.disconnect();
            process.exit(0);
        }

        console.log(`\n🗑️  Found ${claimTransactions.length} claim transaction(s) to delete:`);
        claimTransactions.forEach((tx, index) => {
            console.log(`   ${index + 1}. Transaction ID: ${tx._id}, User: ${tx.userId}`);
        });

        // Delete claim transactions
        const deleteResult = await Transaction.deleteMany({
            userId: { $in: teamMemberIds },
            resourceId: bagResource._id,
            action: 'claim'
        });

        console.log(`\n✅ Deleted ${deleteResult.deletedCount} claim transaction(s)`);

        // Also delete any return transactions for this team
        const returnTransactions = await Transaction.find({
            userId: { $in: teamMemberIds },
            resourceId: bagResource._id,
            action: 'return'
        });

        if (returnTransactions.length > 0) {
            const returnDeleteResult = await Transaction.deleteMany({
                userId: { $in: teamMemberIds },
                resourceId: bagResource._id,
                action: 'return'
            });
            console.log(`✅ Deleted ${returnDeleteResult.deletedCount} return transaction(s)`);
        }

        // Update distributed quantity
        const deletedCount = deleteResult.deletedCount;
        if (deletedCount > 0 && bagResource.distributedQuantity >= deletedCount) {
            bagResource.distributedQuantity -= deletedCount;
            await bagResource.save();
            console.log(`\n📦 Updated distributed quantity: ${bagResource.distributedQuantity}/${bagResource.totalQuantity}`);
        } else {
            console.log(`\n⚠️  Could not update distributed quantity (current: ${bagResource.distributedQuantity}, trying to subtract: ${deletedCount})`);
        }

        console.log(`\n✅ Successfully undone claim for team "${teamName}"`);

        await mongoose.disconnect();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

undoTeamClaim();

