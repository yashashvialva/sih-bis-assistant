/**
 * BIS Compliance Assistant — Clause-Aware Chunker
 * 
 * Splits extracted documents into logical compliance units
 * (Standard → Section → Clause → Sub-clause) rather than
 * arbitrary fixed-size fragments.
 * 
 * Each chunk retains its full provenance metadata.
 */

import type { ExtractedClause, ExtractionResult } from './types';

export interface ChunkOutput {
  standardNumber?: string;
  clauseNumber?: string;
  sectionTitle?: string;
  pageNumber?: number;
  content: string;
  sourceUrl: string;
  metadata: Record<string, unknown>;
}

const MAX_CHUNK_LENGTH = 1500; // Max characters per chunk
const MIN_CHUNK_LENGTH = 50;   // Skip very short chunks

/**
 * Convert extraction results into indexable chunks.
 * Prefers clause-level boundaries when available.
 * Falls back to paragraph-level splitting for unstructured text.
 */
export function chunkDocument(
  extraction: ExtractionResult,
  sourceUrl: string,
  documentId: string
): ChunkOutput[] {
  const chunks: ChunkOutput[] = [];

  // If we have detected clauses, use them
  if (extraction.clauses.length > 0) {
    for (const clause of extraction.clauses) {
      if (clause.content.length < MIN_CHUNK_LENGTH) continue;

      // If a single clause is too long, split it further
      if (clause.content.length > MAX_CHUNK_LENGTH) {
        const subChunks = splitLongText(clause.content);
        for (let i = 0; i < subChunks.length; i++) {
          chunks.push({
            standardNumber: extraction.standardNumber,
            clauseNumber: clause.clauseNumber
              ? `${clause.clauseNumber} (part ${i + 1})`
              : undefined,
            sectionTitle: clause.sectionTitle,
            pageNumber: clause.pageNumber,
            content: subChunks[i],
            sourceUrl,
            metadata: {
              documentId,
              chunkIndex: chunks.length,
              isSubChunk: true,
              subChunkIndex: i,
            },
          });
        }
      } else {
        chunks.push({
          standardNumber: extraction.standardNumber,
          clauseNumber: clause.clauseNumber,
          sectionTitle: clause.sectionTitle,
          pageNumber: clause.pageNumber,
          content: clause.content,
          sourceUrl,
          metadata: {
            documentId,
            chunkIndex: chunks.length,
          },
        });
      }
    }
  }

  // Fallback: if no clauses were detected, split by paragraphs
  if (chunks.length === 0 && extraction.extractedText.length > MIN_CHUNK_LENGTH) {
    const paragraphs = extraction.extractedText.split(/\n{2,}/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (trimmed.length < 20) continue;

      if (currentChunk.length + trimmed.length > MAX_CHUNK_LENGTH) {
        if (currentChunk.length >= MIN_CHUNK_LENGTH) {
          chunks.push({
            standardNumber: extraction.standardNumber,
            content: currentChunk.trim(),
            sourceUrl,
            metadata: {
              documentId,
              chunkIndex: chunks.length,
              chunkingMethod: 'paragraph_fallback',
            },
          });
        }
        currentChunk = trimmed;
      } else {
        currentChunk += '\n\n' + trimmed;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.trim().length >= MIN_CHUNK_LENGTH) {
      chunks.push({
        standardNumber: extraction.standardNumber,
        content: currentChunk.trim(),
        sourceUrl,
        metadata: {
          documentId,
          chunkIndex: chunks.length,
          chunkingMethod: 'paragraph_fallback',
        },
      });
    }
  }

  return chunks;
}

/**
 * Split long text at sentence boundaries.
 */
function splitLongText(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const parts: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length > MAX_CHUNK_LENGTH && current.length > 0) {
      parts.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }

  if (current.trim().length > 0) {
    parts.push(current.trim());
  }

  return parts;
}
