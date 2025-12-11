-- ============================================

-- Manually Matched Participants

-- Generated: 2025-12-11T13:27:38.520Z

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
    'Rohith GN',
    'rohithgn05@gmail.com',
    'CR-T28-P04',
    'CR-T28-P04',
    'APEX-AI-X',
    'CR',
    NULL,
    NULL,
    FALSE,
    '2025-12-11T13:27:38.521Z'::timestamp
)
ON CONFLICT (email) DO NOTHING;


COMMIT;