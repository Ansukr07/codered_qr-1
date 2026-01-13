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

async function seedParticipants() {
    console.log('Seeding 100 participants...');

    const participants = [];
    for (let i = 1; i <= 100; i++) {
        const teamNum = Math.ceil(i / 4);
        const idStr = i.toString().padStart(3, '0');

        participants.push({
            name: `Demo Participant ${i}`,
            email: `demo${i}@example.com`,
            team_id: `Team ${teamNum}`,
            qr_code: `DEMO-${idStr}`,
            participant_id: `DEMO-${idStr}`,
            is_email_verified: true
        });
    }

    const { data, error } = await supabase
        .from('participants')
        .insert(participants);

    if (error) {
        console.error('Error seeding participants:', error);
    } else {
        console.log('Successfully seeded 100 participants in 25 teams.');
    }
}

seedParticipants();
