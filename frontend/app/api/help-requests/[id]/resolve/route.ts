import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import HelpRequest from '@/lib/models/HelpRequest';
import { requireAuth, requireRole } from '@/lib/middleware/rbac';

// Connect to MongoDB if not already connected
async function connectDB() {
    if (mongoose.connections[0].readyState) return;
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
        await mongoose.connect(mongoUri);
    }
}

// Resolve help request (volunteer/admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        
        const authResult = requireRole(request, ['volunteer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }
        const { user } = authResult;

        const helpRequest = await HelpRequest.findById(params.id);

        if (!helpRequest) {
            return NextResponse.json(
                { message: 'Help request not found' },
                { status: 404 }
            );
        }

        if (helpRequest.status === 'resolved') {
            return NextResponse.json(
                { message: 'Request already resolved' },
                { status: 400 }
            );
        }

        helpRequest.status = 'resolved';
        helpRequest.resolvedBy = user.userId;
        helpRequest.resolvedAt = new Date();

        await helpRequest.save();
        await helpRequest.populate('userId', 'name email teamId');
        await helpRequest.populate('resolvedBy', 'name');

        return NextResponse.json({
            message: 'Help request resolved successfully',
            helpRequest
        });
    } catch (error: any) {
        console.error('Resolve help request error:', error);
        return NextResponse.json(
            { message: 'Server error' },
            { status: 500 }
        );
    }
}



