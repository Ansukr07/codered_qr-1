import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { decryptNfcToken } from '../lib/nfc'

const baseUrl = process.env.NFC_TEST_BASE_URL || 'http://localhost:3010'
const databaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!databaseUrl || !serviceKey) throw new Error('Supabase test configuration is missing.')
const db = createClient(databaseUrl, serviceKey, { auth: { persistSession: false } })

type Session = { cookie: string }

async function json(path: string, init: RequestInit = {}, session?: Session) {
  const headers = new Headers(init.headers)
  headers.set('Origin', baseUrl)
  if (session?.cookie) headers.set('Cookie', session.cookie)
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers, redirect: 'manual' })
  const body = await response.json().catch(() => ({}))
  return { response, body }
}

async function login(path: string, body: Record<string, string>) {
  const result = await json(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  assert.equal(result.response.status, 200, `${path}: ${JSON.stringify(result.body)}`)
  const cookie = result.response.headers.get('set-cookie')?.split(';')[0]
  assert.ok(cookie, `${path} did not set an auth cookie`)
  return { cookie }
}

async function main() {
  const { data: storedTag, error: tagError } = await db.from('participant_tags').select('participant_id,public_token_ciphertext').eq('status', 'active').limit(1).single()
  assert.ifError(tagError)
  const token = decryptNfcToken(storedTag.public_token_ciphertext)

  let result = await json('/api/nfc/tags/not-a-token')
  assert.equal(result.response.status, 400)
  result = await json(`/api/nfc/tags/${token}`)
  assert.equal(result.response.status, 200, `Public badge read failed: ${JSON.stringify(result.body)}`)
  assert.equal(result.body.authenticated, false)
  assert.equal(result.body.resources.length, 0)

  result = await json('/api/nfc/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, requestId: crypto.randomUUID() }) })
  assert.equal(result.response.status, 401)

  const participant = await login('/api/auth/demo-login', {
    email: process.env.DEMO_ALICE_EMAIL!, password: process.env.DEMO_ALICE_PASSWORD!,
  })
  result = await json(`/api/nfc/tags/${token}`, {}, participant)
  assert.equal(result.response.status, 200)
  assert.equal(result.body.viewerRole, 'participant')
  result = await json('/api/nfc/my-tag', {}, participant)
  assert.equal(result.response.status, 200)
  assert.ok(Object.hasOwn(result.body, 'tag'))
  const hostileOrigin = await fetch(`${baseUrl}/api/nfc/connect`, { method: 'POST', headers: { Origin: 'https://hostile.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ token, requestId: crypto.randomUUID() }) })
  assert.equal(hostileOrigin.status, 403)
  result = await json('/api/nfc/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, requestId: 'bad-uuid' }) }, participant)
  assert.equal(result.response.status, 400)
  const connectRequestId = crypto.randomUUID()
  result = await json('/api/nfc/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, requestId: connectRequestId }) }, participant)
  assert.ok([200, 207].includes(result.response.status), JSON.stringify(result.body))
  result = await json('/api/nfc/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, requestId: connectRequestId }) }, participant)
  assert.equal(result.response.status, 200)
  assert.equal(result.body.duplicate, true)
  result = await json('/api/network/stats', {}, participant)
  assert.equal(result.response.status, 200)
  assert.equal(typeof result.body.connectionsMade, 'number')

  const volunteer = await login('/api/auth/login', {
    email: process.env.DEMO_VOLUNTEER_EMAIL!, password: process.env.DEMO_VOLUNTEER_PASSWORD!, role: 'volunteer',
  })
  result = await json(`/api/nfc/tags/${token}`, {}, volunteer)
  assert.equal(result.response.status, 200)
  assert.equal(result.body.viewerRole, 'volunteer')
  assert.ok(result.body.resources.length > 0, 'Volunteer badge view has no resources')
  const resource = result.body.resources[0]
  result = await json('/api/nfc/volunteer-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, resourceId: 'bad-uuid', action: 'claim', requestId: crypto.randomUUID() }) }, volunteer)
  assert.equal(result.response.status, 400)

  const admin = await login('/api/auth/login', {
    email: process.env.DEMO_ADMIN_EMAIL!, password: process.env.DEMO_ADMIN_PASSWORD!, role: 'admin',
  })
  result = await json(`/api/nfc/tags/${token}`, {}, admin)
  assert.equal(result.response.status, 200)
  assert.equal(result.body.viewerRole, 'admin')
  result = await json('/api/admin/nfc/tags/issue', {}, admin)
  assert.equal(result.response.status, 200)
  assert.ok(result.body.tags.some((tag: { participant_id: string }) => tag.participant_id === storedTag.participant_id))
  result = await json('/api/admin/nfc/tags/issue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participantId: 'bad-uuid' }) }, admin)
  assert.equal(result.response.status, 400)
  result = await json('/api/admin/nfc/tags/issue', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tagId: 'bad-uuid', status: 'lost' }) }, admin)
  assert.equal(result.response.status, 400)
  result = await json('/api/admin/nfc/tags/issue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participantId: storedTag.participant_id }) }, admin)
  assert.equal(result.response.status, 409)

  const { data: nfcResource } = await db.from('resources').select('id').eq('name', 'NFC Test Meal').maybeSingle()
  const resourceId = nfcResource?.id || resource?.id
  assert.ok(resourceId, 'No resource is available for the volunteer action test')
  const claimRequestId = crypto.randomUUID()
  result = await json('/api/nfc/volunteer-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, resourceId, action: 'claim', requestId: claimRequestId }) }, volunteer)
  assert.equal(result.response.status, 200, `Volunteer issue failed: ${JSON.stringify(result.body)}`)
  result = await json('/api/nfc/volunteer-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, resourceId, action: 'claim', requestId: claimRequestId }) }, volunteer)
  assert.equal(result.response.status, 200)
  assert.match(result.body.message, /already recorded/i)
  result = await json('/api/nfc/volunteer-action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, resourceId, action: 'return', requestId: crypto.randomUUID() }) }, volunteer)
  assert.equal(result.response.status, 200, `Volunteer return failed: ${JSON.stringify(result.body)}`)

  console.log('NFC API checks passed for public, participant, volunteer, and admin roles.')
}

main().catch(error => { console.error(error); process.exitCode = 1 })
