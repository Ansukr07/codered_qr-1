# MongoDB to Supabase Migration - Complete Guide

## Overview

This migration moves your Code Red 3.0 database from MongoDB to Supabase (PostgreSQL), specifically mapping participant emails from your registration CSV to existing MongoDB qrCodes.

## What Was Created

### 1. Database Schema (`supabase_schema.sql`)
Complete PostgreSQL schema with:
- ✅ **Participants** table (with email, qrCode, participantId mapping)
- ✅ **Volunteers** table
- ✅ **Admins** table
- ✅ **OTP** table (for email verification)
- ✅ **Resources** table
- ✅ **Transactions** table (tracks claims/returns)
- ✅ **Tasks** table (gamification)
- ✅ **Submissions** table
- ✅ **Announcements** table
- ✅ **Help Requests** table
- ✅ Indexes for performance
- ✅ Triggers for `updated_at` timestamps
- ✅ Row Level Security (RLS) enabled

### 2. Migration Script (`migrate_to_supabase.js`)
Automated script that:
- ✅ Reads all participant emails from CSV (Team Leader + Members 2, 3, 4)
- ✅ Fetches existing participants from MongoDB
- ✅ Matches CSV emails to MongoDB qrCodes by name
- ✅ Generates SQL INSERT statements
- ✅ Creates mapping file for review

### 3. Helper Script (`fix_unmatched_participants.js`)
Interactive tool to:
- ✅ Manually match unmatched participants
- ✅ Shows similar names from MongoDB
- ✅ Generates SQL for manual matches

## How It Works

### Matching Logic

1. **Name Normalization**: Both CSV and MongoDB names are normalized (lowercase, trimmed, special chars removed)

2. **Exact Match**: If normalized names match exactly → automatic match

3. **Team-Based Match**: If multiple candidates with same name → uses teamId for disambiguation

4. **Manual Review**: Unmatched participants are flagged for manual mapping

### Data Mapping

```
CSV Data → MongoDB → Supabase
─────────────────────────────
Email    → qrCode  → email + qr_code
Name     → Name    → name
Team     → teamId  → team_id
QR Code  → qrCode  → participant_id + qr_code
```

## Quick Start

### Step 1: Setup Supabase Schema

1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `supabase_schema.sql`
3. Execute to create all tables

### Step 2: Run Migration

```bash
cd backend/migrations
node migrate_to_supabase.js
```

This generates:
- `supabase_insert_participants.sql` - SQL INSERT statements
- `email_qrcode_mapping.json` - Mapping review file

### Step 3: Review & Fix

1. Check `email_qrcode_mapping.json` for unmatched participants
2. If needed, run: `node fix_unmatched_participants.js`
3. Review generated SQL files

### Step 4: Execute in Supabase

1. Copy `supabase_insert_participants.sql` content
2. Paste in Supabase SQL Editor
3. Execute to insert participants

## File Structure

```
backend/migrations/
├── supabase_schema.sql              # Complete database schema
├── migrate_to_supabase.js           # Main migration script
├── fix_unmatched_participants.js    # Manual matching helper
├── README.md                        # Detailed instructions
├── MIGRATION_SUMMARY.md             # This file
├── supabase_insert_participants.sql # Generated SQL (after running)
└── email_qrcode_mapping.json       # Mapping review (after running)
```

## Important Notes

### Email Mapping
- ✅ CSV emails are mapped to MongoDB qrCodes
- ✅ Each participant gets their email from CSV
- ✅ qrCode from MongoDB is preserved
- ✅ participant_id = qrCode (for consistency)

### Data Preservation
- ✅ All MongoDB timestamps are preserved
- ✅ Team IDs, tracks, halls, seats are migrated
- ✅ qrCodes remain unchanged

### Unmatched Participants
- ⚠️ Participants that can't be matched need manual review
- Use `fix_unmatched_participants.js` for interactive matching
- Or manually edit the mapping JSON file

## Next Steps After Migration

1. **Test Data**: Verify participants in Supabase dashboard
2. **Migrate Other Data**: 
   - Resources
   - Transactions
   - Tasks & Submissions
   - Announcements
   - Help Requests
3. **Update Backend**: Switch from Mongoose to Supabase client
4. **Update Frontend**: Update API endpoints if needed

## Troubleshooting

### "No participants matched"
- Check if CSV column names match exactly
- Verify MongoDB connection string
- Ensure participants exist in MongoDB

### "Many unmatched"
- Names might have slight variations
- Use the fix script for manual matching
- Consider improving fuzzy matching logic

### "SQL errors in Supabase"
- Check for duplicate emails (should be unique)
- Verify UUID extension is enabled
- Check for special characters in names

## Support

If you encounter issues:
1. Check the mapping JSON file for details
2. Review console output from migration script
3. Verify CSV file format matches expected structure

