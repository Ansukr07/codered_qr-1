import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'

export async function POST(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 500 })
  const auth = requireRole(request, ['participant'])
  if (auth instanceof NextResponse) return auth
  const { username } = await params
  const { data: target, error } = await supabase.from('participants').select('id,name,username').ilike('username', username).eq('onboarding_completed', true).single()
  if (error || !target) return NextResponse.json({ message: 'Player card not found.' }, { status: 404 })
  if (target.id === auth.user.userId) return NextResponse.json({ message: 'That is your own player card.', self: true }, { status: 400 })
  const { error: insertError } = await supabase.from('profile_scans').upsert({ profile_id: target.id, scanner_id: auth.user.userId }, { onConflict: 'profile_id,scanner_id', ignoreDuplicates: true })
  if (insertError) return NextResponse.json({ message: insertError.message }, { status: 500 })
  return NextResponse.json({ message: `You connected with ${target.name}.`, profile: target })
}

