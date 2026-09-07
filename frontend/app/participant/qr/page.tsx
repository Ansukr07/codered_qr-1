'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCodeSVG from 'react-qr-code'
import { ArrowLeft, CheckCircle2, Maximize2, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { PixelAvatar } from '@/components/game/PixelAvatar'

type PassData = {
  name: string
  qrCode: string
  teamId?: string
  participantId?: string
  track?: string
  avatarKey?: string
}

export default function ParticipantPassPage() {
  const { user } = useAuth()
  const [pass, setPass] = useState<PassData | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then((response) => response.json()).then(({ user: current }) => {
      if (current) setPass({
        name: current.name,
        qrCode: current.qrCode,
        teamId: current.teamId,
        participantId: current.participantId,
        track: current.track,
        avatarKey: current.avatarKey,
      })
    })
  }, [])

  if (!pass?.qrCode) return <div className="game-loading">PRINTING EVENT PASS...</div>

  if (fullscreen) return <div className="pass-fullscreen" onClick={() => setFullscreen(false)}>
    <div className="pass-fullscreen-qr"><QRCodeSVG value={pass.qrCode} size={290} level="H"/></div>
    <h1>{pass.name}</h1><p>{pass.participantId}</p><span>TAP ANYWHERE TO CLOSE</span>
  </div>

  return <div className="game-stack pass-page">
    <div className="page-heading"><div><p className="eyebrow">INVENTORY · KEY ITEM</p><h1>Event pass</h1><p>Use this QR for meals, sleeping bags, attendance, and access checkpoints.</p></div><Link href="/participant" className="pixel-button secondary"><ArrowLeft/> BASE</Link></div>
    <section className="event-pass pixel-panel">
      <div className="pass-stripe"><span>CODERED</span><b>4.0</b><small>OFFICIAL PARTICIPANT PASS</small></div>
      <div className="pass-identity"><PixelAvatar avatarKey={pass.avatarKey} size="lg"/><div><p className="eyebrow">PASS HOLDER</p><h2>{pass.name}</h2><p>{pass.participantId || 'PARTICIPANT'}</p></div><ShieldCheck className="pass-shield"/></div>
      <div className="pass-body">
        <button className="pass-qr" onClick={() => setFullscreen(true)} aria-label="Enlarge QR code"><QRCodeSVG value={pass.qrCode} size={220} level="H"/><span><Maximize2/> TAP TO ENLARGE</span></button>
        <div className="pass-details"><div><small>TEAM</small><strong>{pass.teamId || '—'}</strong></div><div><small>TRACK</small><strong>{pass.track || 'MAIN'}</strong></div><div><small>STATUS</small><strong className="verified"><CheckCircle2/> VERIFIED</strong></div><div className="pass-note"><Sparkles/><p>Present this screen to a volunteer. Keep brightness high and avoid screenshots of another participant’s pass.</p></div></div>
      </div>
      <div className="pass-footer"><span>VALID · CODERED 4.0</span><span>{pass.qrCode.slice(0, 8).toUpperCase()}</span></div>
    </section>
    <p className="pass-help">This operational pass is private. Your networking QR lives under <Link href="/participant/profile">Player Card</Link>.</p>
  </div>
}
