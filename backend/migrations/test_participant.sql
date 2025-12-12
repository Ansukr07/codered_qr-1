-- ============================================
-- Test Participant Insert
-- ============================================

BEGIN;

INSERT INTO participants (
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
    'milan sampath',
    'milangs4606@gmail.com',
    'CR-TEST-P01',
    'CR-TEST-P01',
    'Test Team',
    'CR',
    'Main Hall',
    'TEST-001',
    FALSE,
    NOW()
)
ON CONFLICT (email) DO NOTHING;

COMMIT;


