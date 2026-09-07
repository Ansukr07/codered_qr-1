-- Code Red: MongoDB/Mongoose -> Supabase PostgreSQL
-- Schema derived from backend/models/*.js.
-- MongoDB ObjectIds must be mapped to UUIDs by the data migration script.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- The User model is the target of the refs in HelpRequest, Submission, and
-- Transaction. Specialized Admin/Volunteer/Participant collections remain
-- separate because they are separate Mongoose models.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'participant'
    CHECK (role IN ('admin', 'volunteer', 'participant')),
  team_id TEXT,
  qr_code TEXT NOT NULL UNIQUE,
  track TEXT,
  hall TEXT,
  seat_number TEXT,
  github_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_team_id_idx ON users (team_id);

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  qr_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  participant_id TEXT NOT NULL UNIQUE,
  qr_code TEXT NOT NULL UNIQUE,
  team_id TEXT,
  track TEXT,
  hall TEXT,
  seat_number TEXT,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS participants_team_id_idx ON participants (team_id);

CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS otps_email_idx ON otps (email);
CREATE INDEX IF NOT EXISTS otps_expires_at_idx ON otps (expires_at);

CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  total_quantity INTEGER NOT NULL,
  distributed_quantity INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('food', 'accommodation', 'chill_room', 'coffee', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'fun', 'technical', 'social')),
  proof_type TEXT NOT NULL DEFAULT 'image'
    CHECK (proof_type IN ('image', 'link', 'text')),
  requires_proof BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  audience TEXT NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all', 'volunteers', 'participants')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('technical', 'food', 'supplies', 'general')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved')),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  proof_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  volunteer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('claim', 'return', 'verify')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS help_requests_user_id_idx ON help_requests (user_id);
CREATE INDEX IF NOT EXISTS help_requests_status_idx ON help_requests (status);
CREATE INDEX IF NOT EXISTS submissions_user_id_idx ON submissions (user_id);
CREATE INDEX IF NOT EXISTS submissions_task_id_idx ON submissions (task_id);
CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions (status);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions (user_id);
CREATE INDEX IF NOT EXISTS transactions_resource_id_idx ON transactions (resource_id);
CREATE INDEX IF NOT EXISTS transactions_volunteer_id_idx ON transactions (volunteer_id);
CREATE INDEX IF NOT EXISTS transactions_timestamp_idx ON transactions (timestamp);

DROP TRIGGER IF EXISTS resources_set_updated_at ON resources;
CREATE TRIGGER resources_set_updated_at BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS help_requests_set_updated_at ON help_requests;
CREATE TRIGGER help_requests_set_updated_at BEFORE UPDATE ON help_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS submissions_set_updated_at ON submissions;
CREATE TRIGGER submissions_set_updated_at BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS is deny-by-default. The application should use the Supabase service
-- role only in trusted server-side routes. These policies allow authenticated
-- users to read public content and their own records; staff access is granted
-- through the users.role column.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('admin', 'volunteer')
  );
$$;

DROP POLICY IF EXISTS announcements_authenticated_read ON announcements;
CREATE POLICY announcements_authenticated_read ON announcements
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS tasks_authenticated_read ON tasks;
CREATE POLICY tasks_authenticated_read ON tasks
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS resources_authenticated_read ON resources;
CREATE POLICY resources_authenticated_read ON resources
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS users_self_read ON users;
CREATE POLICY users_self_read ON users
  FOR SELECT TO authenticated USING (id = auth.uid() OR is_staff());
DROP POLICY IF EXISTS participants_self_read ON participants;
CREATE POLICY participants_self_read ON participants
  FOR SELECT TO authenticated USING (is_staff() OR email = (auth.jwt() ->> 'email'));
DROP POLICY IF EXISTS volunteers_staff_read ON volunteers;
CREATE POLICY volunteers_staff_read ON volunteers
  FOR SELECT TO authenticated USING (is_staff() OR email = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS help_requests_owner_or_staff ON help_requests;
CREATE POLICY help_requests_owner_or_staff ON help_requests
  FOR ALL TO authenticated USING (user_id = auth.uid() OR is_staff())
  WITH CHECK (user_id = auth.uid() OR is_staff());
DROP POLICY IF EXISTS submissions_owner_or_staff ON submissions;
CREATE POLICY submissions_owner_or_staff ON submissions
  FOR ALL TO authenticated USING (user_id = auth.uid() OR is_staff())
  WITH CHECK (user_id = auth.uid() OR is_staff());
DROP POLICY IF EXISTS transactions_staff_only ON transactions;
CREATE POLICY transactions_staff_only ON transactions
  FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

COMMENT ON TABLE users IS 'Mongoose User model; referenced by userId fields in dependent models.';
COMMENT ON TABLE otps IS 'OTP records; expired rows should be periodically deleted by pg_cron or an application job.';
