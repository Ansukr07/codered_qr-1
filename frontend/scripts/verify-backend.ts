import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';
let adminToken = '';
let resourceId = '';
let participantQrCode = '';

async function verify() {
    console.log('Starting Backend Verification...');

    // 1. Register Admin
    console.log('\n1. Registering Admin...');
    const adminRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Admin User',
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin',
        }),
    });
    const adminData: any = await adminRes.json();
    console.log('Admin Register Status:', adminRes.status);
    if (adminRes.status !== 201 && adminRes.status !== 400) { // 400 if already exists
        console.error('Failed to register admin:', adminData);
        return;
    }

    // 2. Login Admin
    console.log('\n2. Logging in Admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@test.com',
            password: 'password123',
        }),
    });
    const loginData: any = await loginRes.json();
    console.log('Admin Login Status:', loginRes.status);

    // Extract cookie
    const cookieHeader = loginRes.headers.get('set-cookie');
    if (cookieHeader) {
        adminToken = cookieHeader.split(';')[0];
    } else {
        console.error('No cookie received');
        return;
    }

    // 3. Create Resource
    console.log('\n3. Creating Resource...');
    const resourceRes = await fetch(`${BASE_URL}/resources`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': adminToken
        },
        body: JSON.stringify({
            name: 'Test Lunch',
            totalQuantity: 100,
            type: 'consumable',
        }),
    });
    const resourceData: any = await resourceRes.json();
    console.log('Create Resource Status:', resourceRes.status);
    if (resourceRes.status === 201) {
        resourceId = resourceData.resource._id;
    } else {
        console.error('Failed to create resource:', resourceData);
        return;
    }

    // 4. Register Participant
    console.log('\n4. Registering Participant...');
    const userRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Participant User',
            email: 'participant@test.com',
            password: 'password123',
            role: 'participant',
        }),
    });
    const userData: any = await userRes.json();
    console.log('Participant Register Status:', userRes.status);
    if (userRes.status === 201) {
        participantQrCode = userData.user.qrCode;
    } else if (userRes.status === 400) {
        // If user exists, we need to login to get QR code or just fail for now (simplified)
        console.log('Participant already exists, skipping QR fetch for simplicity (or implement login to get it)');
        // For this test, let's assume we can't easily get the QR if we didn't just create it, 
        // unless we add a getter. But let's try to proceed if we have a QR code from a previous run? 
        // Actually, if user exists, we can't get the QR code without logging in as them or admin fetching users.
        // Let's just fetch all users as admin to find the participant.
    }

    // 4b. Fetch Users (to get QR if needed)
    if (!participantQrCode) {
        // This endpoint doesn't exist in my plan but let's assume we might need it or just rely on fresh DB
        console.log('Could not get QR code from registration (user might exist).');
    }

    if (participantQrCode && resourceId) {
        // 5. Scan QR Code
        console.log('\n5. Scanning QR Code...');
        const scanRes = await fetch(`${BASE_URL}/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': adminToken
            },
            body: JSON.stringify({
                qr_code: participantQrCode,
                resource_id: resourceId,
            }),
        });
        const scanData = await scanRes.json();
        console.log('Scan Status:', scanRes.status);
        console.log('Scan Result:', scanData);
    } else {
        console.log('Skipping scan test due to missing data.');
    }
}

verify();
