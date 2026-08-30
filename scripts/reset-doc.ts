import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('source_documents')
    .update({ verification_status: 'PENDING_REVIEW', authoritative: false })
    .eq('source_url', 'https://www.bis.gov.in/wp-content/uploads/2024/03/PM_302-2-15.pdf')
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Reset success:', data);
  }
}

main();
