import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching authoritative source documents...');
  
  const { data: documents, error: fetchError } = await supabase
    .from('source_documents')
    .select('id, standard_number')
    .eq('verification_status', 'AUTHORITATIVE')
    .eq('authoritative', true);

  if (fetchError) {
    console.error('Error fetching documents:', fetchError);
    process.exit(1);
  }

  if (!documents || documents.length === 0) {
    console.error('No authoritative documents found!');
    process.exit(1);
  }

  const kettleDoc = documents.find(d => d.standard_number && d.standard_number.includes('302-2-15'));
  const fanDoc = documents.find(d => d.standard_number && d.standard_number.includes('302-2-80'));

  if (!kettleDoc) {
    console.error('Electric Kettle authoritative document (302-2-15) not found!');
  }
  if (!fanDoc) {
    console.error('Ceiling Fan authoritative document (302-2-80) not found!');
  }

  const mappings = [];

  if (kettleDoc) {
    mappings.push({
      product_category: 'Electric Kettle',
      standard_number: 'IS 302-2-15 : 2009',
      source_document_id: kettleDoc.id,
      description: 'Household and similar electrical appliances — Part 2-15: Particular requirements for appliances for heating liquids'
    });
  }

  if (fanDoc) {
    mappings.push({
      product_category: 'Ceiling Fan',
      standard_number: 'IS 302-2-80 : 2017',
      source_document_id: fanDoc.id,
      description: 'Household and similar electrical appliances — Safety — Part 2-80: Particular requirements for fans'
    });
  }

  if (mappings.length > 0) {
    console.log('Inserting product standard mappings...');
    const { error: insertError } = await supabase
      .from('product_standard_mappings')
      .upsert(mappings, { onConflict: 'product_category' });

    if (insertError) {
      console.error('Error inserting mappings:', insertError);
      process.exit(1);
    }
    console.log('Successfully inserted mappings!');
  }
}

main();
