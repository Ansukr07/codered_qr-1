import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireAuth, requireRole } from '@/lib/middleware/rbac';

// Get Announcements (Filtered by audience) - All authenticated users
export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }
        const { user } = authResult;

        let query = supabase.from('announcements').select('*');

        if (user.role === 'admin') {
            // Admin sees all
        } else if (user.role === 'volunteer') {
            query = query.in('audience', ['all', 'volunteers']);
        } else if (user.role === 'participant') {
            query = query.in('audience', ['all', 'participants']);
        } else {
            return NextResponse.json({ announcements: [] });
        }

        const { data: announcements, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        return NextResponse.json({ announcements });
    } catch (error: any) {
        console.error('Get announcements error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// Create Announcement (Admin only)
export async function POST(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { title, message, priority, audience } = await request.json();
        const { data: announcement, error } = await supabase
            .from('announcements')
            .insert({
                title,
                message,
                priority: priority || 'medium',
                audience: audience || 'all'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(
            { message: 'Announcement created', announcement },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Create announcement error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

