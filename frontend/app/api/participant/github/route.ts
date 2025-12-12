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
        
        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            return NextResponse.json(
                { message: 'Invalid request body' },
                { status: 400 }
            );
        }
        
        const { githubLink } = body;

        // Trim and validate GitHub URL if provided
        const trimmedLink = githubLink && typeof githubLink === 'string' ? githubLink.trim() : null;
        
        if (trimmedLink) {
            const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+/;
            if (!githubUrlPattern.test(trimmedLink)) {
                return NextResponse.json(
                    { message: 'Invalid GitHub URL format. Please use format: https://github.com/username/repository' },
                    { status: 400 }
                );
            }
        }

        const userRecord = await User.findById(user.userId);
        if (!userRecord) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Set githubLink
        userRecord.githubLink = trimmedLink || null;
        
        try {
            await userRecord.save();
        } catch (saveError: any) {
            console.error('Error saving user record:', saveError);
            return NextResponse.json(
                { message: `Failed to save GitHub link: ${saveError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'GitHub link updated successfully',
            githubLink: userRecord.githubLink
        });
    } catch (error: any) {
        console.error('Error in PUT /api/participant/github:', error);
        return NextResponse.json(
            { 
                message: error.message || 'Failed to update GitHub link',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
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
        console.error('Error in GET /api/participant/github:', error);
        return NextResponse.json(
            { 
                message: error.message || 'Failed to fetch GitHub link',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

