'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ScrollText, Trophy, UserRound, QrCode, ScanLine, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
const nav = [{ href: '/participant', label: 'Base', icon: Home },{ href: '/participant/quests', label: 'Quests', icon: ScrollText },{ href: '/participant/network', label: 'Scan', icon: ScanLine },{ href: '/participant/leaderboard', label: 'Ranks', icon: Trophy },{ href: '/participant/profile', label: 'Card', icon: UserRound },{ href: '/participant/qr', label: 'Pass', icon: QrCode }]
export function GameShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const onboarding = pathname === '/participant/onboarding'
  return <div className="game-world"><div className="pixel-cloud cloud-one"/><div className="pixel-cloud cloud-two"/><header className="game-topbar"><Link href={onboarding ? '/participant/onboarding' : '/participant'} className="game-brand"><span className="brand-cube">CR</span><span>CODERED <b>4.0</b></span></Link><div className="game-account"><div className="game-status"><span className="status-dot"/> {onboarding ? 'CREATING PLAYER' : 'SYSTEM ONLINE'}</div><button type="button" className="game-logout" onClick={()=>void logout('/login')} aria-label="Log out"><LogOut/><span>LOGOUT</span></button></div></header><main className="game-content">{children}</main>{!onboarding && <nav className="game-nav" aria-label="Participant navigation">{nav.map((item) => { const active = pathname === item.href; const Icon = item.icon; return <Link className={active ? 'active' : ''} href={item.href} key={item.href}><Icon/><span>{item.label}</span></Link> })}</nav>}</div>
}
