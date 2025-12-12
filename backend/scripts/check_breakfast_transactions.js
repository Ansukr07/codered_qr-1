/**
 * Script to check breakfast transactions in the database
 * Shows what transactions exist, by whom, and when
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

async function checkBreakfastTransactions() {
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
            console.log('⚠️  No breakfast resources found in database\n');
            await mongoose.disconnect();
            process.exit(0);
        }

        console.log(`Found ${breakfastResources.length} breakfast resource(s):\n`);
        breakfastResources.forEach(r => {
            console.log(`  - ${r.name} (ID: ${r._id})`);
            console.log(`    Total Quantity: ${r.totalQuantity}`);
            console.log(`    Distributed: ${r.distributedQuantity}\n`);
        });

        // Get all transactions for breakfast resources
        const breakfastResourceIds = breakfastResources.map(r => r._id);
        
        const transactions = await Transaction.find({
            resourceId: { $in: breakfastResourceIds }
        })
        .populate('userId', 'name email teamId')
        .populate('volunteerId', 'name email')
        .sort({ timestamp: -1 });

        console.log(`\n📊 Found ${transactions.length} breakfast transactions:\n`);

        if (transactions.length === 0) {
            console.log('No transactions found for breakfast resources.\n');
        } else {
            // Group by action type
            const claims = transactions.filter(t => t.action === 'claim');
            const returns = transactions.filter(t => t.action === 'return');
            const verifications = transactions.filter(t => t.action === 'verify');

            console.log(`  Claims: ${claims.length}`);
            console.log(`  Returns: ${returns.length}`);
            console.log(`  Verifications: ${verifications.length}\n`);

            // Show all transactions
            console.log('='.repeat(80));
            console.log('ALL BREAKFAST TRANSACTIONS (Most Recent First)');
            console.log('='.repeat(80));
            console.log('');

            transactions.forEach((tx, index) => {
                const participant = tx.userId;
                const volunteer = tx.volunteerId;
                const resource = breakfastResources.find(r => r._id.toString() === tx.resourceId.toString());

                console.log(`${index + 1}. ${tx.action.toUpperCase()}`);
                console.log(`   Participant: ${participant ? participant.name : 'Unknown'} (${participant ? participant.email || 'No email' : 'N/A'})`);
                if (participant && participant.teamId) {
                    console.log(`   Team: ${participant.teamId}`);
                }
                console.log(`   Resource: ${resource ? resource.name : 'Unknown'}`);
                console.log(`   Volunteer: ${volunteer ? volunteer.name : 'Unknown'} (${volunteer ? volunteer.email || 'No email' : 'N/A'})`);
                console.log(`   Timestamp: ${new Date(tx.timestamp).toLocaleString()}`);
                console.log(`   Transaction ID: ${tx._id}`);
                console.log('');
            });

            // Summary by participant
            console.log('='.repeat(80));
            console.log('SUMMARY BY PARTICIPANT');
            console.log('='.repeat(80));
            console.log('');

            const participantMap = new Map();
            claims.forEach(tx => {
                if (tx.userId) {
                    const userId = tx.userId._id.toString();
                    const participant = tx.userId;
                    if (!participantMap.has(userId)) {
                        participantMap.set(userId, {
                            name: participant.name,
                            email: participant.email,
                            teamId: participant.teamId,
                            claimCount: 0,
                            transactions: []
                        });
                    }
                    const data = participantMap.get(userId);
                    data.claimCount++;
                    data.transactions.push(tx);
                }
            });

            const sortedParticipants = Array.from(participantMap.values()).sort((a, b) => 
                new Date(b.transactions[0].timestamp).getTime() - new Date(a.transactions[0].timestamp).getTime()
            );

            sortedParticipants.forEach((data, index) => {
                console.log(`${index + 1}. ${data.name}`);
                console.log(`   Email: ${data.email || 'N/A'}`);
                console.log(`   Team: ${data.teamId || 'N/A'}`);
                console.log(`   Total Claims: ${data.claimCount}`);
                if (data.transactions.length > 0) {
                    const latest = data.transactions[0];
                    const volunteer = latest.volunteerId;
                    console.log(`   Last Claimed: ${new Date(latest.timestamp).toLocaleString()}`);
                    console.log(`   Last Claimed By: ${volunteer ? volunteer.name : 'Unknown'}`);
                }
                console.log('');
            });

            // Summary by volunteer
            console.log('='.repeat(80));
            console.log('SUMMARY BY VOLUNTEER');
            console.log('='.repeat(80));
            console.log('');

            const volunteerMap = new Map();
            claims.forEach(tx => {
                if (tx.volunteerId) {
                    const volunteerId = tx.volunteerId._id.toString();
                    const volunteer = tx.volunteerId;
                    if (!volunteerMap.has(volunteerId)) {
                        volunteerMap.set(volunteerId, {
                            name: volunteer.name,
                            email: volunteer.email,
                            scanCount: 0
                        });
                    }
                    const data = volunteerMap.get(volunteerId);
                    data.scanCount++;
                }
            });

            const sortedVolunteers = Array.from(volunteerMap.values()).sort((a, b) => b.scanCount - a.scanCount);

            sortedVolunteers.forEach((data, index) => {
                console.log(`${index + 1}. ${data.name}`);
                console.log(`   Email: ${data.email || 'N/A'}`);
                console.log(`   Scans Performed: ${data.scanCount}`);
                console.log('');
            });

            // Time distribution
            console.log('='.repeat(80));
            console.log('TIME DISTRIBUTION');
            console.log('='.repeat(80));
            console.log('');

            const timeGroups = {};
            claims.forEach(tx => {
                const date = new Date(tx.timestamp);
                const hour = date.getHours();
                const timeKey = `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`;
                timeGroups[timeKey] = (timeGroups[timeKey] || 0) + 1;
            });

            Object.entries(timeGroups)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .forEach(([time, count]) => {
                    console.log(`  ${time}: ${count} claims`);
                });
        }

        await mongoose.disconnect();
        console.log('\n✅ Check completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

checkBreakfastTransactions();

