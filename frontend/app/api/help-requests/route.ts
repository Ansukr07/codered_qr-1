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

        // A help request can be resolved by either an admin or a volunteer. PostgREST
        // can only join one foreign-table relationship per alias, so we look up
        // resolver names from both tables in a single batched query.
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

        // Map the joined `participants` field to `userId` (and snake_case to camelCase)
        // so frontend components can use the expected `request.userId.name` shape.
        const mapped = (helpRequests || []).map((req: any) => {
            const p = req.participants;
            return {
                _id: req.id,
                ...req,
                userId: p
                    ? {
                          _id: p.id,
                          name: p.name,
                          email: p.email,
                          teamId: p.team_id,
                          qrCode: p.qr_code,
                      }
                    : null,
                createdAt: req.created_at,
                resolvedAt: req.resolved_at,
                resolvedBy:
                    req.resolved_by && resolverNameMap[req.resolved_by]
                        ? { name: resolverNameMap[req.resolved_by] }
                        : null,
            };
        });

        return NextResponse.json({ helpRequests: mapped });
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

        const p = (helpRequest as any)?.participants;
        const mappedHelpRequest = helpRequest
            ? {
                  _id: (helpRequest as any).id,
                  ...helpRequest,
                  userId: p
                      ? {
                            _id: p.id,
                            name: p.name,
                            email: p.email,
                            teamId: p.team_id,
                        }
                      : null,
                  createdAt: (helpRequest as any).created_at,
              }
            : helpRequest;

        return NextResponse.json(
            { message: 'Help request created successfully', helpRequest: mappedHelpRequest },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Create help request error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}



