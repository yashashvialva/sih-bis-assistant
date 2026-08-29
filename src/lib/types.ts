// BIS Compliance Assistant — Trust Layer Types
// These types enforce the architectural constraint that every AI-generated
// claim must be categorized into one of three trust states.

/**
 * The three trust states for any AI-generated compliance claim.
 * This is the core architectural layer — NOT visual decoration.
 */
export type ConfidenceLevel =
  | 'VERIFIED_BIS_DATA'
  | 'AI_INTERPRETATION'
  | 'NO_MATCHING_SOURCE';

/**
 * A source reference linking a claim back to an authoritative BIS document.
 */
export interface SourceReference {
  standardNumber: string;       // e.g., "IS 302-2-15:2009"
  clause?: string;              // e.g., "Clause 7.1"
  sectionTitle?: string;        // e.g., "Marking and Instructions"
  documentTitle?: string;       // e.g., "Safety of Household Electrical Appliances"
  evidenceText?: string;        // The exact retrieved text snippet
  chunkId?: string;             // Reference to bis_chunks.id
}

/**
 * A sourced claim combines the AI output with its trust classification
 * and any supporting evidence from the BIS corpus.
 */
export interface SourcedClaimData {
  id: string;
  content: string;              // The claim/statement text
  confidenceLevel: ConfidenceLevel;
  sources: SourceReference[];   // Empty for NO_MATCHING_SOURCE
  reasoning?: string;           // AI's reasoning (for AI_INTERPRETATION)
}

/**
 * Structured response from the RAG pipeline.
 * Each response can contain multiple claims with different confidence levels.
 */
export interface RAGResponse {
  query: string;
  claims: SourcedClaimData[];
  overallConfidence: ConfidenceLevel;
  timestamp: string;
}

// ─── Workspace Types ───────────────────────────────────

export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type StepType =
  | 'STANDARD_IDENTIFICATION'
  | 'CERTIFICATION_REQUIREMENT'
  | 'TESTING'
  | 'DOCUMENTATION'
  | 'LAB_SELECTION'
  | 'APPLICATION'
  | 'FINAL_REVIEW';

export interface Product {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  standardId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Roadmap {
  id: string;
  productId: string;
  standardId?: string;
  status: string;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapStep {
  id: string;
  roadmapId: string;
  orderIndex: number;
  stepType: StepType;
  title: string;
  description: string;
  sourceChunkId?: string;
  sourceClause?: string;
  confidenceLevel: ConfidenceLevel;
  status: StepStatus;
  createdAt: string;
}

export interface BISStandard {
  id: string;
  standardNumber: string;
  title: string;
  productCategory: string;
  status: string;
  createdAt: string;
}

export interface BISChunk {
  id: string;
  standardId: string;
  standardNumber: string;
  clause?: string;
  sectionTitle?: string;
  content: string;
  metadata?: Record<string, unknown>;
  authoritative?: boolean;
  sourceType?: string;
  verificationStatus?: string;
  embedding?: number[];
  createdAt: string;
}

export interface UploadedDocument {
  id: string;
  userId: string;
  productId: string;
  filename: string;
  fileType: string;
  storagePath: string;
  extractedText?: string;
  createdAt: string;
}

export interface ComplianceEvidence {
  id: string;
  documentId: string;
  roadmapStepId: string;
  sourceClause?: string;
  requirementSummary: string;
  extractedEvidence?: string;
  assessment: 'LIKELY_ADDRESSED' | 'POTENTIALLY_INCOMPLETE' | 'NO_MATCHING_EVIDENCE';
  confidenceTag: ConfidenceLevel;
  notes?: string;
  createdAt: string;
}

// ─── Amendment Types (Tier 3 — Mock) ──────────────────

export interface SimulatedAmendment {
  id: string;
  standardNumber: string;
  title: string;
  impactSummary: string;
  affectedClause?: string;
  severity: 'REVIEW_RECOMMENDED' | 'POTENTIAL_IMPACT' | 'INFORMATION_ONLY';
  publishedDate: string;
}

// ─── Lab Types (Tier 3 — Static) ──────────────────────

export interface Laboratory {
  id: string;
  name: string;
  location: string;
  city: string;
  state: string;
  productCategories: string[];
  testingCapabilities: string[];
  isDemo: boolean;  // Always true — demo data marker
}

// ─── Verification Types (Tier 3) ──────────────────────

export interface LicenseRecord {
  licenseNumber: string;
  productName: string;
  manufacturer: string;
  standardNumber: string;
  validUntil: string;
  isDemo: boolean;  // Always true — demo data marker
}
