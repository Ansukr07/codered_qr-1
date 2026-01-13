import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkParticipant() {
    console.log('Checking for participant: anznup@gmail.com');
    const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('email', 'anznup@gmail.com');

    if (error) {
        console.error('Error fetching participant:', error);
    } else {
        console.log('Found participants:', data);
    }
}

checkParticipant();
