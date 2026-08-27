/**
 * BIS Compliance Assistant — Mock Vector Search
 * 
 * Local in-memory vector search for development/testing when
 * Supabase + pgvector is not available.
 * 
 * Uses simple keyword matching as a stand-in for semantic
 * similarity. Will be replaced by pgvector cosine similarity
 * when Supabase is configured with real embeddings.
 */

import { DEMO_CHUNKS, DEMO_STANDARDS } from '@/lib/mock-data/seedData';
import type { BISChunk, BISStandard, ConfidenceLevel, SourcedClaimData, SourceReference } from '@/lib/types';

interface SearchResult {
  chunk: BISChunk;
  score: number;
}

/**
 * Simple keyword-based search against the demo corpus.
 * Returns chunks sorted by relevance score.
 */
export function searchCorpus(query: string, topK: number = 5): SearchResult[] {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  const results: SearchResult[] = DEMO_CHUNKS.map(chunk => {
    const content = `${chunk.content} ${chunk.sectionTitle ?? ''} ${chunk.clause ?? ''} ${chunk.standardNumber}`.toLowerCase();
    
    let score = 0;
    for (const term of queryTerms) {
      if (content.includes(term)) {
        score += 1;
        // Boost for exact clause matches
        if (chunk.clause?.toLowerCase().includes(term)) score += 0.5;
        // Boost for title matches
        if (chunk.sectionTitle?.toLowerCase().includes(term)) score += 0.5;
      }
    }
    
    // Normalize by query terms count
    score = queryTerms.length > 0 ? score / queryTerms.length : 0;
    
    return { chunk, score };
  });
  
  return results
    .filter(r => r.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Find the standard associated with a product category or keyword.
 */
export function findStandardForProduct(productDescription: string): BISStandard | null {
  const desc = productDescription.toLowerCase();
  
  for (const std of DEMO_STANDARDS) {
    const stdText = `${std.title} ${std.productCategory}`.toLowerCase();
    const stdTerms = stdText.split(/\s+/).filter(t => t.length > 3);
    
    for (const term of stdTerms) {
      if (desc.includes(term)) return std;
    }
  }
  
  return null;
}

/**
 * Get all chunks for a specific standard.
 */
export function getChunksForStandard(standardId: string): BISChunk[] {
  return DEMO_CHUNKS.filter(c => c.standardId === standardId);
}

/**
 * Build sourced claims from search results.
 * Enforces the trust boundary:
 * - High-score matches → VERIFIED_BIS_DATA (with direct source)
 * - Medium-score matches → AI_INTERPRETATION (with supporting source)
 * - No matches → NO_MATCHING_SOURCE (explicit uncertainty)
 */
export function buildSourcedClaims(
  query: string,
  searchResults: SearchResult[]
): SourcedClaimData[] {
  if (searchResults.length === 0) {
    return [
      {
        id: `claim-${Date.now()}-none`,
        content:
          'No matching information was found in the curated BIS corpus for this query. This does not mean the requirement doesn\'t exist — it may be covered under a different standard or clause not yet in the corpus. Please consult BIS directly for authoritative information.',
        confidenceLevel: 'NO_MATCHING_SOURCE' as ConfidenceLevel,
        sources: [],
      },
    ];
  }

  const claims: SourcedClaimData[] = [];

  for (const result of searchResults) {
    const confidence: ConfidenceLevel =
      result.score > 0.5 ? 'VERIFIED_BIS_DATA' : 'AI_INTERPRETATION';

    const source: SourceReference = {
      standardNumber: result.chunk.standardNumber,
      clause: result.chunk.clause,
      sectionTitle: result.chunk.sectionTitle,
      evidenceText: result.chunk.content,
      chunkId: result.chunk.id,
    };

    const claim: SourcedClaimData = {
      id: `claim-${Date.now()}-${result.chunk.id}`,
      content: result.chunk.content,
      confidenceLevel: confidence,
      sources: [source],
      reasoning:
        confidence === 'AI_INTERPRETATION'
          ? `This information is related to your query but may not directly answer it. The match was found in ${result.chunk.standardNumber}, ${result.chunk.clause ?? 'general provisions'}. This is an AI-assisted interpretation and should be verified with the original standard document.`
          : undefined,
    };

    claims.push(claim);
  }

  return claims;
}
