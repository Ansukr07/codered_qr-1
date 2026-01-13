import { NextRequest, NextResponse } from 'next/server';

/**
 * Fetch recent commits for a GitHub repository
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

        // Fetch commits from GitHub API
        const githubApiUrl = `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=10`;

        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CodeRed-Portal'
        };

        // Use Basic Auth with Client ID/Secret to increase rate limits if available
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        if (clientId && clientSecret) {
            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        }

        const response = await fetch(githubApiUrl, { headers });

        if (!response.ok) {
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
