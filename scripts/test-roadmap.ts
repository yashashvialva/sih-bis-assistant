import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProduct(category: string) {
  console.log(`\n--- Checking Category: ${category} ---`);
  
  // 1. Get standard mapping
  const { data: mappings, error: mappingError } = await supabase
    .from('product_standard_mappings')
    .select(`*, source_documents(verification_status, authoritative)`)
    .eq('product_category', category);

  if (mappingError) {
    console.error('Error fetching mappings:', mappingError);
    return;
  }

  console.log('Mappings found:', mappings?.length);
  
  if (!mappings || mappings.length === 0) {
    console.log('No mappings found for', category);
    return;
  }

  const authoritativeMappings = mappings.filter(m => 
    m.source_documents && 
    m.source_documents.verification_status === 'AUTHORITATIVE' && 
    m.source_documents.authoritative === true
  );

  console.log('Authoritative mappings:', authoritativeMappings.length);
  authoritativeMappings.forEach(m => console.log(' -> Standard Number:', m.standard_number));

  const mappedStandards = authoritativeMappings.map(m => m.standard_number);

  if (mappedStandards.length === 0) {
    console.log('No authoritative mapped standards to filter by.');
    return;
  }

  // 2. Check chunks in bis_chunks
  const { data: chunkStats, error: chunkError } = await supabase
    .from('bis_chunks')
    .select('standard_number')
    .in('standard_number', mappedStandards);

  if (chunkError) {
    console.error('Error fetching chunks:', chunkError);
  } else {
    console.log(`Found ${chunkStats?.length || 0} chunks EXACTLY matching standard numbers:`, mappedStandards);
  }

  // 3. See what standard numbers ACTUALLY exist in bis_chunks (unique)
  const { data: uniqueStandards, error: uError } = await supabase
    .from('bis_chunks')
    .select('standard_number')
    .limit(1000);

  if (!uError && uniqueStandards) {
    const uniques = Array.from(new Set(uniqueStandards.map(s => s.standard_number)));
    console.log('Available unique standard numbers in bis_chunks (sample):', uniques);
  }
}

async function main() {
  await checkProduct('Ceiling Fan');
  await checkProduct('Air Conditioner');
}

main().catch(console.error);
