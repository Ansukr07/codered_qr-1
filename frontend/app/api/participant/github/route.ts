import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireAuth } from '@/lib/middleware/rbac';

export async function PUT(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;
        if (!user || !user.userId) {
            return NextResponse.json({ message: 'Invalid user data' }, { status: 401 });
        }

        const body = await request.json();
        const { githubLink } = body;

        // Process link
        let linkToProcess: string | null = null;
        if (typeof githubLink === 'string') {
            linkToProcess = githubLink;
        } else if (githubLink && typeof githubLink === 'object') {
            linkToProcess = githubLink.html_url || githubLink.url || null;
        }

        const trimmedLink = linkToProcess && typeof linkToProcess === 'string' ? linkToProcess.trim() : null;

        if (trimmedLink) {
            const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+/;
            if (!githubUrlPattern.test(trimmedLink)) {
                return NextResponse.json(
                    { message: 'Invalid GitHub URL format' },
                    { status: 400 }
                );
            }
        }

        // Retrieve access token from cookie (set during callback)
        const accessToken = request.cookies.get('github_token')?.value;

        const updateData: any = { github_link: trimmedLink };
        if (accessToken) {
            updateData.github_access_token = accessToken;
        }

        const { data: participant, error } = await supabase
            .from('participants')
            .update(updateData)
            .eq('id', user.userId)
            .select()
            .single();

        if (error) throw error;
        if (!participant) {
            return NextResponse.json({ message: 'Participant not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'GitHub link updated successfully',
            githubLink: trimmedLink
        });
    } catch (error: any) {
        console.error('Error in PUT /api/participant/github:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { user } = authResult;

        const { data: participant, error } = await supabase
            .from('participants')
            .select('github_link')
            .eq('id', user.userId)
            .single();

        if (error || !participant) {
            return NextResponse.json({ githubLink: null });
        }

        return NextResponse.json({
            githubLink: participant.github_link || null
        });
    } catch (error: any) {
        console.error('Error in GET /api/participant/github:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

