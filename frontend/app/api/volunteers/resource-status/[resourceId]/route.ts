import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/lib/models/User';
import Resource from '@/lib/models/Resource';
import Transaction from '@/lib/models/Transaction';
import { requireAuth, requireRole } from '@/lib/middleware/rbac';

// Connect to MongoDB if not already connected
async function connectDB() {
    if (mongoose.connections[0].readyState) return;
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
        await mongoose.connect(mongoUri);
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { resourceId: string } }
) {
    try {
        await connectDB();
        
        const authResult = requireRole(request, ['volunteer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { resourceId } = params;
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');

        console.log(`Fetching resource status for resourceId: ${resourceId}`);

        // Get the resource
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            console.log('Resource not found');
            return NextResponse.json(
                { message: 'Resource not found' },
                { status: 404 }
            );
        }
        console.log('Resource found:', resource.name);

        // Get all participants
        let allParticipants = await User.find({ role: 'participant' }).select('name email teamId qrCode');
        console.log(`Found ${allParticipants.length} total participants`);

        // Apply search filter if provided
        if (search) {
            const searchLower = search.toLowerCase();
            allParticipants = allParticipants.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                (p.email && p.email.toLowerCase().includes(searchLower)) ||
                (p.teamId && p.teamId.toLowerCase().includes(searchLower))
            );
            console.log(`After search filter: ${allParticipants.length} participants`);
        }

        // Get all transactions for this resource
        const transactions = await Transaction.find({ resourceId })
            .populate('userId', 'name email teamId')
            .populate('volunteerId', 'name')
            .sort({ timestamp: -1 });
        console.log(`Found ${transactions.length} transactions for this resource`);

        // Check if this is coffee (allows multiple claims)
        const isCoffee = resource.category === 'coffee' || resource.name.toLowerCase().includes('coffee');
        const maxClaims = isCoffee ? 3 : 1;

        // Create a map of userId -> transactions and count claims
        const transactionMap = new Map();
        const claimCountMap = new Map();
        
        transactions.forEach(t => {
            if (t.userId && t.action === 'claim') {
                const userId = (t.userId as any)._id.toString();
                
                // Count claims for each user
                claimCountMap.set(userId, (claimCountMap.get(userId) || 0) + 1);
                
                // Store the most recent transaction
                if (!transactionMap.has(userId)) {
                    transactionMap.set(userId, t);
                } else {
                    const existing = transactionMap.get(userId);
                    if (new Date(t.timestamp) > new Date(existing.timestamp)) {
                        transactionMap.set(userId, t);
                    }
                }
            }
        });

        // Separate participants into completed and pending
        const completed: any[] = [];
        const pending: any[] = [];

        allParticipants.forEach(participant => {
            const participantId = participant._id.toString();
            const transaction = transactionMap.get(participantId);
            const claimCount = claimCountMap.get(participantId) || 0;

            if (transaction && claimCount > 0) {
                completed.push({
                    _id: participant._id.toString(),
                    name: participant.name,
                    email: participant.email || '',
                    teamId: participant.teamId || '',
                    timestamp: transaction.timestamp,
                    volunteer: transaction.volunteerId ? (transaction.volunteerId as any).name : 'Unknown',
                    claimCount: claimCount,
                    maxClaims: maxClaims
                });
            } else {
                pending.push({
                    _id: participant._id.toString(),
                    name: participant.name,
                    email: participant.email || '',
                    teamId: participant.teamId || '',
                    qrCode: participant.qrCode,
                    claimCount: 0,
                    maxClaims: maxClaims
                });
            }
        });

        // Calculate statistics
        const stats = {
            total: allParticipants.length,
            completed: completed.length,
            pending: pending.length
        };

        console.log('Stats:', stats);
        console.log(`Returning ${completed.length} completed and ${pending.length} pending`);

        return NextResponse.json({
            resource: {
                _id: resource._id.toString(),
                name: resource.name,
                category: resource.category
            },
            stats,
            completed,
            pending
        });

    } catch (error: any) {
        console.error('Resource status error:', error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}


