import * as dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

// Use absolute path for .env.local relative to this script
const envPath = path.join(__dirname, '../frontend/.env.local');
console.log(`Loading env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env.local:', result.error);
}

async function testFetchCommits(repoUrl: string) {
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
    console.log(`Client Secret loaded: ${clientSecret ? 'YES' : 'NO'}`);
    if (clientId) console.log(`Client ID: ${clientId.substring(0, 4)}...`);

    const headers: any = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CodeRed-Portal'
    };

    if (clientId && clientSecret) {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
        console.log('Using Basic Auth');
    } else {
        console.log('Using Public API (No Auth)');
    }

    try {
        const response = await fetch(githubApiUrl, { headers });
        console.log(`Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            console.error('Body:', await response.text());
            return;
        }

        const commits = await response.json();
        console.log(`Fetched ${commits.length} commits successfully.`);
        if (commits.length > 0) {
            console.log('Latest commit:', (commits[0] as any).commit.message);
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testFetchCommits('https://github.com/Ansukr07/codered_qr-1');
