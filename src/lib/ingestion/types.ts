/**
 * BIS Compliance Assistant — Ingestion Pipeline Types
 * 
 * Types for the automatic source discovery, fetching,
 * parsing, verification, and indexing subsystem.
 */

// ─── Verification Status ─────────────────────────────────

export type VerificationStatus =
  | 'PENDING_REVIEW'
  | 'AUTHORITATIVE'
  | 'TRUSTED_SECONDARY'
  | 'UNVERIFIED'
  | 'DEMO'
  | 'REJECTED';

export type SourceType = 'OFFICIAL_BIS' | 'OFFICIAL_GOVERNMENT' | 'TRUSTED_SECONDARY';

// ─── Trusted Source Registry ─────────────────────────────

export interface TrustedSource {
  id: string;
  name: string;
  baseUrl: string;
  domain: string;
  sourceType: SourceType;
  enabled: boolean;
  allowedPaths?: string[];
  verificationPolicy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Source Documents ────────────────────────────────────

export interface SourceDocument {
  id: string;
  sourceId: string;
  sourceUrl: string;
  sourceDomain: string;
  title?: string;
  standardNumber?: string;
  documentType?: string;
  verificationStatus: VerificationStatus;
  authoritative: boolean;
  discoveredBy: string;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Source Document Versions ────────────────────────────

export interface SourceDocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  contentHash: string;
  rawContent?: string;
  extractedText?: string;
  pageCount?: number;
  retrievedAt: string;
  isCurrent: boolean;
  metadata: Record<string, unknown>;
}

// ─── Ingestion Jobs ─────────────────────────────────────

export type IngestionJobStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type IngestionTrigger = 'MANUAL' | 'SCHEDULED' | 'ADMIN';

export interface IngestionJob {
  id: string;
  status: IngestionJobStatus;
  triggerType: IngestionTrigger;
  startedAt: string;
  completedAt?: string;
  sourcesDiscovered: number;
  sourcesFetched: number;
  sourcesRejected: number;
  documentsCreated: number;
  documentsUpdated: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  errors: number;
  log: IngestionLogEntry[];
}

export interface IngestionLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  url?: string;
  error?: string;
}

// ─── Ingestion Events ───────────────────────────────────

export type IngestionEventType =
  | 'DOCUMENT_DISCOVERED'
  | 'DOCUMENT_FETCHED'
  | 'DOCUMENT_CHANGED'
  | 'DOCUMENT_VERIFIED'
  | 'DOCUMENT_REJECTED'
  | 'CHUNK_CREATED'
  | 'EMBEDDING_GENERATED'
  | 'FETCH_FAILED'
  | 'EXTRACTION_FAILED';

export interface IngestionEvent {
  id: string;
  eventType: IngestionEventType;
  documentId?: string;
  standardNumber?: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── Source Verification Result ──────────────────────────

export interface VerificationResult {
  authoritative: boolean;
  verificationStatus: VerificationStatus;
  reason: string;
}

// ─── Fetcher Types ──────────────────────────────────────

export interface FetchResult {
  url: string;
  domain: string;
  httpStatus: number;
  contentType: string;
  retrievedAt: string;
  contentHash: string;
  rawContent: Buffer | string;
  contentLength: number;
}

// ─── Extractor Types ────────────────────────────────────

export interface ExtractionResult {
  title?: string;
  standardNumber?: string;
  extractedText: string;
  pageCount?: number;
  clauses: ExtractedClause[];
  metadata: Record<string, unknown>;
}

export interface ExtractedClause {
  clauseNumber?: string;
  sectionTitle?: string;
  content: string;
  pageNumber?: number;
}

// ─── Pipeline Types ─────────────────────────────────────

export interface IngestionInput {
  query?: string;
  standardNumber?: string;
  productCategory?: string;
  urls?: string[];
}

export interface IngestionProgress {
  jobId: string;
  phase: string;
  current: number;
  total: number;
  message: string;
}
