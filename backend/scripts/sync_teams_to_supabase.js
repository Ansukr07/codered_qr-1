/**
 * Script to sync "404 Brain Not Found" and "Gabbar ke geeks" teams to Supabase
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
const supabase = require('../config/supabase');

const TEAMS_TO_SYNC = ['404 Brain Not Found', 'Gabbar ke geeks'];

async function syncTeamsToSupabase() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        if (!supabase) {
            throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        console.log('='.repeat(80));
        console.log('SYNCING TEAMS TO SUPABASE');
        console.log('='.repeat(80));
        console.log('');

        let totalProcessed = 0;
        let totalCreated = 0;
        let totalUpdated = 0;
        let totalErrors = 0;

        for (const teamName of TEAMS_TO_SYNC) {
            console.log(`\n📋 Processing team: "${teamName}"`);
            console.log('-'.repeat(80));

            // Get all team members from MongoDB
            const teamMembers = await User.find({ 
                teamId: teamName,
                role: 'participant'
            });

            if (teamMembers.length === 0) {
                console.log(`⚠️  No members found for team "${teamName}" in MongoDB`);
                continue;
            }

            console.log(`Found ${teamMembers.length} member(s) in MongoDB\n`);

            for (const member of teamMembers) {
                try {
                    totalProcessed++;

                    // Check if participant already exists in Supabase by qr_code
                    const { data: existingParticipant, error: fetchError } = await supabase
                        .from('participants')
                        .select('id, name, email, qr_code, team_id')
                        .eq('qr_code', member.qrCode)
                        .single();

                    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
                        throw fetchError;
                    }

                    const participantData = {
                        name: member.name,
                        email: member.email || `${member.qrCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@codered.local`,
                        participant_id: member.qrCode, // Using qrCode as participant_id
                        qr_code: member.qrCode,
                        team_id: member.teamId || null,
                        track: member.track || null,
                        updated_at: new Date().toISOString()
                    };

                    if (existingParticipant) {
                        // Update existing participant
                        const { data, error } = await supabase
                            .from('participants')
                            .update(participantData)
                            .eq('qr_code', member.qrCode)
                            .select();

                        if (error) throw error;

                        console.log(`  🔄 Updated: ${member.name} (${member.qrCode})`);
                        totalUpdated++;
                    } else {
                        // Create new participant
                        participantData.created_at = new Date().toISOString();
                        
                        const { data, error } = await supabase
                            .from('participants')
                            .insert(participantData)
                            .select();

                        if (error) throw error;

                        console.log(`  ✅ Created: ${member.name} (${member.qrCode})`);
                        totalCreated++;
                    }
                } catch (error) {
                    console.error(`  ❌ Error processing ${member.name} (${member.qrCode}):`, error.message);
                    totalErrors++;
                }
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total participants processed: ${totalProcessed}`);
        console.log(`✅ Created in Supabase: ${totalCreated}`);
        console.log(`🔄 Updated in Supabase: ${totalUpdated}`);
        console.log(`❌ Errors: ${totalErrors}`);
        console.log('');

        // Verify in Supabase
        console.log('='.repeat(80));
        console.log('VERIFICATION IN SUPABASE');
        console.log('='.repeat(80));
        console.log('');

        for (const teamName of TEAMS_TO_SYNC) {
            const { data: supabaseParticipants, error } = await supabase
                .from('participants')
                .select('name, email, qr_code, team_id')
                .eq('team_id', teamName);

            if (error) {
                console.error(`❌ Error fetching team "${teamName}" from Supabase:`, error.message);
            } else {
                console.log(`Team "${teamName}": ${supabaseParticipants.length} member(s) in Supabase`);
                supabaseParticipants.forEach((p, index) => {
                    console.log(`  ${index + 1}. ${p.name} - ${p.qr_code}`);
                });
                console.log('');
            }
        }

        await mongoose.disconnect();
        console.log('✅ Sync completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

syncTeamsToSupabase();

