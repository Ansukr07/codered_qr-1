import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

// Get all help requests (volunteer/admin only)
export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['volunteer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { data: helpRequests, error } = await supabase
            .from('help_requests')
            .select(`
                *,
                participants:user_id (id, name, email, team_id, qr_code)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ helpRequests });
    } catch (error: any) {
        console.error('Get help requests error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}

// Create help request (participant only)
export async function POST(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['participant']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }
        const { user } = authResult;

        const { description, category, priority } = await request.json();

        if (!description) {
            return NextResponse.json({ message: 'Description is required' }, { status: 400 });
        }

        const { data: helpRequest, error } = await supabase
            .from('help_requests')
            .insert({
                user_id: user.userId,
                description,
                category: category || 'general',
                priority: priority || 'medium',
                status: 'pending'
            })
            .select(`
                *,
                participants:user_id (id, name, email, team_id)
            `)
            .single();

        if (error) throw error;

        return NextResponse.json(
            { message: 'Help request created successfully', helpRequest },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Create help request error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}



