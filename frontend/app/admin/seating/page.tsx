'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, MapPin, RefreshCw, Trash2, Save } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface SeatingConfig {
    totalSeats: number
    sections: {
        left: number
        right: number
    }
    rows?: {
        left: number
        right: number
    }
    columns?: {
        left: number
        right: number
    }
}

interface Seating {
    teamId: string
    teamSize: number
    section: string
    seats: Array<{
        seatNumber: number
        row: number
        column: number
    }>
    labName: string
}

export default function SeatingManagementPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()

    const [config, setConfig] = useState<SeatingConfig>({
        totalSeats: 200,
        sections: { left: 100, right: 100 }
    })

    const [seatingData, setSeatingData] = useState<Seating[]>([])
    const [stats, setStats] = useState<any>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [showClearDialog, setShowClearDialog] = useState(false)
    const [totalTeams, setTotalTeams] = useState(0)

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchSeating()
            fetchTotalTeams()
        }
    }, [user])

    const fetchTotalTeams = async () => {
        try {
            const res = await fetch('/api/admin/participants')
            if (res.ok) {
                const data = await res.json()
                const uniqueTeams = [...new Set(data.participants.map((p: any) => p.teamId).filter(Boolean))]
                setTotalTeams(uniqueTeams.length)
            }
        } catch (error) {
            console.error('Failed to fetch teams:', error)
        }
    }

    const fetchSeating = async () => {
        try {
            const res = await fetch('/api/seating/all')
            if (res.ok) {
                const data = await res.json()
                setSeatingData(data.seating)
                setStats(data.stats)
            }
        } catch (error) {
            console.error('Failed to fetch seating:', error)
        }
    }

    const handleGenerate = async () => {
        setIsGenerating(true)
        try {
            const res = await fetch('/api/seating/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })

            const data = await res.json()

            if (res.ok) {
                toast({
                    title: 'Success',
                    description: `Seating generated for ${data.stats.assigned} teams`,
                })
                setSeatingData(data.seating)
                setStats(data.stats)
            } else {
                toast({
                    title: 'Error',
                    description: data.message,
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to generate seating',
                variant: 'destructive',
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const handleClear = async () => {
        try {
            const res = await fetch('/api/seating', {
                method: 'DELETE'
            })

            if (res.ok) {
                toast({
                    title: 'Success',
                    description: 'All seating cleared',
                })
                setSeatingData([])
                setStats(null)
                setShowClearDialog(false)
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to clear seating',
                variant: 'destructive',
            })
        }
    }

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background relative">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

            <div className="relative z-10 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <Button variant="default" size="icon">
                                <ArrowLeft className="h-4 w-4 text-white" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground">Seating Arrangement</h1>
                            <p className="text-muted-foreground">Manage seating for APJ Abdul Kalam Lab</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground">{totalTeams}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground">{config.totalSeats}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Assigned</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-500">{stats?.total || 0}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-500">
                                    {config.totalSeats - (stats?.total || 0)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Configuration Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Seating Configuration
                            </CardTitle>
                            <CardDescription>Configure seating arrangement parameters</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="totalSeats">Total Seats</Label>
                                    <Input
                                        id="totalSeats"
                                        type="number"
                                        value={config.totalSeats}
                                        onChange={(e) => {
                                            const total = parseInt(e.target.value) || 0
                                            setConfig(prev => ({
                                                ...prev,
                                                totalSeats: total,
                                                sections: {
                                                    left: Math.floor(total / 2),
                                                    right: Math.ceil(total / 2)
                                                }
                                            }))
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Lab Name</Label>
                                    <Input value="APJ Abdul Kalam Lab" disabled />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="leftSeats">Left Section Seats</Label>
                                    <Input
                                        id="leftSeats"
                                        type="number"
                                        value={config.sections.left}
                                        onChange={(e) => {
                                            const left = parseInt(e.target.value) || 0
                                            setConfig(prev => ({
                                                ...prev,
                                                sections: {
                                                    left,
                                                    right: prev.totalSeats - left
                                                }
                                            }))
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rightSeats">Right Section Seats</Label>
                                    <Input
                                        id="rightSeats"
                                        type="number"
                                        value={config.sections.right}
                                        onChange={(e) => {
                                            const right = parseInt(e.target.value) || 0
                                            setConfig(prev => ({
                                                ...prev,
                                                sections: {
                                                    left: prev.totalSeats - right,
                                                    right
                                                }
                                            }))
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || totalTeams === 0}
                                    className="flex-1"
                                >
                                    <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                                    {isGenerating ? 'Generating...' : 'Generate Seating'}
                                </Button>

                                {seatingData.length > 0 && (
                                    <Link href="/admin/seating/preview">
                                        <Button variant="outline">
                                            <MapPin className="mr-2 h-4 w-4" />
                                            View Preview
                                        </Button>
                                    </Link>
                                )}

                                <Button
                                    variant="destructive"
                                    onClick={() => setShowClearDialog(true)}
                                    disabled={seatingData.length === 0}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Clear All
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Seating Preview */}
                    {seatingData.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Seating Assignments ({seatingData.length} teams)</CardTitle>
                                <CardDescription>Generated seating arrangement</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Left Section */}
                                    <div>
                                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                                            <Badge variant="default" className="bg-blue-500">Left Section</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                ({seatingData.filter(s => s.section === 'left').length} teams)
                                            </span>
                                        </h3>
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {seatingData
                                                .filter(s => s.section === 'left')
                                                .map(seat => (
                                                    <div
                                                        key={seat.teamId}
                                                        className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-card-foreground">{seat.teamId}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Team Size: {seat.teamSize} | Seats: {seat.seats.map(s =>
                                                                    `${String.fromCharCode(64 + s.row)}${s.column}`
                                                                ).join(', ')}
                                                            </p>
                                                        </div>
                                                        <Badge variant="outline">{seat.teamSize} seats</Badge>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Right Section */}
                                    <div>
                                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                                            <Badge variant="default" className="bg-orange-500">Right Section</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                ({seatingData.filter(s => s.section === 'right').length} teams)
                                            </span>
                                        </h3>
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {seatingData
                                                .filter(s => s.section === 'right')
                                                .map(seat => (
                                                    <div
                                                        key={seat.teamId}
                                                        className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-card-foreground">{seat.teamId}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Team Size: {seat.teamSize} | Seats: {seat.seats.map(s =>
                                                                    `${String.fromCharCode(64 + s.row)}${s.column}`
                                                                ).join(', ')}
                                                            </p>
                                                        </div>
                                                        <Badge variant="outline">{seat.teamSize} seats</Badge>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Clear Confirmation Dialog */}
            <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clear All Seating?</DialogTitle>
                        <DialogDescription>
                            This will remove all seating assignments. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowClearDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleClear}>
                            Clear All
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
