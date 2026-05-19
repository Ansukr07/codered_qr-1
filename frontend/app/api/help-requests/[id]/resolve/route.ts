import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

// Resolve help request (volunteer/admin only)
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['volunteer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }
        const { user } = authResult;

        // In Next.js 15+, `params` is an async value that must be awaited.
        const { id } = await context.params;

        const { data: helpRequest, error: fetchError } = await supabase
            .from('help_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !helpRequest) {
            return NextResponse.json({ message: 'Help request not found' }, { status: 404 });
        }

        if (helpRequest.status === 'resolved') {
            return NextResponse.json({ message: 'Request already resolved' }, { status: 400 });
        }

        const { data: updatedRequest, error: updateError } = await supabase
            .from('help_requests')
            .update({
                status: 'resolved',
                resolved_by: user.userId,
                resolved_at: new Date().toISOString()
            })
            .eq('id', id)
            .select(`
                *,
                participants:user_id (id, name, email, team_id)
            `)
            .single();

        if (updateError) throw updateError;

        // Resolver may be admin OR volunteer - look up name in either table.
        let resolverName: string | null = null;
        if (updatedRequest?.resolved_by) {
            const [{ data: adminRow }, { data: volunteerRow }] = await Promise.all([
                supabase.from('admins').select('name').eq('id', updatedRequest.resolved_by).maybeSingle(),
                supabase.from('volunteers').select('name').eq('id', updatedRequest.resolved_by).maybeSingle(),
            ]);
            resolverName = (adminRow as any)?.name || (volunteerRow as any)?.name || null;
        }

        const p = (updatedRequest as any)?.participants;
        const helpResponse = updatedRequest
            ? {
                  _id: (updatedRequest as any).id,
                  ...updatedRequest,
                  createdAt: (updatedRequest as any).created_at,
                  resolvedAt: (updatedRequest as any).resolved_at,
                  userId: p
                      ? {
                            _id: p.id,
                            name: p.name,
                            email: p.email,
                            teamId: p.team_id,
                        }
                      : null,
                  resolvedBy: resolverName ? { name: resolverName } : null,
              }
            : updatedRequest;

        return NextResponse.json({
            message: 'Help request resolved successfully',
            helpRequest: helpResponse
        });
    } catch (error: any) {
        console.error('Resolve help request error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}



