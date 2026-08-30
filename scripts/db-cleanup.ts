import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Demoting non-standards...');
  
  const { data: demoteData, error: demoteError } = await supabase
    .from('source_documents')
    .update({ authoritative: false, verification_status: 'REJECTED' })
    .in('id', [
      'ab9fea1f-3924-4764-8b16-c680c969f9ab', // standardsbis.bsb.co.in html
      '8d6aa111-58ac-4f67-b15b-e692833945cf', // bis.gov.in products html
      '5bcde963-539b-4b67-9e25-382b05bc9ba3', // www.bis.gov.in html
      '3256b575-e522-483d-aa5f-3aacf946caba'  // Indian-Standards-on-Power-Energy-sector.pdf
    ])
    .select();

  if (demoteError) {
    console.error('Failed to demote:', demoteError);
  } else {
    console.log(`Demoted ${demoteData?.length} documents successfully.`);
  }

  // Also remove their chunks from bis_chunks if they exist so they don't pollute RAG even though authoritative=false filters them
  // Actually, RAG already filters them, but let's delete them to be clean.
  const { error: chunkDeleteError } = await supabase
    .from('bis_chunks')
    .delete()
    .in('source_document_id', [
      'ab9fea1f-3924-4764-8b16-c680c969f9ab', 
      '8d6aa111-58ac-4f67-b15b-e692833945cf', 
      '5bcde963-539b-4b67-9e25-382b05bc9ba3', 
      '3256b575-e522-483d-aa5f-3aacf946caba'
    ]);
    
  if (chunkDeleteError) console.error('Chunk deletion error:', chunkDeleteError);

  console.log('Inserting IS 16102 Part 1 & Part 2 as PENDING_REVIEW...');
  const { data: insertData, error: insertError } = await supabase
    .from('source_documents')
    .insert([
      {
        source_url: 'https://lims.bis.gov.in/home/search_is_number/?is_number__doc_no=16102&page=1&part=1',
        source_domain: 'lims.bis.gov.in',
        title: 'Self-Ballasted LED Lamps for General Lighting Services — Part 1: Safety Requirements',
        standard_number: 'IS 16102 (Part 1) : 2026',
        document_type: 'application/pdf',
        verification_status: 'PENDING_REVIEW',
        authoritative: false,
        discovered_by: 'manual_entry'
      },
      {
        source_url: 'https://lims.bis.gov.in/home/search_is_number/?is_number__doc_no=16102&page=1&part=2',
        source_domain: 'lims.bis.gov.in',
        title: 'Self-Ballasted LED Lamps for General Lighting Services — Part 2: Performance Requirements',
        standard_number: 'IS 16102 (Part 2) : 2017',
        document_type: 'application/pdf',
        verification_status: 'PENDING_REVIEW',
        authoritative: false,
        discovered_by: 'manual_entry'
      }
    ])
    .select();

  if (insertError) {
    console.error('Failed to insert new candidates:', insertError);
  } else {
    console.log(`Inserted ${insertData?.length} LED candidates successfully.`);
  }
}

main();
