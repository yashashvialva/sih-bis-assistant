/**
 * BIS Compliance Assistant — Content Extractor
 * 
 * Extracts meaningful text from HTML and PDF documents.
 * Strips navigation, scripts, styles, and other noise.
 * Detects standard numbers, titles, and clause structure.
 * 
 * SECURITY: All extracted content is treated as untrusted data.
 * Script tags, event handlers, and iframes are stripped.
 */

import * as cheerio from 'cheerio';
import type { ExtractionResult, ExtractedClause } from './types';

// ─── Standard Number Detection ──────────────────────────

const IS_STANDARD_REGEX = /\b(IS\s*[:/]?\s*\d{1,5}(?:\s*[-–]\s*\d{1,3}(?:\s*[-–]\s*\d{1,3})?)?(?:\s*:\s*\d{4})?)\b/gi;
const CLAUSE_REGEX = /^(?:Clause\s+)?(\d+(?:\.\d+)*)\s*[-–:.\s]\s*(.+)/i;
const SECTION_HEADING_REGEX = /^(?:(?:\d+(?:\.\d+)*)\s+)?([A-Z][A-Za-z\s,&—–-]{3,80})$/m;

// ─── HTML Extraction ────────────────────────────────────

export function extractFromHtml(html: string, sourceUrl: string): ExtractionResult {
  const $ = cheerio.load(html);

  // Security: Remove dangerous elements
  $('script, style, iframe, object, embed, form, input, noscript').remove();
  $('[onclick], [onload], [onerror], [onmouseover]').removeAttr('onclick onload onerror onmouseover');

  // Remove common noise elements
  $('nav, header, footer, .sidebar, .menu, .navigation, .breadcrumb, .cookie-notice, .advertisement').remove();

  // Extract title
  const title = $('title').text().trim() ||
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content')?.trim() ||
    undefined;

  // Extract main content
  const mainContent = $('main, article, .content, .main-content, #content, #main').first();
  const contentElement = mainContent.length ? mainContent : $('body');

  // Get text, preserving some structure
  const textBlocks: string[] = [];
  contentElement.find('p, li, td, th, h1, h2, h3, h4, h5, h6, div, blockquote, pre').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10) { // Skip very short fragments
      textBlocks.push(text);
    }
  });

  const extractedText = textBlocks.join('\n\n');

  // Detect standard numbers
  const standardMatches = extractedText.match(IS_STANDARD_REGEX);
  const standardNumber = standardMatches?.[0]?.replace(/\s+/g, ' ').trim();

  // Extract clause structure
  const clauses = extractClauses(textBlocks);

  return {
    title,
    standardNumber,
    extractedText,
    clauses,
    metadata: {
      sourceUrl,
      extractionMethod: 'html',
      textBlockCount: textBlocks.length,
    },
  };
}

// ─── PDF Extraction ─────────────────────────────────────

export async function extractFromPdf(pdfBuffer: Buffer, sourceUrl: string): Promise<ExtractionResult> {
  try {
    const pdfParse = (await import('pdf-parse')) as any;
    const parse = pdfParse.default || pdfParse;
    const data = await parse(pdfBuffer);

    const extractedText = data.text || '';
    const pageCount = data.numpages || undefined;

    // Detect if this is a scanned/image-only PDF
    if (extractedText.trim().length < 50 && pageCount && pageCount > 0) {
      return {
        title: undefined,
        standardNumber: undefined,
        extractedText: '',
        pageCount,
        clauses: [],
        metadata: {
          sourceUrl,
          extractionMethod: 'pdf',
          extractionFailed: true,
          failureReason: 'PDF appears to be image-only (scanned). OCR not available.',
          pageCount,
        },
      };
    }

    // Detect standard numbers
    const standardMatches = extractedText.match(IS_STANDARD_REGEX);
    const standardNumber = standardMatches?.[0]?.replace(/\s+/g, ' ').trim();

    // Try to detect title (usually first meaningful line)
    const lines = extractedText.split('\n').filter((l: string) => l.trim().length > 5);
    const title = lines[0]?.trim()?.slice(0, 200);

    // Extract clause structure from the text
    const textBlocks = extractedText.split(/\n{2,}/);
    const clauses = extractClauses(textBlocks);

    return {
      title,
      standardNumber,
      extractedText,
      pageCount,
      clauses,
      metadata: {
        sourceUrl,
        extractionMethod: 'pdf',
        pageCount,
        pdfInfo: data.info || {},
      },
    };
  } catch (error: any) {
    return {
      title: undefined,
      standardNumber: undefined,
      extractedText: '',
      clauses: [],
      metadata: {
        sourceUrl,
        extractionMethod: 'pdf',
        extractionFailed: true,
        failureReason: `PDF parsing failed: ${error.message}`,
      },
    };
  }
}

// ─── Plain Text Extraction ──────────────────────────────

export function extractFromText(text: string, sourceUrl: string): ExtractionResult {
  const standardMatches = text.match(IS_STANDARD_REGEX);
  const standardNumber = standardMatches?.[0]?.replace(/\s+/g, ' ').trim();

  const lines = text.split('\n').filter(l => l.trim().length > 5);
  const title = lines[0]?.trim()?.slice(0, 200);

  const textBlocks = text.split(/\n{2,}/);
  const clauses = extractClauses(textBlocks);

  return {
    title,
    standardNumber,
    extractedText: text,
    clauses,
    metadata: {
      sourceUrl,
      extractionMethod: 'text',
    },
  };
}

// ─── Auto-detect and Extract ────────────────────────────

export async function extractContent(
  rawContent: Buffer | string,
  contentType: string,
  sourceUrl: string
): Promise<ExtractionResult> {
  if (contentType.includes('pdf')) {
    const buffer = typeof rawContent === 'string' ? Buffer.from(rawContent) : rawContent;
    return extractFromPdf(buffer, sourceUrl);
  }

  if (contentType.includes('html')) {
    const text = typeof rawContent === 'string' ? rawContent : rawContent.toString('utf-8');
    return extractFromHtml(text, sourceUrl);
  }

  // Plain text, XML, JSON — treat as text
  const text = typeof rawContent === 'string' ? rawContent : rawContent.toString('utf-8');
  return extractFromText(text, sourceUrl);
}

// ─── Clause Extraction Helper ───────────────────────────

function extractClauses(textBlocks: string[]): ExtractedClause[] {
  const clauses: ExtractedClause[] = [];

  let currentSection: string | undefined;

  for (const block of textBlocks) {
    const trimmed = block.trim();
    if (!trimmed || trimmed.length < 15) continue;

    // Check if this block is a clause heading
    const clauseMatch = trimmed.match(CLAUSE_REGEX);
    if (clauseMatch) {
      clauses.push({
        clauseNumber: `Clause ${clauseMatch[1]}`,
        sectionTitle: clauseMatch[2].trim(),
        content: trimmed,
      });
      currentSection = clauseMatch[2].trim();
      continue;
    }

    // Check for section headings
    const sectionMatch = trimmed.match(SECTION_HEADING_REGEX);
    if (sectionMatch && trimmed.length < 100) {
      currentSection = sectionMatch[1]?.trim() || trimmed;
      continue;
    }

    // Regular content block — attach to current section if we have one
    if (trimmed.length > 30) {
      clauses.push({
        sectionTitle: currentSection,
        content: trimmed,
      });
    }
  }

  return clauses;
}
