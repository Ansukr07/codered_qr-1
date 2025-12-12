/**
 * Script to add github_link column to Supabase participants table
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env.local first, then .env as fallback
const envLocalPath = path.join(__dirname, '../.env.local');
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
    console.log('Loaded .env.local');
} else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Loaded .env');
} else {
    dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials not found in environment variables');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local or .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function addGithubLinkColumn() {
    try {
        console.log('Connecting to Supabase...');
        console.log('Supabase URL:', supabaseUrl);
        console.log('');

        // Read the SQL file
        const sqlPath = path.join(__dirname, '../migrations/add_github_link_to_participants.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('SQL to execute:');
        console.log('---');
        console.log(sql);
        console.log('---\n');

        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        console.log(`Executing ${statements.length} SQL statement(s)...\n`);

        // Execute each statement using Supabase RPC or direct query
        // Note: Supabase doesn't have a direct SQL execution endpoint via the JS client
        // We'll need to use the REST API or pg client
        // For now, let's use a workaround with Supabase's REST API

        // Actually, the best way is to use the Supabase SQL editor or pg client
        // Let's create a simpler approach - use pg if available, otherwise provide instructions

        try {
            // Try using pg (PostgreSQL client) if available
            const { Client } = require('pg');
            
            // Extract connection details from Supabase URL
            // Supabase connection string format: postgresql://postgres:[password]@[host]:[port]/postgres
            // Or use the connection pooling URL
            const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
            
            if (!dbUrl) {
                console.log('⚠️  Direct database connection not available.');
                console.log('📝 Please run the SQL script manually in Supabase SQL Editor:');
                console.log(`   File: ${sqlPath}`);
                console.log('\nOr set SUPABASE_DB_URL or DATABASE_URL environment variable.');
                console.log('\nTo get the connection string:');
                console.log('1. Go to your Supabase project dashboard');
                console.log('2. Navigate to Settings > Database');
                console.log('3. Copy the "Connection string" (URI format)');
                console.log('4. Set it as SUPABASE_DB_URL in your .env file');
                process.exit(0);
            }

            const client = new Client({
                connectionString: dbUrl,
                ssl: { rejectUnauthorized: false }
            });

            await client.connect();
            console.log('✅ Connected to Supabase database\n');

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement.trim()) {
                    try {
                        console.log(`Executing statement ${i + 1}/${statements.length}...`);
                        await client.query(statement);
                        console.log(`✅ Statement ${i + 1} executed successfully\n`);
                    } catch (err) {
                        // If column already exists, that's okay
                        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                            console.log(`⚠️  Statement ${i + 1}: ${err.message.split('\n')[0]}\n`);
                        } else {
                            throw err;
                        }
                    }
                }
            }

            // Verify the column was added
            const verifyResult = await client.query(`
                SELECT 
                    column_name, 
                    data_type, 
                    character_maximum_length,
                    is_nullable
                FROM information_schema.columns
                WHERE table_name = 'participants' 
                AND column_name = 'github_link'
            `);

            if (verifyResult.rows.length > 0) {
                console.log('✅ Verification: github_link column exists');
                console.log('   Column details:', verifyResult.rows[0]);
            } else {
                console.log('⚠️  Verification: github_link column not found');
            }

            await client.end();
            console.log('\n✅ Migration completed successfully!');
            process.exit(0);

        } catch (pgError) {
            if (pgError.code === 'MODULE_NOT_FOUND') {
                console.log('⚠️  pg (PostgreSQL client) module not found.');
                console.log('📦 Install it with: npm install pg');
                console.log('\n📝 Alternatively, run the SQL script manually in Supabase SQL Editor:');
                console.log(`   File: ${sqlPath}`);
                console.log('\nTo run manually:');
                console.log('1. Go to your Supabase project dashboard');
                console.log('2. Navigate to SQL Editor');
                console.log('3. Copy and paste the SQL from the file');
                console.log('4. Click "Run"');
                process.exit(0);
            } else {
                throw pgError;
            }
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

addGithubLinkColumn();

