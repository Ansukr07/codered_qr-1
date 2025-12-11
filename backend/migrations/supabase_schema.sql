-- ============================================
-- Code Red 3.0 - Supabase Database Schema
-- Migration from MongoDB to PostgreSQL (Supabase)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE USER TABLES
-- ============================================

-- Participants Table
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    participant_id VARCHAR(100) UNIQUE NOT NULL, -- e.g., CRU-T01-P01
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    team_id VARCHAR(100),
    track VARCHAR(50), -- CRU or CR
    hall VARCHAR(100), -- Main Hall, Small Hall 1, Small Hall 2
    seat_number VARCHAR(50), -- e.g. M-T6, S2-T12
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for participants
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_participant_id ON participants(participant_id);
CREATE INDEX idx_participants_qr_code ON participants(qr_code);
CREATE INDEX idx_participants_team_id ON participants(team_id);

-- Volunteers Table
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hashed
    qr_code VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for volunteers
CREATE INDEX idx_volunteers_email ON volunteers(email);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hashed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admins
CREATE INDEX idx_admins_email ON admins(email);

-- ============================================
-- AUTHENTICATION & SECURITY
-- ============================================

-- OTP Table
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for OTPs
CREATE INDEX idx_otps_email ON otps(email);
CREATE INDEX idx_otps_expires_at ON otps(expires_at);
CREATE INDEX idx_otps_is_used ON otps(is_used);

-- Auto-cleanup expired OTPs (runs via cron job or trigger)
-- Note: Supabase doesn't support TTL indexes like MongoDB, so use pg_cron or scheduled cleanup

-- ============================================
-- RESOURCES & TRANSACTIONS
-- ============================================

-- Resources Table
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    total_quantity INTEGER NOT NULL,
    distributed_quantity INTEGER DEFAULT 0,
    category VARCHAR(50) CHECK (category IN ('food', 'accommodation', 'chill_room', 'other')) DEFAULT 'other',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References participants.id
    resource_id UUID REFERENCES resources(id),
    volunteer_id UUID NOT NULL, -- References volunteers.id or admins.id
    action VARCHAR(20) CHECK (action IN ('claim', 'return', 'verify')) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_resource_id ON transactions(resource_id);
CREATE INDEX idx_transactions_volunteer_id ON transactions(volunteer_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_transactions_action ON transactions(action);

-- ============================================
-- GAMIFICATION
-- ============================================

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    category VARCHAR(50) CHECK (category IN ('general', 'fun', 'technical', 'social')) DEFAULT 'general',
    proof_type VARCHAR(20) CHECK (proof_type IN ('image', 'link', 'text')) DEFAULT 'image',
    requires_proof BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References participants.id
    task_id UUID NOT NULL REFERENCES tasks(id),
    team_id VARCHAR(100) NOT NULL,
    proof_url VARCHAR(500) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    verified_by UUID, -- References volunteers.id or admins.id
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for submissions
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_task_id ON submissions(task_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_team_id ON submissions(team_id);

-- ============================================
-- COMMUNICATION
-- ============================================

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    audience VARCHAR(20) CHECK (audience IN ('all', 'volunteers', 'participants')) DEFAULT 'all',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for announcements
CREATE INDEX idx_announcements_audience ON announcements(audience);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);

-- Help Requests Table
CREATE TABLE IF NOT EXISTS help_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References participants.id
    description TEXT NOT NULL,
    category VARCHAR(50) CHECK (category IN ('technical', 'food', 'supplies', 'general')) DEFAULT 'general',
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status VARCHAR(20) CHECK (status IN ('pending', 'resolved')) DEFAULT 'pending',
    resolved_by UUID, -- References volunteers.id or admins.id
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for help requests
CREATE INDEX idx_help_requests_user_id ON help_requests(user_id);
CREATE INDEX idx_help_requests_status ON help_requests(status);
CREATE INDEX idx_help_requests_category ON help_requests(category);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_help_requests_updated_at BEFORE UPDATE ON help_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

-- Note: Add specific RLS policies based on your authentication setup
-- Example policies would go here based on Supabase Auth integration

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE participants IS 'Stores participant information with email and QR code mapping';
COMMENT ON TABLE volunteers IS 'Stores volunteer accounts with email/password authentication';
COMMENT ON TABLE admins IS 'Stores admin accounts with email/password authentication';
COMMENT ON TABLE otps IS 'Stores OTP codes for participant email verification';
COMMENT ON TABLE resources IS 'Stores resources like food, sleeping bags, etc.';
COMMENT ON TABLE transactions IS 'Tracks all resource claims and returns';
COMMENT ON TABLE tasks IS 'Gamification tasks for participants';
COMMENT ON TABLE submissions IS 'Task submissions by participants';
COMMENT ON TABLE announcements IS 'System announcements';
COMMENT ON TABLE help_requests IS 'Help requests from participants';

