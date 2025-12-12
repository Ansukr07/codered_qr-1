import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import HelpRequest from '@/lib/models/HelpRequest';
import User from '@/lib/models/User';
import { requireAuth, requireRole } from '@/lib/middleware/rbac';

// Connect to MongoDB if not already connected
async function connectDB() {
    if (mongoose.connections[0].readyState) return;
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
        await mongoose.connect(mongoUri);
    }
}

// Get user's own help requests (participant only)
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        
        const authResult = requireRole(request, ['participant']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }
        const { user } = authResult;

        const userRecord = await User.findById(user.userId);
        if (!userRecord) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        const helpRequests = await HelpRequest.find({ userId: userRecord._id })
            .populate('resolvedBy', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json({ helpRequests });
    } catch (error: any) {
        console.error('Get my requests error:', error);
        return NextResponse.json(
            { message: 'Server error' },
            { status: 500 }
        );
    }
}


