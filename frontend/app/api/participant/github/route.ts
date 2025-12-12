import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/lib/models/User';
import { requireAuth, requireRole } from '@/lib/middleware/rbac';
import { createClient } from '@supabase/supabase-js';

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

function getSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
        return null;
    }
    
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
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

        // Try to find user in MongoDB first
        let userRecord = null;
        try {
            userRecord = await User.findById(user.userId);
        } catch (findError: any) {
            // If userId is not a valid MongoDB ObjectId, it might be a Supabase UUID
            console.log('MongoDB findById failed, might be Supabase participant:', findError.message);
        }
        
        // If not found in MongoDB and user is a participant, try Supabase
        if (!userRecord && user.role === 'participant') {
            console.log('User not found in MongoDB, trying Supabase for participant:', user.userId);
            const supabase = getSupabaseClient();
            
            if (supabase) {
                try {
                    // Update Supabase participants table
                    const { data: participant, error: supabaseError } = await supabase
                        .from('participants')
                        .update({ github_link: trimmedLink })
                        .eq('id', user.userId)
                        .select()
                        .single();
                    
                    if (supabaseError) {
                        console.error('Supabase update error:', supabaseError);
                        return NextResponse.json(
                            { 
                                message: `Failed to update GitHub link in Supabase: ${supabaseError.message}`,
                                error: process.env.NODE_ENV === 'development' ? supabaseError.details : undefined
                            },
                            { status: 500 }
                        );
                    }
                    
                    if (!participant) {
                        console.error('Participant not found in Supabase with ID:', user.userId);
                        return NextResponse.json(
                            { message: 'Participant not found in database' },
                            { status: 404 }
                        );
                    }
                    
                    console.log('Successfully updated GitHub link in Supabase for participant:', user.userId);
                    return NextResponse.json({
                        message: 'GitHub link updated successfully',
                        githubLink: trimmedLink
                    });
                } catch (supabaseError: any) {
                    console.error('Error updating Supabase:', supabaseError);
                    return NextResponse.json(
                        { 
                            message: `Failed to update GitHub link: ${supabaseError.message || 'Unknown error'}`,
                            error: process.env.NODE_ENV === 'development' ? supabaseError.stack : undefined
                        },
                        { status: 500 }
                    );
                }
            } else {
                console.error('Supabase client not available');
                return NextResponse.json(
                    { message: 'Database configuration error. Please contact support.' },
                    { status: 500 }
                );
            }
        }
        
        // If still not found, return error
        if (!userRecord) {
            console.error('User not found with ID:', user.userId, 'role:', user.role);
            return NextResponse.json(
                { message: 'User not found in database' },
                { status: 404 }
            );
        }

        // Update MongoDB User record
        const previousLink = userRecord.githubLink;
        userRecord.githubLink = trimmedLink || null;
        
        console.log('Updating GitHub link in MongoDB:', {
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
        
        // Try MongoDB first
        let userRecord = null;
        try {
            userRecord = await User.findById(user.userId).select('githubLink');
        } catch (findError: any) {
            // If userId is not a valid MongoDB ObjectId, it might be a Supabase UUID
            console.log('MongoDB findById failed, might be Supabase participant:', findError.message);
        }
        
        // If not found in MongoDB and user is a participant, try Supabase
        if (!userRecord && user.role === 'participant') {
            const supabase = getSupabaseClient();
            
            if (supabase) {
                try {
                    const { data: participant, error: supabaseError } = await supabase
                        .from('participants')
                        .select('github_link')
                        .eq('id', user.userId)
                        .single();
                    
                    if (supabaseError || !participant) {
                        return NextResponse.json({
                            githubLink: null
                        });
                    }
                    
                    return NextResponse.json({
                        githubLink: participant.github_link || null
                    });
                } catch (supabaseError: any) {
                    console.error('Error fetching from Supabase:', supabaseError);
                    return NextResponse.json({
                        githubLink: null
                    });
                }
            }
        }
        
        if (!userRecord) {
            return NextResponse.json({
                githubLink: null
            });
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

