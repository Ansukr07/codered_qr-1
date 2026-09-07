'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, BedDouble, CalendarDays, Github, MapPinned, Megaphone, ScrollText, Sparkles, Utensils } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { PixelAvatar } from '@/components/game/PixelAvatar'
type Profile = { name: string; team_id: string; participant_id: string; avatar_key: string; username: string; onboarding_completed: boolean }
type Quest = { id: string; points: number; submission: { status: string } | null }
export default function ParticipantHome() {
  const { user } = useAuth(); const router = useRouter(); const [profile, setProfile] = useState<Profile | null>(null); const [quests, setQuests] = useState<Quest[]>([]); const [announcements, setAnnouncements] = useState<any[]>([])
  useEffect(() => { Promise.all([fetch('/api/participant/profile').then((r) => r.json()), fetch('/api/quests').then((r) => r.json()), fetch('/api/announcements').then((r) => r.json())]).then(([p, q, a]) => { if (p.profile && !p.profile.onboarding_completed) return router.replace('/participant/onboarding'); setProfile(p.profile || null); setQuests(q.quests || []); setAnnouncements((a.announcements || []).slice(0, 2)) }) }, [router])
  const points = quests.reduce((total, quest) => total + (quest.submission?.status === 'approved' ? quest.points : 0), 0); const completed = quests.filter((quest) => quest.submission?.status === 'approved').length
  return <div className="game-stack"><section className="player-banner pixel-panel"><PixelAvatar avatarKey={profile?.avatar_key} size="lg"/><div className="player-copy"><p className="eyebrow">PLAYER ONE</p><h1>{profile?.name || user?.name || 'Loading...'}</h1><p>{profile?.team_id || 'Team'} · {profile?.participant_id || 'CODERED 4.0'}</p></div><div className="xp-box"><span>XP</span><strong>{points}</strong><small>{completed}/{quests.length} quests</small></div></section>
    <section className="game-hero pixel-panel"><div><p className="eyebrow"><Sparkles size={14}/> LIVE ADVENTURE</p><h2>Your 24-hour build quest starts here.</h2><p>Explore the venue, meet builders, ship code, and earn your place on the guild board.</p><Link className="pixel-button" href="/participant/quests">OPEN QUEST LOG <ArrowRight size={16}/></Link></div><div className="hero-scene" aria-hidden><span className="scene-mountain">▲</span><span className="scene-tree">♠</span><span className="scene-flag">⚑</span><span className="scene-player">◆</span></div></section>
    <div className="game-grid"><section className="pixel-panel"><div className="section-title"><span><Megaphone/> RADIO TOWER</span><small>ANNOUNCEMENTS</small></div>{announcements.length ? announcements.map((item) => <div className="radio-message" key={item.id || item._id}><b>{item.title}</b><p>{item.message}</p></div>) : <p className="muted-game">The airwaves are quiet.</p>}</section><section className="pixel-panel"><div className="section-title"><span><ScrollText/> QUICK TRAVEL</span></div><div className="action-grid"><Link href="/participant/timeline"><CalendarDays/> Schedule</Link><Link href="/participant/campus-map"><MapPinned/> Map</Link><Link href="/participant/submission"><Github/> Repository</Link><Link href="/participant/qr"><Utensils/> Event Pass</Link><Link href="/participant/seating"><BedDouble/> My Seat</Link><Link href="/participant/profile"><Sparkles/> Player Card</Link></div></section></div>
  </div>
}
