'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import QRCodeSVG from 'react-qr-code'
import { ArrowLeft, Github, Linkedin, Link as LinkIcon, ScanLine, Users } from 'lucide-react'
import { PixelAvatar } from '@/components/game/PixelAvatar'

export default function PublicProfilePage() {
  const params=useParams();const router=useRouter();const[profile,setProfile]=useState<any>(null);const[missing,setMissing]=useState(false);const[url,setUrl]=useState('');const[connected,setConnected]=useState('')
  useEffect(()=>{const cardUrl=`${location.origin}/p/${params.username}?scan=1`;setUrl(cardUrl);if(new URLSearchParams(location.search).get('scan')==='1')fetch(`/api/profiles/${params.username}/scan`,{method:'POST'}).then(async r=>{const d=await r.json();if(r.ok)setConnected(d.message)});fetch(`/api/profiles/${params.username}`).then(async r=>{if(!r.ok)return setMissing(true);setProfile((await r.json()).profile)})},[params.username])
  const goBack=()=>{if(window.history.length>1)router.back();else router.push('/participant/profile')}
  if(missing)return <main className="public-card-world"><button className="player-card-back" onClick={goBack}><ArrowLeft/> BACK</button><div className="pixel-panel empty-game"><b>PLAYER NOT FOUND</b></div></main>
  if(!profile)return <main className="public-card-world"><button className="player-card-back" onClick={goBack}><ArrowLeft/> BACK</button><p className="game-loading">LOADING PLAYER...</p></main>
  const links=[{url:profile.github_profile,label:'GitHub',sub:'See my code',icon:Github},{url:profile.linkedin_url,label:'LinkedIn',sub:'Let’s connect',icon:Linkedin},{url:profile.portfolio_url,label:'Portfolio',sub:'View my work',icon:LinkIcon}].filter(x=>x.url)
  return <main className="public-card-world"><button className="player-card-back" onClick={goBack}><ArrowLeft/> BACK</button><section className="pixel-panel public-player-card"><p className="eyebrow">CODERED 4.0 · PLAYER CARD</p><PixelAvatar avatarKey={profile.avatar_key} size="lg"/><h1>{profile.name}</h1><p className="profile-handle">@{profile.username}</p><p>{profile.bio}</p><div className="profile-tags"><span>{profile.team_id}</span><span>{profile.track}</span></div>{connected&&<div className="connected-toast">✓ {connected}</div>}<div className="scan-count"><Users/><b>{profile.scan_count}</b><span>people scanned this card</span></div><div className="public-links">{links.map(({url,label,sub,icon:Icon}:any)=><a href={url} target="_blank" rel="noreferrer" key={label}><Icon/><span><b>{label}</b><small>{sub}</small></span><i>↗</i></a>)}</div>{!links.length&&<p className="network-tip">This player has not equipped social links yet.</p>}<div className="qr-tile"><QRCodeSVG value={url} size={132}/><span><ScanLine/> SCAN TO CONNECT</span></div></section></main>
}
