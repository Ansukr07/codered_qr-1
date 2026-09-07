import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import supabase from '@/lib/config/supabase'

const DEMO_EMAIL = 'demo.participant@codered.local'
const DEMO_PASSWORD = 'CR4-Demo-2026!'
const LOCAL_DEMO_ID = '00000000-0000-0000-0000-000000000001'

function localDemoResponse() {
  const token = jwt.sign({ userId: LOCAL_DEMO_ID, role: 'participant', name: 'Demo Participant', email: DEMO_EMAIL, demo: true }, process.env.JWT_SECRET!, { expiresIn: '12h' })
  const response = NextResponse.json({ message: 'Local demo login successful', user: { userId: LOCAL_DEMO_ID, name: 'Demo Participant', email: DEMO_EMAIL, role: 'participant', onboardingCompleted: true, teamId: 'DEMO-TEAM', participantId: 'DEMO-PLAYER', avatarKey: 'byte', username: 'demo-player' } })
  response.cookies.set('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 12 * 60 * 60, path: '/' })
  return response
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (!supabase || !process.env.JWT_SECRET) return NextResponse.json({ message: 'Demo login is not configured.' }, { status: 500 })
  const { email, password } = await request.json()
  if (String(email).toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) return NextResponse.json({ message: 'Invalid demo credentials.' }, { status: 401 })
  let { data: participant, error } = await supabase.from('participants').select('*').eq('email', DEMO_EMAIL).maybeSingle()
  if (error?.message?.toLowerCase().includes('fetch failed')) return localDemoResponse()
  if (error) return NextResponse.json({ message: `Could not load demo participant: ${error.message}` }, { status: 500 })
  if (!participant) {
    const created = await supabase.from('participants').insert({
      name: 'Demo Participant',
      email: DEMO_EMAIL,
      participant_id: 'DEMO-PLAYER',
      qr_code: 'codered-demo-player',
      team_id: 'DEMO-TEAM',
      track: 'Main Track',
      is_email_verified: true,
    }).select('*').single()
    participant = created.data
    error = created.error
    if (error || !participant) return NextResponse.json({ message: `Could not create demo participant: ${error?.message || 'unknown database error'}` }, { status: 500 })
  }
  const token = jwt.sign({ userId: participant.id, role: 'participant', name: participant.name, email: participant.email }, process.env.JWT_SECRET, { expiresIn: '12h' })
  const response = NextResponse.json({ message: 'Demo login successful', user: { name: participant.name, role: 'participant', onboardingCompleted: true } })
  response.cookies.set('token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 12 * 60 * 60, path: '/' })
  return response
}
