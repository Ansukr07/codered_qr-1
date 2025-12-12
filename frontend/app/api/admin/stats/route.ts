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

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const resources = await Resource.find({});
        const participants = await User.find({ role: 'participant' });
        const totalTransactions = await Transaction.countDocuments();

        const stats = {
            totalResources: resources.length,
            totalParticipants: participants.length,
            totalDistributed: resources.reduce((sum, r) => sum + r.distributedQuantity, 0),
            totalCapacity: resources.reduce((sum, r) => sum + r.totalQuantity, 0),
            totalTransactions,
            resources: resources.map(r => ({
                _id: r._id,
                name: r.name,
                totalQuantity: r.totalQuantity,
                distributedQuantity: r.distributedQuantity,
                remaining: r.totalQuantity - r.distributedQuantity,
                category: r.category
            }))
        };

        return NextResponse.json(stats);
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

