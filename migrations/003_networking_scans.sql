-- Unique participant-to-participant profile exchanges.
CREATE TABLE IF NOT EXISTS profile_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  scanner_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT profile_scans_not_self CHECK (profile_id <> scanner_id),
  CONSTRAINT profile_scans_unique_pair UNIQUE (profile_id, scanner_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_scans_profile ON profile_scans(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_scans_scanner ON profile_scans(scanner_id);
ALTER TABLE profile_scans ENABLE ROW LEVEL SECURITY;

