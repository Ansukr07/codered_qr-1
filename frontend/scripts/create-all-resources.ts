const baseUrl = 'http://localhost:3000/api';

async function createAllResources() {
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

    const resources = [
        { name: 'Breakfast', totalQuantity: 200, type: 'consumable' },
        { name: 'Lunch', totalQuantity: 200, type: 'consumable' },
        { name: 'Dinner', totalQuantity: 200, type: 'consumable' },
        { name: 'Sleeping Bag', totalQuantity: 50, type: 'returnable' },
        { name: 'Chill Room Access', totalQuantity: 20, type: 'consumable' },
        { name: 'Swag Kit', totalQuantity: 150, type: 'consumable' },
    ];

    console.log('Creating resources...\n');

    for (const resource of resources) {
        const res = await fetch(`${baseUrl}/resources`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieValue || ''
            },
            body: JSON.stringify(resource)
        });

        const data = await res.json();
        if (res.ok) {
            console.log(`✓ ${resource.name}: Created successfully`);
        } else {
            console.log(`✗ ${resource.name}: ${data.message}`);
        }
    }

    console.log('\nAll resources created!');
}

createAllResources();
