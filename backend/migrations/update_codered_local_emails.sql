-- ============================================
-- Update @codered.local emails from CSV data
-- This script updates only participants with @codered.local emails
-- DO NOT touch participants with regular email addresses
-- ============================================

-- Step 1: Create a temporary table to hold CSV data
CREATE TEMP TABLE IF NOT EXISTS csv_team_data (
    sl_no INTEGER,
    team_name VARCHAR(255),
    problem_statement_code VARCHAR(50),
    team_leader_name VARCHAR(255),
    team_leader_gender VARCHAR(50),
    team_leader_email VARCHAR(255),
    team_leader_contact VARCHAR(50),
    team_leader_usn VARCHAR(255),
    team_leader_dept VARCHAR(255),
    team_leader_sem VARCHAR(50),
    member2_name VARCHAR(255),
    member2_gender VARCHAR(50),
    member2_email VARCHAR(255),
    member2_contact VARCHAR(50),
    member2_usn VARCHAR(255),
    member2_dept VARCHAR(255),
    member2_sem VARCHAR(50),
    member3_name VARCHAR(255),
    member3_gender VARCHAR(50),
    member3_email VARCHAR(255),
    member3_contact VARCHAR(50),
    member3_usn VARCHAR(255),
    member3_dept VARCHAR(255),
    member3_sem VARCHAR(50)
);

-- Step 2: Load CSV data into temporary table
-- Note: You'll need to manually import the CSV or use COPY command
-- For Supabase, you can use the SQL Editor to import or use COPY FROM
-- Example (adjust path as needed):
-- COPY csv_team_data FROM '/path/to/CODE RED 3.0 Unisys Track Final Round Registration (Responses) - MasterData.csv' 
-- WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Alternative: Insert data manually or use Supabase's import feature
-- The CSV data will be inserted here or imported via Supabase dashboard

-- Step 3: Create a unified view of all team members from CSV
CREATE OR REPLACE TEMP VIEW csv_all_members AS
SELECT 
    TRIM(UPPER(team_name)) as team_name_upper,
    TRIM(team_name) as team_name,
    TRIM(team_leader_name) as member_name,
    LOWER(TRIM(team_leader_email)) as member_email,
    1 as member_position
FROM csv_team_data
WHERE team_leader_name IS NOT NULL AND team_leader_name != ''
UNION ALL
SELECT 
    TRIM(UPPER(team_name)) as team_name_upper,
    TRIM(team_name) as team_name,
    TRIM(member2_name) as member_name,
    LOWER(TRIM(member2_email)) as member_email,
    2 as member_position
FROM csv_team_data
WHERE member2_name IS NOT NULL AND member2_name != ''
UNION ALL
SELECT 
    TRIM(UPPER(team_name)) as team_name_upper,
    TRIM(team_name) as team_name,
    TRIM(member3_name) as member_name,
    LOWER(TRIM(member3_email)) as member_email,
    3 as member_position
FROM csv_team_data
WHERE member3_name IS NOT NULL AND member3_name != '';

-- Step 4: Check which participants have @codered.local emails and need updating
-- This query shows what will be updated (for verification)
SELECT 
    p.id,
    p.name as participant_name,
    p.email as current_email,
    p.team_id,
    csv.team_name as csv_team_name,
    csv.member_name as csv_member_name,
    csv.member_email as new_email,
    CASE 
        WHEN LOWER(TRIM(p.team_id)) = csv.team_name_upper THEN 'Team Match'
        WHEN LOWER(TRIM(p.team_id)) LIKE '%' || LOWER(csv.team_name) || '%' THEN 'Partial Team Match'
        ELSE 'Name Only Match'
    END as match_type
FROM participants p
INNER JOIN csv_all_members csv ON 
    -- Match by name (case-insensitive, trimmed)
    LOWER(TRIM(p.name)) = LOWER(TRIM(csv.member_name))
    -- AND match by team (case-insensitive, trimmed)
    AND (
        LOWER(TRIM(p.team_id)) = csv.team_name_upper
        OR LOWER(TRIM(p.team_id)) LIKE '%' || LOWER(csv.team_name) || '%'
        OR LOWER(csv.team_name) LIKE '%' || LOWER(TRIM(p.team_id)) || '%'
    )
WHERE 
    -- Only update participants with @codered.local emails
    p.email LIKE '%@codered.local'
    -- Ensure CSV has a valid email (not empty, not null)
    AND csv.member_email IS NOT NULL 
    AND csv.member_email != ''
    AND csv.member_email NOT LIKE '%@codered.local'
ORDER BY p.team_id, p.name;

-- Step 5: Update emails for participants with @codered.local
-- This will ONLY update participants who:
-- 1. Have email ending with @codered.local
-- 2. Match by name and team from CSV
-- 3. CSV has a valid email address
UPDATE participants p
SET 
    email = csv.member_email,
    updated_at = NOW()
FROM csv_all_members csv
WHERE 
    -- Match by name (case-insensitive, trimmed)
    LOWER(TRIM(p.name)) = LOWER(TRIM(csv.member_name))
    -- AND match by team (case-insensitive, trimmed)
    AND (
        LOWER(TRIM(p.team_id)) = csv.team_name_upper
        OR LOWER(TRIM(p.team_id)) LIKE '%' || LOWER(csv.team_name) || '%'
        OR LOWER(csv.team_name) LIKE '%' || LOWER(TRIM(p.team_id)) || '%'
    )
    -- Only update @codered.local emails
    AND p.email LIKE '%@codered.local'
    -- Ensure CSV has a valid email (not empty, not null, not @codered.local)
    AND csv.member_email IS NOT NULL 
    AND csv.member_email != ''
    AND csv.member_email NOT LIKE '%@codered.local';

-- Step 6: Show summary of updates
SELECT 
    COUNT(*) as total_updated,
    COUNT(DISTINCT team_id) as teams_affected
FROM participants
WHERE email NOT LIKE '%@codered.local'
    AND updated_at >= (SELECT MAX(updated_at) - INTERVAL '1 minute' FROM participants);

-- Step 7: Show participants that still have @codered.local emails (couldn't be matched)
SELECT 
    p.id,
    p.name,
    p.email,
    p.team_id,
    'No match found in CSV' as reason
FROM participants p
WHERE p.email LIKE '%@codered.local'
    AND NOT EXISTS (
        SELECT 1 
        FROM csv_all_members csv
        WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(csv.member_name))
            AND (
                LOWER(TRIM(p.team_id)) = csv.team_name_upper
                OR LOWER(TRIM(p.team_id)) LIKE '%' || LOWER(csv.team_name) || '%'
                OR LOWER(csv.team_name) LIKE '%' || LOWER(TRIM(p.team_id)) || '%'
            )
    )
ORDER BY p.team_id, p.name;

-- Cleanup (optional - temp tables are automatically dropped at session end)
-- DROP TABLE IF EXISTS csv_team_data;
-- DROP VIEW IF EXISTS csv_all_members;

