/**
 * Script to verify breakfast resource state and check for any remaining transactions
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

async function verifyBreakfastState() {
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

        console.log('📋 Breakfast Resource Details:');
        console.log(`   Name: ${breakfastResource.name}`);
        console.log(`   ID: ${breakfastResource._id}`);
        console.log(`   Total Quantity: ${breakfastResource.totalQuantity}`);
        console.log(`   Distributed Quantity: ${breakfastResource.distributedQuantity}`);
        console.log(`   Category: ${breakfastResource.category}\n`);

        // Check all transactions for this resource
        const allTransactions = await Transaction.find({
            resourceId: breakfastResource._id
        })
        .populate('userId', 'name email teamId')
        .populate('volunteerId', 'name email')
        .sort({ timestamp: -1 });

        console.log(`📊 Total transactions for breakfast resource: ${allTransactions.length}\n`);

        if (allTransactions.length > 0) {
            console.log('='.repeat(80));
            console.log('REMAINING BREAKFAST TRANSACTIONS');
            console.log('='.repeat(80));
            console.log('');

            allTransactions.forEach((tx, index) => {
                const participant = tx.userId;
                const volunteer = tx.volunteerId;

                console.log(`${index + 1}. ${tx.action.toUpperCase()}`);
                console.log(`   Participant: ${participant ? participant.name : 'Unknown'} (${participant ? participant.email || 'No email' : 'N/A'})`);
                if (participant && participant.teamId) {
                    console.log(`   Team: ${participant.teamId}`);
                }
                console.log(`   Volunteer: ${volunteer ? volunteer.name : 'Unknown'} (${volunteer ? volunteer.email || 'No email' : 'N/A'})`);
                console.log(`   Timestamp: ${new Date(tx.timestamp).toLocaleString()}`);
                console.log(`   Transaction ID: ${tx._id}`);
                console.log('');
            });

            // Count by action type
            const claims = allTransactions.filter(t => t.action === 'claim');
            const returns = allTransactions.filter(t => t.action === 'return');
            const verifications = allTransactions.filter(t => t.action === 'verify');

            console.log('Summary:');
            console.log(`  Claims: ${claims.length}`);
            console.log(`  Returns: ${returns.length}`);
            console.log(`  Verifications: ${verifications.length}\n`);

            // Check if distributedQuantity matches claim count
            const claimCount = claims.length;
            const returnCount = returns.length;
            const netDistributed = claimCount - returnCount;

            console.log('Quantity Check:');
            console.log(`  Claim transactions: ${claimCount}`);
            console.log(`  Return transactions: ${returnCount}`);
            console.log(`  Net distributed (claims - returns): ${netDistributed}`);
            console.log(`  Resource distributedQuantity: ${breakfastResource.distributedQuantity}`);
            
            if (netDistributed !== breakfastResource.distributedQuantity) {
                console.log(`  ⚠️  MISMATCH: Expected ${netDistributed}, but resource shows ${breakfastResource.distributedQuantity}`);
            } else {
                console.log(`  ✅ Quantities match`);
            }
        } else {
            console.log('✅ No transactions found for breakfast resource.');
            console.log(`   The distributedQuantity (${breakfastResource.distributedQuantity}) should ideally be 0 or match any remaining transactions.\n`);
        }

        // Also check lunch to see what we moved
        const lunchResource = await Resource.findOne({
            name: { $regex: /lunch/i }
        });

        if (lunchResource) {
            const lunchTransactions = await Transaction.countDocuments({
                resourceId: lunchResource._id,
                action: 'claim'
            });
            console.log('📋 Lunch Resource (for comparison):');
            console.log(`   Name: ${lunchResource.name}`);
            console.log(`   Distributed Quantity: ${lunchResource.distributedQuantity}`);
            console.log(`   Claim Transactions: ${lunchTransactions}`);
            console.log('');
        }

        await mongoose.disconnect();
        console.log('✅ Verification completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

verifyBreakfastState();


