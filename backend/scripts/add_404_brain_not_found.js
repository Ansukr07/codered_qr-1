/**
 * Script to add 404 Brain Not Found team members to the database
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
        name: "Aprameya HP",
        email: "hpaprameya1@gmail.com",
        role: "participant",
        teamId: "404 Brain Not Found",
        qrCode: "CR-T78-P01",
        track: "CR",
        phone: "9449316055",
        usn: "01JST24UIS018"
    },
    {
        name: "Archita Pai",
        email: "archupai05@gmail.com",
        role: "participant",
        teamId: "404 Brain Not Found",
        qrCode: "CR-T78-P02",
        track: "CR",
        phone: "7337766333",
        usn: "01JST24UIS018"
    },
    {
        name: "Prathviraj S Bhure",
        email: "prathvibhure10@gmail.com",
        role: "participant",
        teamId: "404 Brain Not Found",
        qrCode: "CR-T78-P03",
        track: "CR",
        phone: "7483647994",
        usn: "01JST24UIS065"
    },
    {
        name: "Vidyashankara CK",
        email: "vidyashankara2005@gmail.com",
        role: "participant",
        teamId: "404 Brain Not Found",
        qrCode: "CR-T78-P04",
        track: "CR",
        phone: "9353304017",
        usn: "02JST24UCS124"
    }
];

async function add404BrainNotFound() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        console.log('='.repeat(80));
        console.log('ADDING 404 BRAIN NOT FOUND TEAM MEMBERS');
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
                    // Add phone and usn if they don't exist in schema, or update if they do
                    if (existingUser.phone !== undefined) {
                        existingUser.phone = participant.phone;
                    }
                    if (existingUser.usn !== undefined) {
                        existingUser.usn = participant.usn;
                    }
                    await existingUser.save();
                    console.log(`✅ Updated: ${participant.name} (${participant.qrCode})`);
                    updatedCount++;
                } else {
                    // Create new user
                    const userData = {
                        name: participant.name,
                        email: participant.email,
                        role: participant.role,
                        teamId: participant.teamId,
                        qrCode: participant.qrCode,
                        track: participant.track
                    };

                    // Add phone and usn if schema supports them (they might not be in the schema)
                    // We'll try to add them, but if the schema doesn't support them, mongoose will ignore them
                    const user = await User.create(userData);
                    
                    // Try to update phone and usn if they exist in the document
                    try {
                        if (user.phone !== undefined) {
                            user.phone = participant.phone;
                        }
                        if (user.usn !== undefined) {
                            user.usn = participant.usn;
                        }
                        await user.save();
                    } catch (e) {
                        // Ignore if phone/usn fields don't exist in schema
                    }

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
        const teamMembers = await User.find({ teamId: '404 Brain Not Found' });
        console.log(`Team "404 Brain Not Found" now has ${teamMembers.length} member(s):`);
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

add404BrainNotFound();


