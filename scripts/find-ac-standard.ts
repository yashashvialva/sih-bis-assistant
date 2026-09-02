import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Check the last few source documents uploaded
  const { data, error } = await supabase
    .from('source_documents')
    .select('id, title, standard_number, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) console.error('Error fetching docs:', error);
  else {
    console.log('Recent uploaded documents:');
    console.table(data);
  }
}

main().catch(console.error);
