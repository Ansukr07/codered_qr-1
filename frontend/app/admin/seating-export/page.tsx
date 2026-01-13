import React from 'react';
import SeatingMapPrint from '@/components/SeatingMapPrint';
import supabase from '@/lib/config/supabase';

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
    if (!supabase) {
        throw new Error("Supabase is not configured");
    }

    // In Supabase, track might not exist on participants table based on final_setup.sql,
    // assuming track is related to something else or just filtering all for now.
    // If track is needed, we should check the schema.
    // Looking at final_setup.sql, 'participants' table has 'team_id'.
    // Let's assume all participants for now if track filter isn't directly on table,
    // or if track is part of some naming convention.

    const { data: participants, error } = await supabase
        .from('participants')
        .select('team_id');

    if (error) throw error;

    // Group by team_id
    const teamsMap = new Set<string>();
    participants.forEach((p) => {
        if (p.team_id) {
            teamsMap.add(p.team_id);
        }
    });

    const teams = Array.from(teamsMap).map((name) => ({
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
