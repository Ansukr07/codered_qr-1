import { NextRequest, NextResponse } from 'next/server';

/**
 * Fetch GitHub repository statistics
 * This endpoint fetches public stats from GitHub API without authentication
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
        // Format: https://github.com/owner/repo
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            return NextResponse.json(
                { message: 'Invalid GitHub URL format' },
                { status: 400 }
            );
        }

        const [, owner, repo] = match;
        const repoName = repo.replace(/\.git$/, ''); // Remove .git suffix if present

        // Fetch repository stats from GitHub API
        // Using public API (no auth required for public repos)
        const githubApiUrl = `https://api.github.com/repos/${owner}/${repoName}`;
        
        const response = await fetch(githubApiUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'CodeRed-Portal'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json(
                    { message: 'Repository not found or is private' },
                    { status: 404 }
                );
            }
            return NextResponse.json(
                { message: `GitHub API error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const repoData = await response.json();

        // Fetch commit count using contributors API (more accurate)
        let commitCount = 0;
        try {
            // Try to get commit count from contributors API
            const contributorsResponse = await fetch(
                `https://api.github.com/repos/${owner}/${repoName}/contributors?per_page=1&anon=1`,
                {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'CodeRed-Portal'
                    }
                }
            );
            
            if (contributorsResponse.ok) {
                const linkHeader = contributorsResponse.headers.get('link');
                if (linkHeader) {
                    // Extract total count from Link header
                    const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
                    if (lastPageMatch) {
                        commitCount = parseInt(lastPageMatch[1], 10) * 30; // Approximate (30 per page)
                    }
                }
            }
            
            // Fallback: try commits API with pagination
            if (commitCount === 0) {
                const commitsResponse = await fetch(
                    `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=1`,
                    {
                        headers: {
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'CodeRed-Portal'
                        }
                    }
                );
                
                if (commitsResponse.ok) {
                    const linkHeader = commitsResponse.headers.get('link');
                    if (linkHeader) {
                        const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
                        if (lastPageMatch) {
                            commitCount = parseInt(lastPageMatch[1], 10);
                        }
                    } else {
                        // If no pagination, try to get all commits (limited)
                        const commits = await commitsResponse.json();
                        commitCount = commits.length > 0 ? 1 : 0;
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching commit count:', error);
            // Continue without commit count
        }

        return NextResponse.json({
            stars: repoData.stargazers_count || 0,
            forks: repoData.forks_count || 0,
            commits: commitCount,
            openIssues: repoData.open_issues_count || 0,
            language: repoData.language || null,
            description: repoData.description || null,
            updatedAt: repoData.updated_at || null,
            defaultBranch: repoData.default_branch || 'main'
        });
    } catch (error: any) {
        console.error('Error fetching GitHub stats:', error);
        return NextResponse.json(
            { message: error.message || 'Failed to fetch GitHub stats' },
            { status: 500 }
        );
    }
}

