import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/lib/models/User';
import { requireAuth, requireRole } from '@/lib/middleware/rbac';

async function connectDB() {
    try {
        if (mongoose.connections[0].readyState === 1) {
            return; // Already connected
        }
        
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
    } catch (error: any) {
        console.error('Database connection error:', error);
        throw new Error(`Database connection failed: ${error.message}`);
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Connect to database first
        try {
            await connectDB();
        } catch (dbError: any) {
            console.error('Database connection failed:', dbError);
            return NextResponse.json(
                { 
                    message: 'Database connection failed. Please check your MONGODB_URI environment variable.',
                    error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
                },
                { status: 500 }
            );
        }
        
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
        // Connect to database first
        try {
            await connectDB();
        } catch (dbError: any) {
            console.error('Database connection failed:', dbError);
            return NextResponse.json(
                { 
                    message: 'Database connection failed. Please check your MONGODB_URI environment variable.',
                    error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
                },
                { status: 500 }
            );
        }
        
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

