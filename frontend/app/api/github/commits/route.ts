import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';

/**
 * Fetch recent commits for a GitHub repository
 * Supports private repositories by looking up the participant's saved access token
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const repoUrl = searchParams.get('url');

        if (!repoUrl) {
            return NextResponse.json(
                { message: 'Repository URL is required' },
                { status: 400 }
            );
        }

        // Extract owner and repo from GitHub URL
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            return NextResponse.json(
                { message: 'Invalid GitHub URL format' },
                { status: 400 }
            );
        }

        const [, owner, repo] = match;
        const repoName = repo.replace(/\.git$/, '');

        // 1. Look up the participant who owns this repo link to get their access token
        // Use normalized search (trim whitespace)
        let accessToken: string | null = null;

        if (supabase) {
            const { data: participant, error } = await supabase
                .from('participants')
                .select('github_access_token')
                .eq('github_link', repoUrl.trim())
                .limit(1)
                .single();

            if (!error && participant && participant.github_access_token) {
                accessToken = participant.github_access_token;
            }
        }

        // Fetch commits from GitHub API
        const githubApiUrl = `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=10`;

        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CodeRed-Portal'
        };

        if (accessToken) {
            // Use Participant's Token (Access to Private Repos)
            headers['Authorization'] = `token ${accessToken}`;
            console.log('Using Participant Access Token for commit fetch');
        } else {
            // Fallback: Use App Client ID/Secret (Public Repos only, higher rate limit)
            const clientId = process.env.GITHUB_CLIENT_ID;
            const clientSecret = process.env.GITHUB_CLIENT_SECRET;

            if (clientId && clientSecret) {
                const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
                headers['Authorization'] = `Basic ${auth}`;
                console.log('Using App Basic Auth (Public only)');
            }
        }

        const response = await fetch(githubApiUrl, { headers });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json(
                    { message: 'Repository not found or is private (and no valid token found)' },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { message: `GitHub API error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const commits = await response.json();

        // Simplify response
        const mappedCommits = commits.map((c: any) => ({
            sha: c.sha,
            message: c.commit.message,
            author: c.commit.author.name,
            date: c.commit.author.date,
            url: c.html_url
        }));

        return NextResponse.json({ commits: mappedCommits });

    } catch (error: any) {
        console.error('Error fetching commits:', error);
        return NextResponse.json(
            { message: error.message || 'Failed to fetch commits' },
            { status: 500 }
        );
    }
}
