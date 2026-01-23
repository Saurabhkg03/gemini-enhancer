import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
  console.log('Starting keep-alive ping...');
  
  try {
    // We try to fetch a single row. 
    // Even if it returns no data or RLS error, it hits the database.
    const { data, error } = await supabase
      .from('question_banks')
      .select('id')
      .limit(1);

    if (error) {
      console.log('Ping completed with expected database interaction (even if error):', error.message);
    } else {
      console.log('Ping successful. Row count:', data.length);
    }
  } catch (err) {
    console.error('Unexpected error during ping:', err);
    process.exit(1);
  }
}

keepAlive();
