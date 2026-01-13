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

        const { data: resources, error } = await supabase
            .from('resources')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        // Map to expected format (snake_case to camelCase if needed)
        const mappedResources = resources.map(r => ({
            _id: r.id,
            name: r.name,
            category: r.category,
            totalQuantity: r.total_quantity,
            distributedQuantity: r.distributed_quantity,
            description: r.description
        }));

        return NextResponse.json(mappedResources);
    } catch (error: any) {
        console.error('Admin resources GET error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const body = await request.json();
        const { name, category, totalQuantity, description } = body;

        if (!name || !category || totalQuantity === undefined) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const { data: resource, error } = await supabase
            .from('resources')
            .insert({
                name,
                category,
                total_quantity: totalQuantity,
                distributed_quantity: 0,
                description
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            _id: resource.id,
            ...resource,
            totalQuantity: resource.total_quantity,
            distributedQuantity: resource.distributed_quantity
        });
    } catch (error: any) {
        console.error('Admin resources POST error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
