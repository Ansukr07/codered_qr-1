import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

// Volunteer/admin participant check-in: look up a participant by QR or
// participant_id and return their basic identity info. This is the Supabase
// replacement for the legacy Express `/api/scan/verify-participant` endpoint
// that the `/verify` page calls.
export async function POST(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['volunteer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { qr_code } = await request.json();

        // Normalize: trim, and pull the `id` query param out if the QR is a URL.
        let normalizedQrCode = qr_code ? String(qr_code).trim() : '';
        if (normalizedQrCode.includes('http') || normalizedQrCode.includes('?')) {
            try {
                const url = new URL(normalizedQrCode);
                const idParam = url.searchParams.get('id');
                if (idParam) normalizedQrCode = idParam.trim();
            } catch {
                const idMatch = normalizedQrCode.match(/[?&]id=([^&]+)/);
                if (idMatch) normalizedQrCode = idMatch[1].trim();
            }
        }

        if (!normalizedQrCode) {
            return NextResponse.json({ message: 'Invalid QR Code' }, { status: 400 });
        }

        // Two scoped lookups avoid `.or()` parsing issues with user input.
        let participant: any = null;
        {
            const { data } = await supabase
                .from('participants')
                .select('*')
                .eq('qr_code', normalizedQrCode)
                .maybeSingle();
            participant = data;
        }
        if (!participant) {
            const { data } = await supabase
                .from('participants')
                .select('*')
                .eq('participant_id', normalizedQrCode)
                .maybeSingle();
            participant = data;
        }

        if (!participant) {
            return NextResponse.json({ message: 'Invalid QR Code' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Verification successful',
            user: {
                _id: participant.id,
                name: participant.name,
                email: participant.email,
                teamId: participant.team_id,
                qrCode: participant.qr_code,
                participantId: participant.participant_id,
                track: participant.track,
                hall: participant.hall,
                seatNumber: participant.seat_number,
            },
        });
    } catch (error: any) {
        console.error('Verify participant error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
