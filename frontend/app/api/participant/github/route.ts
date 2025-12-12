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
        
        if (!user || !user.userId) {
            console.error('Invalid user data from auth:', { user, hasUserId: !!user?.userId });
            return NextResponse.json(
                { message: 'Invalid user data. Please log in again.' },
                { status: 401 }
            );
        }
        
        console.log('Processing GitHub link update for user:', user.userId);
        
        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            console.error('Error parsing request body:', parseError);
            return NextResponse.json(
                { message: 'Invalid request body' },
                { status: 400 }
            );
        }
        
        const { githubLink } = body;
        console.log('Received GitHub link:', { githubLink, type: typeof githubLink });

        // Handle both string URLs and object with html_url property
        let linkToProcess: string | null = null;
        if (typeof githubLink === 'string') {
            linkToProcess = githubLink;
        } else if (githubLink && typeof githubLink === 'object' && 'html_url' in githubLink) {
            linkToProcess = githubLink.html_url;
        } else if (githubLink && typeof githubLink === 'object' && 'url' in githubLink) {
            linkToProcess = githubLink.url;
        }

        // Trim and validate GitHub URL if provided
        const trimmedLink = linkToProcess && typeof linkToProcess === 'string' ? linkToProcess.trim() : null;
        
        if (trimmedLink) {
            const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+/;
            if (!githubUrlPattern.test(trimmedLink)) {
                console.error('Invalid GitHub URL format:', trimmedLink);
                return NextResponse.json(
                    { message: 'Invalid GitHub URL format. Please use format: https://github.com/username/repository' },
                    { status: 400 }
                );
            }
        }
        
        console.log('Processed GitHub link:', { original: githubLink, processed: trimmedLink });

        let userRecord;
        try {
            userRecord = await User.findById(user.userId);
        } catch (findError: any) {
            console.error('Error finding user:', findError);
            return NextResponse.json(
                { 
                    message: 'Failed to find user',
                    error: process.env.NODE_ENV === 'development' ? findError.message : undefined
                },
                { status: 500 }
            );
        }
        
        if (!userRecord) {
            console.error('User not found with ID:', user.userId);
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        // Set githubLink
        const previousLink = userRecord.githubLink;
        userRecord.githubLink = trimmedLink || null;
        
        console.log('Updating GitHub link:', {
            userId: user.userId,
            previousLink,
            newLink: trimmedLink
        });
        
        try {
            await userRecord.save();
            console.log('Successfully saved GitHub link for user:', user.userId);
        } catch (saveError: any) {
            console.error('Error saving user record:', saveError);
            console.error('Save error details:', {
                userId: user.userId,
                githubLink: trimmedLink,
                error: saveError.message,
                errorName: saveError.name,
                errorCode: saveError.code,
                stack: saveError.stack
            });
            return NextResponse.json(
                { 
                    message: `Failed to save GitHub link: ${saveError.message || 'Unknown error'}`,
                    error: process.env.NODE_ENV === 'development' ? saveError.stack : undefined
                },
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

