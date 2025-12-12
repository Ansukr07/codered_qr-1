import { connect } from 'mongoose';
import React from 'react';
import SeatingMapPrint from '@/components/SeatingMapPrint';
// Import User model - we might need to be careful about environment
// Since this is a server component in Next 13+, we can access DB directly if configured.

// Copied logic from SeatingMap.tsx to ensure index consistency
function getTeamIndex(teamName: string, maxTeams: number): number {
    let hash = 0;
    const str = teamName.toLowerCase().replace(/\s+/g, '');
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % maxTeams;
}

async function getTeamsForTrack(track: string) {
    // This is a direct DB call. Ensure MONGODB_URI is available.
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI not defined");
    }

    // We need to use the User model. In Next.js server components, we can require it if not using edge runtime.
    // However, importing mongoose models in Next.js can be tricky with hot reloading.
    // Let's try to define the schema/model locally if not exists to avoid overwrite errors.
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
    }

    // Import User model from the model file to avoid duplicate schema compilation
    // This prevents the duplicate index warning
    const User = (await import('@/lib/models/User')).default;
    
    // Find users in this track
    const users = await User.find({ track: track });

    // Group by teamId
    const teamsMap = new Map();
    users.forEach((u: any) => {
        if (u.teamId) {
            teamsMap.set(u.teamId, u.teamId);
        }
    });

    const teams = Array.from(teamsMap.values()).map((name: string) => ({
        name: name,
        index: getTeamIndex(name, 52)
    }));

    return teams;
}

export default async function SeatingExportPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const track = (await searchParams).track as string;

    if (!track) {
        return <div className="text-white p-4">Please provide a ?track= param (CR or CRU)</div>;
    }

    const teams = await getTeamsForTrack(track);

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'black' }}>
            <SeatingMapPrint teams={teams} />
        </div>
    );
}
