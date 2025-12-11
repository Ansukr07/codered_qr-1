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

// Get all help requests (volunteer/admin only)
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        
        const authResult = requireRole(request, ['volunteer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const helpRequests = await HelpRequest.find()
            .populate('userId', 'name email teamId qrCode')
            .populate('resolvedBy', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json({ helpRequests });
    } catch (error: any) {
        console.error('Get help requests error:', error);
        return NextResponse.json(
            { message: 'Server error' },
            { status: 500 }
        );
    }
}

// Create help request (participant only)
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        const authResult = requireRole(request, ['participant']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }
        const { user } = authResult;

        const { description, category, priority } = await request.json();

        if (!description) {
            return NextResponse.json(
                { message: 'Description is required' },
                { status: 400 }
            );
        }

        const userRecord = await User.findById(user.userId);
        if (!userRecord) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        const helpRequest = new HelpRequest({
            userId: userRecord._id,
            description,
            category: category || 'general',
            priority: priority || 'medium'
        });

        await helpRequest.save();

        // Populate user info before sending response
        await helpRequest.populate('userId', 'name email teamId');

        return NextResponse.json(
            {
                message: 'Help request created successfully',
                helpRequest
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Create help request error:', error);
        return NextResponse.json(
            { message: 'Server error' },
            { status: 500 }
        );
    }
}

