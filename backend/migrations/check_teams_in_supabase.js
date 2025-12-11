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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined');
    process.exit(1);
}

// Create Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTeams() {
    try {
        console.log('📊 Checking teams in Supabase...\n');

        // Get all participants with team_id
        const { data: participants, error } = await supabase
            .from('participants')
            .select('team_id, track, name, qr_code')
            .not('team_id', 'is', null);

        if (error) {
            console.error('❌ Error fetching participants:', error);
            return;
        }

        console.log(`Total participants with team_id: ${participants.length}\n`);

        // Group by team_id
        const teamsMap = new Map();
        participants.forEach(p => {
            if (p.team_id) {
                if (!teamsMap.has(p.team_id)) {
                    teamsMap.set(p.team_id, {
                        name: p.team_id,
                        track: p.track || null,
                        members: []
                    });
                }
                teamsMap.get(p.team_id).members.push({
                    name: p.name,
                    qr_code: p.qr_code,
                    track: p.track
                });
                // Update track if not set
                if (!teamsMap.get(p.team_id).track && p.track) {
                    teamsMap.get(p.team_id).track = p.track;
                }
            }
        });

        const teams = Array.from(teamsMap.values());
        console.log(`📋 Found ${teams.length} unique teams in Supabase:\n`);

        teams.forEach((team, index) => {
            console.log(`${index + 1}. ${team.name} (${team.members.length} members, track: ${team.track || 'N/A'})`);
        });

        // Count by track
        const trackCounts = {};
        teams.forEach(team => {
            const track = team.track || 'Unknown';
            trackCounts[track] = (trackCounts[track] || 0) + 1;
        });

        console.log('\n📊 Teams by Track:');
        Object.entries(trackCounts).forEach(([track, count]) => {
            console.log(`  ${track}: ${count} teams`);
        });

        // Get participants without team_id
        const { data: participantsWithoutTeam, error: error2 } = await supabase
            .from('participants')
            .select('id, name, qr_code, track')
            .is('team_id', null)
            .limit(10);

        if (!error2 && participantsWithoutTeam) {
            console.log(`\n⚠️  Participants without team_id: ${participantsWithoutTeam.length > 0 ? participantsWithoutTeam.length : 0}`);
            if (participantsWithoutTeam.length > 0) {
                console.log('  First 10:');
                participantsWithoutTeam.forEach(p => {
                    console.log(`    - ${p.name} (QR: ${p.qr_code}, Track: ${p.track || 'N/A'})`);
                });
            }
        }

        console.log('\n✅ Check completed!');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

checkTeams()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed:', error);
        process.exit(1);
    });

