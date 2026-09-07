import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/config/supabase'
import { requireRole } from '@/lib/middleware/rbac'

export async function POST(request: NextRequest) {
  if (!supabase) return NextResponse.json({ message: 'Database unavailable' }, { status: 500 })
  const auth = requireRole(request, ['participant'])
  if (auth instanceof NextResponse) return auth
  const form = await request.formData()
  const taskId = String(form.get('taskId') || '')
  const proofText = String(form.get('proofText') || '').trim().slice(0, 500)
  const file = form.get('proof') as File | null
  const [{ data: player }, { data: task }] = await Promise.all([
    supabase.from('participants').select('team_id').eq('id', auth.user.userId).single(),
    supabase.from('tasks').select('id,proof_type,requires_proof,is_active').eq('id', taskId).single(),
  ])
  if (!player?.team_id || !task?.is_active) return NextResponse.json({ message: 'Quest or team not found.' }, { status: 404 })
  if (task.requires_proof && task.proof_type === 'image' && (!file || file.size === 0)) return NextResponse.json({ message: 'Add an image as proof.' }, { status: 400 })
  if (file && (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) return NextResponse.json({ message: 'Proof must be a JPG, PNG, or WebP under 2 MB.' }, { status: 400 })
  if (task.requires_proof && task.proof_type !== 'image' && !proofText) return NextResponse.json({ message: 'Add proof before submitting.' }, { status: 400 })
  if (task.proof_type === 'link') {
    try {
      const proofLink = new URL(proofText)
      if (!['http:', 'https:'].includes(proofLink.protocol)) throw new Error('protocol')
    } catch {
      return NextResponse.json({ message: 'Enter a valid http(s) proof link.' }, { status: 400 })
    }
  }
  let proofUrl: string | null = null
  if (file && file.size) {
    const extension = file.type.split('/')[1] || 'webp'
    proofUrl = `${player.team_id}/${taskId}/${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from('quest-proofs').upload(proofUrl, file, { contentType: file.type, upsert: false })
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  }
  const { error } = await supabase.from('submissions').insert({ user_id: auth.user.userId, team_id: player.team_id, task_id: taskId, proof_url: proofUrl, proof_text: proofText || null, status: 'pending' })
  if (error) {
    if (proofUrl) await supabase.storage.from('quest-proofs').remove([proofUrl])
    return NextResponse.json({ message: error.code === '23505' ? 'Your team already submitted this quest.' : error.message }, { status: error.code === '23505' ? 409 : 500 })
  }
  return NextResponse.json({ message: 'Proof sent to the guild desk.' }, { status: 201 })
}
