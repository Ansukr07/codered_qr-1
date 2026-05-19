import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

export async function POST(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['volunteer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }
        const { user } = authResult;

        const { qr_code, resource_id } = await request.json();

        // Normalize QR code
        let normalizedQrCode = qr_code ? qr_code.trim() : '';
        if (normalizedQrCode.includes('id=')) {
            const url = new URL(normalizedQrCode.includes('http') ? normalizedQrCode : `http://x.y?${normalizedQrCode}`);
            normalizedQrCode = url.searchParams.get('id') || normalizedQrCode;
        }

        // 1. Get Participant. Two scoped lookups avoid the PostgREST `.or()`
        // parsing pitfalls when the QR contains commas, periods, etc.
        let participant: any = null;
        let pError: any = null;
        {
            const { data, error } = await supabase
                .from('participants')
                .select('*')
                .eq('qr_code', normalizedQrCode)
                .maybeSingle();
            participant = data;
            pError = error;
        }
        if (!participant) {
            const { data, error } = await supabase
                .from('participants')
                .select('*')
                .eq('participant_id', normalizedQrCode)
                .maybeSingle();
            participant = data;
            pError = error;
        }

        if (pError || !participant) {
            return NextResponse.json({ message: 'Invalid QR Code' }, { status: 404 });
        }

        // 2. Get Resource
        const { data: resource, error: rError } = await supabase
            .from('resources')
            .select('*')
            .eq('id', resource_id)
            .single();

        if (rError || !resource) {
            return NextResponse.json({ message: 'Resource not found' }, { status: 404 });
        }

        const isSleepingBag = resource.category === 'accommodation' || resource.name.toLowerCase().includes('bag');

        // 3. Find claim to return
        let claimQuery = supabase.from('transactions')
            .select('*')
            .eq('resource_id', resource_id)
            .eq('action', 'claim');

        if (isSleepingBag && participant.team_id) {
            const { data: members } = await supabase.from('participants').select('id').eq('team_id', participant.team_id);
            claimQuery = claimQuery.in('user_id', members?.map(m => m.id) || []);
        } else {
            claimQuery = claimQuery.eq('user_id', participant.id);
        }

        const { data: claims } = await claimQuery;

        // Count returns to see if there's an active claim
        let returnQuery = supabase.from('transactions')
            .select('*')
            .eq('resource_id', resource_id)
            .eq('action', 'return');

        if (isSleepingBag && participant.team_id) {
            const { data: members } = await supabase.from('participants').select('id').eq('team_id', participant.team_id);
            returnQuery = returnQuery.in('user_id', members?.map(m => m.id) || []);
        } else {
            returnQuery = returnQuery.eq('user_id', participant.id);
        }

        const { data: returns } = await returnQuery;

        const activeClaims = (claims?.length || 0) - (returns?.length || 0);

        if (activeClaims <= 0) {
            return NextResponse.json({ message: 'No active claim found to return' }, { status: 400 });
        }

        // 4. Record Return
        if (resource.distributed_quantity > 0) {
            await supabase
                .from('resources')
                .update({ distributed_quantity: resource.distributed_quantity - 1 })
                .eq('id', resource.id);
        }

        const { data: transaction, error: tError } = await supabase
            .from('transactions')
            .insert({
                user_id: participant.id,
                resource_id: resource.id,
                volunteer_id: user.userId,
                action: 'return'
            })
            .select()
            .single();

        return NextResponse.json({
            message: 'Return successful',
            transaction,
            memberName: participant.name
        });

    } catch (error: any) {
        console.error('Return error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}


