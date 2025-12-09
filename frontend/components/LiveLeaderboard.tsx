'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, RefreshCcw, Crown, Medal, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TeamStats {
    rank: number
    teamId: string
    completedTasks: number
    points: number
    lastCompletion: string
}

export default function LiveLeaderboard() {
    const [leaderboard, setLeaderboard] = useState<TeamStats[]>([])
    const [prevLeaderboard, setPrevLeaderboard] = useState<TeamStats[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('/api/gamification/leaderboard')
            if (res.ok) {
                const data = await res.json()
                setPrevLeaderboard(leaderboard)
                setLeaderboard(data.leaderboard)
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLeaderboard()
        const interval = setInterval(fetchLeaderboard, 5000) // Poll every 5s for live feel
        return () => clearInterval(interval)
    }, [])

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500 animate-pulse" />
        if (rank === 2) return <Medal className="h-5 w-5 text-slate-300 fill-slate-300" />
        if (rank === 3) return <Medal className="h-5 w-5 text-amber-700 fill-amber-700" />
        return <span className="text-muted-foreground font-mono w-5 text-center">{rank}</span>
    }

    const getRankChange = (teamId: string, currentRank: number) => {
        const prev = prevLeaderboard.find(t => t.teamId === teamId)
        if (!prev) return <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-500">NEW</Badge>
        if (prev.rank > currentRank) return <TrendingUp className="h-4 w-4 text-green-500" />
        if (prev.rank < currentRank) return <TrendingDown className="h-4 w-4 text-red-500" />
        return <Minus className="h-4 w-4 text-muted-foreground opacity-20" />
    }

    return (
        <Card className="bg-card/50 backdrop-blur-xl border-white/10 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        <CardTitle className="font-bold text-foreground">
                            Live Standings
                        </CardTitle>
                    </div>
                    <Badge variant="outline" className="flex gap-1 items-center border-white/20 text-white/70">
                        <RefreshCcw className="h-3 w-3 animate-spin duration-[3000ms]" />
                        <span className="text-xs">Live</span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {loading && leaderboard.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Syncing leaderboard...</div>
                    ) : leaderboard.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Waiting for champions to emerge...
                        </div>
                    ) : (
                        <AnimatePresence mode='popLayout'>
                            {leaderboard.map((team) => (
                                <motion.div
                                    key={team.teamId}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className={`relative flex items-center justify-between p-3 rounded-xl border transition-colors ${team.rank === 1 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30' :
                                        team.rank === 2 ? 'bg-gradient-to-r from-slate-400/10 to-transparent border-slate-400/30' :
                                            team.rank === 3 ? 'bg-gradient-to-r from-amber-700/10 to-transparent border-amber-700/30' :
                                                'bg-secondary/20 border-white/5 hover:bg-secondary/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center w-8">
                                            {getRankIcon(team.rank)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-foreground">{team.teamId}</p>
                                                {getRankChange(team.teamId, team.rank)}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="outline" className="h-5 px-1 bg-background/50 text-[10px]">
                                                    Lvl {Math.floor(team.completedTasks / 3) + 1}
                                                </Badge>
                                                <span>• {team.completedTasks} Quests</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-primary tabular-nums tracking-tight">
                                            {team.points}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">XP</p>
                                    </div>

                                    {/* Glow Effect for Top 3 */}
                                    {team.rank <= 3 && (
                                        <div className={`absolute inset-0 rounded-xl blur-xl -z-10 opacity-20 ${team.rank === 1 ? 'bg-yellow-500' :
                                            team.rank === 2 ? 'bg-slate-400' :
                                                'bg-amber-700'
                                            }`} />
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
