/**
 * Script to migrate tesserhack team from MongoDB to Supabase
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials not found in environment variables');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local or .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function migrateTesserhackTeam() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        // Find all users in tesserhack team (case-insensitive)
        const teamMembers = await User.find({
            teamId: { $regex: /^tesserhack$/i },
            role: 'participant'
        });

        if (teamMembers.length === 0) {
            console.log('⚠️  No members found for team "tesserhack"');
            await mongoose.disconnect();
            process.exit(0);
        }

        console.log(`Found ${teamMembers.length} member(s) in tesserhack team:\n`);
        teamMembers.forEach((member, index) => {
            console.log(`${index + 1}. ${member.name} (${member.email || 'No email'})`);
        });

        console.log('\n📝 Migrating to Supabase...\n');

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const member of teamMembers) {
            try {
                // Check if participant already exists in Supabase by email
                let existingParticipant = null;
                if (member.email) {
                    const { data: existing } = await supabase
                        .from('participants')
                        .select('id')
                        .eq('email', member.email.toLowerCase())
                        .single();
                    
                    existingParticipant = existing;
                }

                const participantData = {
                    name: member.name,
                    email: member.email ? member.email.toLowerCase() : null,
                    participant_id: member.qrCode || `CR-${member._id.toString().slice(-6)}`,
                    qr_code: member.qrCode,
                    team_id: member.teamId || 'tesserhack',
                    track: member.track || null,
                    hall: member.hall || null,
                    seat_number: member.seatNumber || null,
                    is_email_verified: member.email ? true : false,
                    github_link: member.githubLink || null
                };

                if (existingParticipant) {
                    // Update existing participant
                    const { error: updateError } = await supabase
                        .from('participants')
                        .update(participantData)
                        .eq('id', existingParticipant.id);

                    if (updateError) {
                        throw updateError;
                    }
                    console.log(`✅ Updated: ${member.name}`);
                } else {
                    // Insert new participant
                    const { error: insertError } = await supabase
                        .from('participants')
                        .insert(participantData);

                    if (insertError) {
                        throw insertError;
                    }
                    console.log(`✅ Inserted: ${member.name}`);
                }

                successCount++;
            } catch (error) {
                console.error(`❌ Error migrating ${member.name}:`, error.message);
                errors.push({ name: member.name, error: error.message });
                errorCount++;
            }
        }

        console.log(`\n📊 Migration Summary:`);
        console.log(`   ✅ Success: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);

        if (errors.length > 0) {
            console.log(`\n❌ Errors:`);
            errors.forEach(({ name, error }) => {
                console.log(`   - ${name}: ${error}`);
            });
        }

        // Verify migration
        const { data: supabaseMembers, error: verifyError } = await supabase
            .from('participants')
            .select('name, email, team_id')
            .eq('team_id', 'tesserhack');

        if (!verifyError && supabaseMembers) {
            console.log(`\n🔍 Verification: Found ${supabaseMembers.length} member(s) in Supabase with team_id='tesserhack'`);
        }

        await mongoose.disconnect();
        console.log('\n✅ Migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migrateTesserhackTeam();

