/**
 * RAG Retrieval Tests
 *
 * Verifies that the vector search:
 * - Retrieves relevant source chunks
 * - Preserves metadata (standard number, clause)
 * - Returns NO_MATCHING_SOURCE for unmatched queries (no hallucination)
 * - Correctly classifies confidence levels
 */

import { describe, it, expect } from 'vitest';
import {
  searchCorpus,
  findStandardForProduct,
  buildSourcedClaims,
} from '@/lib/rag/vectorStore';

describe('searchCorpus — Vector Search', () => {
  it('retrieves relevant chunks for a known query', () => {
    const results = searchCorpus('electric strength high voltage test');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].chunk.standardNumber).toContain('IS 302-2-15');
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('preserves source metadata (standard number, clause)', () => {
    const results = searchCorpus('marking requirements appliance');

    expect(results.length).toBeGreaterThan(0);
    const chunk = results[0].chunk;
    expect(chunk.standardNumber).toBeDefined();
    expect(chunk.clause).toBeDefined();
    expect(chunk.sectionTitle).toBeDefined();
    expect(chunk.content).toBeDefined();
  });

  it('returns empty array for completely unrelated queries', () => {
    const results = searchCorpus(
      'quantum computing blockchain cryptocurrency'
    );

    expect(results.length).toBe(0);
  });

  it('does not fabricate citations for unmatched queries', () => {
    const results = searchCorpus('alien spaceship landing protocol');

    expect(results.length).toBe(0);
    // Verify no fabricated data
    results.forEach(r => {
      expect(r.chunk.content).toBeDefined();
      expect(r.chunk.id).toBeDefined();
    });
  });
});

describe('findStandardForProduct', () => {
  it('finds matching standard for a known product category', () => {
    const standard = findStandardForProduct(
      'I want to manufacture electric kettles'
    );

    expect(standard).not.toBeNull();
    expect(standard!.standardNumber).toContain('IS 302-2-15');
    expect(standard!.productCategory).toBe('Domestic Electric Appliances');
  });

  it('returns null for unknown products', () => {
    const standard = findStandardForProduct(
      'antimatter propulsion systems'
    );

    expect(standard).toBeNull();
  });
});

describe('buildSourcedClaims — Trust Boundary', () => {
  it('returns NO_MATCHING_SOURCE claim when no results found', () => {
    const claims = buildSourcedClaims('unknown topic xyz', []);

    expect(claims.length).toBe(1);
    expect(claims[0].confidenceLevel).toBe('NO_MATCHING_SOURCE');
    expect(claims[0].sources).toHaveLength(0);
    expect(claims[0].content).toContain('No matching information');
    // Must NOT contain any fabricated standard numbers
    expect(claims[0].content).not.toMatch(/IS \d+/);
  });

  it('classifies high-score matches as VERIFIED_BIS_DATA', () => {
    const results = searchCorpus('electric strength high voltage test insulation');
    const claims = buildSourcedClaims('high voltage test', results);

    const verified = claims.filter(
      c => c.confidenceLevel === 'VERIFIED_BIS_DATA'
    );

    if (results.some(r => r.score > 0.5)) {
      expect(verified.length).toBeGreaterThan(0);
      verified.forEach(claim => {
        expect(claim.sources.length).toBeGreaterThan(0);
        expect(claim.sources[0].standardNumber).toBeDefined();
      });
    }
  });

  it('never produces "You are compliant" in any claim', () => {
    const results = searchCorpus('marking requirements');
    const claims = buildSourcedClaims('Am I compliant?', results);

    claims.forEach(claim => {
      expect(claim.content).not.toContain('You are compliant');
      expect(claim.content).not.toContain('You are non-compliant');
      expect(claim.content).not.toContain('You are certified');
    });
  });
});
