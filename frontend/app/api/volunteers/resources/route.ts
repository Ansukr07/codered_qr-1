import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['volunteer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        // Get resources
        const { data: resources, error: rError } = await supabase
            .from('resources')
            .select('id, name, category, total_quantity');

        if (rError) throw rError;

        // Get claim counts for each resource
        const { data: claimCounts, error: tError } = await supabase
            .from('transactions')
            .select('resource_id')
            .eq('action', 'claim');

        if (tError) throw tError;

        const countMap = claimCounts.reduce((acc: any, t) => {
            acc[t.resource_id] = (acc[t.resource_id] || 0) + 1;
            return acc;
        }, {});

        const resourcesWithCounts = resources.map((resource) => ({
            _id: resource.id,
            name: resource.name,
            category: resource.category,
            participantCount: countMap[resource.id] || 0,
            totalQuantity: resource.total_quantity
        }));

        return NextResponse.json({ resources: resourcesWithCounts });
    } catch (error: any) {
        console.error('Error fetching resources:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}


