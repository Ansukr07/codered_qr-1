'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Map as MapIcon, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

import CampusFloorMap, { RoomNode } from '@/components/CampusFloorMap'

// --- Data Constants ---

const FLOOR_3_DATA: RoomNode[] = [
    // --- Left Wing ---
    { id: '3-teach-1', label: 'Teachers Cabin', type: 'office', x: 20, y: 150, width: 80, height: 100 },
    { id: '3-teach-2', label: 'Teachers', type: 'office', x: 20, y: 250, width: 80, height: 100 },
    { id: '3-lift-l', label: 'LIFT', type: 'lift', x: 100, y: 180, width: 50, height: 50 },
    { id: '3-wash-g', label: 'Girls Washroom', type: 'washroom', x: 100, y: 100, width: 80, height: 80 },
    { id: '3-stair-l', label: 'Stairs', type: 'stairs', x: 180, y: 50, width: 100, height: 100, specialMark: 'X' },

    // --- Middle Top ---
    // Evaluation rooms 301-305 + Aryabhata Lab (306)
    { id: '301', label: '301 (Eval)', type: 'classroom', x: 300, y: 150, width: 100, height: 80 },
    { id: '302', label: '302 (Eval)', type: 'classroom', x: 400, y: 150, width: 100, height: 80 },
    { id: '303', label: '303 (Eval)', type: 'classroom', x: 500, y: 150, width: 100, height: 80 },
    { id: '304', label: '304 (Eval)', type: 'classroom', x: 600, y: 150, width: 100, height: 80 },
    { id: '305', label: '305 (Eval)', type: 'classroom', x: 700, y: 150, width: 100, height: 80 },
    { id: '306', label: 'Aryabhata Lab (306)', type: 'lab', x: 800, y: 150, width: 150, height: 80 },

    // --- Middle Bottom ---
    // Teachers Cabin, Ratan Tata Lab (310), 309, 308
    { id: '3-teach-3', label: 'Teachers', type: 'office', x: 300, y: 370, width: 80, height: 80 },
    { id: '310', label: 'Ratan Tata Lab (310)', type: 'lab', x: 380, y: 370, width: 300, height: 80 },
    // Gap for middle stairs
    { id: '3-stair-m', label: 'Stairs', type: 'stairs', x: 680, y: 450, width: 60, height: 80 },
    { id: '309', label: '309 (Eval)', type: 'classroom', x: 740, y: 370, width: 100, height: 80 },
    { id: '308', label: '308 (Eval)', type: 'classroom', x: 840, y: 370, width: 100, height: 80 },
    { id: '3-teach-4', label: 'Teachers', type: 'office', x: 940, y: 370, width: 100, height: 80 },


    // --- Right Wing ---
    { id: '3-water', label: 'Water', type: 'water', x: 1050, y: 150, width: 50, height: 50 },
    { id: '3-stair-r', label: 'Stairs', type: 'stairs', x: 1050, y: 50, width: 100, height: 100, specialMark: 'X' },
    { id: '3-wash-b', label: 'Boys Washroom', type: 'washroom', x: 1150, y: 120, width: 80, height: 50 },
    { id: '3-lift-r', label: 'LIFT', type: 'lift', x: 1150, y: 180, width: 50, height: 50 },
    { id: '3-place', label: 'Placement Office', type: 'office', x: 1200, y: 180, width: 80, height: 200, rotation: 90 },

    // --- Corridors ---
    { id: '3-corr-main', label: '', type: 'corridor', x: 180, y: 230, width: 970, height: 140 },
];

const FLOOR_4_DATA: RoomNode[] = [
    // --- Left Wing (Identical structure mostly) ---
    { id: '4-teach-1', label: 'Teachers Cabin', type: 'office', x: 20, y: 150, width: 80, height: 100 },
    { id: '4-teach-2', label: 'Teachers', type: 'office', x: 20, y: 250, width: 80, height: 100 },
    { id: '4-lift-l', label: 'LIFT', type: 'lift', x: 100, y: 180, width: 50, height: 50 },
    { id: '4-wash-g', label: 'Girls Washroom', type: 'washroom', x: 100, y: 100, width: 80, height: 80 },
    { id: '4-stair-l', label: 'Stairs', type: 'stairs', x: 180, y: 50, width: 100, height: 100, specialMark: 'X' },

    // --- Middle Top ---
    // 401, 402, 403, APJ Lab
    { id: '401', label: '401 (Girls Common)', type: 'common', x: 300, y: 150, width: 120, height: 80 },
    { id: '402', label: '402 (Chill)', type: 'common', x: 420, y: 150, width: 100, height: 80 },
    { id: '403', label: 'Savitribai Phule (403)', type: 'classroom', x: 520, y: 150, width: 150, height: 80 },
    { id: '4-apj', label: 'APJ Abdul Kalam Lab', type: 'lab', x: 670, y: 150, width: 350, height: 80 },

    // --- Middle Bottom ---
    // Teachers, Kalpana Chawla (410), 409, 408
    { id: '4-teach-3', label: 'Teachers', type: 'office', x: 300, y: 370, width: 80, height: 80 },
    { id: '410', label: 'Kalpana Chawla Lab', type: 'lab', x: 380, y: 370, width: 300, height: 80 },
    // Stair gap
    { id: '4-stair-m', label: 'Stairs', type: 'stairs', x: 680, y: 450, width: 60, height: 80 },
    { id: '409', label: '409 (Storage)', type: 'storage', x: 740, y: 370, width: 100, height: 80 },
    { id: '408', label: '408 (Boys Common)', type: 'common', x: 840, y: 370, width: 120, height: 80 },
    { id: '4-teach-4', label: 'Teachers', type: 'office', x: 960, y: 370, width: 80, height: 80 },

    // --- Right Wing ---
    { id: '4-water', label: 'Water', type: 'water', x: 1050, y: 150, width: 50, height: 50 },
    { id: '4-stair-r', label: 'Stairs', type: 'stairs', x: 1050, y: 50, width: 100, height: 100, specialMark: 'X' },
    { id: '4-wash-b', label: 'Boys Washroom', type: 'washroom', x: 1150, y: 120, width: 80, height: 50 },
    { id: '4-lift-r', label: 'LIFT', type: 'lift', x: 1150, y: 180, width: 50, height: 50 },
    { id: '4-lab-long', label: 'Long LAB Block', type: 'lab', x: 1200, y: 180, width: 80, height: 250, rotation: 90 },

    // --- Corridors ---
    { id: '4-corr-main', label: '', type: 'corridor', x: 180, y: 230, width: 970, height: 140 },
];

export default function CampusMapPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [activeFloor, setActiveFloor] = useState<3 | 4>(3)

    // Redirect if not logged in
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 bg-blue-500 rounded-full mb-4"></div>
                    <p className="text-muted-foreground">Loading campus map...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-[#f5f5f7] relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 flex flex-col min-h-screen">
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
                                <MapIcon className="h-6 w-6 text-blue-500" />
                                Campus Map
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                View layout for 3rd and 4th floors
                            </p>
                        </div>
                    </div>

                    {/* Floor Toggle Buttons */}
                    <div className="flex bg-[#1e1e2e] p-1 rounded-lg border border-[#2a2a35]">
                        <button
                            onClick={() => setActiveFloor(3)}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 ${activeFloor === 3
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-muted-foreground hover:text-white hover:bg-[#2a2a35]'
                                }`}
                        >
                            3rd Floor
                        </button>
                        <button
                            onClick={() => setActiveFloor(4)}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 ${activeFloor === 4
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-muted-foreground hover:text-white hover:bg-[#2a2a35]'
                                }`}
                        >
                            4th Floor
                        </button>
                    </div>
                </header>

                {/* Map Display Area */}
                <main className="flex-1 flex flex-col relative">
                    <div className="w-full h-full border border-[#2a2a35] rounded-2xl p-4 bg-[#13131a]/50 backdrop-blur-sm shadow-xl relative overflow-hidden flex items-center justify-center">
                        <CampusFloorMap
                            floorNumber={activeFloor}
                            data={activeFloor === 3 ? FLOOR_3_DATA : FLOOR_4_DATA}
                        />

                        {/* Floating Floor Indicator */}
                        <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 pointer-events-none">
                            <Layers className="h-4 w-4 text-blue-400" />
                            <span className="font-mono font-bold text-white">
                                {activeFloor === 3 ? '3RD FLOOR' : '4TH FLOOR'}
                            </span>
                        </div>
                    </div>

                    {/* Legend / Info */}
                    <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground justify-center">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-500/20 border border-red-500/60 rounded"></span> Lab
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-blue-500/10 border border-blue-500/50 rounded"></span> Classroom/Hall
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-cyan-500/20 border border-cyan-500/50 rounded"></span> Washroom
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/50 rounded"></span> Office
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-red-500 font-bold">X</span> Blocked Access
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
