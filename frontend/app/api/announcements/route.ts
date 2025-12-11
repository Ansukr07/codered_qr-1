import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Announcement from '@/lib/models/Announcement';
import { requireAuth, requireRole } from '@/lib/middleware/rbac';

// Connect to MongoDB if not already connected
async function connectDB() {
    if (mongoose.connections[0].readyState) return;
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
        await mongoose.connect(mongoUri);
    }
}

// Get Announcements (Filtered by audience) - All authenticated users
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        
        const authResult = requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }
        const { user } = authResult;

        let query: any = {};

        if (user.role === 'admin') {
            // Admin sees all announcements
            query = {};
        } else if (user.role === 'volunteer') {
            // Volunteers see 'all' and 'volunteers'
            query = { audience: { $in: ['all', 'volunteers'] } };
        } else if (user.role === 'participant') {
            // Participants see 'all' and 'participants'
            query = { audience: { $in: ['all', 'participants'] } };
        } else {
            // Default: no announcements
            query = { audience: 'none' };
        }

        const announcements = await Announcement.find(query).sort({ createdAt: -1 });
        return NextResponse.json({ announcements });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

// Create Announcement (Admin only)
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { title, message, priority, audience } = await request.json();
        const announcement = await Announcement.create({
            title,
            message,
            priority,
            audience
        });
        
        return NextResponse.json(
            { message: 'Announcement created', announcement },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

