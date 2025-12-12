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
        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        // Fetch ONLY from Supabase - this is where clean teams like "404 brain not found" and "tesserhack" are
        const supabase = getSupabaseClient();
        if (!supabase) {
            return NextResponse.json(
                { message: 'Supabase not configured' },
                { status: 500 }
            );
        }

        let supabaseParticipants: any[] = [];
        
        try {
            const { data, error } = await supabase
                .from('participants')
                .select('id, name, email, team_id, github_link, created_at')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Supabase fetch error:', error);
                return NextResponse.json(
                    { message: `Supabase error: ${error.message}` },
                    { status: 500 }
                );
            }
            
            supabaseParticipants = data || [];
        } catch (supabaseError: any) {
            console.error('Error fetching from Supabase:', supabaseError);
            return NextResponse.json(
                { message: `Failed to fetch from Supabase: ${supabaseError.message}` },
                { status: 500 }
            );
        }

        // Process Supabase participants with proper deduplication
        const participantMap = new Map<string, any>();
        
        // Helper functions
        const normalizeEmail = (email: string | null | undefined): string | null => {
            if (!email) return null;
            return email.trim().toLowerCase();
        };
        
        const normalizeTeamId = (teamId: string | null | undefined): string | null => {
            if (!teamId) return null;
            return teamId.trim();
        };
        
        supabaseParticipants.forEach(p => {
            const normalizedEmail = normalizeEmail(p.email);
            const normalizedTeamId = normalizeTeamId(p.team_id);
            const hasLink = p.github_link && p.github_link.trim() && p.github_link.trim().length > 0;
            
            // Create unique key: email+teamId (or id+teamId if no email)
            const key = normalizedEmail 
                ? `${normalizedEmail}_${normalizedTeamId || 'no-team'}`
                : `${p.id}_${normalizedTeamId || 'no-team'}`;
            
            // Only add if not already exists (first occurrence wins)
            if (!participantMap.has(key)) {
                participantMap.set(key, {
                    _id: p.id,
                    name: p.name,
                    email: normalizedEmail,
                    teamId: normalizedTeamId,
                    githubLink: hasLink ? p.github_link.trim() : null,
                    status: hasLink ? 'submitted' : 'pending',
                    createdAt: p.created_at ? new Date(p.created_at) : new Date()
                });
            } else {
                // If duplicate found, prefer the one with GitHub link
                const existing = participantMap.get(key);
                if (hasLink && !existing.githubLink) {
                    existing.githubLink = p.github_link.trim();
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
        return NextResponse.json(
            { message: error.message || 'Failed to fetch GitHub status' },
            { status: 500 }
        );
    }
}

