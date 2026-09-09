import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'
import { AVATARS, safeUrl } from '@/lib/game'

const PROFILE_COLUMNS = 'id,name,email,participant_id,team_id,track,username,bio,github_profile,linkedin_url,portfolio_url,avatar_key,onboarding_completed'

async function resolveParticipant(authUser: { userId:string; email?:string }) {
  const byId = await supabase.from('participants').select(PROFILE_COLUMNS).eq('id', authUser.userId).maybeSingle()
  if (byId.error) return { data:null, error:byId.error }
  if (byId.data || !authUser.email) return byId
  // Older and Supabase-created sessions can carry the Auth identity UUID
  // instead of the application participant UUID. The email is inside our
  // verified, signed JWT, so it is safe to reconcile the application row.
  return supabase.from('participants').select(PROFILE_COLUMNS).eq('email', authUser.email.trim().toLowerCase()).maybeSingle()
}

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['participant'])
  if (auth instanceof NextResponse) return auth
  if (auth.user.userId === '00000000-0000-0000-0000-000000000001' || auth.user.email === 'demo.participant@codered.local') {
    return NextResponse.json({ profile: { id: auth.user.userId, name: 'Demo Participant', email: 'demo.participant@codered.local', participant_id: 'DEMO-PLAYER', team_id: 'DEMO-TEAM', track: 'Main Track', username: 'demo-player', bio: 'Local CODERED demo adventurer.', github_profile: 'https://github.com/', linkedin_url: null, portfolio_url: null, avatar_key: 'byte', onboarding_completed: true } })
  }
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 500 })
  const { data, error } = await resolveParticipant(auth.user)
  if (error) return NextResponse.json({ message: 'Could not load your participant profile.' }, { status: 500 })
  if (!data) return NextResponse.json({ message: 'No participant profile is linked to this login.' }, { status: 404 })
  return NextResponse.json({ profile: data })
}

export async function PUT(request: NextRequest) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 500 })
  const auth = requireRole(request, ['participant'])
  if (auth instanceof NextResponse) return auth
  const body = await request.json()
  const username = String(body.username || '').trim().toLowerCase()
  if (!/^[a-z0-9_]{3,24}$/.test(username)) return NextResponse.json({ message: 'Username must be 3–24 letters, numbers, or underscores.' }, { status: 400 })
  if (!AVATARS.some((avatar) => avatar.key === body.avatarKey)) return NextResponse.json({ message: 'Choose a valid avatar.' }, { status: 400 })
  const github = safeUrl(body.github, ['github.com'])
  const linkedin = safeUrl(body.linkedin, ['linkedin.com'])
  const portfolio = safeUrl(body.portfolio)
  if (body.github && !github) return NextResponse.json({ message: 'Enter a valid GitHub profile.' }, { status: 400 })
  if (body.linkedin && !linkedin) return NextResponse.json({ message: 'Enter a valid LinkedIn profile.' }, { status: 400 })
  if (body.portfolio && !portfolio) return NextResponse.json({ message: 'Enter a valid portfolio URL.' }, { status: 400 })
  if (!github && !linkedin && !portfolio) return NextResponse.json({ message: 'Add at least one networking link to finish onboarding.' }, { status: 400 })
  const resolved = await resolveParticipant(auth.user)
  if (resolved.error) return NextResponse.json({ message: 'Could not locate your participant profile.' }, { status: 500 })
  if (!resolved.data) return NextResponse.json({ message: 'No participant profile is linked to this login. Please sign out and request a new OTP.' }, { status: 404 })
  const { data, error } = await supabase.from('participants').update({
    username,
    bio: String(body.bio || '').trim().slice(0, 180) || null,
    github_profile: github,
    linkedin_url: linkedin,
    portfolio_url: portfolio,
    avatar_key: body.avatarKey,
    onboarding_completed: true,
  }).eq('id', resolved.data.id).select(PROFILE_COLUMNS).maybeSingle()
  if (error?.code === '23505') return NextResponse.json({ message: 'That username is already claimed.' }, { status: 409 })
  if (error) return NextResponse.json({ message: 'Could not save your participant profile.' }, { status: 500 })
  if (!data) return NextResponse.json({ message: 'Your profile was not updated. Please sign out and request a new OTP.' }, { status: 409 })
  return NextResponse.json({ profile: data })
}
