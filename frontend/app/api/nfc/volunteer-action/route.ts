import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'
import { hashNfcToken, hasTrustedOrigin, isValidNfcToken } from '@/lib/nfc'

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return NextResponse.json({ message: 'Untrusted request origin.' }, { status: 403 })
  if (!supabase) return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 })
  const auth = requireRole(request, ['volunteer'])
  if (auth instanceof NextResponse) return auth
  const { token, resourceId, action, requestId } = await request.json().catch(() => ({}))
  if (!isValidNfcToken(token || '') || !resourceId || !['claim','return'].includes(action) || !/^[0-9a-f-]{36}$/i.test(requestId || '')) {
    return NextResponse.json({ message: 'Invalid NFC action request.' }, { status: 400 })
  }
  const { data, error } = await supabase.rpc('process_nfc_resource_action', {
    p_tag_hash: hashNfcToken(token), p_resource_id: resourceId, p_volunteer_id: auth.user.userId, p_action: action, p_request_id: requestId,
  })
  if (error) {
    const known = ['Badge is inactive','Resource not found','Claim limit reached','Resource out of stock','No active claim to return']
    const message = known.find(item => error.message.includes(item)) || 'Could not record this resource action.'
    return NextResponse.json({ message }, { status: message === 'Badge is inactive' ? 410 : 409 })
  }
  return NextResponse.json({ message: data.duplicate ? 'This action was already recorded.' : `${data.resourceName} ${action === 'claim' ? 'issued' : 'returned'} for ${data.participantName}.`, result: data })
}
