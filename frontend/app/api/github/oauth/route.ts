import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        
        if (!userId) {
            return NextResponse.json(
                { message: 'User ID is required' },
                { status: 400 }
            );
        }

        // GitHub OAuth configuration
        const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
        const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/github/callback`;
        
        if (!GITHUB_CLIENT_ID) {
            return NextResponse.json(
                { message: 'GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID in environment variables.' },
                { status: 500 }
            );
        }

        // Generate state parameter for security (store userId in state)
        const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
        
        // GitHub OAuth authorization URL
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=repo&state=${state}`;
        
        return NextResponse.json({ authUrl });
    } catch (error: any) {
        console.error('Error generating GitHub OAuth URL:', error);
        return NextResponse.json(
            { message: error.message || 'Failed to generate GitHub OAuth URL' },
            { status: 500 }
        );
    }
}

