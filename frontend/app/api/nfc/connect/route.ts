import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'
import { hashNfcToken, hasTrustedOrigin, isValidNfcToken, normalizeConnectionPair } from '@/lib/nfc'

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: 'Untrusted request origin.' }, { status: 403 })
  if (!supabase) return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 })
  const auth = requireRole(request, ['participant'])
  if (auth instanceof NextResponse) return auth
  const { token, requestId } = await request.json().catch(() => ({}))
  if (!isValidNfcToken(token || '')) return NextResponse.json({ message: 'Invalid badge token.' }, { status: 400 })
  if (!requestId || !/^[0-9a-f-]{36}$/i.test(requestId)) return NextResponse.json({ message: 'Invalid request ID.' }, { status: 400 })

  const { data: previous } = await supabase.from('nfc_events').select('metadata').eq('request_id', requestId).maybeSingle()
  if (previous) return NextResponse.json({ message: 'Connection already recorded.', duplicate: true, ...previous.metadata })

  const { data: tag } = await supabase.from('participant_tags').select('id,participant_id,status').eq('public_token_hash', hashNfcToken(token)).maybeSingle()
  if (!tag || tag.status !== 'active') return NextResponse.json({ message: 'This badge is inactive.' }, { status: 410 })
  if (tag.participant_id === auth.user.userId) return NextResponse.json({ message: 'You cannot connect with your own badge.' }, { status: 400 })

  const pair = normalizeConnectionPair(auth.user.userId, tag.participant_id)
  const tapField = pair.actorIsLow ? 'low_tapped_high_at' : 'high_tapped_low_at'
  const now = new Date().toISOString()
  const { data: existing } = await supabase.from('participant_connections').select('*').eq('participant_low_id', pair.low).eq('participant_high_id', pair.high).maybeSingle()
  const connectionPayload = existing
    ? { ...existing, [tapField]: existing[tapField] || now }
    : { participant_low_id: pair.low, participant_high_id: pair.high, [tapField]: now }
  const { data: connection, error } = await supabase.from('participant_connections').upsert(connectionPayload).select().single()
  if (error) return NextResponse.json({ message: 'Could not save this connection.' }, { status: 500 })
  const mutual = Boolean(connection.low_tapped_high_at && connection.high_tapped_low_at)
  await supabase.from('nfc_events').insert({ tag_id: tag.id, actor_id: auth.user.userId, actor_role: 'participant', event_type: 'profile_connected', request_id: requestId, metadata: { mutual } })
  return NextResponse.json({ message: mutual ? 'You are now mutual connections!' : 'Connection saved.', mutual })
}
