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

const MONGODB_URI = process.env.MONGODB_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env.local or .env');
    process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined');
    process.exit(1);
}

// Create Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrateTeams() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Get all users with teamId
        const users = await User.find({ 
            teamId: { $exists: true, $ne: null, $ne: '' },
            role: 'participant' // Only participants have teams
        });

        console.log(`\nFound ${users.length} participants with teamId in MongoDB`);

        // Group by teamId to get unique teams
        const teamsMap = new Map();
        users.forEach(user => {
            if (user.teamId) {
                if (!teamsMap.has(user.teamId)) {
                    teamsMap.set(user.teamId, {
                        name: user.teamId,
                        track: user.track || null,
                        memberCount: 0,
                        members: []
                    });
                }
                const team = teamsMap.get(user.teamId);
                team.memberCount++;
                team.members.push({
                    name: user.name,
                    email: user.email,
                    qrCode: user.qrCode,
                    track: user.track
                });
                // Update track if not set (use first non-null track)
                if (!team.track && user.track) {
                    team.track = user.track;
                }
            }
        });

        const teams = Array.from(teamsMap.values());
        console.log(`\nFound ${teams.length} unique teams in MongoDB:`);
        teams.forEach((team, index) => {
            console.log(`  ${index + 1}. ${team.name} (${team.memberCount} members, track: ${team.track || 'N/A'})`);
        });

        // Now update Supabase participants with team_id
        console.log('\n📝 Updating team_id in Supabase participants...');
        
        let updatedCount = 0;
        let notFoundCount = 0;
        const notFoundQRCodes = [];

        for (const team of teams) {
            for (const member of team.members) {
                if (!member.qrCode) {
                    console.warn(`⚠️  Member ${member.name} has no QR code, skipping`);
                    continue;
                }

                // Find participant in Supabase by QR code
                const { data: participant, error: findError } = await supabase
                    .from('participants')
                    .select('id, qr_code, team_id, name')
                    .eq('qr_code', member.qrCode)
                    .single();

                if (findError || !participant) {
                    console.warn(`⚠️  Participant with QR code ${member.qrCode} (${member.name}) not found in Supabase`);
                    notFoundCount++;
                    notFoundQRCodes.push({ qrCode: member.qrCode, name: member.name, team: team.name });
                    continue;
                }

                // Update team_id if it's different
                if (participant.team_id !== team.name) {
                    const { error: updateError } = await supabase
                        .from('participants')
                        .update({ 
                            team_id: team.name,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', participant.id);

                    if (updateError) {
                        console.error(`❌ Error updating ${member.name} (${member.qrCode}):`, updateError.message);
                    } else {
                        updatedCount++;
                        console.log(`✓ Updated ${member.name} -> team: ${team.name}`);
                    }
                } else {
                    console.log(`- ${member.name} already has correct team_id: ${team.name}`);
                }
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`  Total teams found: ${teams.length}`);
        console.log(`  Participants updated: ${updatedCount}`);
        console.log(`  Participants not found in Supabase: ${notFoundCount}`);

        if (notFoundQRCodes.length > 0) {
            console.log('\n⚠️  Participants not found in Supabase:');
            notFoundQRCodes.slice(0, 10).forEach(item => {
                console.log(`  - ${item.name} (QR: ${item.qrCode}, Team: ${item.team})`);
            });
            if (notFoundQRCodes.length > 10) {
                console.log(`  ... and ${notFoundQRCodes.length - 10} more`);
            }
        }

        // Generate SQL for teams summary (optional, for reference)
        console.log('\n📋 Generating teams summary...');
        const teamsSummary = teams.map(team => ({
            name: team.name,
            track: team.track,
            memberCount: team.memberCount
        }));

        const summaryPath = path.join(__dirname, 'teams_summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(teamsSummary, null, 2));
        console.log(`✓ Teams summary saved to ${summaryPath}`);

        // Also generate a SQL query to see teams in Supabase
        console.log('\n📋 Generating SQL query to view teams in Supabase...');
        const sqlQuery = `
-- View all teams and their member counts in Supabase
SELECT 
    team_id,
    COUNT(*) as member_count,
    COUNT(DISTINCT track) as track_count,
    STRING_AGG(DISTINCT track, ', ') as tracks
FROM participants
WHERE team_id IS NOT NULL
GROUP BY team_id
ORDER BY team_id;
        `.trim();

        const sqlPath = path.join(__dirname, 'view_teams_in_supabase.sql');
        fs.writeFileSync(sqlPath, sqlQuery);
        console.log(`✓ SQL query saved to ${sqlPath}`);

        console.log('\n✅ Team migration completed!');

    } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

// Run migration
migrateTeams()
    .then(() => {
        console.log('\n✅ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });



