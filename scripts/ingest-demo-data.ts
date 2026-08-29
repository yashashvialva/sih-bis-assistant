import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';
import { DEMO_STANDARDS, DEMO_CHUNKS } from '../src/lib/mock-data/seedData';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseKey === 'placeholder-service-key') {
  console.error('Missing or invalid Supabase environment variables. Skipping ingestion.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await pipeline('feature-extraction', 'Xenova/bge-m3', { quantized: true });
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data) as number[];
}

async function ingest() {
  console.log('Starting ingestion...');

  for (const std of DEMO_STANDARDS) {
    const { error } = await supabase
      .from('bis_standards')
      .upsert({
        id: std.id,
        standard_number: std.standardNumber,
        title: std.title,
        product_category: std.productCategory,
        status: std.status,
        source_type: 'demo',
        verification_status: 'mock',
        authoritative: false, // Rule 11: Demo data is NEVER authoritative
      }, { onConflict: 'standard_number' });

    if (error) console.error(`Error inserting standard ${std.standardNumber}:`, error);
    else console.log(`Inserted standard ${std.standardNumber}`);
  }

  for (const chunk of DEMO_CHUNKS) {
    console.log(`Generating embedding for chunk ${chunk.id}...`);
    const embeddingText = `${chunk.content} ${chunk.sectionTitle ?? ''} ${chunk.clause ?? ''} ${chunk.standardNumber}`;
    const embedding = await generateEmbedding(embeddingText);

    const { error } = await supabase
      .from('bis_chunks')
      .upsert({
        id: chunk.id,
        standard_id: chunk.standardId,
        standard_number: chunk.standardNumber,
        clause: chunk.clause,
        section_title: chunk.sectionTitle,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding,
        source_type: 'demo',
        verification_status: 'mock',
        authoritative: false, // Rule 11: Demo data is NEVER authoritative
      }, { onConflict: 'id' });

    if (error) console.error(`Error inserting chunk ${chunk.id}:`, error);
    else console.log(`Inserted chunk ${chunk.id}`);
  }

  console.log('Ingestion complete!');
}

ingest().catch(console.error);
