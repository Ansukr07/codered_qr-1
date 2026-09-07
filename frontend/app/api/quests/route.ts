import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['participant'])
  if (auth instanceof NextResponse) return auth
  if (auth.user.userId === '00000000-0000-0000-0000-000000000001' || auth.user.email === 'demo.participant@codered.local') {
    return NextResponse.json({ quests: [
      { id: 'demo-quest-1', title: 'Make a new ally', description: 'Meet someone outside your team and exchange CODERED profiles.', points: 20, category: 'social', proof_type: 'image', submission: null },
      { id: 'demo-quest-2', title: 'Ship five commits', description: 'Push five meaningful commits to your team repository.', points: 30, category: 'technical', proof_type: 'link', submission: null },
      { id: 'demo-quest-3', title: 'Mentor checkpoint', description: 'Attend a mentor session and record your key takeaway.', points: 15, category: 'general', proof_type: 'text', submission: null },
      { id: 'demo-quest-4', title: 'Build your player card', description: 'Complete your public profile and exchange it with another participant.', points: 10, category: 'social', proof_type: 'image', submission: null },
    ] })
  }
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 500 })
  const [{ data: player, error: playerError }, { data: tasks, error: taskError }] = await Promise.all([
    supabase.from('participants').select('team_id').eq('id', auth.user.userId).single(),
    supabase.from('tasks').select('*').eq('is_active', true).order('points', { ascending: true }),
  ])
  if (playerError || taskError) return NextResponse.json({ message: playerError?.message || taskError?.message }, { status: 500 })
  const { data: submissions, error: submissionError } = await supabase.from('submissions').select('id,task_id,status,proof_url,proof_text,review_note,created_at').eq('team_id', player.team_id)
  if (submissionError) return NextResponse.json({ message: submissionError.message }, { status: 500 })
  const submissionByTask = Object.fromEntries((submissions || []).map((submission) => [submission.task_id, submission]))
  return NextResponse.json({ quests: (tasks || []).map((task) => ({ ...task, submission: submissionByTask[task.id] || null })) })
}
