import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Resource from '@/lib/models/Resource';
import User from '@/lib/models/User';
import Transaction from '@/lib/models/Transaction';
import { requireAuth, requireRole } from '@/lib/middleware/rbac';

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
        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { resourceId } = params;
        const resource = await Resource.findById(resourceId);

        if (!resource) {
            return NextResponse.json(
                { message: 'Resource not found' },
                { status: 404 }
            );
        }

        // Get all transactions for this resource
        const transactions = await Transaction.find({ resourceId })
            .populate('userId', 'name email teamId qrCode githubLink')
            .populate('volunteerId', 'name')
            .sort({ timestamp: -1 });

        // Get all participants
        const allParticipants = await User.find({ role: 'participant' });

        // For multi-claim resources (like coffee), count claims per user
        const isCoffee = resource.category === 'coffee' || resource.name.toLowerCase().includes('coffee');
        const maxClaims = isCoffee ? 3 : 1;

        const userClaimMap = new Map();
        transactions.forEach(t => {
            if (t.userId && t.action === 'claim') {
                const userId = (t.userId as any)._id.toString();
                if (!userClaimMap.has(userId)) {
                    userClaimMap.set(userId, []);
                }
                userClaimMap.get(userId).push(t);
            }
        });

        // Build completed list with claim counts
        const completed = Array.from(userClaimMap.entries()).map(([userId, txs]: [string, any[]]) => {
            const latestTx = txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            return {
                name: latestTx.userId.name,
                email: latestTx.userId.email,
                teamId: latestTx.userId.teamId,
                githubLink: latestTx.userId.githubLink,
                timestamp: latestTx.timestamp,
                volunteer: latestTx.volunteerId ? (latestTx.volunteerId as any).name : 'Unknown',
                claimCount: txs.length,
                maxClaims: maxClaims
            };
        });

        // Build remaining list
        const claimedUserIds = Array.from(userClaimMap.keys());
        const remaining = allParticipants
            .filter(p => !claimedUserIds.includes(p._id.toString()))
            .map(p => ({
                name: p.name,
                email: p.email,
                teamId: p.teamId,
                qrCode: p.qrCode,
                githubLink: p.githubLink || null
            }));

        return NextResponse.json({
            resource: {
                name: resource.name,
                totalQuantity: resource.totalQuantity,
                distributedQuantity: resource.distributedQuantity,
                category: resource.category
            },
            completed,
            remaining
        });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

