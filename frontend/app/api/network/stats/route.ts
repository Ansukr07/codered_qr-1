import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'

export async function GET(request: NextRequest) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 500 })
  const auth = requireRole(request, ['participant'])
  if (auth instanceof NextResponse) return auth
  const [{ count: profileViews }, { count: connectionsMade }] = await Promise.all([
    supabase.from('profile_scans').select('id', { count: 'exact', head: true }).eq('profile_id', auth.user.userId),
    supabase.from('profile_scans').select('id', { count: 'exact', head: true }).eq('scanner_id', auth.user.userId),
  ])
  return NextResponse.json({ profileViews: profileViews || 0, connectionsMade: connectionsMade || 0 })
}
