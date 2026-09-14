const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');
for (const filename of ['.env.local', '.env']) {
  const candidate = path.resolve(__dirname, '..', filename);
  if (fs.existsSync(candidate)) { dotenv.config({ path:candidate }); break; }
}
function required(name) { const value=process.env[name]?.trim(); if (!value) throw new Error(`${name} is required`); return value; }
module.exports = {
  nodeEnv:process.env.NODE_ENV || 'development',
  clientOrigins:(process.env.CLIENT_ORIGINS || 'http://localhost:5173').split(',').map(v=>v.trim()).filter(Boolean),
  supabaseUrl:required('SUPABASE_URL'), supabaseServiceRoleKey:required('SUPABASE_SERVICE_ROLE_KEY'), jwtSecret:required('JWT_SECRET'),
};
