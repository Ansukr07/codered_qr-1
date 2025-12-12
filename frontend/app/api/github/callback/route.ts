import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (!code || !state) {
            return NextResponse.redirect(new URL('/participant/github?error=missing_params', request.url));
        }

        // Decode state to get userId
        let userId: string;
        try {
            const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
            userId = decodedState.userId;
        } catch (error) {
            return NextResponse.redirect(new URL('/participant/github?error=invalid_state', request.url));
        }

        // Exchange code for access token
        const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
        const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
        const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/github/callback`;

        if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
            return NextResponse.redirect(new URL('/participant/github?error=oauth_not_configured', request.url));
        }

        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: GITHUB_REDIRECT_URI,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('GitHub OAuth error:', tokenData);
            return NextResponse.redirect(new URL(`/participant/github?error=${tokenData.error}`, request.url));
        }

        const accessToken = tokenData.access_token;

        if (!accessToken) {
            return NextResponse.redirect(new URL('/participant/github?error=no_token', request.url));
        }

        // Create response with redirect
        const response = NextResponse.redirect(new URL('/participant/github/select', request.url));
        
        // Store access token temporarily in a cookie (will be used to fetch repos)
        response.cookies.set('github_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 10, // 10 minutes
            path: '/',
            sameSite: 'lax',
        });

        // Store userId in cookie for later use
        response.cookies.set('github_user_id', userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 10, // 10 minutes
            path: '/',
            sameSite: 'lax',
        });

        // Return response with cookies set
        return response;
    } catch (error: any) {
        console.error('Error in GitHub OAuth callback:', error);
        return NextResponse.redirect(new URL(`/participant/github?error=${error.message}`, request.url));
    }
}

