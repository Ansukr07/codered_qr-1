const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');
for (const filename of ['.env.local', '.env']) {
  const candidate = path.resolve(__dirname, '..', filename);
  if (fs.existsSync(candidate)) { dotenv.config({ path:candidate }); break; }
}
function required(name) { const value=process.env[name]?.trim(); if (!value) throw new Error(`${name} is required`); return value; }
function json(name,fallback){const raw=process.env[name]?.trim();if(!raw)return fallback;try{return JSON.parse(raw);}catch{throw new Error(`${name} must contain valid JSON`);}}
module.exports = {
  nodeEnv:process.env.NODE_ENV || 'development',
  clientOrigins:(process.env.CLIENT_ORIGINS || 'http://localhost:5173').split(',').map(v=>v.trim()).filter(Boolean),
  supabaseUrl:required('SUPABASE_URL'), supabaseServiceRoleKey:required('SUPABASE_SERVICE_ROLE_KEY'), jwtSecret:required('JWT_SECRET'),
  nfcEncryptionKey:process.env.NFC_TOKEN_ENCRYPTION_KEY?.trim() || required('JWT_SECRET'),
  publicAppUrl:(process.env.PUBLIC_APP_URL || 'http://localhost:5173').replace(/\/$/,''),
  submissionsOpen:process.env.SUBMISSIONS_OPEN==='true',
  eventSchedule:json('EVENT_SCHEDULE_JSON',[]),
};
