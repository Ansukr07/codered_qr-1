import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) throw new Error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')

const email = String(process.argv[2] || '').trim().toLowerCase()
const name = String(process.argv[3] || '').trim()
const requestedId = String(process.argv[4] || '').trim().toUpperCase()

if (!/^\S+@\S+\.\S+$/.test(email) || !name || !requestedId) {
  throw new Error('Usage: tsx scripts/upsert-participant.ts <email> <name> <participant-id>')
}

async function main() {
  const supabase = createClient(url!, serviceKey!, { auth: { persistSession: false } })
  const profile = {
    email,
    name,
    participant_id: requestedId,
    qr_code: requestedId,
    is_email_verified: true,
  }

  const existing = await supabase.from('participants').select('id').eq('email', email).maybeSingle()
  if (existing.error) throw existing.error

  const query = existing.data
    ? supabase.from('participants').update(profile).eq('id', existing.data.id)
    : supabase.from('participants').insert(profile)
  const result = await query.select('id,email,name,participant_id,team_id,track').single()

  if (result.error) throw result.error
  console.log(JSON.stringify({ action: existing.data ? 'updated' : 'created', participant: result.data }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
