# MongoDB to Supabase Migration Guide

This directory contains scripts to migrate your Code Red 3.0 database from MongoDB to Supabase (PostgreSQL).

## Files

- `supabase_schema.sql` - Complete database schema for Supabase
- `migrate_to_supabase.js` - Main migration script
- `fix_unmatched_participants.js` - Helper script to manually fix unmatched participants
- `supabase_insert_participants.sql` - Generated SQL INSERT statements (created after running migration)

## Prerequisites

1. Install csv-parser:
```bash
cd backend
npm install csv-parser
```

2. Ensure your `.env` file has:
```
MONGODB_URI=your_mongodb_connection_string
```

3. Place the CSV file at the project root:
```
CODE RED 3.0 Final Round Registration (Responses) - Form Responses 1.csv
```

## Migration Steps

### Step 1: Create Supabase Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase_schema.sql`
4. Run the SQL script to create all tables

### Step 2: Run Migration Script

```bash
cd backend/migrations
node migrate_to_supabase.js
```

This will:
- Read all participants from the CSV file
- Fetch existing participants from MongoDB
- Match CSV emails to MongoDB qrCodes by name
- Generate SQL INSERT statements
- Create a mapping file for review

### Step 3: Review Mapping

Check `email_qrcode_mapping.json` to see:
- Which participants were matched
- Which participants couldn't be matched
- Match confidence levels

### Step 4: Fix Unmatched Participants (if any)

If there are unmatched participants, you can:

1. **Manual Fix**: Edit `email_qrcode_mapping.json` and add manual mappings
2. **Use Fix Script**: Run `node fix_unmatched_participants.js` to interactively fix matches

### Step 5: Execute SQL in Supabase

1. Review the generated `supabase_insert_participants.sql`
2. Copy and paste into Supabase SQL Editor
3. Execute to insert all participants

### Step 6: Migrate Other Data

After participants are migrated, you'll need to migrate:
- Resources
- Transactions
- Tasks & Submissions
- Announcements
- Help Requests
- Volunteers & Admins

## Matching Logic

The migration script matches participants using:
1. **Exact name match** (normalized, case-insensitive)
2. **Team-based matching** (if multiple candidates with same name)
3. **Manual review** for unmatched entries

## Notes

- The script uses `qrCode` from MongoDB as both `participant_id` and `qr_code` in Supabase
- Email addresses are normalized to lowercase
- Unmatched participants will need manual mapping
- All timestamps are preserved from MongoDB

## Troubleshooting

### "Cannot find module 'csv-parser'"
```bash
npm install csv-parser
```

### "CSV file not found"
Ensure the CSV file is at the project root with the exact filename:
`CODE RED 3.0 Final Round Registration (Responses) - Form Responses 1.csv`

### "MongoDB connection failed"
Check your `MONGODB_URI` in `.env` file

### Many unmatched participants
- Check if names in CSV match names in MongoDB exactly
- Use the fix script to manually map unmatched entries
- Consider fuzzy matching improvements

