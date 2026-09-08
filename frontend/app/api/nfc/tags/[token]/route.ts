import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { getAuthUser } from '@/lib/middleware/auth'
import { hashNfcToken, isValidNfcToken, safePublicUrl } from '@/lib/nfc'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 })
  const { token } = await params
  if (!isValidNfcToken(token)) return NextResponse.json({ message: 'This badge link is invalid.' }, { status: 400 })

  const { data: tag, error } = await supabase
    .from('participant_tags')
    .select('id,status,token_hint,participant_id')
    .eq('public_token_hash', hashNfcToken(token))
    .maybeSingle()

  if (error) return NextResponse.json({ message: 'Could not read this badge.' }, { status: 500 })
  if (!tag || tag.status !== 'active') return NextResponse.json({ message: 'This badge is inactive. Please visit the help desk.' }, { status: 410 })

  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .select('id,name,username,bio,avatar_key,team_id,track,participant_id,github_profile,linkedin_url,portfolio_url,onboarding_completed')
    .eq('id', tag.participant_id)
    .maybeSingle()
  if (participantError) return NextResponse.json({ message: 'Could not read the participant assigned to this badge.' }, { status: 500 })
  if (!participant) return NextResponse.json({ message: 'This badge is not assigned.' }, { status: 404 })
  const user = getAuthUser(request)
  let resources: any[] = []
  if (user?.role === 'volunteer') {
    const { data, error: resourcesError } = await supabase.from('resources').select('id,name,category,total_quantity,distributed_quantity').order('name')
    if (resourcesError) return NextResponse.json({ message: 'Could not load volunteer resources.' }, { status: 500 })
    resources = data || []
  }
  const response = NextResponse.json({
    authenticated: Boolean(user),
    viewerRole: user?.role || null,
    isSelf: user?.role === 'participant' && user.userId === participant.id,
    tagId: tag.id,
    participant: {
      name: participant.name,
      username: participant.username,
      bio: participant.bio,
      avatarKey: participant.avatar_key,
      teamId: participant.team_id,
      track: participant.track,
      participantId: participant.participant_id,
      github: safePublicUrl(participant.github_profile),
      linkedin: safePublicUrl(participant.linkedin_url),
      portfolio: safePublicUrl(participant.portfolio_url),
    },
    resources,
  })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
