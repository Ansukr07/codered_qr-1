'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import SeatingMap from '@/components/SeatingMap'

interface SeatInfo {
    seatNumber: number
    row: number
    column: number
    section?: 'left' | 'right'
}

interface SeatingData {
    teamId: string
    section: 'left' | 'right'
    teamSize: number
    seats: SeatInfo[]
    labName: string
}

interface PageData {
    mySeating: SeatingData
    allOccupiedSeats: SeatInfo[]
    sectionLayout: {
        left: { rows: number, columns: number }
        right: { rows: number, columns: number }
    }
}

export default function ParticipantSeatingPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [pageData, setPageData] = useState<PageData | null>(null)
    const [loadingSeating, setLoadingSeating] = useState(true)
    const [error, setError] = useState<string>('')

    useEffect(() => {
        if (!loading && (!user || user.role !== 'participant')) {
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        if (user && user.role === 'participant') {
            fetchSeating()
        }
    }, [user])

    const fetchSeating = async () => {
        try {
            setLoadingSeating(true)
            console.log('🪑 [Participant Seating] Fetching seating data...')

            const res = await fetch('/api/seating/my-seat')
            console.log('🪑 [Participant Seating] Response status:', res.status)

            if (res.ok) {
                const data = await res.json()
                console.log('🪑 [Participant Seating] Seating data received:', data)
                setPageData(data)
                setError('')
            } else {
                const errorData = await res.json()
                console.log('🪑 [Participant Seating] Error response:', errorData)
                setError(errorData.message || 'Failed to load seating')
            }
        } catch (error) {
            console.error('🪑 [Participant Seating] Fetch error:', error)
            setError('Unable to load seating information')
        } finally {
            setLoadingSeating(false)
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
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

            <div className="relative z-10 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <Link href="/participant">
                            <Button variant="default" size="icon">
                                <ArrowLeft className="h-4 w-4 text-white" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground">My Seating Assignment</h1>
                            <p className="text-muted-foreground">View your team's assigned seats</p>
                        </div>
                    </div>

                    {loadingSeating && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <p className="text-muted-foreground">Loading seating information...</p>
                            </CardContent>
                        </Card>
                    )}

                    {!loadingSeating && error && (
                        <Card className="border-orange-500/50 bg-orange-500/5">
                            <CardContent className="p-12 text-center">
                                <MapPin className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                                    Seating Not Available
                                </h3>
                                <p className="text-muted-foreground mb-4">{error}</p>
                                <Button onClick={fetchSeating} variant="outline">
                                    Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {!loadingSeating && pageData && (
                        <div className="space-y-4">
                            <Card className="bg-gradient-to-r from-primary/20 to-primary/5 border-primary/30">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-primary/20 rounded-full">
                                                <MapPin className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-card-foreground">
                                                    Your Team Seats Assigned
                                                </h3>
                                                <p className="text-sm text-muted-foreground">{pageData.mySeating.labName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">Section</p>
                                                <Badge
                                                    className={`mt-1 ${pageData.mySeating.section === 'left' ? 'bg-blue-500' : 'bg-orange-500'} text-white`}
                                                >
                                                    {pageData.mySeating.section === 'left' ? 'Left' : 'Right'}
                                                </Badge>
                                            </div>
                                            <div className="text-center px-4 border-x border-border">
                                                <p className="text-xs text-muted-foreground">Team Size</p>
                                                <p className="text-2xl font-bold text-foreground mt-1">
                                                    {pageData.mySeating.teamSize}
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-muted-foreground">Seats</p>
                                                <p className="text-sm font-semibold text-foreground mt-1">
                                                    {pageData.mySeating.seats.map(s =>
                                                        `${String.fromCharCode(64 + s.row)}${s.column}`
                                                    ).join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {pageData.sectionLayout && (
                                <SeatingMap
                                    section={pageData.mySeating.section}
                                    teamSeats={pageData.mySeating.seats}
                                    allOccupiedSeats={pageData.allOccupiedSeats}
                                    totalRows={Math.max(pageData.sectionLayout.left.rows, pageData.sectionLayout.right.rows)}
                                    totalColumns={Math.max(pageData.sectionLayout.left.columns, pageData.sectionLayout.right.columns)}
                                    labName={pageData.mySeating.labName}
                                />
                            )}

                            <Card className="bg-card/50">
                                <CardContent className="p-4">
                                    <p className="text-sm text-muted-foreground text-center">
                                        💡 <strong>Note:</strong> All {pageData.mySeating.teamSize} seats highlighted in green are assigned to your team.
                                        Please ensure all team members sit in their designated seats.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
