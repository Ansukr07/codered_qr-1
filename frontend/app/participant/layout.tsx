'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { GameShell } from '@/components/game/GameShell'
export default function ParticipantLayout({ children }: { children: React.ReactNode }) { const { user, loading } = useAuth(); const router = useRouter(); const pathname = usePathname(); useEffect(() => { if (loading) return; if (!user || user.role !== 'participant') return router.replace('/login'); if (user.onboardingCompleted === false && pathname !== '/participant/onboarding') router.replace('/participant/onboarding') }, [user, loading, router, pathname]); if (loading) return <div className="game-loading">LOADING WORLD...</div>; if (!user || user.role !== 'participant') return null; return <GameShell>{children}</GameShell> }
