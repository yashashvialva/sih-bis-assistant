import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { getEmbedding } from '../src/lib/ai/embedding';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const docId = '9f160e37-7f09-4691-9390-40acbeab0757'; // IS 8148 : 2018
const standardNumber = 'IS 8148 : 2018';

const chunksData = [
  {
    clause: '1.1',
    sectionTitle: 'Scope',
    content: 'This Standard specifies performance testing, the standard conditions and the test methods for determining the capacity and efficiency ratings of air-cooled air-conditioners and air-to-air heat pumps. This Standard is applicable unitary and split ducted air conditioners having air-cooled and water cooled condenser, and ducted air to air heat pumps.'
  },
  {
    clause: '1.2',
    sectionTitle: 'Scope - Applicable for',
    content: 'This standard is applicable for: a) Residential and commercial unitary and split air conditioners and heat pumps; b) Utilizing single stage, two stage, multi stage and variable capacity components; c) Single refrigeration system having nominal cooling capacity 3 500 W and above with one evaporator and one condenser, controlled by a single thermostat/controller; and d) Multiple split system utilizing one or more refrigeration systems controlled by a single thermostat/controller: 1) One outdoor and one or more indoor units, or 2) One or more outdoor and one indoor unit.'
  },
  {
    clause: '1.3',
    sectionTitle: 'Scope - Not Applicable for',
    content: 'This Standard is not applicable to the rating and testing of the following: a) Water-source heat pumps; b) Multi-split-system air-conditioners and air-to-air heat pumps (VRF); c) Mobile (windowless) units having a condenser exhaust duct; d) Individual assemblies not constituting a complete refrigeration system; e) Equipment using the absorption refrigeration cycle; and f) Non-ducted equipment (see IS 1391 part 1 and 2 for testing of such equipment).'
  },
  {
    clause: '2',
    sectionTitle: 'References',
    content: 'The standards listed below contain provisions, which through reference in this text constitute provision of this standard. 101 (Part 6/Sec 1) : 1988 Methods of sampling and test for paints, varnishes and related products: Part 6 Durability tests, Section 1 Resistance to humidity under conditions of condensation. 302 (Part 1) : 2008 Safety of household and similar electrical appliances: Part 1 General requirements. 996 : 2009 Single-phase a.c. industrial motors for general purpose. 1391 (Part 1) : 2017 Room air conditioners - Specification: Part 1 Unitary air conditioners. 1391 (Part 2) : 2018 Room air conditioners - Specification: Part 2 Split air conditioners.'
  }
];

async function main() {
  console.log('Generating embeddings and inserting chunks...');
  
  // Clear old chunks for this document if any
  await supabase.from('bis_chunks').delete().eq('source_document_id', docId);
  
  for (const chunk of chunksData) {
    const embeddingText = `${chunk.content} ${chunk.sectionTitle} ${chunk.clause} ${standardNumber}`;
    console.log(`Getting embedding for clause ${chunk.clause}...`);
    const embedding = await getEmbedding(embeddingText);
    
    const { error } = await supabase.from('bis_chunks').insert({
      source_document_id: docId,
      standard_number: standardNumber,
      clause: chunk.clause,
      section_title: chunk.sectionTitle,
      content: chunk.content,
      metadata: { source: 'manual_ingestion' },
      embedding: embedding
    });
    
    if (error) {
      console.error(`Error inserting chunk ${chunk.clause}:`, error);
    } else {
      console.log(`Inserted chunk for clause ${chunk.clause}`);
    }
  }
  
  console.log('Ingestion complete! You can now generate the roadmap for Air Conditioners.');
}

main().catch(console.error);
