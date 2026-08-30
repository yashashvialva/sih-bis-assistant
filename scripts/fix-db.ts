import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const sql = `
    DROP INDEX IF EXISTS idx_bis_chunks_embedding;
    ALTER TABLE bis_chunks ALTER COLUMN embedding TYPE VECTOR(1024);
    CREATE INDEX idx_bis_chunks_embedding ON bis_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    
    DROP FUNCTION IF EXISTS match_bis_chunks;

    CREATE OR REPLACE FUNCTION match_bis_chunks(
        query_embedding vector(1024),
        match_threshold float,
        match_count int
    )
    RETURNS TABLE (
        id uuid,
        source_document_id uuid,
        standard_number text,
        clause text,
        section_title text,
        content text,
        metadata jsonb,
        similarity float,
        authoritative boolean,
        source_type text
    )
    LANGUAGE sql
    AS $$
        SELECT 
            bc.id,
            bc.source_document_id,
            bc.standard_number,
            bc.clause,
            bc.section_title,
            bc.content,
            bc.metadata,
            1 - (bc.embedding <=> query_embedding) AS similarity,
            sd.authoritative,
            sd.document_type AS source_type
        FROM bis_chunks bc
        INNER JOIN source_documents sd ON bc.source_document_id = sd.id
        WHERE 
            sd.authoritative = true 
            AND 1 - (bc.embedding <=> query_embedding) > match_threshold
        ORDER BY similarity DESC
        LIMIT match_count;
    $$;
  `;

  // Supabase JS doesn't support raw queries directly, we must use an RPC or REST API.
  // We can write a quick query to create a temporary RPC to execute raw SQL, but standard practice is 
  // to just use postgres JS client or since it's a Supabase project, use `npx supabase db execute`.
}

main();
