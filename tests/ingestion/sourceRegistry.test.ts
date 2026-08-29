import { describe, it, expect } from 'vitest';
import { validateDomain, determineVerificationStatus } from '../../src/lib/ingestion/sourceRegistry';
import type { TrustedSource } from '../../src/lib/ingestion/types';

describe('Source Registry - Domain Validation', () => {
  const mockSources: TrustedSource[] = [
    {
      id: '1',
      name: 'BIS',
      baseUrl: 'https://bis.gov.in',
      domain: 'bis.gov.in',
      sourceType: 'OFFICIAL_BIS',
      enabled: true,
      verificationPolicy: 'REQUIRES_REVIEW',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '2',
      name: 'Disabled Source',
      baseUrl: 'https://disabled.com',
      domain: 'disabled.com',
      sourceType: 'TRUSTED_SECONDARY',
      enabled: false,
      verificationPolicy: 'REQUIRES_REVIEW',
      createdAt: '',
      updatedAt: '',
    }
  ];

  it('allows exact domain match via HTTPS', () => {
    const result = validateDomain('https://bis.gov.in/some/path', mockSources);
    expect(result.allowed).toBe(true);
    expect(result.source?.domain).toBe('bis.gov.in');
  });

  it('allows subdomain match', () => {
    const result = validateDomain('https://www.bis.gov.in/path', mockSources);
    expect(result.allowed).toBe(true);
  });

  it('rejects HTTP URLs', () => {
    const result = validateDomain('http://bis.gov.in', mockSources);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Only HTTPS');
  });

  it('rejects unlisted domains', () => {
    const result = validateDomain('https://random.com', mockSources);
    expect(result.allowed).toBe(false);
  });

  it('rejects disabled sources', () => {
    const result = validateDomain('https://disabled.com', mockSources);
    expect(result.allowed).toBe(false);
  });

  it('rejects private IPs (SSRF prevention)', () => {
    const result = validateDomain('https://127.0.0.1', mockSources);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Private/local hostnames');
  });
});

describe('Source Registry - Verification Status', () => {
  it('marks demo data as DEMO permanently', () => {
    const result = determineVerificationStatus('OFFICIAL_BIS', true, true, true);
    expect(result.verificationStatus).toBe('DEMO');
    expect(result.authoritative).toBe(false);
  });

  it('marks failed extraction as UNVERIFIED', () => {
    const result = determineVerificationStatus('OFFICIAL_BIS', false, true, false);
    expect(result.verificationStatus).toBe('UNVERIFIED');
  });

  it('marks official sources as PENDING_REVIEW', () => {
    const result = determineVerificationStatus('OFFICIAL_BIS', true, true, false);
    expect(result.verificationStatus).toBe('PENDING_REVIEW');
    expect(result.authoritative).toBe(false); // Wait for admin
  });

  it('marks secondary sources as TRUSTED_SECONDARY', () => {
    const result = determineVerificationStatus('TRUSTED_SECONDARY', true, true, false);
    expect(result.verificationStatus).toBe('TRUSTED_SECONDARY');
    expect(result.authoritative).toBe(false);
  });
});
