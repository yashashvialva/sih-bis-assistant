/**
 * BIS Compliance Assistant — Source Discovery
 * 
 * Discovers potentially relevant BIS/government source URLs
 * from configured trusted sources. Uses sitemaps, known
 * listing pages, and structured queries.
 * 
 * IMPORTANT: Does NOT crawl the entire internet.
 * Only discovers URLs from domains in the trusted allowlist.
 */

import * as cheerio from 'cheerio';
import { INGESTION_CONFIG } from '../ai/config';
import type { TrustedSource, IngestionInput } from './types';

export interface DiscoveredUrl {
  url: string;
  domain: string;
  sourceType: TrustedSource['sourceType'];
  discoveryMethod: string;
  title?: string;
  standardNumber?: string;
}

/**
 * Discover relevant URLs from trusted sources based on input query.
 */
export async function discoverSources(
  input: IngestionInput,
  trustedSources: TrustedSource[]
): Promise<DiscoveredUrl[]> {
  const discovered: DiscoveredUrl[] = [];
  const enabledSources = trustedSources.filter(s => s.enabled);

  // If specific URLs are provided, validate and use them directly
  if (input.urls && input.urls.length > 0) {
    for (const url of input.urls) {
      try {
        const parsed = new URL(url);
        const matchingSource = enabledSources.find(
          s => parsed.hostname === s.domain || parsed.hostname.endsWith(`.${s.domain}`)
        );
        if (matchingSource) {
          discovered.push({
            url,
            domain: parsed.hostname,
            sourceType: matchingSource.sourceType,
            discoveryMethod: 'direct_url',
          });
        }
      } catch {
        // Skip invalid URLs
      }
    }
    return discovered;
  }

  // For each enabled source, try discovery methods
  for (const source of enabledSources) {
    try {
      // Method 1: Construct BIS search URLs
      if (source.domain === 'bis.gov.in' || source.domain.includes('bis')) {
        const bisUrls = constructBisSearchUrls(input, source);
        discovered.push(...bisUrls);
      }

      // Method 2: Construct standard-specific URLs
      if (input.standardNumber) {
        const standardUrls = constructStandardUrls(input.standardNumber, source);
        discovered.push(...standardUrls);
      }

      // Method 3: Try sitemap discovery
      const sitemapUrls = await discoverFromSitemap(source, input);
      discovered.push(...sitemapUrls);

    } catch (error) {
      console.warn(`Discovery failed for source ${source.name}: ${error}`);
      // Continue with other sources — don't let one failure stop discovery
    }
  }

  // Deduplicate by URL
  const uniqueUrls = new Map<string, DiscoveredUrl>();
  for (const item of discovered) {
    if (!uniqueUrls.has(item.url)) {
      uniqueUrls.set(item.url, item);
    }
  }

  return Array.from(uniqueUrls.values());
}

// ─── BIS-specific URL Construction ──────────────────────

function constructBisSearchUrls(input: IngestionInput, source: TrustedSource): DiscoveredUrl[] {
  const urls: DiscoveredUrl[] = [];

  if (input.standardNumber) {
    // Direct standard lookup patterns
    const stdNum = input.standardNumber.replace(/\s+/g, '').replace('IS', '').trim();
    urls.push({
      url: `${source.baseUrl}/index.php/standards/catalog/view/${stdNum}`,
      domain: source.domain,
      sourceType: source.sourceType,
      discoveryMethod: 'bis_catalog_pattern',
      standardNumber: input.standardNumber,
    });
  }

  if (input.productCategory) {
    urls.push({
      url: `${source.baseUrl}/index.php/product-certification/products-under-compulsory-certification`,
      domain: source.domain,
      sourceType: source.sourceType,
      discoveryMethod: 'bis_product_listing',
    });
  }

  return urls;
}

function constructStandardUrls(standardNumber: string, source: TrustedSource): DiscoveredUrl[] {
  const urls: DiscoveredUrl[] = [];

  // For government gazette — notifications related to standards
  if (source.domain.includes('egazette') || source.domain.includes('indiacode')) {
    urls.push({
      url: `${source.baseUrl}/ViewSearch?searchdata=${encodeURIComponent(standardNumber)}`,
      domain: source.domain,
      sourceType: source.sourceType,
      discoveryMethod: 'gazette_search',
      standardNumber,
    });
  }

  return urls;
}

// ─── Sitemap Discovery ──────────────────────────────────

async function discoverFromSitemap(
  source: TrustedSource,
  input: IngestionInput
): Promise<DiscoveredUrl[]> {
  const discovered: DiscoveredUrl[] = [];

  try {
    const sitemapUrl = `${source.baseUrl}/sitemap.xml`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(sitemapUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'BIS-Compliance-Assistant/1.0' },
    });
    clearTimeout(timeout);

    if (!response.ok) return discovered;

    const xml = await response.text();
    const $ = cheerio.load(xml, { xml: true });

    // Extract URLs from sitemap
    $('url > loc').each((_, el) => {
      const loc = $(el).text().trim();
      if (!loc) return;

      // Filter by relevance if we have a query
      const isRelevant = isUrlRelevant(loc, input);
      if (isRelevant) {
        discovered.push({
          url: loc,
          domain: source.domain,
          sourceType: source.sourceType,
          discoveryMethod: 'sitemap',
        });
      }
    });
  } catch {
    // Sitemap not available — not an error, just skip
  }

  return discovered;
}

// ─── Relevance Filter ───────────────────────────────────

function isUrlRelevant(url: string, input: IngestionInput): boolean {
  const urlLower = url.toLowerCase();

  // Always include standard-related pages
  if (urlLower.includes('standard') || urlLower.includes('certification') || urlLower.includes('specification')) {
    return true;
  }

  // Check against specific standard number
  if (input.standardNumber) {
    const stdNum = input.standardNumber.replace(/\s+/g, '').toLowerCase();
    if (urlLower.includes(stdNum)) return true;
  }

  // Check against product category
  if (input.productCategory) {
    const category = input.productCategory.toLowerCase().replace(/\s+/g, '-');
    if (urlLower.includes(category)) return true;
  }

  // Check against query keywords
  if (input.query) {
    const keywords = input.query.toLowerCase().split(/\s+/).filter(k => k.length > 3);
    const matchCount = keywords.filter(k => urlLower.includes(k)).length;
    if (matchCount >= 2) return true;
  }

  return false;
}
