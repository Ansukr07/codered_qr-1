import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

        const participants = await User.find({ role: 'participant' })
            .select('-password')
            .sort({ createdAt: -1 });

        // Get transaction count and GitHub link for each participant
        const participantsWithStats = await Promise.all(
            participants.map(async (p) => {
                const transactionCount = await Transaction.countDocuments({ userId: p._id });
                return {
                    _id: p._id,
                    name: p.name,
                    email: p.email,
                    teamId: p.teamId,
                    qrCode: p.qrCode,
                    githubLink: p.githubLink || null,
                    resourcesClaimed: transactionCount,
                    createdAt: p.createdAt
                };
            })
        );

        return NextResponse.json({ participants: participantsWithStats });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

