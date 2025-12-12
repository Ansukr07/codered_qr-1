# Update @codered.local Emails from CSV

This script updates participant email addresses in Supabase that currently have placeholder emails ending with `@codered.local` by matching them with real email addresses from the CSV file.

## Important Safety Features

✅ **ONLY updates participants with `@codered.local` emails**  
✅ **NEVER touches participants with regular email addresses**  
✅ **Checks for duplicate emails before updating**  
✅ **Matches by both name and team for accuracy**

## Prerequisites

1. The CSV file must be in the root directory:
   ```
   CODE RED 3.0 Unisys Track Final Round Registration (Responses) - MasterData.csv
   ```

2. Environment variables must be set in `.env` or `.env.local`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Required npm packages (should already be installed):
   - `@supabase/supabase-js`
   - `dotenv`

## Usage

### Option 1: Node.js Script (Recommended)

Run the Node.js script which automatically parses the CSV and updates the database:

```bash
cd backend/migrations
node update_codered_local_emails.js
```

### Option 2: SQL Script (Manual)

If you prefer to use SQL directly:

1. Import the CSV data into Supabase (via dashboard or COPY command)
2. Run the SQL script: `update_codered_local_emails.sql`
3. Review the results before committing

## How It Works

1. **Reads CSV file** from the root directory
2. **Finds all participants** with emails ending in `@codered.local`
3. **Matches participants** with CSV data by:
   - Name (case-insensitive, normalized)
   - Team name (case-insensitive, normalized)
4. **Updates emails** only if:
   - Participant has `@codered.local` email
   - CSV has a valid email (not empty, not `@codered.local`)
   - No duplicate email exists in database
5. **Reports results** showing:
   - Successfully updated participants
   - Skipped participants (no match found)
   - Participants still with `@codered.local` emails

## Matching Logic

The script uses intelligent matching:

1. **Exact Match**: Name and team name match exactly (normalized)
2. **Partial Match**: Name partially matches and team matches
3. **Team Priority**: Prefers exact team name matches over partial matches

## Output Example

```
🚀 Starting email update process...

📖 Reading CSV file...
✅ Parsed 81 team members from CSV
   Found 81 members in CSV

🔍 Finding participants with @codered.local emails...
📋 Found 15 participants with @codered.local emails
   Found 15 participants to check

🔄 Matching and updating emails...

✅ Updated John Doe (Team Alpha): crut01p01@codered.local → john.doe@example.com
✅ Updated Jane Smith (Team Beta): crut02p01@codered.local → jane.smith@example.com
⏭️  No match found for Bob Johnson (Team Gamma)

============================================================
📊 UPDATE SUMMARY
============================================================
✅ Successfully updated: 12
⏭️  Skipped (no match or already has regular email): 3
❌ Errors: 0
📋 Total processed: 15
============================================================

⚠️  3 participants still have @codered.local emails (no match found in CSV):
   - Bob Johnson (Team Gamma): crut03p01@codered.local
   - Alice Brown (Team Delta): crut04p01@codered.local

✨ Process completed!
```

## CSV Format Expected

The CSV file should have the following columns:
- `Team Name`
- `Team Leader Name`
- `Team Leader Email ID`
- `Team Member 2 Name`
- `Team Member 2 Email ID`
- `Team Member 3 Name`
- `Team Member 3 Email id` (note: lowercase 'id')

## Troubleshooting

### "CSV file not found"
- Ensure the CSV file is in the root directory of the project
- Check the file name matches exactly (case-sensitive on some systems)

### "Missing Supabase credentials"
- Check your `.env` or `.env.local` file
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### "No match found" for participants
- Verify team names match between database and CSV
- Check for spelling variations or extra spaces
- Verify participant names match exactly (including middle names/initials)

### "Email already exists" error
- The script automatically skips updates if the email already exists for another participant
- Check the database for duplicate entries

## Safety Notes

- The script **NEVER** updates participants with regular email addresses
- All updates are logged to console for review
- The script checks for duplicate emails before updating
- You can review the SQL script (`update_codered_local_emails.sql`) to see exactly what queries will run

