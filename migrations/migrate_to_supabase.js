/**
 * Migration Script: MongoDB to Supabase
 * 
 * This script:
 * 1. Reads participant data from CSV (registration form)
 * 2. Connects to MongoDB to get existing participants with qrCodes
 * 3. Maps CSV emails to MongoDB qrCodes by name matching
 * 4. Generates SQL INSERT statements for Supabase
 */

const path = require('path');
const fs = require('fs');
// Load .env.local first, then .env as fallback
const envLocalPath = path.join(__dirname, '../.env.local');
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
    require('dotenv').config({ path: envLocalPath });
    console.log('Loaded .env.local');
} else if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log('Loaded .env');
} else {
    require('dotenv').config({ path: envPath }); // Will show error if not found
}

const mongoose = require('mongoose');
const csv = require('csv-parser');
const User = require('../backend/models/User');

// Configuration
const CSV_FILE = path.join(__dirname, '../../CODE RED 3.0 Final Round Registration (Responses) - Form Responses 1.csv');
const OUTPUT_SQL = path.join(__dirname, 'supabase_insert_participants.sql');
const OUTPUT_MAPPING = path.join(__dirname, 'email_qrcode_mapping.json');

// Helper function to normalize names for matching
function normalizeName(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '');
}

// Extract all participants from CSV
async function extractParticipantsFromCSV() {
    return new Promise((resolve, reject) => {
        const participants = [];
        
        fs.createReadStream(CSV_FILE)
            .pipe(csv())
            .on('data', (row) => {
                const teamName = row['Team Name'] || '';
                const problemCode = row['Problem Statement Code \nFormat CR(T)X\nEg: CR(S)1'] || '';
                
                // Extract Team Leader
                if (row['Team Leader Name'] && row['Team Leader Email ID']) {
                    participants.push({
                        name: row['Team Leader Name'].trim(),
                        email: row['Team Leader Email ID'].trim().toLowerCase(),
                        teamName: teamName,
                        problemCode: problemCode,
                        role: 'leader'
                    });
                }
                
                // Extract Team Member 2
                if (row['Team Member 2 Name'] && row['Team Member 2 Email ID']) {
                    participants.push({
                        name: row['Team Member 2 Name'].trim(),
                        email: row['Team Member 2 Email ID'].trim().toLowerCase(),
                        teamName: teamName,
                        problemCode: problemCode,
                        role: 'member'
                    });
                }
                
                // Extract Team Member 3
                if (row['Team Member 3 Name'] && row['Team Member 3 Email id']) {
                    participants.push({
                        name: row['Team Member 3 Name'].trim(),
                        email: row['Team Member 3 Email id'].trim().toLowerCase(),
                        teamName: teamName,
                        problemCode: problemCode,
                        role: 'member'
                    });
                }
                
                // Extract Team Member 4
                if (row['Team Member 4 Name'] && row['Team Member 4 Email ID']) {
                    participants.push({
                        name: row['Team Member 4 Name'].trim(),
                        email: row['Team Member 4 Email ID'].trim().toLowerCase(),
                        teamName: teamName,
                        problemCode: problemCode,
                        role: 'member'
                    });
                }
            })
            .on('end', () => {
                console.log(`Extracted ${participants.length} participants from CSV`);
                resolve(participants);
            })
            .on('error', reject);
    });
}

// Get all participants from MongoDB
async function getMongoParticipants() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file. Please check your .env file in the backend directory.');
        }
        
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        
        const users = await User.find({ role: 'participant' })
            .select('name qrCode teamId track hall seatNumber createdAt')
            .lean();
        
        console.log(`Found ${users.length} participants in MongoDB`);
        return users;
    } catch (error) {
        console.error('Error fetching MongoDB participants:', error);
        throw error;
    }
}

// Match CSV participants to MongoDB participants
function matchParticipants(csvParticipants, mongoParticipants) {
    const matched = [];
    const unmatched = [];
    
    // Create a map of normalized names to MongoDB participants
    const mongoMap = new Map();
    mongoParticipants.forEach(p => {
        const normalized = normalizeName(p.name);
        if (!mongoMap.has(normalized)) {
            mongoMap.set(normalized, []);
        }
        mongoMap.get(normalized).push(p);
    });
    
    // Try to match each CSV participant
    csvParticipants.forEach(csvP => {
        const normalizedName = normalizeName(csvP.name);
        const candidates = mongoMap.get(normalizedName) || [];
        
        if (candidates.length === 1) {
            // Exact match
            matched.push({
                ...csvP,
                mongoData: candidates[0],
                matchType: 'exact'
            });
        } else if (candidates.length > 1) {
            // Multiple matches - use teamId if available
            const teamMatch = candidates.find(c => 
                c.teamId && csvP.teamName && 
                c.teamId.toLowerCase().includes(csvP.teamName.toLowerCase().substring(0, 5))
            );
            
            if (teamMatch) {
                matched.push({
                    ...csvP,
                    mongoData: teamMatch,
                    matchType: 'team_match'
                });
            } else {
                // Use first candidate and flag for review
                matched.push({
                    ...csvP,
                    mongoData: candidates[0],
                    matchType: 'multiple_candidates'
                });
            }
        } else {
            // No match found
            unmatched.push(csvP);
        }
    });
    
    return { matched, unmatched };
}

// Generate SQL INSERT statements
function generateSQLInserts(matchedParticipants) {
    const sqlStatements = [];
    const mapping = [];
    
    // Deduplicate by email - keep first occurrence
    const seenEmails = new Set();
    const uniqueParticipants = [];
    
    matchedParticipants.forEach((p) => {
        const email = p.email.toLowerCase().trim();
        if (!seenEmails.has(email)) {
            seenEmails.add(email);
            uniqueParticipants.push(p);
        } else {
            console.log(`⚠ Skipping duplicate email: ${email} (${p.name})`);
        }
    });
    
    console.log(`\nDeduplication: ${matchedParticipants.length} -> ${uniqueParticipants.length} unique participants`);
    
    sqlStatements.push('-- ============================================');
    sqlStatements.push('-- Participants Migration from MongoDB');
    sqlStatements.push('-- Generated: ' + new Date().toISOString());
    sqlStatements.push('-- ============================================\n');
    
    sqlStatements.push('BEGIN;\n');
    
    uniqueParticipants.forEach((p, index) => {
        const mongo = p.mongoData;
        const participantId = mongo.qrCode; // Use qrCode as participantId
        const qrCode = mongo.qrCode;
        
        // Generate UUID (we'll use Supabase's uuid_generate_v4() in SQL)
        const sql = `INSERT INTO participants (
    id,
    name,
    email,
    participant_id,
    qr_code,
    team_id,
    track,
    hall,
    seat_number,
    is_email_verified,
    created_at
) VALUES (
    uuid_generate_v4(),
    ${escapeSQLString(p.name)},
    ${escapeSQLString(p.email)},
    ${escapeSQLString(participantId)},
    ${escapeSQLString(qrCode)},
    ${mongo.teamId ? escapeSQLString(mongo.teamId) : 'NULL'},
    ${mongo.track ? escapeSQLString(mongo.track) : 'NULL'},
    ${mongo.hall ? escapeSQLString(mongo.hall) : 'NULL'},
    ${mongo.seatNumber ? escapeSQLString(mongo.seatNumber) : 'NULL'},
    FALSE,
    ${escapeSQLDate(mongo.createdAt || new Date())}
);`;
        
        sqlStatements.push(sql);
        
        mapping.push({
            csvEmail: p.email,
            csvName: p.name,
            mongoQrCode: qrCode,
            mongoName: mongo.name,
            matchType: p.matchType,
            teamName: p.teamName
        });
    });
    
    sqlStatements.push('\nCOMMIT;');
    
    return { sql: sqlStatements.join('\n\n'), mapping };
}

// Helper functions
function escapeSQLString(str) {
    if (!str) return 'NULL';
    return `'${str.replace(/'/g, "''")}'`;
}

function escapeSQLDate(date) {
    if (!date) return 'NOW()';
    const d = new Date(date);
    return `'${d.toISOString()}'::timestamp`;
}

// Main migration function
async function migrate() {
    try {
        console.log('Starting migration...\n');
        
        // Step 1: Extract from CSV
        console.log('Step 1: Extracting participants from CSV...');
        const csvParticipants = await extractParticipantsFromCSV();
        
        // Step 2: Get MongoDB data
        console.log('\nStep 2: Fetching participants from MongoDB...');
        const mongoParticipants = await getMongoParticipants();
        
        // Step 3: Match participants
        console.log('\nStep 3: Matching CSV emails to MongoDB qrCodes...');
        const { matched, unmatched } = matchParticipants(csvParticipants, mongoParticipants);
        
        console.log(`\nMatching Results:`);
        console.log(`  Matched: ${matched.length}`);
        console.log(`  Unmatched: ${unmatched.length}`);
        
        // Step 4: Generate SQL
        console.log('\nStep 4: Generating SQL INSERT statements...');
        const { sql, mapping } = generateSQLInserts(matched);
        
        // Step 5: Write output files
        fs.writeFileSync(OUTPUT_SQL, sql);
        console.log(`\n✓ SQL file written: ${OUTPUT_SQL}`);
        
        fs.writeFileSync(OUTPUT_MAPPING, JSON.stringify({
            matched: mapping,
            unmatched: unmatched,
            stats: {
                totalCSV: csvParticipants.length,
                totalMongo: mongoParticipants.length,
                matched: matched.length,
                unmatched: unmatched.length
            }
        }, null, 2));
        console.log(`✓ Mapping file written: ${OUTPUT_MAPPING}`);
        
        // Step 6: Report unmatched
        if (unmatched.length > 0) {
            console.log(`\n⚠️  WARNING: ${unmatched.length} participants could not be matched:`);
            unmatched.slice(0, 10).forEach(p => {
                console.log(`  - ${p.name} (${p.email})`);
            });
            if (unmatched.length > 10) {
                console.log(`  ... and ${unmatched.length - 10} more`);
            }
        }
        
        console.log('\n✅ Migration script completed!');
        console.log('\nNext steps:');
        console.log('1. Review the mapping file: ' + OUTPUT_MAPPING);
        console.log('2. Manually fix any unmatched participants');
        console.log('3. Run the SQL file in Supabase: ' + OUTPUT_SQL);
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrate();

