const baseUrl = 'http://localhost:3000/api';

async function createResources() {
    // Login as admin
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'demo@admin.com',
            password: 'admin123'
        })
    });

    const cookies = loginRes.headers.get('set-cookie');
    const cookieValue = cookies?.split(';')[0];

    // Create Sleeping Bag resource
    const sleepingBagRes = await fetch(`${baseUrl}/resources`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieValue || ''
        },
        body: JSON.stringify({
            name: 'Sleeping Bag',
            totalQuantity: 50,
            type: 'returnable'
        })
    });

    console.log('Sleeping Bag:', await sleepingBagRes.json());

    // Create Chill Room Access
    const chillRoomRes = await fetch(`${baseUrl}/resources`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieValue || ''
        },
        body: JSON.stringify({
            name: 'Chill Room Access',
            totalQuantity: 20,
            type: 'consumable'
        })
    });

    console.log('Chill Room:', await chillRoomRes.json());
}

createResources();
