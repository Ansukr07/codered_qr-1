import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), 'frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedVolunteer() {
    console.log('Seeding demo volunteer directly to Supabase...');

    const email = 'volunteer@demo.com';
    const password = 'volunteer123';
    const name = 'Demo Volunteer';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if exists
    const { data: existing } = await supabase
        .from('volunteers')
        .select('id')
        .eq('email', email)
        .single();

    if (existing) {
        console.log('Volunteer already exists.');
        return;
    }

    const { error } = await supabase
        .from('volunteers')
        .insert({
            name,
            email,
            password: hashedPassword,
            qr_code: `VOL-${Date.now()}` // Generate a dummy QR code
        });

    if (error) {
        console.error('Error seeding volunteer:', error);
    } else {
        console.log('Successfully seeded volunteer!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    }
}

seedVolunteer();
