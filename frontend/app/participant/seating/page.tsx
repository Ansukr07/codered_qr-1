'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Map as MapIcon, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import SeatingMap from '@/components/SeatingMap'
import { findTeamByMember } from '@/lib/teamData'
import { SEATING_DATA } from '@/lib/seatingData'

export default function SeatingPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [searchQuery, setSearchQuery] = React.useState('')
    const [displayTeam, setDisplayTeam] = React.useState<string>('')

    // Redirect if not logged in
    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    // Initial load: Find team for logged in user
    React.useEffect(() => {
        if (user?.name && !searchQuery) {
            const dbTeam = findTeamByMember(user.name);
            // Fallback to user context team if not in DB
            const contextTeam = (user as any).teamName || (user as any).teamId?.name || (user as any).team || '';
            const initialTeam = dbTeam || contextTeam;

            if (initialTeam) setDisplayTeam(initialTeam);
        }
    }, [user, searchQuery]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim().length > 0) {
            // 1. Try finding by member name
            let team = findTeamByMember(query);

            // 2. If not found, try searching SEATING_DATA for Team Name match
            if (!team) {
                const foundSeat = SEATING_DATA.find(s =>
                    s.team.toLowerCase().includes(query.toLowerCase())
                );
                if (foundSeat) {
                    team = foundSeat.team;
                }
            }

            if (team) {
                setDisplayTeam(team);
            } else {
                setDisplayTeam('');
            }
        } else {
            // Revert to user's team
            if (user?.name) {
                const dbTeam = findTeamByMember(user.name);
                const contextTeam = (user as any).teamName || (user as any).teamId?.name || (user as any).team || '';
                setDisplayTeam(dbTeam || contextTeam);
            }
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 bg-red-500 rounded-full mb-4"></div>
                    <p className="text-muted-foreground">Loading seating data...</p>
                </div>
            </div>
        )
    }

    const pageTitle = displayTeam
        ? `Zone: ${displayTeam}`
        : 'Find Seating';

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-[#f5f5f7] relative overflow-hidden">
            {/* Background Grid similar to dashboard */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03] pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 flex flex-col min-h-screen">
                {/* Navigation Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/participant">
                            <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-white">
                                <ChevronLeft className="mr-1 h-5 w-5" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                                <MapIcon className="h-6 w-6 text-red-500" />
                                {pageTitle}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {displayTeam
                                    ? `Showing seating for team ${displayTeam}`
                                    : 'Search for a member to find their seat.'}
                            </p>
                        </div>
                    </div>
                    {/* Search Bar */}
                    <div className="w-full md:w-auto relative group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-red-500 transition-colors" />
                        <Input
                            type="text"
                            placeholder="Find team or member..."
                            className="pl-9 w-full md:w-64 bg-[#1e1e2e] border-[#2a2a35] focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-white placeholder:text-muted-foreground"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col relative">
                    <div className="w-full flex-1 min-h-[500px] border border-[#2a2a35] rounded-2xl p-1 bg-[#13131a]/50 backdrop-blur-sm shadow-xl relative">
                        <SeatingMap teamName={displayTeam} />

                        {/* Search feedback overlay */}
                        {searchQuery && !displayTeam && (
                            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm backdrop-blur-md animate-in fade-in slide-in-from-top-4">
                                No team found for "{searchQuery}"
                            </div>
                        )}
                    </div>

                    {/* Legend / Info */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1e1e2e]/50 border border-[#2a2a35]">
                            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                            <span>Selected Team Zone</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1e1e2e]/50 border border-[#2a2a35]">
                            <span className="w-3 h-3 rounded-full bg-[#3c1414]"></span>
                            <span>Occupied Zones</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1e1e2e]/50 border border-[#2a2a35]">
                            <span className="w-3 h-3 rounded-full bg-[#15151a] border border-[#2a2a35]"></span>
                            <span>Available / Unassigned</span>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
