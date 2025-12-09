'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
        <div className="min-h-screen bg-[#0a0a0c] text-white relative overflow-x-hidden selection:bg-cyan-500/30">
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
                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1 truncate">
                                    Quest Board
                                </h1>
                                <p className="text-slate-400 font-medium break-words">
                                    Complete bounties, earn XP, and climb the ranks.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Leaderboard Button */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-lg shadow-emerald-900/20 border border-emerald-500/20">
                                    <Trophy className="mr-2 h-5 w-5" /> View Live Leaderboard
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[80vh] bg-[#0a0a0c] border-t border-cyan-500/20 text-white p-6">
                                <div className="space-y-6 h-full overflow-y-auto pb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Trophy className="text-cyan-500 h-6 w-6" />
                                        <h2 className="text-xl font-bold">Live Standings</h2>
                                    </div>
                                    <LiveLeaderboard />
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-500/20">
                                        <h3 className="font-bold text-cyan-300 mb-2">💡 Pro Tip</h3>
                                        <p className="text-sm text-cyan-100/70">
                                            Focus on the <span className="text-white font-semibold">Technical</span> quests for higher XP rewards.
                                        </p>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                        {/* Quest Board Section - Main Content */}
                        <div className="lg:col-span-8 space-y-8">
                            <QuestBoard />
                        </div>

                        {/* Leaderboard Section - Sticky Sidebar (Desktop Only) */}
                        <div className="hidden lg:block lg:col-span-4 space-y-6">
                            <div className="sticky top-8 space-y-6">
                                <LiveLeaderboard />

                                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-900/50 to-blue-900/50 border border-cyan-500/20">
                                    <h3 className="font-bold text-cyan-300 mb-2">💡 Pro Tip</h3>
                                    <p className="text-sm text-cyan-100/70">
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
