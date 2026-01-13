import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedSpecificParticipant() {
    console.log('Seeding specific participant: Ansu <anznup@gmail.com>');

    const { data, error } = await supabase
        .from('participants')
        .upsert({
            name: 'Ansu',
            email: 'anznup@gmail.com',
            team_id: 'Team 0',
            qr_code: 'ANSU-001',
            participant_id: 'ANSU-001',
            is_email_verified: true
        });

    if (error) {
        console.error('Error seeding participant:', error);
    } else {
        console.log('Successfully seeded participant "Ansu".');
    }
}

seedSpecificParticipant();
