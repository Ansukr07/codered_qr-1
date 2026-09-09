import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { getAuthUser } from '@/lib/middleware/auth'
import { hashNfcToken, isValidNfcToken, safePublicUrl } from '@/lib/nfc'

export const dynamic = 'force-dynamic'

const wait = (milliseconds:number) => new Promise(resolve => setTimeout(resolve, milliseconds))

async function findTag(tokenHash:string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await supabase.from('participant_tags')
      .select('id,status,token_hint,participant_id')
      .eq('public_token_hash', tokenHash)
      .maybeSingle()
    if (result.error || result.data || attempt === 2) return result
    await wait(attempt === 0 ? 150 : 350)
  }
  return { data:null, error:null }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable.' }, { status: 503 })
  const { token } = await params
  if (!isValidNfcToken(token)) return NextResponse.json({ message: 'This badge link is invalid.' }, { status: 400 })

  const { data: tag, error } = await findTag(hashNfcToken(token))

  if (error) return NextResponse.json({ message: 'Could not read this badge.' }, { status: 500 })
  if (!tag) return NextResponse.json({ message: 'This badge is not recognized. Tap it again or ask the help desk to verify it.' }, { status: 404 })
  if (tag.status !== 'active') return NextResponse.json({ message: 'This badge is inactive. Please visit the help desk.' }, { status: 410 })

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
    const participantIds = [participant.id]
    if (participant.team_id) {
      const { data: teammates, error: teammatesError } = await supabase.from('participants').select('id').eq('team_id', participant.team_id)
      if (teammatesError) return NextResponse.json({ message: 'Could not load the participant team.' }, { status: 500 })
      participantIds.splice(0, participantIds.length, ...(teammates || []).map((member:any) => member.id))
    }
    const { data: transactions, error: transactionsError } = await supabase.from('transactions')
      .select('user_id,resource_id,action').in('user_id', participantIds).in('action', ['claim', 'return'])
    if (transactionsError) return NextResponse.json({ message: 'Could not load current resource assignments.' }, { status: 500 })
    resources = (data || []).map((resource:any) => {
      const teamScoped = resource.category === 'accommodation' || resource.name.toLowerCase().includes('bag')
      const relevant = (transactions || []).filter((transaction:any) => transaction.resource_id === resource.id && (teamScoped || transaction.user_id === participant.id))
      const claimCount = relevant.filter((transaction:any) => transaction.action === 'claim').length
      const returnCount = relevant.filter((transaction:any) => transaction.action === 'return').length
      const activeQuantity = Math.max(0, claimCount - returnCount)
      const claimLimit = resource.category === 'coffee' || resource.name.toLowerCase().includes('coffee') ? 3 : 1
      return {
        ...resource,
        claim_count: claimCount,
        active_quantity: activeQuantity,
        claim_limit: claimLimit,
        can_issue: claimCount < claimLimit && resource.distributed_quantity < resource.total_quantity,
        can_return: activeQuantity > 0,
        team_scoped: teamScoped,
      }
    })
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
