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

        // Fetch commit count using commits API with proper pagination
        let commitCount = 0;
        try {
            // Use commits API with max per_page (100) for better accuracy
            const perPage = 100;
            const commitsResponse = await fetch(
                `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=${perPage}&page=1`,
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
                    // Parse Link header to find last page
                    // Format: <url1>; rel="next", <url2>; rel="last"
                    const links = linkHeader.split(',').map(link => link.trim());
                    let lastPage: number | null = null;
                    
                    for (const link of links) {
                        const lastPageMatch = link.match(/page=(\d+)>; rel="last"/);
                        if (lastPageMatch) {
                            lastPage = parseInt(lastPageMatch[1], 10);
                            break;
                        }
                    }
                    
                    if (lastPage !== null) {
                        // Fetch the last page to get exact count on that page
                        const lastPageResponse = await fetch(
                            `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=${perPage}&page=${lastPage}`,
                            {
                                headers: {
                                    'Accept': 'application/vnd.github.v3+json',
                                    'User-Agent': 'CodeRed-Portal'
                                }
                            }
                        );
                        
                        if (lastPageResponse.ok) {
                            const lastPageCommits = await lastPageResponse.json();
                            const commitsOnLastPage = lastPageCommits.length;
                            
                            // Calculate total: (lastPage - 1) * perPage + commits on last page
                            commitCount = (lastPage - 1) * perPage + commitsOnLastPage;
                        } else {
                            // Fallback: approximate using last page number
                            // This is less accurate but better than 0
                            commitCount = lastPage * perPage;
                        }
                    } else {
                        // No last page found in Link header, count commits on first page only
                        const commits = await commitsResponse.json();
                        commitCount = commits.length;
                    }
                } else {
                    // No Link header means single page or no commits
                    const commits = await commitsResponse.json();
                    commitCount = commits.length;
                }
            }
        } catch (error) {
            console.error('Error fetching commit count:', error);
            // Continue without commit count (will be 0)
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

