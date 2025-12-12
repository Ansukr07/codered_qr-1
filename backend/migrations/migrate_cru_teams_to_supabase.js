const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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

async function migrateCRUTeams() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get all CRU track participants from MongoDB
        const cruUsers = await User.find({ 
            track: 'CRU',
            role: 'participant',
            teamId: { $exists: true, $ne: null, $ne: '' }
        });

        console.log(`Found ${cruUsers.length} CRU participants in MongoDB\n`);

        // Check which ones are already in Supabase
        const cruQRCodes = cruUsers.map(u => u.qrCode).filter(Boolean);
        const { data: existingParticipants } = await supabase
            .from('participants')
            .select('qr_code')
            .in('qr_code', cruQRCodes);

        const existingQRCodes = new Set((existingParticipants || []).map(p => p.qr_code));
        
        const missingUsers = cruUsers.filter(u => !existingQRCodes.has(u.qrCode));
        console.log(`Found ${missingUsers.length} CRU participants missing from Supabase\n`);

        if (missingUsers.length === 0) {
            console.log('✅ All CRU participants are already in Supabase!');
            return;
        }

        // Group by team
        const teamsMap = new Map();
        missingUsers.forEach(user => {
            if (user.teamId) {
                if (!teamsMap.has(user.teamId)) {
                    teamsMap.set(user.teamId, []);
                }
                teamsMap.get(user.teamId).push(user);
            }
        });

        console.log(`📋 Found ${teamsMap.size} CRU teams to migrate:\n`);
        teamsMap.forEach((members, teamName) => {
            console.log(`  - ${teamName}: ${members.length} members`);
        });

        // Prepare participants for insertion
        const participantsToInsert = missingUsers.map(user => {
            // Generate participant_id from QR code or create one
            let participantId = user.qrCode;
            if (!participantId) {
                participantId = `CRU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }

            return {
                id: uuidv4(),
                name: user.name || 'Unknown',
                email: user.email || `${user.qrCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@codered.local`, // Generate placeholder email
                participant_id: participantId,
                qr_code: user.qrCode,
                team_id: user.teamId || null,
                track: user.track || 'CRU',
                hall: user.hall || null,
                seat_number: user.seatNumber || null,
                is_email_verified: false,
                created_at: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        });

        console.log(`\n📝 Inserting ${participantsToInsert.length} CRU participants into Supabase...\n`);

        // Insert in batches of 100
        const batchSize = 100;
        let insertedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < participantsToInsert.length; i += batchSize) {
            const batch = participantsToInsert.slice(i, i + batchSize);
            
            const { data, error } = await supabase
                .from('participants')
                .insert(batch)
                .select('id, name, qr_code');

            if (error) {
                console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
                
                // Try inserting one by one to identify problematic records
                if (error.code === '23505') { // Duplicate key error
                    console.log('  Attempting individual inserts to skip duplicates...');
                    for (const participant of batch) {
                        const { error: singleError } = await supabase
                            .from('participants')
                            .insert(participant)
                            .select('id');

                        if (singleError) {
                            if (singleError.code === '23505') {
                                console.log(`  ⚠️  Skipping duplicate: ${participant.name} (QR: ${participant.qr_code})`);
                            } else {
                                console.error(`  ❌ Error inserting ${participant.name}:`, singleError.message);
                                errorCount++;
                            }
                        } else {
                            insertedCount++;
                            console.log(`  ✓ Inserted: ${participant.name} (QR: ${participant.qr_code})`);
                        }
                    }
                } else {
                    errorCount += batch.length;
                }
            } else {
                insertedCount += data.length;
                console.log(`✓ Inserted batch ${Math.floor(i / batchSize) + 1}: ${data.length} participants`);
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`  Total CRU participants in MongoDB: ${cruUsers.length}`);
        console.log(`  Already in Supabase: ${cruUsers.length - missingUsers.length}`);
        console.log(`  Newly inserted: ${insertedCount}`);
        console.log(`  Errors: ${errorCount}`);

        // Verify teams are now in Supabase
        console.log('\n📋 Verifying teams in Supabase...');
        const { data: allTeams } = await supabase
            .from('participants')
            .select('team_id, track')
            .not('team_id', 'is', null);

        const teamsSet = new Set();
        (allTeams || []).forEach(p => {
            if (p.team_id) {
                teamsSet.add(p.team_id);
            }
        });

        console.log(`  Total unique teams in Supabase: ${teamsSet.size}`);

        // Count CRU teams
        const { data: cruTeams } = await supabase
            .from('participants')
            .select('team_id')
            .eq('track', 'CRU')
            .not('team_id', 'is', null);

        const cruTeamsSet = new Set();
        (cruTeams || []).forEach(p => {
            if (p.team_id) {
                cruTeamsSet.add(p.team_id);
            }
        });

        console.log(`  CRU teams: ${cruTeamsSet.size}`);
        console.log(`  CR teams: ${teamsSet.size - cruTeamsSet.size}`);

        console.log('\n✅ CRU teams migration completed!');

    } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('\n✓ Disconnected from MongoDB');
    }
}

// Run migration
migrateCRUTeams()
    .then(() => {
        console.log('\n✅ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });


