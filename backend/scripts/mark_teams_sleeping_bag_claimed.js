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

async function markTeamsAsClaimed() {
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
        console.log(`   ID: ${bagResource._id}`);
        console.log(`   Total Quantity: ${bagResource.totalQuantity}`);
        console.log(`   Current Distributed Quantity: ${bagResource.distributedQuantity}\n`);

        // Teams to mark as claimed (with variations)
        const teamNames = [
            'Titan Core',
            'WI-FIGTERS',
            'Wi - Fight club',
            'Material Girls',
            'Material Girlz',
            'QuadraBytes'
        ];

        let successCount = 0;
        let errorCount = 0;
        const claimedTeams = [];

        for (const teamName of teamNames) {
            try {
                // Find team members (case-insensitive)
                const teamMembers = await User.find({
                    role: 'participant',
                    teamId: { $regex: new RegExp(`^${teamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                });

                if (teamMembers.length === 0) {
                    console.log(`⚠️  Team "${teamName}" not found`);
                    errorCount++;
                    continue;
                }

                // Check if team already has a claim
                const teamMemberIds = teamMembers.map(m => m._id);
                const existingClaim = await Transaction.findOne({
                    userId: { $in: teamMemberIds },
                    resourceId: bagResource._id,
                    action: 'claim'
                });

                if (existingClaim) {
                    console.log(`ℹ️  Team "${teamName}" already has a claim (skipping)`);
                    continue;
                }

                // Use the first team member to create the claim
                const firstMember = teamMembers[0];
                
                // Create a claim transaction (using a dummy volunteer ID - we'll use the first member's ID as volunteer)
                // Actually, we need a valid volunteer ID. Let's find or create one.
                const Volunteer = require('../models/Volunteer');
                let volunteer = await Volunteer.findOne({ email: 'vol@vol.in' });
                
                if (!volunteer) {
                    volunteer = await Volunteer.create({
                        name: 'System Volunteer',
                        email: 'vol@vol.in',
                        password: 'dummy'
                    });
                }

                const transaction = await Transaction.create({
                    userId: firstMember._id,
                    resourceId: bagResource._id,
                    volunteerId: volunteer._id,
                    action: 'claim',
                });

                console.log(`✅ Marked team "${teamName}" as claimed (${teamMembers.length} members)`);
                claimedTeams.push(teamName);
                successCount++;
            } catch (error) {
                console.error(`❌ Error processing team "${teamName}":`, error.message);
                errorCount++;
            }
        }

        // Update distributed quantity
        const newDistributedQuantity = bagResource.distributedQuantity + successCount;
        bagResource.distributedQuantity = newDistributedQuantity;
        await bagResource.save();

        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Successfully marked: ${successCount} teams`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   📦 New Distributed Quantity: ${newDistributedQuantity}/${bagResource.totalQuantity}`);
        console.log(`\n✅ Teams marked as claimed:`);
        claimedTeams.forEach(team => console.log(`   - ${team}`));

        await mongoose.disconnect();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

markTeamsAsClaimed();

