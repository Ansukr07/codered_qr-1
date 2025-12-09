'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, RefreshCcw, Timer } from 'lucide-react'

interface TeamStats {
    rank: number
    teamId: string
    completedTasks: number
    points: number
    lastCompletion: string
}

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState<TeamStats[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('/api/gamification/leaderboard')
            if (res.ok) {
                const data = await res.json()
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
        const interval = setInterval(fetchLeaderboard, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [])

    return (
        <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <CardTitle>Team Leaderboard</CardTitle>
                    </div>
                    <Badge variant="outline" className="flex gap-1 items-center">
                        <RefreshCcw className="h-3 w-3 animate-spin duration-[3000ms]" />
                        <span className="text-xs">Live</span>
                    </Badge>
                </div>
                <CardDescription>3 verified tasks = 1 Point</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-4 text-muted-foreground">Loading standings...</div>
                    ) : leaderboard.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No active teams yet. Be the first!
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {leaderboard.map((team) => (
                                <div
                                    key={team.teamId}
                                    className={`flex items-center justify-between p-3 rounded-lg border border-border/50 transition-colors ${team.rank === 1 ? 'bg-yellow-500/10 border-yellow-500/50' :
                                            team.rank === 2 ? 'bg-slate-400/10 border-slate-400/50' :
                                                team.rank === 3 ? 'bg-orange-700/10 border-orange-700/50' :
                                                    'bg-secondary/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                            ${team.rank === 1 ? 'bg-yellow-500 text-yellow-950' :
                                                team.rank === 2 ? 'bg-slate-400 text-slate-900' :
                                                    team.rank === 3 ? 'bg-orange-700 text-orange-100' :
                                                        'bg-secondary text-muted-foreground'}
                                        `}>
                                            {team.rank}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">{team.teamId}</p>
                                            <p className="text-xs text-muted-foreground">{team.completedTasks} tasks done</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-primary">{team.points}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
