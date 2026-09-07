import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'

export async function GET(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 500 })
  const { username } = await params
  const { data, error } = await supabase.from('participants')
    .select('id,name,participant_id,team_id,track,username,bio,github_profile,linkedin_url,portfolio_url,avatar_key')
    .ilike('username', username).eq('onboarding_completed', true).single()
  if (error || !data) return NextResponse.json({ message: 'Player not found' }, { status: 404 })
  const { count } = await supabase.from('profile_scans').select('id', { count: 'exact', head: true }).eq('profile_id', data.id)
  const { id: _privateId, ...profile } = data
  return NextResponse.json({ profile: { ...profile, scan_count: count || 0 } }, { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' } })
}

