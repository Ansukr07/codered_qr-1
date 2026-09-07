import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'

export async function GET(request: NextRequest) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 500 })
  const auth = requireRole(request, ['volunteer', 'admin'])
  if (auth instanceof NextResponse) return auth
  const status = request.nextUrl.searchParams.get('status') || 'pending'
  const { data, error } = await supabase.from('submissions').select('id,user_id,team_id,status,proof_url,proof_text,created_at,tasks(title,description,points,category)').eq('status', status).order('created_at', { ascending: true }).limit(100)
  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  const participantIds = [...new Set((data || []).map((item: any) => item.user_id).filter(Boolean))]
  const { data: participants, error: participantError } = participantIds.length
    ? await supabase.from('participants').select('id,name').in('id', participantIds)
    : { data: [], error: null }
  if (participantError) return NextResponse.json({ message: participantError.message }, { status: 500 })
  const participantById = Object.fromEntries((participants || []).map((participant: any) => [participant.id, participant]))
  const submissions = await Promise.all((data || []).map(async (submission) => {
    let proofImage = null
    if (submission.proof_url) { const { data: signed } = await supabase!.storage.from('quest-proofs').createSignedUrl(submission.proof_url, 300); proofImage = signed?.signedUrl || null }
    return { ...submission, participants: participantById[submission.user_id] || null, proofImage }
  }))
  return NextResponse.json({ submissions })
}
