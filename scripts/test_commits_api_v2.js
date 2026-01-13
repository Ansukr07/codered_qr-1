const fs = require('fs');
const path = require('path');

// Basic .env parser since we can't rely on dotenv module being loaded correctly
function loadEnv() {
    const envPath = path.join(__dirname, '../frontend/.env.local');
    console.log(`Loading env from: ${envPath}`);
    try {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1'); // Remove quotes
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        }
    } catch (e) {
        console.error('Failed to read .env.local', e);
    }
}

loadEnv();

async function testFetchCommits(repoUrl) {
    console.log(`Testing fetch commits for: ${repoUrl}`);

    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
        console.error('Invalid URL');
        return;
    }

    const [, owner, repo] = match;
    const repoName = repo.replace(/\.git$/, '');

    const githubApiUrl = `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=10`;

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    console.log(`Client ID loaded: ${clientId ? 'YES' : 'NO'}`);

    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CodeRed-Portal'
    };

    if (clientId && clientSecret) {
        // Simple Basic Auth construction
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
        console.log('Using Basic Auth');
    } else {
        console.log('Using Public API (No Auth)');
    }

    try {
        // Native fetch
        const response = await fetch(githubApiUrl, { headers });
        console.log(`Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            console.error('Body:', await response.text());
            return;
        }

        const commits = await response.json();
        console.log(`Fetched ${commits.length} commits successfully.`);
        if (commits.length > 0) {
            console.log('Latest commit:', commits[0].commit.message);
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testFetchCommits('https://github.com/Ansukr07/codered_qr-1');
