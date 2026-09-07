/*
 * Migrate all Mongoose collections into migrations/001_mongodb_to_supabase.sql.
 * Run from the repository root after applying the SQL migration:
 *   node scripts/migrateToSupabase.js
 *
 * Required environment variables:
 *   MONGODB_URI, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const required = ['MONGODB_URI', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required`);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Stable UUIDs make the script safely repeatable and preserve Mongo references.
function mongoIdToUuid(value) {
  const hex = crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 32);
  const bytes = Buffer.from(hex, 'hex');
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5-style deterministic UUID
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = bytes.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const value = (doc, key, fallback = null) => doc[key] === undefined ? fallback : doc[key];
const date = (v, fallback = null) => v ? new Date(v).toISOString() : fallback;
const idOf = doc => mongoIdToUuid(doc._id);
const ref = (doc, key) => doc[key] == null ? null : mongoIdToUuid(doc[key]);

async function read(collection) {
  return mongoose.connection.collection(collection).find({}).toArray();
}

async function insert(table, rows) {
  if (!rows.length) return;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabase.from(table).insert(batch);
    if (error) throw new Error(`${table} insert failed: ${error.message}`);
  }
  console.log(`Migrated ${rows.length} ${table}`);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to MongoDB database ${mongoose.connection.name}`);

  const docs = {};
  for (const name of ['users', 'admins', 'volunteers', 'participants', 'otps', 'resources', 'tasks', 'announcements', 'helprequests', 'submissions', 'transactions']) {
    docs[name] = await read(name);
  }

  await insert('users', docs.users.map(d => ({
    id: idOf(d), name: d.name, email: d.email || null, password: d.password || null,
    role: d.role || 'participant', team_id: d.teamId || null, qr_code: d.qrCode,
    track: d.track || null, hall: d.hall || null, seat_number: d.seatNumber || null,
    github_link: d.githubLink || null, created_at: date(d.createdAt)
  })));
  await insert('admins', docs.admins.map(d => ({ id: idOf(d), name: d.name, email: d.email,
    password: d.password, created_at: date(d.createdAt) })));
  await insert('volunteers', docs.volunteers.map(d => ({ id: idOf(d), name: d.name, email: d.email,
    password: d.password, qr_code: d.qrCode || null, created_at: date(d.createdAt) })));
  await insert('participants', docs.participants.map(d => ({ id: idOf(d), name: d.name, email: d.email,
    participant_id: d.participantId, qr_code: d.qrCode, team_id: d.teamId || null,
    track: d.track || null, hall: d.hall || null, seat_number: d.seatNumber || null,
    is_email_verified: !!d.isEmailVerified, created_at: date(d.createdAt) })));

  await insert('otps', docs.otps.map(d => ({ id: idOf(d), email: d.email, otp: d.otp,
    expires_at: date(d.expiresAt), is_used: !!d.isUsed, created_at: date(d.createdAt) })));
  await insert('resources', docs.resources.map(d => ({ id: idOf(d), name: d.name,
    total_quantity: d.totalQuantity, distributed_quantity: value(d, 'distributedQuantity', 0),
    category: d.category || 'other', created_at: date(d.createdAt), updated_at: date(d.updatedAt, date(d.createdAt)) })));
  await insert('tasks', docs.tasks.map(d => ({ id: idOf(d), title: d.title, description: d.description,
    points: value(d, 'points', 1), category: d.category || 'general', proof_type: d.proofType || 'image',
    requires_proof: value(d, 'requiresProof', true), created_at: date(d.createdAt) })));
  await insert('announcements', docs.announcements.map(d => ({ id: idOf(d), title: d.title,
    message: d.message, priority: d.priority || 'medium', audience: d.audience || 'all', created_at: date(d.createdAt) })));

  await insert('help_requests', docs.helprequests.map(d => ({ id: idOf(d), user_id: ref(d, 'userId'),
    description: d.description, category: d.category || 'general', priority: d.priority || 'medium',
    status: d.status || 'pending', resolved_by: ref(d, 'resolvedBy'), resolved_at: date(d.resolvedAt),
    created_at: date(d.createdAt), updated_at: date(d.updatedAt, date(d.createdAt)) })));
  await insert('submissions', docs.submissions.map(d => ({ id: idOf(d), user_id: ref(d, 'userId'),
    task_id: ref(d, 'taskId'), team_id: d.teamId, proof_url: d.proofUrl, status: d.status || 'pending',
    verified_by: ref(d, 'verifiedBy'), verified_at: date(d.verifiedAt), created_at: date(d.createdAt),
    updated_at: date(d.updatedAt, date(d.createdAt)) })));
  await insert('transactions', docs.transactions.map(d => ({ id: idOf(d), user_id: ref(d, 'userId'),
    resource_id: ref(d, 'resourceId'), volunteer_id: ref(d, 'volunteerId'), action: d.action,
    timestamp: date(d.timestamp), })));

  console.log('MongoDB to Supabase migration completed.');
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
});
