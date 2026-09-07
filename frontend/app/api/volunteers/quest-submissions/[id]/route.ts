import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 500 })
  const auth = requireRole(request, ['volunteer', 'admin'])
  if (auth instanceof NextResponse) return auth
  const { id } = await params; const body = await request.json()
  if (!['approved', 'rejected'].includes(body.status)) return NextResponse.json({ message: 'Invalid review status.' }, { status: 400 })
  if (body.status === 'rejected' && !String(body.note || '').trim()) return NextResponse.json({ message: 'Add a reason so the team knows what to fix.' }, { status: 400 })
  const reviewer = /^[0-9a-f-]{36}$/i.test(auth.user.userId) ? auth.user.userId : null
  const { data, error } = await supabase.from('submissions').update({ status: body.status, review_note: String(body.note || '').trim().slice(0, 300) || null, verified_by: reviewer, verified_at: new Date().toISOString() }).eq('id', id).eq('status', 'pending').select('id').single()
  if (error || !data) return NextResponse.json({ message: 'This proof was already reviewed or could not be updated.' }, { status: 409 })
  return NextResponse.json({ message: `Quest ${body.status}.` })
}
