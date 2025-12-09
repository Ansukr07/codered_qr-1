'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Medal, Rocket, Star, Zap, Code, Shield } from 'lucide-react'

// Mock achievements for now
const achievements = [
    {
        id: 'first-step',
        title: 'First Steps',
        description: 'Complete your first quest',
        icon: Rocket,
        color: 'text-blue-500',
        bg: 'bg-blue-500'
    },
    {
        id: 'xp-hunter',
        title: 'XP Hunter',
        description: 'Reach Level 2',
        icon: Zap,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500'
    },
    {
        id: 'clean-code',
        title: 'Clean Code',
        description: 'Submit a code snippet',
        icon: Code,
        color: 'text-green-500',
        bg: 'bg-green-500'
    },
    {
        id: 'protector',
        title: 'Guardian',
        description: 'Report a bug or issue',
        icon: Shield,
        color: 'text-purple-500',
        bg: 'bg-purple-500'
    }
]

export default function Achievements({ completedCount }: { completedCount: number }) {
    // Simple logic to "unlock" based on completed tasks
    const isUnlocked = (id: string) => {
        if (id === 'first-step') return completedCount >= 1
        if (id === 'xp-hunter') return completedCount >= 3
        if (id === 'clean-code') return completedCount >= 2 // Mock logic
        return false
    }

    return (
        <Card className="bg-card/50 backdrop-blur-xl border-white/10 shadow-xl">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
                <div className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-blue-400" />
                    <CardTitle className="bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent font-bold">
                        Achievements
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {achievements.map((achievement) => {
                        const unlocked = isUnlocked(achievement.id)
                        return (
                            <div
                                key={achievement.id}
                                className={`p-3 rounded-lg border transition-all ${unlocked
                                        ? 'bg-secondary/40 border-primary/20 opacity-100'
                                        : 'bg-secondary/10 border-white/5 opacity-50 grayscale'
                                    }`}
                            >
                                <div className="flex flex-col items-center text-center gap-2">
                                    <div className={`p-2 rounded-full bg-background ${unlocked ? 'shadow-lg shadow-primary/20' : ''}`}>
                                        <achievement.icon className={`h-5 w-5 ${unlocked ? achievement.color : 'text-muted-foreground'}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">{achievement.title}</p>
                                        <p className="text-[10px] text-muted-foreground line-clamp-1">{achievement.description}</p>
                                    </div>
                                    {unlocked && (
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-green-500/10 text-green-500">
                                            Unlocked
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
