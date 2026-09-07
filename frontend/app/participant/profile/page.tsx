'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCodeSVG from 'react-qr-code'
import { Github, Linkedin, Link as LinkIcon, Pencil, QrCode, ScanLine, Users } from 'lucide-react'
import { PixelAvatar } from '@/components/game/PixelAvatar'
export default function ProfilePage() {
  const [profile,setProfile]=useState<any>(null); const [stats,setStats]=useState({profileViews:0,connectionsMade:0}); const [error,setError]=useState(''); const [cardUrl,setCardUrl]=useState('')
  useEffect(()=>{ Promise.all([fetch('/api/participant/profile'),fetch('/api/network/stats')]).then(async([p,s])=>{const pd=await p.json();const sd=await s.json();if(!p.ok)throw new Error(pd.message);setProfile(pd.profile);setStats(sd);setCardUrl(`${location.origin}/p/${pd.profile.username}?scan=1`)}).catch((e)=>setError(e.message||'Could not load your card.')) },[])
  if(error)return <div className="pixel-panel empty-game"><b>CARD PRINTER OFFLINE</b><p>{error}</p><Link className="pixel-button" href="/participant/onboarding">REPAIR PROFILE</Link></div>
  if(!profile)return <p className="game-loading">LOADING CARD...</p>
  const links=[{url:profile.github_profile,label:'GitHub',sub:'See my code',icon:Github},{url:profile.linkedin_url,label:'LinkedIn',sub:'Let’s connect',icon:Linkedin},{url:profile.portfolio_url,label:'Portfolio',sub:'View my work',icon:LinkIcon}].filter(x=>x.url)
  return <div className="game-stack"><div className="page-heading"><div><p className="eyebrow">NETWORK HUB</p><h1>Your networking card</h1><p>One QR for every way people can reconnect with you.</p></div><Link className="pixel-button secondary" href="/participant/onboarding"><Pencil/> EDIT LINKS</Link></div><div className="network-layout"><section className="pixel-panel public-player-card profile-live"><p className="eyebrow">CODERED 4.0 · PLAYER CARD</p><PixelAvatar avatarKey={profile.avatar_key} size="lg"/><h1>{profile.name}</h1><p className="profile-handle">@{profile.username}</p><p>{profile.bio||'CODERED builder and adventurer.'}</p><div className="profile-tags"><span>{profile.team_id}</span><span>{profile.track}</span></div><div className="public-links">{links.map(({url,label,sub,icon:Icon}:any)=><a href={url} target="_blank" rel="noreferrer" key={label}><Icon/><span><b>{label}</b><small>{sub}</small></span><i>↗</i></a>)}</div>{!links.length&&<Link className="network-tip" href="/participant/onboarding">+ Equip GitHub, LinkedIn or portfolio</Link>}</section><aside className="network-side"><div className="pixel-panel stat-pair"><div><Users/><strong>{stats.profileViews}</strong><span>SCANNED YOU</span></div><div><ScanLine/><strong>{stats.connectionsMade}</strong><span>YOU SCANNED</span></div></div><div className="pixel-panel share-qr"><QRCodeSVG value={cardUrl} size={190}/><b>YOUR NETWORKING QR</b><p>Each participant counts once.</p></div><Link className="pixel-button network-cta" href="/participant/network"><QrCode/> SCAN SOMEONE</Link></aside></div></div>
}

