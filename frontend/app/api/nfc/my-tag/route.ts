import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'
import { decryptNfcToken } from '@/lib/nfc'

export async function GET(request: NextRequest) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 })
  const auth = requireRole(request, ['participant'])
  if (auth instanceof NextResponse) return auth
  const { data: tag, error } = await supabase.from('participant_tags').select('public_token_ciphertext,token_hint,assigned_at').eq('participant_id', auth.user.userId).eq('status', 'active').maybeSingle()
  if (error) return NextResponse.json({ message: 'Could not load your NFC badge.' }, { status: 500 })
  if (!tag) return NextResponse.json({ tag: null })
  try {
    const token = decryptNfcToken(tag.public_token_ciphertext)
    return NextResponse.json({ tag: { url: `${new URL(request.url).origin}/nfc/t/${token}`, tokenHint: tag.token_hint, assignedAt: tag.assigned_at } })
  } catch { return NextResponse.json({ message: 'Badge configuration needs administrator attention.' }, { status: 500 }) }
}
