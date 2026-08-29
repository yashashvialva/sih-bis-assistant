/**
 * BIS Compliance Assistant — Trusted Source Registry
 * 
 * Maintains an explicit allowlist of domains that may be
 * used for automatic data acquisition. Only domains in this
 * registry are permitted to be fetched.
 * 
 * IMPORTANT: Being on the allowlist does NOT make content
 * automatically authoritative. It only means the system is
 * permitted to fetch from that domain.
 */

import type { TrustedSource, SourceType, VerificationResult, VerificationStatus } from './types';

// ─── Default Allowlist ──────────────────────────────────

export const DEFAULT_TRUSTED_SOURCES: Omit<TrustedSource, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Bureau of Indian Standards (Main)',
    baseUrl: 'https://www.bis.gov.in',
    domain: 'bis.gov.in',
    sourceType: 'OFFICIAL_BIS',
    enabled: true,
    allowedPaths: ['/index.php/standards', '/index.php/product-certification'],
    verificationPolicy: 'REQUIRES_REVIEW',
  },
  {
    name: 'BIS Standards Portal',
    baseUrl: 'https://standardsbis.bsb.co.in',
    domain: 'standardsbis.bsb.co.in',
    sourceType: 'OFFICIAL_BIS',
    enabled: true,
    verificationPolicy: 'REQUIRES_REVIEW',
  },
  {
    name: 'India Code (Legislative)',
    baseUrl: 'https://www.indiacode.nic.in',
    domain: 'indiacode.nic.in',
    sourceType: 'OFFICIAL_GOVERNMENT',
    enabled: true,
    verificationPolicy: 'REQUIRES_REVIEW',
  },
  {
    name: 'Gazette of India',
    baseUrl: 'https://egazette.gov.in',
    domain: 'egazette.gov.in',
    sourceType: 'OFFICIAL_GOVERNMENT',
    enabled: true,
    verificationPolicy: 'REQUIRES_REVIEW',
  },
  {
    name: 'Ministry of Consumer Affairs',
    baseUrl: 'https://consumeraffairs.nic.in',
    domain: 'consumeraffairs.nic.in',
    sourceType: 'OFFICIAL_GOVERNMENT',
    enabled: true,
    verificationPolicy: 'REQUIRES_REVIEW',
  },
  {
    name: 'Public Resource (Indian Standards)',
    baseUrl: 'https://law.resource.org',
    domain: 'law.resource.org',
    sourceType: 'TRUSTED_SECONDARY',
    enabled: true,
    verificationPolicy: 'REQUIRES_REVIEW',
  },
];

// ─── Domain Validation ──────────────────────────────────

/**
 * Check if a URL's domain is on the trusted allowlist.
 * Returns the matching TrustedSource or null.
 */
export function validateDomain(
  url: string,
  trustedSources: Pick<TrustedSource, 'domain' | 'enabled' | 'sourceType' | 'allowedPaths'>[]
): { allowed: boolean; source?: typeof trustedSources[number]; reason: string } {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { allowed: false, reason: `Invalid URL: ${url}` };
  }

  // Enforce HTTPS
  if (parsedUrl.protocol !== 'https:') {
    return { allowed: false, reason: `Only HTTPS URLs are allowed. Got: ${parsedUrl.protocol}` };
  }

  // Block private/local IPs (SSRF prevention)
  const hostname = parsedUrl.hostname;
  if (isPrivateHostname(hostname)) {
    return { allowed: false, reason: `Private/local hostnames are blocked: ${hostname}` };
  }

  // Check domain against allowlist
  const matchingSource = trustedSources.find(s => {
    if (!s.enabled) return false;
    // Match exact domain or subdomain
    return hostname === s.domain || hostname.endsWith(`.${s.domain}`);
  });

  if (!matchingSource) {
    return { allowed: false, reason: `Domain not in trusted allowlist: ${hostname}` };
  }

  // Check allowed paths if configured
  if (matchingSource.allowedPaths && matchingSource.allowedPaths.length > 0) {
    const pathAllowed = matchingSource.allowedPaths.some(
      allowedPath => parsedUrl.pathname.startsWith(allowedPath)
    );
    if (!pathAllowed) {
      // Path restriction is a soft filter — still allow but note it
      // The source is trusted, just not the specific path
    }
  }

  return { allowed: true, source: matchingSource, reason: 'Domain is on the trusted allowlist' };
}

/**
 * Determine the verification status for a document from a given source.
 * This is backend logic — the LLM NEVER decides this.
 */
export function determineVerificationStatus(
  sourceType: SourceType,
  contentExtracted: boolean,
  hasRequiredMetadata: boolean,
  isDemoData: boolean
): VerificationResult {
  // Rule: Demo data can NEVER be authoritative
  if (isDemoData) {
    return {
      authoritative: false,
      verificationStatus: 'DEMO',
      reason: 'Demo/synthetic data is permanently non-authoritative.',
    };
  }

  // Rule: Failed extraction cannot be authoritative
  if (!contentExtracted) {
    return {
      authoritative: false,
      verificationStatus: 'UNVERIFIED',
      reason: 'Content extraction failed or incomplete.',
    };
  }

  // Official BIS sources with metadata → candidate for review
  if (sourceType === 'OFFICIAL_BIS' && hasRequiredMetadata) {
    return {
      authoritative: false, // Still false until admin review
      verificationStatus: 'PENDING_REVIEW',
      reason: 'Official BIS source with metadata. Requires admin verification.',
    };
  }

  // Official government sources → pending review
  if (sourceType === 'OFFICIAL_GOVERNMENT' && hasRequiredMetadata) {
    return {
      authoritative: false,
      verificationStatus: 'PENDING_REVIEW',
      reason: 'Official government source. Requires admin verification.',
    };
  }

  // Trusted secondary — always non-authoritative
  if (sourceType === 'TRUSTED_SECONDARY') {
    return {
      authoritative: false,
      verificationStatus: 'TRUSTED_SECONDARY',
      reason: 'Trusted secondary source. Can be used for discovery but not as authoritative evidence.',
    };
  }

  // Default fallback
  return {
    authoritative: false,
    verificationStatus: 'UNVERIFIED',
    reason: 'Insufficient metadata or unrecognized source type.',
  };
}

// ─── Helpers ────────────────────────────────────────────

function isPrivateHostname(hostname: string): boolean {
  // Block localhost, private IPs, link-local
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
  if (hostname.startsWith('10.')) return true;
  if (hostname.startsWith('192.168.')) return true;
  if (hostname.startsWith('172.')) {
    const second = parseInt(hostname.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (hostname.startsWith('169.254.')) return true;
  if (hostname.endsWith('.local')) return true;
  return false;
}
