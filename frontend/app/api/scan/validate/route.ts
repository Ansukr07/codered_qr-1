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

        const { qr_code, resource_id } = await request.json();

        // Normalize QR code
        let normalizedQrCode = qr_code ? qr_code.trim() : '';
        if (normalizedQrCode.includes('http') || normalizedQrCode.includes('?')) {
            try {
                const url = new URL(normalizedQrCode);
                const idParam = url.searchParams.get('id');
                if (idParam) normalizedQrCode = idParam.trim();
            } catch (e) {
                const idMatch = normalizedQrCode.match(/[?&]id=([^&]+)/);
                if (idMatch) normalizedQrCode = idMatch[1].trim();
            }
        }

        // 1. Find participant in Supabase
        const { data: userRecord, error: uError } = await supabase
            .from('participants')
            .select('*')
            .ilike('qr_code', normalizedQrCode) // case-insensitive
            .single();

        if (uError || !userRecord) {
            return NextResponse.json({ message: 'Invalid QR Code' }, { status: 404 });
        }

        // 2. Find resource
        const { data: resource, error: rError } = await supabase
            .from('resources')
            .select('*')
            .eq('id', resource_id)
            .single();

        if (rError || !resource) {
            return NextResponse.json({ message: 'Resource not found' }, { status: 404 });
        }

        // 3. Check claim status
        const isCoffee = resource.category === 'coffee' || resource.name.toLowerCase().includes('coffee');
        const maxClaims = isCoffee ? 3 : 1;

        const { count: claimCount, error: cError } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userRecord.id)
            .eq('resource_id', resource.id)
            .eq('action', 'claim');

        if (cError) throw cError;

        const { data: lastTransaction, error: ltError } = await supabase
            .from('transactions')
            .select(`
                *,
                volunteers:volunteer_id (name)
            `)
            .eq('user_id', userRecord.id)
            .eq('resource_id', resource.id)
            .eq('action', 'claim')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (ltError) throw ltError;

        if (claimCount !== null && claimCount >= maxClaims) {
            return NextResponse.json({
                status: 'limit_reached',
                message: `Maximum limit reached: ${resource.name}. This participant has already claimed ${claimCount} out of ${maxClaims} allowed.`,
                member: {
                    name: userRecord.name,
                    teamId: userRecord.team_id,
                    email: userRecord.email
                },
                claimCount,
                maxClaims,
                transaction: lastTransaction ? {
                    timestamp: lastTransaction.created_at,
                    volunteerName: lastTransaction.volunteers ? (lastTransaction.volunteers as any).name : 'Unknown'
                } : undefined
            });
        }

        if (claimCount !== null && claimCount > 0 && !isCoffee) {
            return NextResponse.json({
                status: 'claimed',
                message: `Already claimed: ${resource.name}. This resource can only be claimed once.`,
                member: {
                    name: userRecord.name,
                    teamId: userRecord.team_id,
                    email: userRecord.email
                },
                claimCount,
                maxClaims,
                transaction: lastTransaction ? {
                    timestamp: lastTransaction.created_at,
                    volunteerName: lastTransaction.volunteers ? (lastTransaction.volunteers as any).name : 'Unknown'
                } : undefined
            });
        }

        return NextResponse.json({
            status: 'allowed',
            message: (claimCount || 0) > 0
                ? `Ready to claim (${claimCount}/${maxClaims} already claimed).`
                : 'Ready to claim',
            member: {
                name: userRecord.name,
                teamId: userRecord.team_id,
                email: userRecord.email
            },
            claimCount: claimCount || 0,
            maxClaims,
            transaction: lastTransaction ? {
                timestamp: lastTransaction.created_at,
                volunteerName: lastTransaction.volunteers ? (lastTransaction.volunteers as any).name : 'Unknown'
            } : undefined
        });
    } catch (error: any) {
        console.error('Scan validation error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}


