const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Manually load env
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^["'](.*)["']$/, '$1');
    }
});

const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials!');
    console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
    console.log('Key:', supabaseKey ? 'Found' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Seeding Demo Volunteer...');

    const email = 'volunteer@demo.com';
    const password = 'volunteer123';
    const name = 'Demo Volunteer';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check existing
    const { data: existing, error: checkError } = await supabase
        .from('volunteers')
        .select('*')
        .eq('email', email)
        .single();

    if (existing) {
        console.log('Volunteer already exists!');
        console.log('Email:', email);
        console.log('Password:', password);
        return;
    }

    // Create new
    const { data, error } = await supabase
        .from('volunteers')
        .insert({
            name,
            email,
            password: hashedPassword,
            qr_code: `VOL-${Date.now()}`
        })
        .select();

    if (error) {
        console.error('Error creating volunteer:', error);
    } else {
        console.log('Success! Volunteer created.');
        console.log('Email:', email);
        console.log('Password:', password);
    }
}

seed();
