import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'
import { createNfcToken, encryptNfcToken, hashNfcToken, hasTrustedOrigin } from '@/lib/nfc'

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: 'Untrusted request origin.' }, { status: 403 })
  if (!supabase) return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 })
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth
  const { participantId } = await request.json().catch(() => ({}))
  if (!participantId) return NextResponse.json({ message: 'Participant ID is required.' }, { status: 400 })
  const { data: participant } = await supabase.from('participants').select('id,name,participant_id').eq('id', participantId).maybeSingle()
  if (!participant) return NextResponse.json({ message: 'Participant not found.' }, { status: 404 })
  const { data: active } = await supabase.from('participant_tags').select('id').eq('participant_id', participant.id).eq('status', 'active').maybeSingle()
  if (active) return NextResponse.json({ message: 'Participant already has an active tag.' }, { status: 409 })
  const token = createNfcToken()
  const { data: tag, error } = await supabase.from('participant_tags').insert({ participant_id: participant.id, public_token_hash: hashNfcToken(token), public_token_ciphertext: encryptNfcToken(token), token_hint: token.slice(-8), assigned_by: auth.user.userId }).select('id,token_hint,status,assigned_at').single()
  if (error) return NextResponse.json({ message: 'Could not issue tag.' }, { status: 500 })
  const origin = new URL(request.url).origin
  return NextResponse.json({ tag, participant, token, url: `${origin}/nfc/t/${token}`, warning: 'This URL is shown once. Program and verify the tag now.' }, { status: 201 })
}
