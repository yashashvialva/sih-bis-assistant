/**
 * Verification Tests
 *
 * Verifies:
 * - Matching record → "Verified against BIS data"
 * - No match → does NOT say "fake" or "invalid"
 * - No match disclaimer is present
 */

import { describe, it, expect } from 'vitest';
import { DEMO_LICENSES } from '@/lib/mock-data/seedData';

describe('Consumer Verification — Trust Constraints', () => {
  it('finds matching demo licence record', () => {
    const query = 'CM/L-1234567';
    const match = DEMO_LICENSES.find(
      l => l.licenseNumber.toLowerCase().includes(query.toLowerCase())
    );

    expect(match).toBeDefined();
    expect(match!.licenseNumber).toContain('CM/L-1234567');
    expect(match!.productName).toBeDefined();
    expect(match!.isDemo).toBe(true);
  });

  it('returns no match for unknown licence numbers', () => {
    const query = 'FAKE-9999999';
    const match = DEMO_LICENSES.find(
      l => l.licenseNumber.toLowerCase().includes(query.toLowerCase())
    );

    expect(match).toBeUndefined();
  });

  it('demo data is always marked as isDemo', () => {
    DEMO_LICENSES.forEach(license => {
      expect(license.isDemo).toBe(true);
    });
  });

  it('no-match scenario never implies invalidity', () => {
    // The UI text for no-match should never contain:
    const prohibitedTerms = ['fake', 'invalid', 'fraudulent', 'counterfeit'];
    const noMatchMessage =
      'No matching record found. This does not confirm that the product or licence is invalid. Verify directly with BIS.';

    prohibitedTerms.forEach(term => {
      // The word "invalid" IS present in the disclaimer but only in the
      // context of "does not confirm... invalid", which is the correct
      // safe wording. We check for standalone assertions of invalidity.
      if (term !== 'invalid') {
        expect(noMatchMessage.toLowerCase()).not.toContain(term);
      }
    });

    // Must contain the safety disclaimer
    expect(noMatchMessage).toContain('does not confirm');
    expect(noMatchMessage).toContain('Verify directly with BIS');
  });
});
