import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const required = (name:string) => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

async function upsertStaff(table:'admins'|'volunteers', name:string, email:string, password:string) {
  const supabase = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), { auth:{ persistSession:false, autoRefreshToken:false } })
  const normalizedEmail = email.toLowerCase()
  const { data: existing, error: readError } = await supabase.from(table).select('id').eq('email', normalizedEmail).maybeSingle()
  if (readError) throw readError
  const payload:Record<string,unknown> = { name, email:normalizedEmail, password:await bcrypt.hash(password, 12) }
  if (table === 'volunteers' && !existing) payload.qr_code = randomUUID()
  const query = existing ? supabase.from(table).update(payload).eq('id', existing.id) : supabase.from(table).insert(payload)
  const { error } = await query
  if (error) throw error
  return existing ? 'updated' : 'created'
}

async function upsertParticipant(profile:Record<string,unknown>) {
  const supabase = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), { auth:{ persistSession:false, autoRefreshToken:false } })
  const email = String(profile.email).toLowerCase()
  const { data: existing, error: readError } = await supabase.from('participants').select('id').eq('email', email).maybeSingle()
  if (readError) throw readError
  const query = existing ? supabase.from('participants').update(profile).eq('id', existing.id) : supabase.from('participants').insert(profile)
  const { error } = await query
  if (error) throw error
  return existing ? 'updated' : 'created'
}

async function main() {
  const adminEmail = required('DEMO_ADMIN_EMAIL')
  const volunteerEmail = required('DEMO_VOLUNTEER_EMAIL')
  const adminResult = await upsertStaff('admins', 'NFC Demo Admin', adminEmail, required('DEMO_ADMIN_PASSWORD'))
  const volunteerResult = await upsertStaff('volunteers', 'NFC Demo Volunteer', volunteerEmail, required('DEMO_VOLUNTEER_PASSWORD'))
  console.log(`Demo admin ${adminResult}: ${adminEmail}`)
  console.log(`Demo volunteer ${volunteerResult}: ${volunteerEmail}`)

  const supabase = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), { auth:{ persistSession:false, autoRefreshToken:false } })
  for (const account of [{table:'admins',email:adminEmail,password:required('DEMO_ADMIN_PASSWORD')},{table:'volunteers',email:volunteerEmail,password:required('DEMO_VOLUNTEER_PASSWORD')}]) {
    const { data, error } = await supabase.from(account.table).select('password').eq('email', account.email).single()
    if (error || !data || !await bcrypt.compare(account.password, data.password)) throw new Error(`${account.table} password verification failed`)
  }
  console.log('Stored password hashes verified')

  const aliceEmail = required('DEMO_ALICE_EMAIL')
  const bobEmail = required('DEMO_BOB_EMAIL')
  const aliceResult = await upsertParticipant({ name:'Alice Demo', email:aliceEmail, participant_id:'DEMO-ALICE', qr_code:'codered-demo-alice', team_id:'PIXEL-PIONEERS', track:'Main Track', is_email_verified:true, username:'alice-demo', bio:'Frontend builder exploring CODERED 4.0.', github_profile:'https://github.com/', linkedin_url:null, portfolio_url:null, avatar_key:'nova', onboarding_completed:true })
  const bobResult = await upsertParticipant({ name:'Bob Demo', email:bobEmail, participant_id:'DEMO-BOB', qr_code:'codered-demo-bob', team_id:'BYTE-BUILDERS', track:'Main Track', is_email_verified:true, username:'bob-demo', bio:'Backend builder testing NFC connections.', github_profile:'https://github.com/', linkedin_url:null, portfolio_url:null, avatar_key:'byte', onboarding_completed:true })
  console.log(`Demo participant Alice ${aliceResult}: ${aliceEmail}`)
  console.log(`Demo participant Bob ${bobResult}: ${bobEmail}`)
}

main().catch(error => { console.error(`Demo seed failed: ${error.message}`); process.exitCode=1 })
