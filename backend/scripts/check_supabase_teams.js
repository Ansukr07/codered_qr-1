const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('⚠️  Supabase credentials not found');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTeams() {
    try {
        const { data, error } = await supabase
            .from('participants')
            .select('team_id, name, email')
            .order('team_id');
        
        if (error) {
            console.error('Error:', error);
            return;
        }
        
        const teamCounts = {};
        data.forEach(p => {
            const team = p.team_id || 'no-team';
            if (!teamCounts[team]) teamCounts[team] = [];
            teamCounts[team].push({ name: p.name, email: p.email });
        });
        
        console.log('Teams in Supabase:');
        console.log('==================');
        
        Object.entries(teamCounts).forEach(([team, members]) => {
            console.log(`${team}: ${members.length} members`);
            
            // Show details for specific teams
            if (team === '404 Brain Not Found' || team === 'tesserhack') {
                console.log('  Members:');
                members.forEach(m => console.log(`    - ${m.name} (${m.email})`));
            }
            
            // Check for duplicate emails within team
            const emails = members.map(m => m.email).filter(Boolean);
            const uniqueEmails = [...new Set(emails)];
            if (emails.length !== uniqueEmails.length) {
                console.log(`  ⚠️  DUPLICATES FOUND: ${emails.length} total, ${uniqueEmails.length} unique`);
            }
        });
        
        console.log('\n📊 Summary:');
        console.log(`Total teams: ${Object.keys(teamCounts).length}`);
        console.log(`Total participants: ${data.length}`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkTeams();
