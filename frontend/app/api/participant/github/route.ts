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

export async function PUT(request: NextRequest) {
    try {
        await connectDB();
        const authResult = requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const { githubLink } = await request.json();

        // Validate GitHub URL
        if (githubLink && !githubLink.match(/^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+/)) {
            return NextResponse.json(
                { message: 'Invalid GitHub URL format' },
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

        userRecord.githubLink = githubLink || null;
        await userRecord.save();

        return NextResponse.json({
            message: 'GitHub link updated successfully',
            githubLink: userRecord.githubLink
        });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const authResult = requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        const userRecord = await User.findById(user.userId).select('githubLink');

        if (!userRecord) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            githubLink: userRecord.githubLink || null
        });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

