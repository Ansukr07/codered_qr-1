/**
 * Script to debug Material Girls QR code issue
 * Checks if team members exist in database and what their QR codes are
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

async function debugMaterialGirls() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Search for Material Girls team members (case-insensitive)
        const teamVariations = [
            'Material Girls',
            'material girls',
            'MATERIAL GIRLS',
            'MaterialGirls',
            'materialgirls'
        ];

        console.log('🔍 Searching for Material Girls team members...\n');

        let foundUsers = [];

        for (const teamName of teamVariations) {
            const users = await User.find({
                $or: [
                    { teamId: { $regex: teamName, $options: 'i' } },
                    { name: { $regex: teamName, $options: 'i' } }
                ],
                role: 'participant'
            }).select('name email teamId qrCode role');

            if (users.length > 0) {
                foundUsers = users;
                console.log(`✅ Found ${users.length} user(s) matching "${teamName}":\n`);
                break;
            }
        }

        if (foundUsers.length === 0) {
            // Try searching for any user with "material" in name or teamId
            const allMaterial = await User.find({
                $or: [
                    { teamId: { $regex: /material/i } },
                    { name: { $regex: /material/i } }
                ],
                role: 'participant'
            }).select('name email teamId qrCode role').limit(20);

            if (allMaterial.length > 0) {
                console.log(`⚠️  Found ${allMaterial.length} user(s) with "material" in name/team:\n`);
                foundUsers = allMaterial;
            } else {
                console.log('❌ No users found matching "Material Girls" or "material"\n');
                console.log('📋 Checking all teams to find similar names...\n');
                
                // Get all unique teamIds
                const allTeams = await User.distinct('teamId', { role: 'participant', teamId: { $exists: true, $ne: null } });
                const similarTeams = allTeams.filter(team => 
                    team && (
                        team.toLowerCase().includes('girl') ||
                        team.toLowerCase().includes('material')
                    )
                );
                
                if (similarTeams.length > 0) {
                    console.log(`Found similar team names: ${similarTeams.join(', ')}\n`);
                    for (const team of similarTeams) {
                        const teamUsers = await User.find({ teamId: team, role: 'participant' })
                            .select('name email teamId qrCode role')
                            .limit(5);
                        if (teamUsers.length > 0) {
                            foundUsers = [...foundUsers, ...teamUsers];
                        }
                    }
                }
            }
        }

        if (foundUsers.length > 0) {
            console.log('📊 User Details:\n');
            foundUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Email: ${user.email || 'N/A'}`);
                console.log(`   Team: ${user.teamId || 'N/A'}`);
                console.log(`   QR Code: ${user.qrCode || 'MISSING!'}`);
                console.log(`   Role: ${user.role}`);
                console.log('');
            });

            // Check for users with missing QR codes
            const missingQR = foundUsers.filter(u => !u.qrCode);
            if (missingQR.length > 0) {
                console.log(`\n⚠️  ${missingQR.length} user(s) have missing QR codes:`);
                missingQR.forEach(u => {
                    console.log(`   - ${u.name} (Team: ${u.teamId || 'N/A'})`);
                });
            }

            // Check for duplicate QR codes
            const qrCodes = foundUsers.map(u => u.qrCode).filter(qr => qr);
            const duplicates = qrCodes.filter((qr, index) => qrCodes.indexOf(qr) !== index);
            if (duplicates.length > 0) {
                console.log(`\n⚠️  Found duplicate QR codes: ${[...new Set(duplicates)].join(', ')}`);
            }
        } else {
            console.log('❌ No users found. The team might not be in MongoDB.\n');
            console.log('💡 They might be in Supabase instead. Check Supabase participants table.');
        }

        // Also check all users to see QR code format
        console.log('\n📋 Sample QR codes from database (first 5):');
        const sampleUsers = await User.find({ role: 'participant', qrCode: { $exists: true } })
            .select('name qrCode teamId')
            .limit(5);
        sampleUsers.forEach(u => {
            console.log(`   ${u.name}: ${u.qrCode} (Team: ${u.teamId || 'N/A'})`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Debug completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

debugMaterialGirls();


