import { supabase } from '@/lib/db/supabaseClient';
import { getEmbedding } from '@/lib/ai/embedding';
import type { BISChunk } from '@/lib/types';

export interface SearchResult {
  chunk: BISChunk;
  score: number;
}

/**
 * Semantic vector search against the Supabase pgvector corpus.
 * Returns chunks sorted by similarity score.
 */
export async function searchCorpusVector(query: string, topK: number = 5): Promise<SearchResult[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured. Vector search is disabled.');
      return [];
    }

    const queryEmbedding = await getEmbedding(query);

    const { data, error } = await supabase.rpc('match_bis_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1, // Adjusted threshold
      match_count: topK,
    });

    if (error) {
      console.error('Supabase RPC error in searchCorpusVector:', error);
      return [];
    }

    if (!data) return [];

    return data.map((row: any) => ({
      chunk: {
        id: row.id,
        standardId: 'unknown', // Need to fetch standard_id if needed, but not critical for chunk
        standardNumber: row.standard_number,
        clause: row.clause,
        sectionTitle: row.section_title,
        content: row.content,
        metadata: row.metadata,
        authoritative: row.authoritative,
        sourceType: row.source_type,
        verificationStatus: row.verification_status,
      },
      score: row.similarity,
    }));
  } catch (error) {
    console.error('Failed to perform vector search:', error);
    return [];
  }
}
