import { supabase } from '../db/supabaseClient';
import type { ConfidenceLevel, SourceReference } from '../types';

export interface ProvenanceResult {
  confidenceLevel: ConfidenceLevel;
  sources: SourceReference[];
}

export async function validateProvenance(
  chunkIds: string[],
  evidenceText?: string
): Promise<ProvenanceResult> {
  if (!chunkIds || chunkIds.length === 0) {
    return {
      confidenceLevel: 'NO_MATCHING_SOURCE',
      sources: [],
    };
  }

  // Ensure supabase client is available
  if (!supabase) {
    console.warn('Supabase not configured, falling back to mock provenance for chunk IDs:', chunkIds);
    return {
      confidenceLevel: 'AI_INTERPRETATION',
      sources: chunkIds.map(id => ({
        standardNumber: 'Unknown',
        clause: 'Unknown',
        evidenceText,
      })),
    };
  }

  // Fetch chunks and join with source_documents to verify full provenance chain
  const { data: chunks, error } = await supabase
    .from('bis_chunks')
    .select(`
      id,
      standard_number,
      clause,
      section_title,
      content,
      authoritative,
      source_type,
      verification_status,
      source_document_id,
      source_documents (
        id,
        authoritative,
        verification_status,
        source_url
      )
    `)
    .in('id', chunkIds);

  if (error || !chunks || chunks.length === 0) {
    return {
      confidenceLevel: 'NO_MATCHING_SOURCE',
      sources: [],
    };
  }

  const sources: SourceReference[] = chunks.map(chunk => {
    // Determine the source URL, preferring the document's URL if available
    let sourceUrl: string | undefined;
    if (chunk.source_documents && Array.isArray(chunk.source_documents) === false) {
       // Single document join
       const doc = chunk.source_documents as any;
       sourceUrl = doc.source_url;
    }

    return {
      standardNumber: chunk.standard_number,
      clause: chunk.clause || undefined,
      sectionTitle: chunk.section_title || undefined,
      evidenceText: chunk.content, 
      sourceUrl, // Expose the source URL to the UI
    };
  });

  // Strict Provenance Validation:
  // A claim is only VERIFIED_BIS_DATA if ALL referenced chunks are from 
  // explicitly AUTHORITATIVE documents. Demo data and pending reviews fail this.
  const isAllAuthoritative = chunks.every(chunk => {
    // 1. Chunk must not be demo data
    if (chunk.source_type === 'demo' || chunk.verification_status === 'mock' || chunk.verification_status === 'DEMO') {
      return false;
    }
    
    // 2. Chunk itself must be marked authoritative
    if (!chunk.authoritative) {
      return false;
    }

    // 3. If chunk has a parent document, the parent must be authoritative
    if (chunk.source_documents && Array.isArray(chunk.source_documents) === false) {
      const parentDoc = chunk.source_documents as any;
      if (!parentDoc.authoritative || parentDoc.verification_status !== 'AUTHORITATIVE') {
        return false;
      }
    }

    // Passed all checks
    return true;
  });

  if (isAllAuthoritative) {
    return {
      confidenceLevel: 'VERIFIED_BIS_DATA',
      sources,
    };
  } else {
    // If any chunk is unverified/demo/secondary, downgrade the entire claim
    // to an AI Interpretation since it cannot be fully backed by official sources.
    return {
      confidenceLevel: 'AI_INTERPRETATION',
      sources,
    };
  }
}
