'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'

interface SeatInfo {
    seatNumber: number
    row: number
    column: number
}

interface SeatingData {
    teamId: string
    teamSize: number
    section: 'left' | 'right'
    seats: SeatInfo[]
}

interface Stats {
    total: number
    left: number
    right: number
    sectionLayout?: {
        left: { rows: number, columns: number },
        right: { rows: number, columns: number }
    }
}

export default function AdminSeatingPreviewPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [seatingData, setSeatingData] = useState<SeatingData[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loadingData, setLoadingData] = useState(true)
    const [sectionLayout, setSectionLayout] = useState<{
        left: { rows: number, columns: number },
        right: { rows: number, columns: number }
    }>({ left: { rows: 0, columns: 0 }, right: { rows: 0, columns: 0 } })

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchSeating()
        }
    }, [user])

    const fetchSeating = async () => {
        try {
            setLoadingData(true)
            const res = await fetch('/api/seating/all')
            if (res.ok) {
                const data = await res.json()
                setSeatingData(data.seating)
                setStats(data.stats)

                if (data.stats.sectionLayout) {
                    setSectionLayout(data.stats.sectionLayout)
                }
            }
        } catch (error) {
            console.error('Failed to fetch seating:', error)
        } finally {
            setLoadingData(false)
        }
    }

    const getRowLabel = (rowNum: number) => String.fromCharCode(64 + rowNum)

    // Render section like BookMyShow - same as participant view
    const renderSection = (sectionName: 'left' | 'right') => {
        const sectionSeats = seatingData.filter(s => s.section === sectionName)
        const layout = sectionLayout[sectionName]

        if (layout.rows === 0 || layout.columns === 0) {
            return <p className="text-muted-foreground text-center py-8">No seats configured</p>
        }

        // Create grid of all occupied seats
        const occupiedSeats: { [key: string]: boolean } = {}
        sectionSeats.forEach(team => {
            team.seats.forEach(seat => {
                const key = `${seat.row}-${seat.column}`
                occupiedSeats[key] = true
            })
        })

        const rows = []
        for (let r = 1; r <= layout.rows; r++) {
            const cols = []
            for (let c = 1; c <= layout.columns; c++) {
                const key = `${r}-${c}`
                const isOccupied = occupiedSeats[key]

                cols.push(
                    <div
                        key={key}
                        className={`
                            w-8 h-8 rounded flex items-center justify-center text-xs font-medium
                            border transition-all
                            ${isOccupied
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-secondary border-border text-muted-foreground'}
                        `}
                        title={isOccupied ? `Occupied` : `Empty seat ${getRowLabel(r)}${c}`}
                    >
                        {c}
                    </div>
                )
            }
            rows.push(
                <div key={r} className="flex items-center gap-2">
                    <div className="w-6 text-sm font-medium text-muted-foreground text-center">
                        {getRowLabel(r)}
                    </div>
                    <div className="flex gap-1">{cols}</div>
                </div>
            )
        }

        return <div className="space-y-2">{rows}</div>
    }

    if (loading || !user || loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        )
    }

    const totalSeatsLeft = sectionLayout.left.rows * sectionLayout.left.columns
    const totalSeatsRight = sectionLayout.right.rows * sectionLayout.right.columns
    const occupiedLeft = seatingData.filter(s => s.section === 'left').reduce((sum, t) => sum + t.teamSize, 0)
    const occupiedRight = seatingData.filter(s => s.section === 'right').reduce((sum, t) => sum + t.teamSize, 0)

    return (
        <div className="min-h-screen bg-background relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

            <div className="relative z-10 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/seating">
                            <Button variant="default" size="icon">
                                <ArrowLeft className="h-4 w-4 text-white" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground">Seating Preview</h1>
                            <p className="text-muted-foreground">Complete BookMyShow-style layout</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{seatingData.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Left Section</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-500">{stats?.left} teams</div>
                                <p className="text-xs text-muted-foreground mt-1">{occupiedLeft}/{totalSeatsLeft} seats</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Right Section</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-500">{stats?.right} teams</div>
                                <p className="text-xs text-muted-foreground mt-1">{occupiedRight}/{totalSeatsRight} seats</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Empty Seats</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-muted-foreground">
                                    {(totalSeatsLeft + totalSeatsRight) - (occupiedLeft + occupiedRight)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>APJ Abdul Kalam Lab - Complete Seating Layout</CardTitle>
                            <CardDescription>All seats displayed - occupied and empty</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Side by side sections */}
                            <div className="grid md:grid-cols-2 gap-12">
                                {/* Left Section */}
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <Badge className="bg-blue-500 text-white px-4 py-1 text-sm">
                                            Left Section
                                        </Badge>
                                    </div>
                                    {renderSection('left')}
                                </div>

                                {/* Right Section */}
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <Badge className="bg-orange-500 text-white px-4 py-1 text-sm">
                                            Right Section
                                        </Badge>
                                    </div>
                                    {renderSection('right')}
                                </div>
                            </div>

                            {/* Screen Indicator */}
                            <div className="text-center pt-4 border-t border-border">
                                <div className="inline-block px-24 py-3 bg-gradient-to-b from-primary/30 to-primary/10 border-t-2 border-x-2 border-primary/40 rounded-t-[100px]">
                                    <p className="text-sm text-muted-foreground font-semibold">All eyes this way please</p>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="border-t border-border pt-4">
                                <div className="flex justify-center gap-8 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-secondary border border-border rounded"></div>
                                        <span className="text-muted-foreground">Available</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-primary/20 border border-primary rounded"></div>
                                        <span className="text-muted-foreground">Occupied (Team Assigned)</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
