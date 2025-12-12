const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CSV file path
const csvFilePath = path.join(__dirname, '../../CODE RED 3.0 Unisys Track Final Round Registration (Responses) - MasterData.csv');

/**
 * Normalize team name for matching (uppercase, trim, remove extra spaces)
 */
function normalizeTeamName(teamName) {
    if (!teamName) return '';
    return teamName.trim().toUpperCase().replace(/\s+/g, ' ');
}

/**
 * Normalize name for matching (lowercase, trim, remove extra spaces)
 */
function normalizeName(name) {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Check if email is a placeholder (@codered.local)
 */
function isPlaceholderEmail(email) {
    if (!email) return false;
    return email.toLowerCase().endsWith('@codered.local');
}

/**
 * Check if email is valid (not empty, not placeholder)
 */
function isValidEmail(email) {
    if (!email) return false;
    const trimmed = email.trim().toLowerCase();
    return trimmed !== '' && !trimmed.endsWith('@codered.local') && trimmed.includes('@');
}

/**
 * Simple CSV parser
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

/**
 * Parse CSV and extract all team members
 */
function parseCSVData() {
    if (!fs.existsSync(csvFilePath)) {
        throw new Error(`CSV file not found: ${csvFilePath}`);
    }

    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
        throw new Error('CSV file is empty or has no data rows');
    }

    // Parse header
    const header = parseCSVLine(lines[0]);
    const headerMap = {};
    header.forEach((col, index) => {
        headerMap[col.trim()] = index;
    });

    const members = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        
        if (row.length < header.length) {
            // Pad with empty strings if row is shorter
            while (row.length < header.length) {
                row.push('');
            }
        }

        const getValue = (colName) => {
            const index = headerMap[colName];
            return index !== undefined ? (row[index] || '').trim() : '';
        };

        const teamName = getValue('Team Name');
        
        // Team Leader
        const leaderName = getValue('Team Leader Name');
        const leaderEmail = getValue('Team Leader Email ID');
        if (leaderName) {
            members.push({
                teamName: teamName,
                teamNameNormalized: normalizeTeamName(teamName),
                memberName: leaderName,
                memberNameNormalized: normalizeName(leaderName),
                memberEmail: leaderEmail.toLowerCase(),
                position: 1
            });
        }
        
        // Member 2
        const member2Name = getValue('Team Member 2 Name');
        const member2Email = getValue('Team Member 2 Email ID');
        if (member2Name) {
            members.push({
                teamName: teamName,
                teamNameNormalized: normalizeTeamName(teamName),
                memberName: member2Name,
                memberNameNormalized: normalizeName(member2Name),
                memberEmail: member2Email.toLowerCase(),
                position: 2
            });
        }
        
        // Member 3
        const member3Name = getValue('Team Member 3 Name');
        // Note: CSV header uses "Team Member 3 Email id" (lowercase 'id')
        const member3Email = getValue('Team Member 3 Email id') || getValue('Team Member 3 Email ID');
        if (member3Name) {
            members.push({
                teamName: teamName,
                teamNameNormalized: normalizeTeamName(teamName),
                memberName: member3Name,
                memberNameNormalized: normalizeName(member3Name),
                memberEmail: member3Email.toLowerCase(),
                position: 3
            });
        }
    }

    console.log(`✅ Parsed ${members.length} team members from CSV`);
    return members;
}

/**
 * Find participants with @codered.local emails
 */
async function findParticipantsWithPlaceholderEmails() {
    const { data, error } = await supabase
        .from('participants')
        .select('id, name, email, team_id')
        .like('email', '%@codered.local');

    if (error) {
        throw new Error(`Failed to fetch participants: ${error.message}`);
    }

    console.log(`\n📋 Found ${data.length} participants with @codered.local emails`);
    return data;
}

/**
 * Match participant with CSV member
 */
function matchParticipantWithCSV(participant, csvMembers) {
    const participantNameNormalized = normalizeName(participant.name);
    const participantTeamNormalized = normalizeTeamName(participant.team_id || '');

    // Find exact matches first
    let matches = csvMembers.filter(csv => 
        csv.memberNameNormalized === participantNameNormalized &&
        (
            csv.teamNameNormalized === participantTeamNormalized ||
            csv.teamNameNormalized.includes(participantTeamNormalized) ||
            participantTeamNormalized.includes(csv.teamNameNormalized)
        ) &&
        isValidEmail(csv.memberEmail)
    );

    // If no exact match, try partial name match
    if (matches.length === 0) {
        matches = csvMembers.filter(csv => 
            csv.memberNameNormalized.includes(participantNameNormalized) ||
            participantNameNormalized.includes(csv.memberNameNormalized)
        ).filter(csv => 
            (
                csv.teamNameNormalized === participantTeamNormalized ||
                csv.teamNameNormalized.includes(participantTeamNormalized) ||
                participantTeamNormalized.includes(csv.teamNameNormalized)
            ) &&
            isValidEmail(csv.memberEmail)
        );
    }

    // Return the best match (prefer exact team match)
    if (matches.length > 0) {
        // Prefer exact team name match
        const exactTeamMatch = matches.find(m => m.teamNameNormalized === participantTeamNormalized);
        return exactTeamMatch || matches[0];
    }

    return null;
}

/**
 * Update participant email
 */
async function updateParticipantEmail(participantId, newEmail) {
    const { data, error } = await supabase
        .from('participants')
        .update({ 
            email: newEmail.toLowerCase().trim(),
            updated_at: new Date().toISOString()
        })
        .eq('id', participantId)
        .select();

    if (error) {
        throw new Error(`Failed to update participant ${participantId}: ${error.message}`);
    }

    return data[0];
}

/**
 * Main function
 */
async function main() {
    try {
        console.log('🚀 Starting email update process...\n');

        // Step 1: Parse CSV data
        console.log('📖 Reading CSV file...');
        const csvMembers = await parseCSVData();
        console.log(`   Found ${csvMembers.length} members in CSV\n`);

        // Step 2: Find participants with @codered.local emails
        console.log('🔍 Finding participants with @codered.local emails...');
        const participants = await findParticipantsWithPlaceholderEmails();
        console.log(`   Found ${participants.length} participants to check\n`);

        // Step 3: Match and update
        console.log('🔄 Matching and updating emails...\n');
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        const updates = [];

        for (const participant of participants) {
            // Only process if email is @codered.local
            if (!isPlaceholderEmail(participant.email)) {
                skippedCount++;
                continue;
            }

            const csvMatch = matchParticipantWithCSV(participant, csvMembers);

            if (csvMatch && isValidEmail(csvMatch.memberEmail)) {
                try {
                    // Check if new email already exists (to avoid conflicts)
                    const { data: existing } = await supabase
                        .from('participants')
                        .select('id, name, email')
                        .eq('email', csvMatch.memberEmail.toLowerCase().trim())
                        .neq('id', participant.id)
                        .limit(1);

                    if (existing && existing.length > 0) {
                        console.log(`⚠️  Skipped ${participant.name} (${participant.team_id}): Email ${csvMatch.memberEmail} already exists for ${existing[0].name}`);
                        skippedCount++;
                        continue;
                    }

                    await updateParticipantEmail(participant.id, csvMatch.memberEmail);
                    updatedCount++;
                    updates.push({
                        participant: participant.name,
                        team: participant.team_id,
                        oldEmail: participant.email,
                        newEmail: csvMatch.memberEmail
                    });
                    console.log(`✅ Updated ${participant.name} (${participant.team_id}): ${participant.email} → ${csvMatch.memberEmail}`);
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Error updating ${participant.name}: ${error.message}`);
                }
            } else {
                skippedCount++;
                console.log(`⏭️  No match found for ${participant.name} (${participant.team_id || 'No Team'})`);
            }
        }

        // Step 4: Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 UPDATE SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successfully updated: ${updatedCount}`);
        console.log(`⏭️  Skipped (no match or already has regular email): ${skippedCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📋 Total processed: ${participants.length}`);
        console.log('='.repeat(60));

        if (updates.length > 0) {
            console.log('\n📝 Updated Participants:');
            updates.forEach((update, index) => {
                console.log(`   ${index + 1}. ${update.participant} (${update.team})`);
                console.log(`      ${update.oldEmail} → ${update.newEmail}`);
            });
        }

        // Step 5: Show remaining @codered.local emails
        const { data: remaining } = await supabase
            .from('participants')
            .select('id, name, email, team_id')
            .like('email', '%@codered.local');

        if (remaining && remaining.length > 0) {
            console.log(`\n⚠️  ${remaining.length} participants still have @codered.local emails (no match found in CSV):`);
            remaining.forEach(p => {
                console.log(`   - ${p.name} (${p.team_id || 'No Team'}): ${p.email}`);
            });
        }

        console.log('\n✨ Process completed!');

    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
main();

