import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

// Get user's own help requests (participant only)
export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['participant']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }
        const { user } = authResult;

        const { data: helpRequests, error } = await supabase
            .from('help_requests')
            .select(`
                *,
                resolved_by_info:admins(name)
            `)
            .eq('user_id', user.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map resolved_by_info to resolvedBy for frontend compatibility if needed
        const mappedRequests = helpRequests.map(req => ({
            ...req,
            resolvedBy: req.resolved_by_info ? { name: (req.resolved_by_info as any).name } : null
        }));

        return NextResponse.json({ helpRequests: mappedRequests });
    } catch (error: any) {
        console.error('Get my requests error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}



