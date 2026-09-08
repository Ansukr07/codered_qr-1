import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'

type ConnectionTap = { low_tapped_high_at: string | null; high_tapped_low_at: string | null }

export async function GET(request: NextRequest) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 500 })
  const auth = requireRole(request, ['participant'])
  if (auth instanceof NextResponse) return auth
  const [{ count: profileViews, error: viewsError }, { count: connectionsMade, error: scansError }, { data: lowConnections, error: lowError }, { data: highConnections, error: highError }] = await Promise.all([
    supabase.from('profile_scans').select('id', { count: 'exact', head: true }).eq('profile_id', auth.user.userId),
    supabase.from('profile_scans').select('id', { count: 'exact', head: true }).eq('scanner_id', auth.user.userId),
    supabase.from('participant_connections').select('low_tapped_high_at,high_tapped_low_at').eq('participant_low_id', auth.user.userId),
    supabase.from('participant_connections').select('low_tapped_high_at,high_tapped_low_at').eq('participant_high_id', auth.user.userId),
  ])
  if (viewsError || scansError || lowError || highError) {
    return NextResponse.json({ message: 'Could not load networking statistics.' }, { status: 500 })
  }

  // For a low-side participant, low_tapped_high is outgoing and
  // high_tapped_low is incoming. The direction is reversed on the high side.
  const nfcOutgoing = (lowConnections || []).filter((row: ConnectionTap) => row.low_tapped_high_at).length
    + (highConnections || []).filter((row: ConnectionTap) => row.high_tapped_low_at).length
  const nfcIncoming = (lowConnections || []).filter((row: ConnectionTap) => row.high_tapped_low_at).length
    + (highConnections || []).filter((row: ConnectionTap) => row.low_tapped_high_at).length

  return NextResponse.json({
    profileViews: (profileViews || 0) + nfcIncoming,
    connectionsMade: (connectionsMade || 0) + nfcOutgoing,
  })
}
