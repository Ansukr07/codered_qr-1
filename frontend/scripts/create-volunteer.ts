import fetch from 'node-fetch';


const baseUrl = 'http://localhost:3000/api';

async function createVolunteer() {
    console.log('Creating demo volunteer...');

    try {
        const res = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Demo Volunteer',
                email: 'volunteer@demo.com',
                password: process.env.DEMO_VOLUNTEER_PASSWORD || 'volunteer123',
                role: 'volunteer'
            })
        });

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON response:', text);
            return;
        }

        if (res.ok) {
            console.log('✓ Volunteer created successfully');
            console.log('Email: volunteer@demo.com');
            console.log('Password: volunteer123');
        } else {
            console.log(`✗ Failed to create volunteer: ${data.message}`);
            if (res.status === 400 && data.message?.includes('already exists')) {
                console.log('Volunteer already exists. Credentials:');
                console.log('Email: volunteer@demo.com');
                console.log('Password: volunteer123');
            }
        }
    } catch (error) {
        console.error('Error creating volunteer:', error);
    }
}

createVolunteer();
