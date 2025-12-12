/**
 * Script to add Gabbar ke geeks team members to the database
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

const User = require('../models/User');

const participants = [
    {
        name: "Priyanshu",
        email: "priyanshu0@zohomail.in",
        role: "participant",
        teamId: "Gabbar ke geeks",
        qrCode: "CR-T82-P01",
        track: "CR"
    },
    {
        name: "Navya Agrawal",
        email: "ag.navya254@gmail.com",
        role: "participant",
        teamId: "Gabbar ke geeks",
        qrCode: "CR-T82-P02",
        track: "CR"
    },
    {
        name: "Anusha Anand",
        email: "anushaanand1543@gmail.com",
        role: "participant",
        teamId: "Gabbar ke geeks",
        qrCode: "CR-T82-P03",
        track: "CR"
    },
    {
        name: "Pushkarni",
        email: "pushkarni555@gmail.com",
        role: "participant",
        teamId: "Gabbar ke geeks",
        qrCode: "CR-T82-P04",
        track: "CR"
    }
];

async function addGabbarKeGeeks() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        console.log('='.repeat(80));
        console.log('ADDING GABBAR KE GEEKS TEAM MEMBERS');
        console.log('='.repeat(80));
        console.log('');

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const participant of participants) {
            try {
                // Check if user already exists by QR code
                const existingUser = await User.findOne({ qrCode: participant.qrCode });

                if (existingUser) {
                    // Update existing user
                    existingUser.name = participant.name;
                    existingUser.email = participant.email;
                    existingUser.teamId = participant.teamId;
                    existingUser.track = participant.track;
                    await existingUser.save();
                    console.log(`✅ Updated: ${participant.name} (${participant.qrCode})`);
                    updatedCount++;
                } else {
                    // Create new user
                    const user = await User.create({
                        name: participant.name,
                        email: participant.email,
                        role: participant.role,
                        teamId: participant.teamId,
                        qrCode: participant.qrCode,
                        track: participant.track
                    });

                    console.log(`✅ Created: ${participant.name} (${participant.qrCode})`);
                    addedCount++;
                }
            } catch (error) {
                console.error(`❌ Error processing ${participant.name}:`, error.message);
                skippedCount++;
            }
        }

        console.log('');
        console.log('='.repeat(80));
        console.log('SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total participants: ${participants.length}`);
        console.log(`✅ Created: ${addedCount}`);
        console.log(`🔄 Updated: ${updatedCount}`);
        console.log(`⚠️  Skipped: ${skippedCount}`);
        console.log('');

        // Verify the team
        const teamMembers = await User.find({ teamId: 'Gabbar ke geeks' });
        console.log(`Team "Gabbar ke geeks" now has ${teamMembers.length} member(s):`);
        teamMembers.forEach((member, index) => {
            console.log(`  ${index + 1}. ${member.name} - ${member.qrCode}`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Process completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

addGabbarKeGeeks();


