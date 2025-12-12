'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

// Timeline Data
const SCHEDULE = {
    day1: {
        date: "12TH DECEMBER, 2025",
        events: [
            { time: "9:30 AM", title: "INAGURATION", type: "red", align: "left" },
            { time: "11:00 AM", title: "HACKING BEGINS", type: "white", align: "right" },
            { time: "12:30 PM", title: "LUNCH", type: "white", align: "left" },
            { time: "6:00 PM", title: "ROUND 1 EVALUATION", type: "yellow", align: "right" },
            { time: "8:00 PM", title: "DINNER", type: "red", align: "left" },
            { time: "11:00 PM", title: "BONFIRE", type: "red", align: "right" },
        ]
    },
    day2: {
        date: "13TH DECEMBER, 2025",
        events: [
            { time: "1:00 AM", title: "MIDNIGHT MENTORING", type: "red", align: "left" },
            { time: "8:00 AM", title: "BREAKFAST", type: "white", align: "right" },
            { time: "11:00 AM", title: "ROUND 2 EVALUATION", type: "white", align: "left" },
            { time: "2:00 PM", title: "FINAL ROUND EVALUATION", type: "yellow", align: "right" },
            { time: "3:30 PM", title: "CLOSING CEREMONY", type: "red", align: "left" },
        ]
    }
};

export default function TimelinePage() {
    const router = useRouter();
    const [activeDay, setActiveDay] = useState<'day1' | 'day2'>('day1');

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 relative overflow-x-hidden font-sans">
            {/* Background Texture similar to image */}
            <div className="fixed inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: `
                        linear-gradient(45deg, #1a1a1a 25%, transparent 25%), 
                        linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #1a1a1a 75%), 
                        linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
            />

            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-6 hover:bg-white/10 text-white z-50 relative"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-12 text-center relative">
                    <h1 className="text-5xl md:text-7xl font-bold italic tracking-tighter mb-2">
                        DAY {activeDay === 'day1' ? '1' : '2'} <span className="text-red-600">TIMELINE</span>
                    </h1>
                    <div className="inline-block bg-red-700 text-white px-6 py-2 skew-x-[-10deg]">
                        <span className="block skew-x-[10deg] text-lg md:text-xl font-bold italic tracking-wider">
                            {SCHEDULE[activeDay].date}
                        </span>
                    </div>

                    {/* Day Toggles */}
                    <div className="flex justify-center gap-4 mt-8">
                        <button
                            onClick={() => setActiveDay('day1')}
                            className={`px-6 py-2 border-2 font-bold transition-all transform skew-x-[-10deg] hover:scale-105 ${activeDay === 'day1' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white hover:bg-white/10'}`}
                        >
                            <span className="block skew-x-[10deg]">DAY 1</span>
                        </button>
                        <button
                            onClick={() => setActiveDay('day2')}
                            className={`px-6 py-2 border-2 font-bold transition-all transform skew-x-[-10deg] hover:scale-105 ${activeDay === 'day2' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white hover:bg-white/10'}`}
                        >
                            <span className="block skew-x-[10deg]">DAY 2</span>
                        </button>
                    </div>
                </div>

                {/* Timeline Container */}
                <div className="relative py-10">
                    {/* Central Vertical Line */}
                    <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-white ml-[-0.5px] md:ml-[-2px]"></div>

                    <div className="space-y-12">
                        {SCHEDULE[activeDay].events.map((event, index) => (
                            <TimelineItem key={index} event={event} index={index} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Decorative Corner Elements */}
            <div className="fixed bottom-0 left-0 w-32 h-32 opacity-50 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-yellow-500">
                    <path d="M0 100 L40 60 L60 80 L100 0 L80 100 Z" />
                </svg>
            </div>
            <div className="fixed top-0 right-0 w-48 h-48 opacity-50 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-yellow-500">
                    <rect x="50" y="0" width="50" height="50" className="opacity-20" />
                    <path d="M100 0 L70 30 L90 50 L50 100 L100 100 Z" />
                </svg>
            </div>
        </div>
    );
}

function TimelineItem({ event, index }: { event: any, index: number }) {
    // Colors
    const colors = {
        red: { bg: 'bg-[#D80000]', text: 'text-white' },
        white: { bg: 'bg-white', text: 'text-[#D80000]' },
        yellow: { bg: 'bg-[#FFC000]', text: 'text-[#D80000]' } // Yellow bg, Red text for contrast based on image
    };

    const theme = colors[event.type as keyof typeof colors];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative flex items-center mb-8 ${event.align === 'right' ? 'md:flex-row-reverse' : ''}`}
        >
            {/* Timeline Connector Dot/Line for Desktop */}
            <div className="hidden md:block absolute left-1/2 w-4 h-1 bg-white -ml-2"></div>

            {/* Mobile Connector */}
            <div className="md:hidden absolute left-4 w-4 h-1 bg-white"></div>

            {/* Content Spacer for Alignment */}
            <div className="hidden md:block w-1/2"></div>

            {/* Event Card */}
            <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${event.align === 'left' ? 'md:pr-8' : 'md:pl-8'}`}>
                <div className="relative group">
                    {/* The Ribbon Shape */}
                    <div className={`relative p-4 md:p-6 shadow-lg transform transition-transform hover:scale-105 ${theme.bg}`}>
                        {/* Folded Corner Effect (CSS Triangle) */}
                        <div
                            className={`absolute bottom-[-10px] ${event.align === 'left' ? 'right-0' : 'right-0'} w-0 h-0 
                            border-t-[10px] border-r-[10px] z-0 brightness-75
                            ${theme.bg === 'bg-[#D80000]' ? 'border-t-[#900000] border-r-transparent' : ''}
                            ${theme.bg === 'bg-white' ? 'border-t-gray-300 border-r-transparent' : ''}
                            ${theme.bg === 'bg-[#FFC000]' ? 'border-t-[#cc9a00] border-r-transparent' : ''}
                            `}
                        ></div>

                        {/* Decoration vertical strip on the side connecting to timeline */}
                        <div className={`absolute top-4 ${event.align === 'right' ? 'left-[-4px]' : 'right-[-4px] md:right-[-4px]'} bottom-4 w-1 bg-black/20`}></div>

                        <h3 className={`text-2xl md:text-3xl font-bold italic tracking-wide uppercase ${theme.text}`}>
                            {event.title}
                        </h3>
                    </div>

                    {/* Time Label */}
                    <div className={`mt-2 font-bold text-xl md:text-2xl text-white italic tracking-widest ${event.align === 'right' ? 'text-right' : 'text-left'}`}>
                        {event.time}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
