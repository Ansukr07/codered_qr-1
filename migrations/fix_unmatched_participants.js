/**
 * Helper script to manually fix unmatched participants
 * 
 * This script helps you manually map CSV emails to MongoDB qrCodes
 * for participants that couldn't be automatically matched.
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
const readline = require('readline');
const User = require('../backend/models/User');

const MAPPING_FILE = path.join(__dirname, 'email_qrcode_mapping.json');
const OUTPUT_SQL = path.join(__dirname, 'supabase_insert_unmatched.sql');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function getMongoParticipants() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file. Please check your .env file in the backend directory.');
        }
        
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');
        
        const users = await User.find({ role: 'participant' })
            .select('name qrCode teamId track')
            .lean()
            .sort({ name: 1 });
        
        return users;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

function escapeSQLString(str) {
    if (!str) return 'NULL';
    return `'${str.replace(/'/g, "''")}'`;
}

function escapeSQLDate(date) {
    if (!date) return 'NOW()';
    const d = new Date(date);
    return `'${d.toISOString()}'::timestamp`;
}

async function fixUnmatched() {
    try {
        // Load existing mapping
        if (!fs.existsSync(MAPPING_FILE)) {
            console.log('Mapping file not found. Please run migrate_to_supabase.js first.');
            process.exit(1);
        }
        
        const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
        
        if (mapping.unmatched.length === 0) {
            console.log('No unmatched participants! All participants were matched.');
            process.exit(0);
        }
        
        console.log(`Found ${mapping.unmatched.length} unmatched participants.\n`);
        
        // Get MongoDB participants for reference
        const mongoParticipants = await getMongoParticipants();
        
        const manualMatches = [];
        
        for (const unmatched of mapping.unmatched) {
            console.log(`\n--- Unmatched Participant ---`);
            console.log(`Name: ${unmatched.name}`);
            console.log(`Email: ${unmatched.email}`);
            console.log(`Team: ${unmatched.teamName || 'N/A'}`);
            
            // Show similar names from MongoDB
            const similar = mongoParticipants.filter(p => 
                p.name.toLowerCase().includes(unmatched.name.toLowerCase().substring(0, 5)) ||
                unmatched.name.toLowerCase().includes(p.name.toLowerCase().substring(0, 5))
            ).slice(0, 5);
            
            if (similar.length > 0) {
                console.log(`\nSimilar names in MongoDB:`);
                similar.forEach((p, i) => {
                    console.log(`  ${i + 1}. ${p.name} (QR: ${p.qrCode}, Team: ${p.teamId || 'N/A'})`);
                });
            }
            
            const answer = await question('\nEnter qrCode to match (or "skip" to skip, "exit" to finish): ');
            
            if (answer.toLowerCase() === 'exit') {
                break;
            }
            
            if (answer.toLowerCase() === 'skip') {
                continue;
            }
            
            // Find the MongoDB participant
            const mongoP = mongoParticipants.find(p => p.qrCode === answer.trim());
            
            if (!mongoP) {
                console.log('❌ QR Code not found in MongoDB. Skipping...');
                continue;
            }
            
            manualMatches.push({
                csvEmail: unmatched.email,
                csvName: unmatched.name,
                mongoQrCode: mongoP.qrCode,
                mongoName: mongoP.name,
                mongoData: mongoP,
                matchType: 'manual'
            });
            
            console.log(`✓ Matched: ${unmatched.name} -> ${mongoP.name} (${mongoP.qrCode})`);
        }
        
        // Generate SQL for manual matches
        if (manualMatches.length > 0) {
            // Get emails that are already in the matched list
            const matchedEmails = new Set(
                mapping.matched.map(m => m.csvEmail.toLowerCase().trim())
            );
            
            // Filter out manual matches whose emails already exist in matched list
            const uniqueManualMatches = manualMatches.filter(p => {
                const email = p.csvEmail.toLowerCase().trim();
                if (matchedEmails.has(email)) {
                    console.log(`⚠ Skipping ${p.csvName} (${p.csvEmail}) - email already exists in matched list`);
                    return false;
                }
                return true;
            });
            
            if (uniqueManualMatches.length === 0) {
                console.log('\n⚠ All manual matches already exist in the matched list. No SQL generated.');
                await mongoose.disconnect();
                rl.close();
                process.exit(0);
            }
            
            console.log(`\nGenerating SQL for ${uniqueManualMatches.length} unique manual matches...`);
            
            const sqlStatements = [];
            
            sqlStatements.push('-- ============================================');
            sqlStatements.push('-- Manually Matched Participants');
            sqlStatements.push('-- Generated: ' + new Date().toISOString());
            sqlStatements.push('-- ============================================\n');
            
            sqlStatements.push('BEGIN;\n');
            
            uniqueManualMatches.forEach(p => {
                const mongo = p.mongoData;
                const participantId = mongo.qrCode;
                const qrCode = mongo.qrCode;
                
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
    ${escapeSQLString(p.csvName)},
    ${escapeSQLString(p.csvEmail)},
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
            });
            
            sqlStatements.push('\nCOMMIT;');
            
            fs.writeFileSync(OUTPUT_SQL, sqlStatements.join('\n\n'));
            console.log(`\n✓ Generated SQL file: ${OUTPUT_SQL}`);
            console.log(`✓ Matched ${uniqueManualMatches.length} unique participants manually`);
            if (manualMatches.length > uniqueManualMatches.length) {
                console.log(`⚠ Skipped ${manualMatches.length - uniqueManualMatches.length} duplicates`);
            }
        }
        
        await mongoose.disconnect();
        rl.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await mongoose.disconnect();
        rl.close();
        process.exit(1);
    }
}

fixUnmatched();

