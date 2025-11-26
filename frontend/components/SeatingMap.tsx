import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SeatInfo {
    seatNumber?: number
    row: number
    column: number
    section?: 'left' | 'right'
}

interface SeatingMapProps {
    section: 'left' | 'right'
    teamSeats: SeatInfo[]  // User's team seats
    allOccupiedSeats?: SeatInfo[] // All occupied seats in the lab
    totalRows: number
    totalColumns: number
    labName: string
}

export default function SeatingMap({
    section,
    teamSeats,
    allOccupiedSeats = [],
    totalRows,
    totalColumns,
    labName
}: SeatingMapProps) {
    // Generate row labels (A, B, C, ...)
    const getRowLabel = (rowNum: number) => {
        return String.fromCharCode(64 + rowNum)
    }

    // Check if a seat is one of the user's team seats
    const isTeamSeat = (row: number, col: number) => {
        return teamSeats.some(seat => seat.row === row && seat.column === col)
    }

    // Check if a seat is occupied by ANY team
    const isOccupied = (row: number, col: number, sectionName: 'left' | 'right') => {
        return allOccupiedSeats.some(seat =>
            seat.row === row &&
            seat.column === col &&
            seat.section === sectionName
        )
    }

    // Generate seats for a section
    const generateSeats = (sectionName: 'left' | 'right') => {
        const seats = []
        for (let r = 1; r <= totalRows; r++) {
            const rowSeats = []
            for (let c = 1; c <= totalColumns; c++) {
                const isUserTeamSeat = sectionName === section && isTeamSeat(r, c)
                const isSeatOccupied = isOccupied(r, c, sectionName)
                const seatNum = (r - 1) * totalColumns + c

                rowSeats.push({
                    row: r,
                    col: c,
                    num: seatNum,
                    isTeamSeat: isUserTeamSeat,
                    isOccupied: isSeatOccupied
                })
            }
            seats.push({ rowLabel: getRowLabel(r), seats: rowSeats })
        }
        return seats
    }

    const leftSeats = generateSeats('left')
    const rightSeats = generateSeats('right')

    const renderSection = (seats: any[], sectionName: 'left' | 'right', title: string) => {
        return (
            <div className="space-y-1">
                {/* Section Title */}
                <div className="text-center mb-2 pb-2 border-b border-border">
                    <p className="text-xs font-semibold text-muted-foreground">{title}</p>
                </div>

                {/* Seats Grid with Row Labels */}
                <div className="space-y-1">
                    {seats.map((rowData: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                            {/* Row Label */}
                            <div className="w-4 text-xs font-bold text-muted-foreground text-center">
                                {rowData.rowLabel}
                            </div>

                            {/* Seats in Row */}
                            <div className="flex gap-1">
                                {rowData.seats.map((seat: any) => {
                                    // Determine styling based on seat state
                                    let seatStyle = 'bg-secondary/30 border-border text-muted-foreground' // Default empty
                                    let title = `Seat ${seat.col}`

                                    if (seat.isTeamSeat) {
                                        // User's team seat - GREEN
                                        seatStyle = 'bg-green-500 border-green-600 text-white shadow-md font-bold'
                                        title = 'Your Team Seat'
                                    } else if (seat.isOccupied) {
                                        // Occupied by another team - PRIMARY COLOR (Neutral)
                                        seatStyle = 'bg-primary/20 border-primary text-primary font-medium'
                                        title = 'Occupied'
                                    }

                                    return (
                                        <div
                                            key={`${seat.row}-${seat.col}`}
                                            className={`
                                                w-7 h-7 rounded-sm flex items-center justify-center text-[10px]
                                                border transition-all ${seatStyle}
                                            `}
                                            title={title}
                                        >
                                            {seat.col}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <Card className="bg-card border-border">
            <CardContent className="p-6">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-bold text-card-foreground">{labName}</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Seating Plan</p>
                    </div>

                    {/* Both Sections Side-by-Side - BookMyShow Style */}
                    <div className="grid md:grid-cols-2 gap-6 px-4">
                        {/* Left Section */}
                        {renderSection(leftSeats, 'left', '← LEFT SECTION')}

                        {/* Right Section */}
                        {renderSection(rightSeats, 'right', 'RIGHT SECTION →')}
                    </div>

                    {/* Screen/Stage Indicator - BookMyShow Style */}
                    <div className="text-center pt-4">
                        <div className="inline-block px-16 py-2 bg-gradient-to-b from-primary/30 to-primary/10 border-t-2 border-x-2 border-primary/40 rounded-t-[100px]">
                            <p className="text-xs text-muted-foreground font-medium">All eyes this way please</p>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="border-t border-border pt-4">
                        <div className="flex justify-center gap-6 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-secondary/30 border border-border rounded-sm"></div>
                                <span className="text-muted-foreground">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-primary/20 border border-primary rounded-sm"></div>
                                <span className="text-muted-foreground">Occupied</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-green-500 border border-green-600 rounded-sm"></div>
                                <span className="text-muted-foreground font-semibold">Your Team ({teamSeats.length} seats)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
