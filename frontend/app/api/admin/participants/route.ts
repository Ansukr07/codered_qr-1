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

        const { data: participants, error: pError } = await supabase
            .from('participants')
            .select('*')
            .order('created_at', { ascending: false });

        if (pError) throw pError;

        // Get transaction counts for all participants
        const { data: transactions, error: tError } = await supabase
            .from('transactions')
            .select('user_id');

        if (tError) throw tError;

        const transactionCounts = transactions.reduce((acc: any, t) => {
            acc[t.user_id] = (acc[t.user_id] || 0) + 1;
            return acc;
        }, {});

        const participantsWithStats = participants.map((p) => ({
            _id: p.id,
            name: p.name,
            email: p.email,
            teamId: p.team_id,
            qrCode: p.qr_code,
            githubLink: p.github_link || null,
            resourcesClaimed: transactionCounts[p.id] || 0,
            createdAt: p.created_at
        }));

        return NextResponse.json({ participants: participantsWithStats });
    } catch (error: any) {
        console.error('Admin participants error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}


