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

        // Help requests can be resolved by either an admin or a volunteer.
        // Fetch the help requests first, then look up resolver names from both tables
        // to support either role.
        const { data: helpRequests, error } = await supabase
            .from('help_requests')
            .select('*')
            .eq('user_id', user.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const resolverIds = Array.from(
            new Set(
                (helpRequests || [])
                    .map((r: any) => r.resolved_by)
                    .filter((id: any): id is string => !!id)
            )
        );

        const resolverNameMap: Record<string, string> = {};
        if (resolverIds.length > 0) {
            const [{ data: admins }, { data: volunteers }] = await Promise.all([
                supabase.from('admins').select('id, name').in('id', resolverIds),
                supabase.from('volunteers').select('id, name').in('id', resolverIds),
            ]);
            (admins || []).forEach((a: any) => {
                resolverNameMap[a.id] = a.name;
            });
            (volunteers || []).forEach((v: any) => {
                resolverNameMap[v.id] = v.name;
            });
        }

        const mappedRequests = (helpRequests || []).map((req: any) => ({
            _id: req.id,
            ...req,
            createdAt: req.created_at,
            resolvedAt: req.resolved_at,
            resolvedBy: req.resolved_by && resolverNameMap[req.resolved_by]
                ? { name: resolverNameMap[req.resolved_by] }
                : null,
        }));

        return NextResponse.json({ helpRequests: mappedRequests });
    } catch (error: any) {
        console.error('Get my requests error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}



