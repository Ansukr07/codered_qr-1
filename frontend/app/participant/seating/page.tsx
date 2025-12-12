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
    const [userTeamName, setUserTeamName] = React.useState<string>('')

    // Redirect if not logged in
    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    // Helper function to normalize and find exact team name from seating data
    const normalizeTeamName = (teamName: string): string | null => {
        if (!teamName) return null;
        const normalized = teamName.trim().toLowerCase();
        // Try to find exact match in seating data (case-insensitive)
        const found = SEATING_DATA.find(s => 
            s.team.trim().toLowerCase() === normalized && s.team.trim() !== ''
        );
        return found ? found.team.trim() : null;
    };

    // Initial load: Find team for logged in user
    React.useEffect(() => {
        if (user?.name) {
            // Priority 1: Use teamId from user object (from Supabase participant data)
            // This is the most reliable as it comes directly from the database
            const userTeamId = (user as any).teamId;
            
            // Normalize teamId to match exact team name from seating data
            let normalizedTeamId: string | null = null;
            if (userTeamId) {
                normalizedTeamId = normalizeTeamName(userTeamId);
            }
            
            // Priority 2: Try to find team by name (but only if teamId is not available or doesn't match)
            // This is a fallback for cases where teamId might not be set or doesn't match seating data
            const dbTeam = normalizedTeamId ? null : findTeamByMember(user.name);
            
            // Priority 3: Fallback to other team fields
            const contextTeam = (user as any).teamName || (user as any).team || '';
            const normalizedContextTeam = contextTeam ? normalizeTeamName(contextTeam) : null;
            
            // Use normalizedTeamId first, then dbTeam, then normalizedContextTeam
            const myTeam = normalizedTeamId || dbTeam || normalizedContextTeam || contextTeam;

            if (myTeam) {
                setUserTeamName(myTeam);
                if (!searchQuery) {
                    setDisplayTeam(myTeam);
                }
            }
        }
    }, [user, searchQuery]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim().length > 0) {
            // 1. Try finding by member name
            let team = findTeamByMember(query);

            // 2. If not found, try searching SEATING_DATA for Team Name match
            // First try exact match, then partial match
            if (!team) {
                const queryLower = query.toLowerCase().trim();
                // Try exact match first (case-insensitive)
                let foundSeat = SEATING_DATA.find(s => {
                    const teamLower = s.team.trim().toLowerCase();
                    return teamLower === queryLower && teamLower !== '';
                });
                // If no exact match, try starts with match (more precise than includes)
                if (!foundSeat) {
                    foundSeat = SEATING_DATA.find(s => {
                        const teamLower = s.team.trim().toLowerCase();
                        return teamLower !== '' && teamLower.startsWith(queryLower);
                    });
                }
                // Last resort: partial match
                if (!foundSeat) {
                    foundSeat = SEATING_DATA.find(s => {
                        const teamLower = s.team.trim().toLowerCase();
                        return teamLower !== '' && teamLower.includes(queryLower);
                    });
                }
                // Use the exact team name from seating data to ensure consistency
                if (foundSeat && foundSeat.team.trim() !== '') {
                    team = foundSeat.team.trim();
                }
            }

            if (team) {
                // RESTRICTION LOGIC: Check if found team is in the same lab as user
                const userSeat = SEATING_DATA.find(s => s.team.toLowerCase() === userTeamName.toLowerCase());
                const targetSeat = SEATING_DATA.find(s => s.team.toLowerCase() === team!.toLowerCase());

                // Only allow showing if labs match (or if user has no assigned seat, unrestricted?)
                // Requirement: "participant that has a particular lab alloted shouldnt see teams in other labs"
                const userLab = userSeat?.lab;
                const targetLab = targetSeat?.lab;

                if (userLab && targetLab && userLab === targetLab) {
                    setDisplayTeam(team);
                } else if (!userLab) {
                    // If user has no lab allotted, maybe allow viewing all? Or restrict? 
                    // Safest is to allow viewing if we assume generic access, but request implies restriction based on allotment.
                    // If I am not allotted, I might still want to search.
                    setDisplayTeam(team);
                } else {
                    // Allotted to a lab, but searching for team in another lab -> Hide (Show own team instead)
                    setDisplayTeam(userTeamName);
                }
            } else {
                setDisplayTeam(userTeamName); // Revert to own team if not found
            }
        } else {
            // Revert to user's team
            setDisplayTeam(userTeamName);
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
                </main>
            </div>
        </div>
    )
}
