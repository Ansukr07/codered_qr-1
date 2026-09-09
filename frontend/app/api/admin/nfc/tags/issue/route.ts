import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'
import { createNfcToken, decryptNfcToken, encryptNfcToken, hashNfcToken, hasTrustedOrigin, isValidUuid, publicAppOrigin } from '@/lib/nfc'

export async function GET(request: NextRequest) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 })
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth
  const participantId = new URL(request.url).searchParams.get('participantId')
  if (participantId) {
    if (!isValidUuid(participantId)) return NextResponse.json({ message: 'A valid participant ID is required.' }, { status: 400 })
    const { data: tag, error } = await supabase.from('participant_tags')
      .select('id,participant_id,public_token_ciphertext,token_hint,status,assigned_at,revoked_at')
      .eq('participant_id', participantId).eq('status', 'active').maybeSingle()
    if (error) return NextResponse.json({ message: 'Could not load this NFC tag.' }, { status: 500 })
    if (!tag) return NextResponse.json({ tag: null })
    try {
      const token = decryptNfcToken(tag.public_token_ciphertext)
      const { public_token_ciphertext: _privateValue, ...safeTag } = tag
      return NextResponse.json({ tag: { ...safeTag, url: `${publicAppOrigin(request.url)}/nfc/t/${token}` } })
    } catch {
      return NextResponse.json({ message: 'This badge cannot be recovered with the configured encryption key.' }, { status: 500 })
    }
  }
  const { data, error } = await supabase.from('participant_tags').select('id,participant_id,token_hint,status,assigned_at,revoked_at').order('assigned_at', { ascending: false })
  if (error) return NextResponse.json({ message: 'Could not load NFC tags.' }, { status: 500 })
  return NextResponse.json({ tags: data || [] })
}

export async function PATCH(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: 'Untrusted request origin.' }, { status: 403 })
  if (!supabase) return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 })
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth
  const { tagId, status } = await request.json().catch(() => ({}))
  if (!isValidUuid(tagId) || !['lost', 'revoked'].includes(status)) {
    return NextResponse.json({ message: 'A valid tag and revocation reason are required.' }, { status: 400 })
  }
  const { data: tag, error } = await supabase.from('participant_tags')
    .update({ status, revoked_at: new Date().toISOString() })
    .eq('id', tagId).eq('status', 'active')
    .select('id,participant_id,token_hint,status,revoked_at').maybeSingle()
  if (error) return NextResponse.json({ message: 'Could not deactivate this tag.' }, { status: 500 })
  if (!tag) return NextResponse.json({ message: 'This tag is no longer active.' }, { status: 409 })
  return NextResponse.json({ message: status === 'lost' ? 'Tag marked lost. A replacement can now be issued.' : 'Tag revoked.', tag })
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: 'Untrusted request origin.' }, { status: 403 })
  if (!supabase) return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 })
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth
  const { participantId } = await request.json().catch(() => ({}))
  if (!isValidUuid(participantId)) return NextResponse.json({ message: 'A valid participant ID is required.' }, { status: 400 })
  const { data: participant, error: participantError } = await supabase.from('participants').select('id,name,participant_id').eq('id', participantId).maybeSingle()
  if (participantError) return NextResponse.json({ message: 'Could not look up this participant.' }, { status: 500 })
  if (!participant) return NextResponse.json({ message: 'Participant not found.' }, { status: 404 })
  const { data: active, error: activeError } = await supabase.from('participant_tags').select('id').eq('participant_id', participant.id).eq('status', 'active').maybeSingle()
  if (activeError) return NextResponse.json({ message: 'Could not check existing tags.' }, { status: 500 })
  if (active) return NextResponse.json({ message: 'Participant already has an active tag.' }, { status: 409 })
  const token = createNfcToken()
  let encryptedToken: string
  try { encryptedToken = encryptNfcToken(token) }
  catch { return NextResponse.json({ message: 'NFC token encryption is not configured.' }, { status: 503 }) }
  const { data: tag, error } = await supabase.from('participant_tags').insert({ participant_id: participant.id, public_token_hash: hashNfcToken(token), public_token_ciphertext: encryptedToken, token_hint: token.slice(-8), assigned_by: auth.user.userId }).select('id,token_hint,status,assigned_at').single()
  if (error) return NextResponse.json({ message: 'Could not issue tag.' }, { status: 500 })
  const origin = publicAppOrigin(request.url)
  return NextResponse.json({ tag, participant, token, url: `${origin}/nfc/t/${token}`, warning: 'Program and verify the tag now. Administrators can recover this URL later.' }, { status: 201 })
}
