/**
 * BIS Compliance Assistant — Document Fetcher
 * 
 * Robust HTTP fetcher with domain allowlist enforcement,
 * rate limiting, timeout, retry, size limits, and content hashing.
 * 
 * SECURITY: Every URL is validated against the trusted source
 * allowlist before any network request is made.
 */

import { createHash } from 'crypto';
import { INGESTION_CONFIG } from '../ai/config';
import { validateDomain } from './sourceRegistry';
import type { FetchResult, TrustedSource } from './types';

// ─── Rate Limiter ───────────────────────────────────────

let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  const delay = INGESTION_CONFIG.requestDelayMs;
  if (elapsed < delay) {
    await new Promise(resolve => setTimeout(resolve, delay - elapsed));
  }
  lastRequestTime = Date.now();
}

// ─── Fetcher ────────────────────────────────────────────

export async function fetchDocument(
  url: string,
  trustedSources: Pick<TrustedSource, 'domain' | 'enabled' | 'sourceType' | 'allowedPaths'>[]
): Promise<FetchResult> {
  // 1. Validate domain against allowlist
  const validation = validateDomain(url, trustedSources);
  if (!validation.allowed) {
    throw new Error(`BLOCKED: ${validation.reason}`);
  }

  // 2. Rate limit
  await rateLimit();

  // 3. Fetch with timeout and retry
  const maxSizeBytes = INGESTION_CONFIG.maxDocumentSizeMb * 1024 * 1024;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= INGESTION_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        INGESTION_CONFIG.requestTimeoutMs
      );

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BIS-Compliance-Assistant/1.0 (Compliance Research Tool)',
          'Accept': 'text/html,application/pdf,application/xml,text/plain,application/json',
        },
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Verify final redirect URL is still on allowlist
      const finalUrl = response.url || url;
      if (finalUrl !== url) {
        const redirectValidation = validateDomain(finalUrl, trustedSources);
        if (!redirectValidation.allowed) {
          throw new Error(`BLOCKED: Redirect led to unapproved domain: ${finalUrl}`);
        }
      }

      // Check content length header
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      if (contentLength > maxSizeBytes) {
        throw new Error(`Document too large: ${contentLength} bytes (max: ${maxSizeBytes})`);
      }

      // Read response body
      const contentType = response.headers.get('content-type') || 'text/html';
      let rawContent: Buffer | string;

      if (contentType.includes('pdf') || contentType.includes('octet-stream')) {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > maxSizeBytes) {
          throw new Error(`Document too large: ${arrayBuffer.byteLength} bytes`);
        }
        rawContent = Buffer.from(arrayBuffer);
      } else {
        const text = await response.text();
        if (text.length > maxSizeBytes) {
          throw new Error(`Document too large: ${text.length} bytes`);
        }
        rawContent = text;
      }

      // Calculate content hash (SHA-256)
      const hash = createHash('sha256');
      hash.update(typeof rawContent === 'string' ? rawContent : rawContent);
      const contentHash = hash.digest('hex');

      const parsedUrl = new URL(finalUrl);

      return {
        url: finalUrl,
        domain: parsedUrl.hostname,
        httpStatus: response.status,
        contentType,
        retrievedAt: new Date().toISOString(),
        contentHash,
        rawContent,
        contentLength: typeof rawContent === 'string' ? rawContent.length : rawContent.length,
      };
    } catch (error: any) {
      lastError = error;

      // Don't retry on domain validation failures
      if (error.message?.startsWith('BLOCKED:')) {
        throw error;
      }

      // Exponential backoff for retries
      if (attempt < INGESTION_CONFIG.maxRetries) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.warn(`Fetch attempt ${attempt + 1} failed for ${url}: ${error.message}. Retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }

  throw new Error(`Failed to fetch ${url} after ${INGESTION_CONFIG.maxRetries + 1} attempts: ${lastError?.message}`);
}
