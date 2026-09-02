import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const docId = '9f160e37-7f09-4691-9390-40acbeab0757'; // IS 8148 : 2018

  // 1. Mark the document as authoritative so the roadmap filter will accept it
  await supabase.from('source_documents').update({
    verification_status: 'AUTHORITATIVE',
    authoritative: true
  }).eq('id', docId);

  // 2. Insert the standard mapping
  const { error } = await supabase.from('product_standard_mappings').upsert({
    product_category: 'Air Conditioner',
    standard_number: 'IS 8148 : 2018',
    source_document_id: docId,
    description: 'Added via diagnostic script'
  }, { onConflict: 'product_category' });

  if (error) {
    console.error('Failed to map Air Conditioner:', error);
  } else {
    console.log('Successfully mapped Air Conditioner to IS 8148 : 2018');
  }
}

main().catch(console.error);
