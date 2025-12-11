const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('⚠️  Supabase credentials not found in environment variables');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local or .env file');
    console.error('The application will continue but Supabase features will not work.');
} else {
    // Create Supabase client with service role key for server-side operations
    try {
        supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log('✓ Supabase client initialized');
    } catch (error) {
        console.error('❌ Error initializing Supabase client:', error.message);
    }
}

module.exports = supabase;

