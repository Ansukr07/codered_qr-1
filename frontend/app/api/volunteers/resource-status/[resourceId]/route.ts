import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

export async function GET(
    request: NextRequest,
    { params }: { params: { resourceId: string } }
) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['volunteer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { resourceId } = params;
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');

        // 1. Get the resource
        const { data: resource, error: rError } = await supabase
            .from('resources')
            .select('*')
            .eq('id', resourceId)
            .single();

        if (rError || !resource) {
            return NextResponse.json({ message: 'Resource not found' }, { status: 404 });
        }

        // 2. Get all participants
        let query = supabase.from('participants').select('id, name, email, team_id, qr_code');
        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,team_id.ilike.%${search}%`);
        }
        const { data: allParticipants, error: pError } = await query;
        if (pError) throw pError;

        // 3. Get all transactions for this resource
        const { data: transactions, error: tError } = await supabase
            .from('transactions')
            .select(`
                *,
                participants:user_id (id, name, email, team_id),
                volunteers:volunteer_id (name)
            `)
            .eq('resource_id', resourceId)
            .order('created_at', { ascending: false });

        if (tError) throw tError;

        // Process transactions
        const isCoffee = resource.category === 'coffee' || resource.name.toLowerCase().includes('coffee');
        const maxClaims = isCoffee ? 3 : 1;

        const transactionMap = new Map();
        const claimCountMap = new Map();

        transactions.forEach(t => {
            if (t.user_id && t.action === 'claim') {
                const userId = t.user_id;
                claimCountMap.set(userId, (claimCountMap.get(userId) || 0) + 1);

                if (!transactionMap.has(userId)) {
                    transactionMap.set(userId, t);
                }
            }
        });

        // Separate participants
        const completed: any[] = [];
        const pending: any[] = [];

        allParticipants.forEach(participant => {
            const participantId = participant.id;
            const transaction = transactionMap.get(participantId);
            const claimCount = claimCountMap.get(participantId) || 0;

            if (transaction && claimCount > 0) {
                completed.push({
                    _id: participant.id,
                    name: participant.name,
                    email: participant.email || '',
                    teamId: participant.team_id || '',
                    timestamp: transaction.created_at,
                    volunteer: transaction.volunteers ? (transaction.volunteers as any).name : 'Unknown',
                    claimCount,
                    maxClaims
                });
            } else {
                pending.push({
                    _id: participant.id,
                    name: participant.name,
                    email: participant.email || '',
                    teamId: participant.team_id || '',
                    qrCode: participant.qr_code,
                    claimCount: 0,
                    maxClaims
                });
            }
        });

        const stats = {
            total: allParticipants.length,
            completed: completed.length,
            pending: pending.length
        };

        return NextResponse.json({
            resource: {
                _id: resource.id,
                name: resource.name,
                category: resource.category
            },
            stats,
            completed,
            pending
        });
    } catch (error: any) {
        console.error('Resource status error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}


