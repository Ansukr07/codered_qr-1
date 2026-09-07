import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireAuth } from '@/lib/middleware/rbac'

export async function GET(request: NextRequest) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 500 })
  const auth = requireAuth(request)
  if (auth instanceof NextResponse) return auth
  const { data, error } = await supabase.from('submissions').select('team_id,verified_at,tasks(points)').eq('status', 'approved')
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  const teams = new Map<string, { teamId: string; points: number; completed: number; last: string }>()
  for (const row of data || []) {
    const current = teams.get(row.team_id) || { teamId: row.team_id, points: 0, completed: 0, last: row.verified_at }
    const joined: any = row.tasks
    current.points += Number(Array.isArray(joined) ? joined[0]?.points : joined?.points) || 0
    current.completed += 1
    if (row.verified_at > current.last) current.last = row.verified_at
    teams.set(row.team_id, current)
  }
  const leaderboard = [...teams.values()].sort((a, b) => b.points - a.points || a.last.localeCompare(b.last)).slice(0, 50).map((team, index) => ({ ...team, rank: index + 1 }))
  return NextResponse.json({ leaderboard }, { headers: { 'Cache-Control': 'private, max-age=15' } })
}

