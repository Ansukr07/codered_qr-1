import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

type ParticipantInfo = {
    _id: string;
    name: string;
    email: string;
    teamId: string | null;
    qrCode: string | null;
};

type LegSummary = {
    _id: string;
    timestamp: string;
    volunteer: string;
} | null;

type BagTransaction = {
    user: ParticipantInfo;
    claim: LegSummary;
    return: LegSummary;
};

// Admin view of every sleeping-bag transaction grouped into claim/return pairs.
export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        // 1. Find the sleeping-bag resource.
        // Match either by category ('accommodation') OR by anything that
        // contains 'bag'/'sleep' in the name. ilike with % wildcards is safe
        // (no shell-style interpolation) and works for case-insensitive search.
        const { data: bagResources, error: rError } = await supabase
            .from('resources')
            .select('*')
            .or('category.eq.accommodation,name.ilike.%bag%,name.ilike.%sleep%');

        if (rError) {
            console.error('Sleeping bag resource lookup error:', rError);
            return NextResponse.json({ message: rError.message }, { status: 500 });
        }

        const bagResource = (bagResources || [])[0];

        if (!bagResource) {
            return NextResponse.json({
                transactions: [],
                resource: null,
                stats: { totalIssued: 0, totalReturned: 0, pendingReturns: 0 },
            });
        }

        // 2. Fetch all transactions for that resource, joining the participant
        // and volunteer rows so we can display names in the UI.
        const { data: txs, error: tError } = await supabase
            .from('transactions')
            .select(
                `
                id,
                action,
                created_at,
                user_id,
                volunteer_id,
                participants:user_id ( id, name, email, team_id, qr_code ),
                volunteers:volunteer_id ( id, name )
            `
            )
            .eq('resource_id', bagResource.id)
            .order('created_at', { ascending: false });

        if (tError) {
            console.error('Sleeping bag transactions error:', tError);
            return NextResponse.json({ message: tError.message }, { status: 500 });
        }

        // 3. Group claim/return per participant. A team might have multiple
        // members but only one bag — the same logic the legacy backend used.
        const grouped = new Map<string, BagTransaction>();

        for (const tx of txs || []) {
            const p: any = (tx as any).participants;
            if (!p) continue;

            if (!grouped.has(p.id)) {
                grouped.set(p.id, {
                    user: {
                        _id: p.id,
                        name: p.name,
                        email: p.email,
                        teamId: p.team_id ?? null,
                        qrCode: p.qr_code ?? null,
                    },
                    claim: null,
                    return: null,
                });
            }

            const entry = grouped.get(p.id)!;
            const leg: LegSummary = {
                _id: (tx as any).id,
                timestamp: (tx as any).created_at,
                volunteer: ((tx as any).volunteers as any)?.name || 'Unknown',
            };

            if ((tx as any).action === 'claim' && !entry.claim) {
                entry.claim = leg;
            } else if ((tx as any).action === 'return' && !entry.return) {
                entry.return = leg;
            }
        }

        const transactions = Array.from(grouped.values()).sort((a, b) => {
            const aT = a.claim ? new Date(a.claim.timestamp).getTime() : 0;
            const bT = b.claim ? new Date(b.claim.timestamp).getTime() : 0;
            return bT - aT;
        });

        const totalIssued = transactions.filter((t) => t.claim !== null).length;
        const totalReturned = transactions.filter((t) => t.return !== null).length;
        const pendingReturns = transactions.filter((t) => t.claim !== null && t.return === null).length;

        return NextResponse.json({
            resource: {
                _id: bagResource.id,
                name: bagResource.name,
                totalQuantity: bagResource.total_quantity,
                distributedQuantity: bagResource.distributed_quantity,
                remaining: (bagResource.total_quantity || 0) - (bagResource.distributed_quantity || 0),
            },
            transactions,
            stats: { totalIssued, totalReturned, pendingReturns },
        });
    } catch (error: any) {
        console.error('Sleeping bags route error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
