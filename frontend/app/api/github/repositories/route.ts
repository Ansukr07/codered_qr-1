import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const accessToken = request.cookies.get('github_token')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { message: 'GitHub access token not found. Please reconnect.' },
                { status: 401 }
            );
        }

        // Fetch user's repositories from GitHub
        const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
            headers: {
                'Authorization': `token ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!reposResponse.ok) {
            const errorData = await reposResponse.json();
            console.error('GitHub API error:', errorData);
            return NextResponse.json(
                { message: errorData.message || 'Failed to fetch repositories from GitHub' },
                { status: reposResponse.status }
            );
        }

        const repos = await reposResponse.json();

        // Format repositories for frontend
        const formattedRepos = repos
            .filter((repo: any) => !repo.private) // Filter out private repositories
            .map((repo: any) => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                url: repo.html_url,
                description: repo.description,
                private: repo.private,
                updatedAt: repo.updated_at,
                defaultBranch: repo.default_branch,
            }));

        return NextResponse.json({ repositories: formattedRepos });
    } catch (error: any) {
        console.error('Error fetching GitHub repositories:', error);
        return NextResponse.json(
            { message: error.message || 'Failed to fetch repositories' },
            { status: 500 }
        );
    }
}

