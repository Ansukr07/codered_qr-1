'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, User, Users, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import SeatingMap from '@/components/SeatingMap'

interface SeatInfo {
    seatNumber?: number
    row: number
    column: number
    section?: 'left' | 'right'
    teamId?: string
}

interface TeamMember {
    _id: string
    name: string
    email: string
    phone: string
    collegeId: string
    teamId: string
}

interface TeamDetails {
    teamId: string
    members: TeamMember[]
    seating: {
        section: 'left' | 'right'
        seats: SeatInfo[]
        labName: string
    }
}

export default function VolunteerSeatingPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    // Data states
    const [allOccupiedSeats, setAllOccupiedSeats] = useState<SeatInfo[]>([])
    const [sectionLayout, setSectionLayout] = useState({
        left: { rows: 0, columns: 0 },
        right: { rows: 0, columns: 0 }
    })

    // UI states
    const [loadingData, setLoadingData] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [highlightedSeats, setHighlightedSeats] = useState<SeatInfo[]>([])

    // Dialog states
    const [selectedTeam, setSelectedTeam] = useState<TeamDetails | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loadingDetails, setLoadingDetails] = useState(false)

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'volunteer' && user.role !== 'admin'))) {
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        if (user && (user.role === 'volunteer' || user.role === 'admin')) {
            fetchSeatingData()
        }
    }, [user])

    const fetchSeatingData = async () => {
        try {
            setLoadingData(true)
            // Reuse the admin endpoint to get full layout
            const res = await fetch('/api/seating/all')
            if (res.ok) {
                const data = await res.json()

                // Process occupied seats
                const occupied: SeatInfo[] = []
                data.seating.forEach((team: any) => {
                    team.seats.forEach((seat: any) => {
                        occupied.push({
                            ...seat,
                            section: team.section,
                            teamId: team.teamId
                        })
                    })
                })
                setAllOccupiedSeats(occupied)

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

    // Debounced Search Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                performSearch(searchQuery)
            } else {
                setSearchResults([])
                setHighlightedSeats([])
            }
        }, 300) // 300ms debounce

        return () => clearTimeout(timer)
    }, [searchQuery])

    const performSearch = async (query: string) => {
        try {
            const res = await fetch(`/api/seating/search?query=${encodeURIComponent(query)}`)
            if (res.ok) {
                const results = await res.json()
                setSearchResults(results)

                // Highlight seats found
                const highlights: SeatInfo[] = []
                results.forEach((r: any) => {
                    if (r.seating && r.seating.seats) {
                        r.seating.seats.forEach((s: any) => {
                            highlights.push({
                                ...s,
                                section: r.seating.section
                            })
                        })
                    }
                })
                setHighlightedSeats(highlights)
            }
        } catch (error) {
            console.error('Search failed:', error)
        }
    }

    const handleSeatClick = async (seat: SeatInfo) => {
        if (!seat.teamId) return

        try {
            setLoadingDetails(true)
            const res = await fetch(`/api/seating/team/${seat.teamId}`)
            if (res.ok) {
                const data = await res.json()
                setSelectedTeam(data)
                setIsDialogOpen(true)
            }
        } catch (error) {
            console.error('Failed to fetch team details:', error)
        } finally {
            setLoadingDetails(false)
        }
    }

    const clearSearch = () => {
        setSearchQuery('')
        setSearchResults([])
        setHighlightedSeats([])
    }

    if (loading || !user) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-background relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

            <div className="relative z-10 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Link href="/volunteer">
                            <Button variant="default" size="icon">
                                <ArrowLeft className="h-4 w-4 text-white" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground">Seating Management</h1>
                            <p className="text-muted-foreground">Find participants and view seating arrangements</p>
                        </div>
                    </div>

                    {/* Sticky Search Header */}
                    <div className="sticky top-0 z-50 -mx-6 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border mb-6 shadow-sm">
                        <div className="max-w-7xl mx-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by participant name, email or Team ID..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        // Debounce logic handled in useEffect
                                    }}
                                    className="pl-10 h-10 bg-secondary/50 border-primary/20 focus:border-primary transition-all text-white placeholder:text-muted-foreground"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={clearSearch}
                                    >
                                        ×
                                    </Button>
                                )}

                                {/* Search Results Overlay */}
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl max-h-[60vh] overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-2 sticky top-0 bg-card border-b border-border z-10 flex justify-between items-center">
                                            <p className="text-xs font-medium text-muted-foreground px-2">
                                                Found {searchResults.length} participants
                                            </p>
                                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearSearch}>
                                                Close
                                            </Button>
                                        </div>
                                        <div className="p-2 grid gap-1">
                                            {searchResults.map((result: any) => (
                                                <div
                                                    key={result.participant._id}
                                                    className="p-3 rounded-md hover:bg-primary/10 cursor-pointer transition-colors flex items-center justify-between group"
                                                    onClick={() => {
                                                        handleSeatClick({ teamId: result.participant.teamId } as any)
                                                        // Optional: clear search after selection or keep it? 
                                                        // Keeping it allows seeing other team members if searching by team ID
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                                            {result.participant.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                                                {result.participant.name}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <span>{result.participant.teamId}</span>
                                                                <span>•</span>
                                                                <span>{result.participant.email}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {result.seating && (
                                                        <Badge variant="outline" className="bg-background group-hover:border-primary/50 transition-colors">
                                                            {result.seating.section === 'left' ? 'Left' : 'Right'} - {result.seating.seats[0].row}{result.seating.seats[0].column}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Seating Map */}
                    {loadingData ? (
                        <Card>
                            <CardContent className="p-12 text-center">Loading seating map...</CardContent>
                        </Card>
                    ) : (
                        <SeatingMap
                            section="left" // Default, doesn't matter for full view
                            teamSeats={[]} // No specific team to highlight green (unless we want to highlight search result?)
                            allOccupiedSeats={allOccupiedSeats}
                            highlightedSeats={highlightedSeats}
                            totalRows={Math.max(sectionLayout.left.rows, sectionLayout.right.rows)}
                            totalColumns={Math.max(sectionLayout.left.columns, sectionLayout.right.columns)}
                            labName="APJ Abdul Kalam Lab"
                            interactive={true}
                            onSeatClick={handleSeatClick}
                        />
                    )}
                </div>
            </div>

            {/* Team Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Team Details</DialogTitle>
                        <DialogDescription>
                            Seating information and member list
                        </DialogDescription>
                    </DialogHeader>

                    {loadingDetails ? (
                        <div className="py-8 text-center">Loading details...</div>
                    ) : selectedTeam ? (
                        <div className="space-y-6">
                            {/* Team Header */}
                            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border">
                                <div>
                                    <p className="text-sm text-muted-foreground">Team ID</p>
                                    <p className="text-xl font-bold">{selectedTeam.teamId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Location</p>
                                    <Badge className={selectedTeam.seating.section === 'left' ? 'bg-blue-500' : 'bg-orange-500'}>
                                        {selectedTeam.seating.section === 'left' ? 'Left Section' : 'Right Section'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Members List */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Team Members ({selectedTeam.members.length})
                                </h4>
                                <div className="space-y-3">
                                    {selectedTeam.members.map((member) => (
                                        <div key={member._id} className="flex items-start gap-3 p-3 border rounded-md">
                                            <div className="p-2 bg-primary/10 rounded-full">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{member.name}</p>
                                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Phone: {member.phone || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Seats */}
                            <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Assigned Seats
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTeam.seating.seats.map((seat, idx) => (
                                        <Badge key={idx} variant="secondary" className="px-3 py-1">
                                            Row {String.fromCharCode(64 + seat.row)} - Seat {seat.column}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-4 text-center text-muted-foreground">No details found</div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
