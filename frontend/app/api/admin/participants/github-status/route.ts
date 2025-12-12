import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/lib/models/User';
import { requireAuth, requireRole } from '@/lib/middleware/rbac';
import { createClient } from '@supabase/supabase-js';

async function connectDB() {
    if (mongoose.connections[0].readyState) return;
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
        await mongoose.connect(mongoUri);
    }
}

function getSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
        return null;
    }
    
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        // Fetch from MongoDB
        const mongoParticipants = await User.find({ role: 'participant' })
            .select('name email teamId githubLink createdAt')
            .sort({ createdAt: -1 });

        // Fetch from Supabase
        const supabase = getSupabaseClient();
        let supabaseParticipants: any[] = [];
        
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('participants')
                    .select('id, name, email, team_id, github_link, created_at')
                    .order('created_at', { ascending: false });
                
                if (!error && data) {
                    supabaseParticipants = data;
                }
            } catch (supabaseError: any) {
                console.error('Error fetching from Supabase:', supabaseError);
            }
        }

        // Normalize and combine participants from both sources
        // Strategy: Use email (normalized) + teamId (normalized) as unique key
        const participantMap = new Map<string, any>();
        
        // Helper function to normalize email and teamId
        const normalizeEmail = (email: string | null | undefined): string | null => {
            if (!email) return null;
            return email.trim().toLowerCase();
        };
        
        const normalizeTeamId = (teamId: string | null | undefined): string | null => {
            if (!teamId) return null;
            return teamId.trim();
        };
        
        // Add MongoDB participants
        mongoParticipants.forEach(p => {
            const normalizedEmail = normalizeEmail(p.email);
            const normalizedTeamId = normalizeTeamId(p.teamId);
            const hasLink = p.githubLink && p.githubLink.trim() && p.githubLink.trim().length > 0;
            
            // Use normalized email+teamId as key, fallback to _id if no email
            const key = normalizedEmail 
                ? `${normalizedEmail}_${normalizedTeamId || 'no-team'}`
                : `${p._id.toString()}_${normalizedTeamId || 'no-team'}`;
            
            if (!participantMap.has(key)) {
                participantMap.set(key, {
                    _id: p._id.toString(),
                    name: p.name,
                    email: normalizedEmail,
                    teamId: normalizedTeamId,
                    githubLink: hasLink ? p.githubLink.trim() : null,
                    status: hasLink ? 'submitted' : 'pending',
                    createdAt: p.createdAt
                });
            } else {
                // Update existing if this one has a GitHub link and existing doesn't
                const existing = participantMap.get(key);
                if (hasLink && !existing.githubLink) {
                    existing.githubLink = p.githubLink.trim();
                    existing.status = 'submitted';
                }
            }
        });
        
        // Add/update with Supabase participants
        supabaseParticipants.forEach(p => {
            const normalizedEmail = normalizeEmail(p.email);
            const normalizedTeamId = normalizeTeamId(p.team_id);
            const hasLink = p.github_link && p.github_link.trim() && p.github_link.trim().length > 0;
            
            // Use normalized email+teamId as key, fallback to id if no email
            const key = normalizedEmail 
                ? `${normalizedEmail}_${normalizedTeamId || 'no-team'}`
                : `${p.id}_${normalizedTeamId || 'no-team'}`;
            
            if (participantMap.has(key)) {
                // Update existing participant - prefer Supabase github_link
                const existing = participantMap.get(key);
                if (hasLink) {
                    existing.githubLink = p.github_link.trim();
                    existing.status = 'submitted';
                }
                // Update name/email if Supabase has better data
                if (p.name && !existing.name) existing.name = p.name;
                if (normalizedEmail && !existing.email) existing.email = normalizedEmail;
            } else {
                // Add new participant
                participantMap.set(key, {
                    _id: p.id,
                    name: p.name,
                    email: normalizedEmail,
                    teamId: normalizedTeamId,
                    githubLink: hasLink ? p.github_link.trim() : null,
                    status: hasLink ? 'submitted' : 'pending',
                    createdAt: p.created_at ? new Date(p.created_at) : new Date()
                });
            }
        });

        // Final deduplication pass: ensure no duplicates by email+teamId
        const finalMap = new Map<string, any>();
        participantMap.forEach((participant) => {
            const finalKey = participant.email 
                ? `${participant.email}_${participant.teamId || 'no-team'}`
                : `${participant._id}_${participant.teamId || 'no-team'}`;
            
            if (!finalMap.has(finalKey)) {
                finalMap.set(finalKey, participant);
            } else {
                // If duplicate found, prefer the one with GitHub link
                const existing = finalMap.get(finalKey);
                if (participant.githubLink && !existing.githubLink) {
                    finalMap.set(finalKey, participant);
                }
            }
        });

        const githubStatus = Array.from(finalMap.values());

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
        return NextResponse.json(
            { message: error.message || 'Failed to fetch GitHub status' },
            { status: 500 }
        );
    }
}

