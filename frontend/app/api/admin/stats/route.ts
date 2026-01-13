import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { data: resources, error: rError } = await supabase.from('resources').select('*');
        const { count: participantCount, error: pError } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true });
        const { count: transactionCount, error: tError } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true });

        if (rError || pError || tError) throw (rError || pError || tError);

        const stats = {
            totalResources: resources?.length || 0,
            totalParticipants: participantCount || 0,
            totalDistributed: resources?.reduce((sum, r) => sum + (r.distributed_quantity || 0), 0) || 0,
            totalCapacity: resources?.reduce((sum, r) => sum + (r.total_quantity || 0), 0) || 0,
            totalTransactions: transactionCount || 0,
            resources: resources?.map(r => ({
                _id: r.id,
                name: r.name,
                totalQuantity: r.total_quantity,
                distributedQuantity: r.distributed_quantity,
                remaining: r.total_quantity - r.distributed_quantity,
                category: r.category
            })) || []
        };

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}


