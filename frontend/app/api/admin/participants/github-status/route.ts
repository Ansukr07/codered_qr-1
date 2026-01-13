import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { data: participants, error } = await supabase
            .from('participants')
            .select('id, name, email, team_id, github_link, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Process participants with deduplication and status mapping
        const participantMap = new Map<string, any>();

        participants.forEach(p => {
            const email = (p.email || '').trim().toLowerCase();
            const teamId = (p.team_id || '').trim();
            const githubLink = (p.github_link || '').trim();
            const hasLink = githubLink.length > 0;

            // Unique key: email+teamId (fallback to id if no email)
            const key = email ? `${email}_${teamId || 'no-team'}` : `${p.id}_${teamId || 'no-team'}`;

            if (!participantMap.has(key)) {
                participantMap.set(key, {
                    _id: p.id,
                    name: p.name,
                    email: email || null,
                    teamId: teamId || null,
                    githubLink: hasLink ? githubLink : null,
                    status: hasLink ? 'submitted' : 'pending',
                    createdAt: p.created_at
                });
            } else if (hasLink) {
                // If duplicate found, prefer the one with a GitHub link
                const existing = participantMap.get(key);
                if (!existing.githubLink) {
                    existing.githubLink = githubLink;
                    existing.status = 'submitted';
                }
            }
        });

        const githubStatus = Array.from(participantMap.values());

        const stats = {
            total: githubStatus.length,
            submitted: githubStatus.filter(p => p.status === 'submitted').length,
            pending: githubStatus.filter(p => p.status === 'pending').length
        };

        return NextResponse.json({
            participants: githubStatus,
            stats
        });
    } catch (error: any) {
        console.error('Error in GET /api/admin/participants/github-status:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

