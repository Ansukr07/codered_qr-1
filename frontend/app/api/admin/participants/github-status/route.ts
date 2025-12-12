import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/lib/models/User';
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
            .select('name email teamId githubLink createdAt')
            .sort({ createdAt: -1 });

        const githubStatus = participants.map(p => {
            const hasLink = p.githubLink && p.githubLink.trim() && p.githubLink.trim().length > 0;
            return {
                _id: p._id.toString(),
                name: p.name,
                email: p.email,
                teamId: p.teamId || null,
                githubLink: hasLink ? p.githubLink.trim() : null,
                status: hasLink ? 'submitted' : 'pending',
                createdAt: p.createdAt
            };
        });

        const stats = {
            total: githubStatus.length,
            submitted: githubStatus.filter(p => p.status === 'submitted').length,
            pending: githubStatus.filter(p => p.status === 'pending').length
        };

        return NextResponse.json({
            participants: githubStatus,
            stats
        });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

