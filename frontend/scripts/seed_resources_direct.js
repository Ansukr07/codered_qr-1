const { createClient } = require('@supabase/supabase-js');
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
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const resources = [
    { name: 'Breakfast', total_quantity: 200, category: 'food' },
    { name: 'Lunch', total_quantity: 200, category: 'food' },
    { name: 'Dinner', total_quantity: 200, category: 'food' },
    { name: 'Sleeping Bag', total_quantity: 50, category: 'sleeping' },
    { name: 'Chill Room Access', total_quantity: 20, category: 'other' },
    { name: 'Swag Kit', total_quantity: 150, category: 'swag' },
    { name: 'Coffee', total_quantity: 500, category: 'food' }
];

async function seed() {
    console.log('Seeding Resources directly to Supabase...');

    for (const resource of resources) {
        // Check if exists
        const { data: existing } = await supabase
            .from('resources')
            .select('*')
            .eq('name', resource.name)
            .single();

        if (existing) {
            console.log(`Skipping ${resource.name} (Already exists)`);
            continue;
        }

        const { data, error } = await supabase
            .from('resources')
            .insert(resource)
            .select();

        if (error) {
            console.error(`Error creating ${resource.name}:`, error.message);
        } else {
            console.log(`✓ Created ${resource.name}`);
        }
    }
    console.log('Done!');
}

seed();
