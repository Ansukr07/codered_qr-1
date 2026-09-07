-- CODERED 4.0 participant game layer
-- Run after supabase_schema.sql in the Supabase SQL editor.

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS username VARCHAR(40),
  ADD COLUMN IF NOT EXISTS bio VARCHAR(180),
  ADD COLUMN IF NOT EXISTS github_profile VARCHAR(500),
  ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS avatar_key VARCHAR(40) DEFAULT 'byte',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_username
  ON participants (LOWER(username)) WHERE username IS NOT NULL;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS icon VARCHAR(20) DEFAULT 'star',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE submissions
  ALTER COLUMN proof_url DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS proof_text VARCHAR(500),
  ADD COLUMN IF NOT EXISTS review_note VARCHAR(300);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_live_submission_per_team_task
  ON submissions (team_id, task_id)
  WHERE status IN ('pending', 'approved');

-- Private bucket; proof is viewed through short-lived signed URLs only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('quest-proofs', 'quest-proofs', FALSE, 2097152,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (title, description, points, category, proof_type, requires_proof, icon)
SELECT * FROM (VALUES
  ('Make a new ally', 'Meet someone outside your team and exchange CODERED profiles.', 20, 'social', 'image', TRUE, 'handshake'),
  ('Ship five commits', 'Push five meaningful commits to your team repository.', 30, 'technical', 'link', TRUE, 'code'),
  ('Mentor checkpoint', 'Attend a mentor session and record your key takeaway.', 15, 'general', 'text', TRUE, 'mentor'),
  ('Build your player card', 'Complete your public profile and exchange it with another participant.', 10, 'social', 'image', TRUE, 'card')
) AS seed(title, description, points, category, proof_type, requires_proof, icon)
WHERE NOT EXISTS (SELECT 1 FROM tasks);

