'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import QuestBoard from '@/components/QuestBoard'
import LiveLeaderboard from '@/components/LiveLeaderboard'

export default function ParticipantTasksPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && (!user || user.role !== 'participant')) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading Quest Data...</div>
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white relative overflow-x-hidden selection:bg-indigo-500/30">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 pointer-events-none" />
            <div className="fixed inset-0 opacity-[0.08] pointer-events-none" style={{
                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(to right, #fff 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
            }} />

            <div className="relative z-10 p-4 md:p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/participant">
                                <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full h-10 w-10">
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1">
                                    Quest Board
                                </h1>
                                <p className="text-slate-400 font-medium">
                                    Complete bounties, earn XP, and climb the ranks.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                        {/* Quest Board Section - Main Content */}
                        <div className="lg:col-span-8 space-y-8">
                            <QuestBoard />
                        </div>

                        {/* Leaderboard Section - Sticky Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="sticky top-8 space-y-6">
                                <LiveLeaderboard />

                                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/20">
                                    <h3 className="font-bold text-indigo-300 mb-2">💡 Pro Tip</h3>
                                    <p className="text-sm text-indigo-100/70">
                                        Focus on the <span className="text-white font-semibold">Technical</span> quests for higher XP rewards. They heavily impact your team's level!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
