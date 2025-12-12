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

        // Combine participants from both sources
        const participantMap = new Map<string, any>();
        
        // Add MongoDB participants
        mongoParticipants.forEach(p => {
            const hasLink = p.githubLink && p.githubLink.trim() && p.githubLink.trim().length > 0;
            participantMap.set(p._id.toString(), {
                _id: p._id.toString(),
                name: p.name,
                email: p.email || null,
                teamId: p.teamId || null,
                githubLink: hasLink ? p.githubLink.trim() : null,
                status: hasLink ? 'submitted' : 'pending',
                createdAt: p.createdAt
            });
        });
        
        // Add/update with Supabase participants (by email to match)
        supabaseParticipants.forEach(p => {
            const hasLink = p.github_link && p.github_link.trim() && p.github_link.trim().length > 0;
            const key = p.email || p.id; // Use email as key, fallback to id
            
            // If participant exists in MongoDB by email, update it
            // Otherwise, add as new entry
            if (participantMap.has(key)) {
                const existing = participantMap.get(key);
                // Prefer Supabase github_link if it exists
                if (hasLink) {
                    existing.githubLink = p.github_link.trim();
                    existing.status = 'submitted';
                }
            } else {
                participantMap.set(key, {
                    _id: p.id,
                    name: p.name,
                    email: p.email || null,
                    teamId: p.team_id || null,
                    githubLink: hasLink ? p.github_link.trim() : null,
                    status: hasLink ? 'submitted' : 'pending',
                    createdAt: p.created_at ? new Date(p.created_at) : new Date()
                });
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

