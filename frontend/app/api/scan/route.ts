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

        // 1. Get Participant
        const { data: participant, error: pError } = await supabase
            .from('participants')
            .select('*')
            .or(`qr_code.eq.${normalizedQrCode},participant_id.eq.${normalizedQrCode}`)
            .single();

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

        if (resource.distributed_quantity >= resource.total_quantity) {
            return NextResponse.json({ message: 'Resource out of stock' }, { status: 400 });
        }

        // 3. Logic: Sleeping Bags (Team-based) vs Individual
        const isSleepingBag = resource.category === 'accommodation' || resource.name.toLowerCase().includes('bag');
        const isCoffee = resource.category === 'coffee' || resource.name.toLowerCase().includes('coffee');
        const maxClaims = isCoffee ? 3 : 1;

        if (isSleepingBag && participant.team_id) {
            // Count active claims for the team
            const { data: teamClaims, error: tcError } = await supabase
                .from('transactions')
                .select('action')
                .eq('resource_id', resource_id)
                .in('user_id', (
                    await supabase.from('participants').select('id').eq('team_id', participant.team_id)
                ).data?.map(p => p.id) || []);

            const activeClaims = (teamClaims?.filter(t => t.action === 'claim').length || 0) -
                (teamClaims?.filter(t => t.action === 'return').length || 0);

            if (activeClaims >= 1) {
                return NextResponse.json(
                    { message: `Team "${participant.team_id}" already has an active claim for ${resource.name}.` },
                    { status: 400 }
                );
            }
        } else {
            // Individual check
            const { count, error: cError } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', participant.id)
                .eq('resource_id', resource_id)
                .eq('action', 'claim');

            if ((count || 0) >= maxClaims) {
                return NextResponse.json(
                    { message: `Limit reached: ${resource.name}. Already claimed ${count}/${maxClaims}.` },
                    { status: 400 }
                );
            }
        }

        // 4. Update Resource and Create Transaction
        await supabase
            .from('resources')
            .update({ distributed_quantity: resource.distributed_quantity + 1 })
            .eq('id', resource.id);

        const { data: transaction, error: tError } = await supabase
            .from('transactions')
            .insert({
                user_id: participant.id,
                resource_id: resource.id,
                volunteer_id: user.userId,
                action: 'claim'
            })
            .select()
            .single();

        return NextResponse.json({
            message: 'Scan successful',
            transaction,
            memberName: participant.name
        });

    } catch (error: any) {
        console.error('Scan error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}


