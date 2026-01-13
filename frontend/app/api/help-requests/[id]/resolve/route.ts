import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

// Resolve help request (volunteer/admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
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

        const { data: helpRequest, error: fetchError } = await supabase
            .from('help_requests')
            .select('*')
            .eq('id', params.id)
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
            .eq('id', params.id)
            .select(`
                *,
                participants:user_id (id, name, email, team_id),
                volunteers:resolved_by (id, name)
            `)
            .single();

        if (updateError) throw updateError;

        return NextResponse.json({
            message: 'Help request resolved successfully',
            helpRequest: updatedRequest
        });
    } catch (error: any) {
        console.error('Resolve help request error:', error);
        return NextResponse.json({ message: 'Server error' }, { status: 500 });
    }
}



