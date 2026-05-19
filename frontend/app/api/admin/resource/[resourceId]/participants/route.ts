import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ resourceId: string }> }
) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        // In Next.js 15+, `params` is async and must be awaited.
        const { resourceId } = await context.params;

        // 1. Get resource
        const { data: resource, error: rError } = await supabase
            .from('resources')
            .select('*')
            .eq('id', resourceId)
            .single();

        if (rError || !resource) {
            return NextResponse.json({ message: 'Resource not found' }, { status: 404 });
        }

        // 2. Get all transactions for this resource
        const { data: transactions, error: tError } = await supabase
            .from('transactions')
            .select(`
                *,
                participants:user_id (id, name, email, team_id, qr_code, github_link),
                volunteers:volunteer_id (id, name)
            `)
            .eq('resource_id', resourceId)
            .eq('action', 'claim')
            .order('created_at', { ascending: false });

        if (tError) throw tError;

        // 3. Get all participants
        const { data: allParticipants, error: pError } = await supabase
            .from('participants')
            .select('*');

        if (pError) throw pError;

        // 4. Logic for completed claims
        const isCoffee = resource.category === 'coffee' || resource.name.toLowerCase().includes('coffee');
        const maxClaims = isCoffee ? 3 : 1;

        const userClaimMap = new Map();
        transactions.forEach((t: any) => {
            // Skip orphan transactions whose participant row was deleted; the
            // join would return `null` for `participants` and accessing
            // .name/.email below would crash this route.
            if (t.user_id && t.participants) {
                if (!userClaimMap.has(t.user_id)) {
                    userClaimMap.set(t.user_id, []);
                }
                userClaimMap.get(t.user_id).push(t);
            }
        });

        const completed = Array.from(userClaimMap.entries()).map(([userId, txs]: [string, any[]]) => {
            const latestTx = txs[0]; // Already ordered by created_at desc
            const p = latestTx.participants || {};
            const v = latestTx.volunteers || null;
            return {
                name: p.name,
                email: p.email,
                teamId: p.team_id,
                githubLink: p.github_link,
                timestamp: latestTx.created_at,
                volunteer: v ? v.name : 'Unknown',
                claimCount: txs.length,
                maxClaims: maxClaims
            };
        });

        // 5. Build remaining list
        const claimedUserIds = Array.from(userClaimMap.keys());
        const remaining = allParticipants
            .filter(p => !claimedUserIds.includes(p.id))
            .map(p => ({
                name: p.name,
                email: p.email,
                teamId: p.team_id,
                qrCode: p.qr_code,
                githubLink: p.github_link || null
            }));

        return NextResponse.json({
            resource: {
                name: resource.name,
                totalQuantity: resource.total_quantity,
                distributedQuantity: resource.distributed_quantity,
                category: resource.category
            },
            completed,
            remaining
        });
    } catch (error: any) {
        console.error('Resource participants error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}


