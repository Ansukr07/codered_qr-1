'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Check, Github, Link as LinkIcon, Linkedin, Loader2, LogOut, Nfc, ShieldCheck, UserRound, Users } from 'lucide-react'
import { PixelAvatar } from '@/components/game/PixelAvatar'
import { useAuth } from '@/contexts/AuthContext'

type TagData = {
  authenticated: boolean
  viewerRole: 'participant' | 'volunteer' | 'admin' | null
  isSelf: boolean
  participant: { name:string; username?:string; bio?:string; avatarKey?:string; teamId?:string; track?:string; participantId?:string; github?:string; linkedin?:string; portfolio?:string }
}

export default function NfcTagPage() {
  const { logout } = useAuth()
  const router = useRouter()
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<TagData | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const [actionError, setActionError] = useState('')
  const returnTo = useMemo(() => `/nfc/t/${encodeURIComponent(token)}`, [token])

  async function loadBadge() {
    const response = await fetch(`/api/nfc/tags/${encodeURIComponent(token)}`, { cache: 'no-store' })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.message || 'Could not read this badge.')
    setData(body)
  }

  useEffect(() => { loadBadge().catch(cause => setError(cause.message || 'Could not read this badge.')) }, [token])
  useEffect(() => {
    if (data?.viewerRole === 'volunteer') router.replace(`/volunteer/nfc/${encodeURIComponent(token)}`)
  }, [data?.viewerRole, router, token])

  async function connect() {
    setBusy(true); setResult(''); setActionError('')
    const requestId = crypto.randomUUID()
    try {
      const response = await fetch('/api/nfc/connect', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token, requestId }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message)
      setResult(body.message)
    } catch (cause:any) { setActionError(cause.message || 'Could not connect.') }
    finally { setBusy(false) }
  }

  if (error) return <main className="nfc-world"><section className="pixel-panel nfc-error"><Nfc/><h1>Badge unavailable</h1><p>{error}</p><Link className="pixel-button" href="/login">GO TO PORTAL</Link></section></main>
  if (!data) return <main className="nfc-world"><div className="game-loading"><Loader2 className="spin"/> READING BADGE...</div></main>
  if (data.viewerRole === 'volunteer') return <main className="nfc-world"><div className="game-loading"><Loader2 className="spin"/> OPENING VOLUNTEER RESOURCES...</div></main>
  const links = [{url:data.participant.github,label:'GitHub',icon:Github},{url:data.participant.linkedin,label:'LinkedIn',icon:Linkedin},{url:data.participant.portfolio,label:'Portfolio',icon:LinkIcon}].filter(item=>item.url)

  return <main className="nfc-world"><section className="pixel-panel nfc-card">
    <div className="nfc-status"><Nfc/><span>CODERED TAP</span><b>ACTIVE BADGE</b></div>
    <PixelAvatar avatarKey={data.participant.avatarKey || 'byte'} size="lg"/>
    <p className="eyebrow">PARTICIPANT VERIFIED</p><h1>{data.participant.name}</h1>
    {data.participant.username&&<p className="profile-handle">@{data.participant.username}</p>}
    <div className="profile-tags"><span>{data.participant.teamId || 'NO TEAM'}</span><span>{data.participant.track || 'CODERED 4.0'}</span></div>
    {data.participant.participantId&&<p className="nfc-id"><ShieldCheck/> {data.participant.participantId}</p>}
    {data.participant.bio&&<p>{data.participant.bio}</p>}
    {!data.authenticated?<div className="nfc-action-box"><UserRound/><h2>Sign in to continue</h2><p>Your login will return you to this badge.</p><Link className="pixel-button" href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>SIGN IN</Link></div>
    :data.viewerRole==='participant'?<div className="nfc-action-box"><Users/><h2>{data.isSelf?'This is your badge':'Add to your network'}</h2>{data.isSelf?<p>Share this badge with another participant.</p>:<button className="pixel-button" onClick={connect} disabled={busy||Boolean(result)}>{busy?'CONNECTING...':result?<><Check/> CONNECTED</>:'CONNECT'}</button>}{result&&<p role="status" className="connected-toast">{result}</p>}{actionError&&<p role="alert" className="game-error">{actionError}</p>}</div>
    :<div className="nfc-action-box"><ShieldCheck/><h2>Administrator view</h2><p>Badge identity confirmed. Resource distribution requires a volunteer account for a clear audit trail.</p><Link href="/admin/nfc">OPEN NFC BADGE STATION</Link></div>}
    {!!links.length&&<div className="public-links">{links.map(({url,label,icon:Icon})=><a key={label} href={url} target="_blank" rel="noreferrer"><Icon/><span><b>{label}</b><small>Open profile</small></span><i>↗</i></a>)}</div>}
    {data.authenticated&&<button type="button" className="nfc-logout" onClick={()=>void logout(data.viewerRole==='admin'?'/admin-login':data.viewerRole==='volunteer'?'/volunteer-login':'/login')}><LogOut/> LOG OUT</button>}
    <p className="nfc-safety">Confirm the name and participant ID before issuing event resources.</p>
  </section></main>
}
