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

        // The frontend (admin, volunteer, participant pages) reads `_id` and
        // `createdAt`. Without this mapping, every <li> would share `key={undefined}`
        // and timestamps would render as "Invalid Date".
        const mapped = (announcements || []).map((a: any) => ({
            ...a,
            _id: a.id,
            createdAt: a.created_at,
            updatedAt: a.updated_at,
        }));

        return NextResponse.json({ announcements: mapped });
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

        if (!title || !message) {
            return NextResponse.json({ message: 'Title and message are required' }, { status: 400 });
        }

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

        const mappedAnnouncement = announcement
            ? {
                  ...announcement,
                  _id: (announcement as any).id,
                  createdAt: (announcement as any).created_at,
                  updatedAt: (announcement as any).updated_at,
              }
            : announcement;

        return NextResponse.json(
            { message: 'Announcement created', announcement: mappedAnnouncement },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Create announcement error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

