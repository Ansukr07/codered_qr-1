import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('⚠️  Supabase credentials not found in environment variables');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local or .env file');
    console.error('The application will continue but Supabase features will not work.');
} else {
    // Create Supabase client with service role key for server-side operations
    try {
        // Replace `any` with generated Supabase Database types when the schema
        // is checked in. Until then this boundary avoids false `never` errors
        // across the existing route handlers.
        supabase = createClient<any>(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log('✓ Supabase client initialized');
    } catch (error: any) {
        console.error('❌ Error initializing Supabase client:', error.message);
    }
}

export default supabase;
