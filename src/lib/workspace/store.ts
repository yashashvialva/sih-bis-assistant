/**
 * BIS Compliance Assistant — Local Workspace Store
 * 
 * In-memory persistence layer for products, roadmaps, and progress.
 * Operates entirely client-side when Supabase is not configured.
 * Uses localStorage for persistence across page reloads.
 */

import type {
  Product,
  Roadmap,
  RoadmapStep,
  StepStatus,
  ConfidenceLevel,
} from '@/lib/types';
import { DEMO_CHUNKS, DEMO_STANDARDS } from '@/lib/mock-data/seedData';

const STORAGE_KEY = 'bis-workspace';

interface WorkspaceState {
  products: Product[];
  roadmaps: Roadmap[];
  roadmapSteps: RoadmapStep[];
}

function getInitialState(): WorkspaceState {
  if (typeof window === 'undefined') {
    return { products: [], roadmaps: [], roadmapSteps: [] };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as WorkspaceState;
  } catch {
    // Ignore parse errors
  }
  return { products: [], roadmaps: [], roadmapSteps: [] };
}

function saveState(state: WorkspaceState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

let state = getInitialState();

// ─── Products ────────────────────────────────────────────────

export function getProducts(): Product[] {
  state = getInitialState();
  return state.products;
}

export function getProduct(id: string): Product | undefined {
  state = getInitialState();
  return state.products.find(p => p.id === id);
}

export function createProduct(data: {
  name: string;
  description: string;
  category: string;
}): Product {
  state = getInitialState();
  const product: Product = {
    id: `prod-${Date.now()}`,
    userId: 'local-user',
    name: data.name,
    description: data.description,
    category: data.category,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.products.push(product);
  saveState(state);
  return product;
}

export function deleteProduct(id: string): void {
  state = getInitialState();
  state.products = state.products.filter(p => p.id !== id);
  state.roadmapSteps = state.roadmapSteps.filter(
    s => !state.roadmaps.some(r => r.productId === id && r.id === s.roadmapId)
  );
  state.roadmaps = state.roadmaps.filter(r => r.productId !== id);
  saveState(state);
}

// ─── Roadmaps ────────────────────────────────────────────────

export function getRoadmap(productId: string): Roadmap | undefined {
  state = getInitialState();
  return state.roadmaps.find(r => r.productId === productId);
}

export function getRoadmapSteps(roadmapId: string): RoadmapStep[] {
  state = getInitialState();
  return state.roadmapSteps
    .filter(s => s.roadmapId === roadmapId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export function generateRoadmap(productId: string): {
  roadmap: Roadmap;
  steps: RoadmapStep[];
} {
  state = getInitialState();
  
  const product = state.products.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  // Remove existing roadmap if any
  const existingRoadmap = state.roadmaps.find(r => r.productId === productId);
  if (existingRoadmap) {
    state.roadmapSteps = state.roadmapSteps.filter(
      s => s.roadmapId !== existingRoadmap.id
    );
    state.roadmaps = state.roadmaps.filter(r => r.id !== existingRoadmap.id);
  }

  // Find matching standard from demo data
  const matchedStandard = DEMO_STANDARDS.find(
    s => s.productCategory.toLowerCase() === product.category.toLowerCase()
  );

  const roadmapId = `roadmap-${Date.now()}`;
  const roadmap: Roadmap = {
    id: roadmapId,
    productId,
    standardId: matchedStandard?.id,
    status: 'IN_PROGRESS',
    completionPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Get relevant chunks for this category
  const relevantChunks = matchedStandard
    ? DEMO_CHUNKS.filter(c => c.standardId === matchedStandard.id)
    : [];

  const steps: RoadmapStep[] = [];

  // Step 1: Standard Identification
  steps.push({
    id: `step-${Date.now()}-1`,
    roadmapId,
    orderIndex: 1,
    stepType: 'STANDARD_IDENTIFICATION',
    title: 'Identify Applicable Standard',
    description: matchedStandard
      ? `The applicable standard for ${product.category} is ${matchedStandard.standardNumber}: ${matchedStandard.title}`
      : `No matching standard found in the curated corpus for ${product.category}. Please consult the BIS website or contact BIS CARE.`,
    sourceChunkId: undefined,
    sourceClause: undefined,
    confidenceLevel: matchedStandard
      ? ('VERIFIED_BIS_DATA' as ConfidenceLevel)
      : ('NO_MATCHING_SOURCE' as ConfidenceLevel),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  // Step 2: Certification Requirement
  const certChunk = relevantChunks.find(
    c => (c.metadata as Record<string, unknown>).requirementType === 'Certification'
  );
  steps.push({
    id: `step-${Date.now()}-2`,
    roadmapId,
    orderIndex: 2,
    stepType: 'CERTIFICATION_REQUIREMENT',
    title: 'Check Certification Requirements',
    description: certChunk
      ? certChunk.content
      : 'Certification scheme details are not yet available in the curated corpus. Check with BIS for the applicable certification scheme.',
    sourceChunkId: certChunk?.id,
    sourceClause: certChunk?.clause,
    confidenceLevel: certChunk
      ? ('VERIFIED_BIS_DATA' as ConfidenceLevel)
      : ('NO_MATCHING_SOURCE' as ConfidenceLevel),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  // Step 3–N: Testing Requirements
  const testChunks = relevantChunks.filter(
    c => (c.metadata as Record<string, unknown>).requirementType === 'Testing'
  );
  testChunks.forEach((chunk, idx) => {
    steps.push({
      id: `step-${Date.now()}-test-${idx}`,
      roadmapId,
      orderIndex: 3 + idx,
      stepType: 'TESTING',
      title: `Testing: ${chunk.sectionTitle ?? 'Required Test'}`,
      description: chunk.content,
      sourceChunkId: chunk.id,
      sourceClause: chunk.clause,
      confidenceLevel: 'VERIFIED_BIS_DATA' as ConfidenceLevel,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });
  });

  // Documentation step
  const docChunk = relevantChunks.find(
    c => (c.metadata as Record<string, unknown>).requirementType === 'Documentation'
  );
  const docIdx = steps.length + 1;
  steps.push({
    id: `step-${Date.now()}-doc`,
    roadmapId,
    orderIndex: docIdx,
    stepType: 'DOCUMENTATION',
    title: 'Prepare Required Documents',
    description: docChunk
      ? docChunk.content
      : 'Required documentation details are not yet available in the curated corpus.',
    sourceChunkId: docChunk?.id,
    sourceClause: docChunk?.clause,
    confidenceLevel: docChunk
      ? ('VERIFIED_BIS_DATA' as ConfidenceLevel)
      : ('NO_MATCHING_SOURCE' as ConfidenceLevel),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  // Lab Selection step (AI interpretation — mapped, not direct source)
  steps.push({
    id: `step-${Date.now()}-lab`,
    roadmapId,
    orderIndex: docIdx + 1,
    stepType: 'LAB_SELECTION',
    title: 'Select BIS-recognized Testing Laboratory',
    description: `Select a BIS-recognized laboratory capable of conducting the required tests for ${product.category}. Check the BIS website for the current list of recognized laboratories.`,
    sourceChunkId: undefined,
    sourceClause: undefined,
    confidenceLevel: 'AI_INTERPRETATION' as ConfidenceLevel,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  // Application step
  steps.push({
    id: `step-${Date.now()}-app`,
    roadmapId,
    orderIndex: docIdx + 2,
    stepType: 'APPLICATION',
    title: 'Submit BIS Application',
    description: 'Submit the BIS certification application through the BIS portal with all required documents, test reports, and fees. The application process may vary by certification scheme.',
    sourceChunkId: undefined,
    sourceClause: undefined,
    confidenceLevel: 'AI_INTERPRETATION' as ConfidenceLevel,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  // Final Review step
  steps.push({
    id: `step-${Date.now()}-review`,
    roadmapId,
    orderIndex: docIdx + 3,
    stepType: 'FINAL_REVIEW',
    title: 'Final Review & Grant of Licence',
    description: 'After successful factory inspection and evaluation of test reports by BIS, the licence/certificate will be granted. This step is completed by BIS, not by this application.',
    sourceChunkId: undefined,
    sourceClause: undefined,
    confidenceLevel: 'AI_INTERPRETATION' as ConfidenceLevel,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  state.roadmaps.push(roadmap);
  state.roadmapSteps.push(...steps);
  saveState(state);

  return { roadmap, steps };
}

// ─── Step Status Updates ─────────────────────────────────────

export function saveRoadmapFromApi(productId: string, stepsFromApi: RoadmapStep[]): { roadmap: Roadmap; steps: RoadmapStep[] } {
  state = getInitialState();
  
  const product = state.products.find(p => p.id === productId);
  if (!product) throw new Error('Product not found');

  // Remove existing roadmap if any
  const existingRoadmap = state.roadmaps.find(r => r.productId === productId);
  if (existingRoadmap) {
    state.roadmapSteps = state.roadmapSteps.filter(
      s => s.roadmapId !== existingRoadmap.id
    );
    state.roadmaps = state.roadmaps.filter(r => r.id !== existingRoadmap.id);
  }

  const roadmapId = `roadmap-${Date.now()}`;
  const roadmap: Roadmap = {
    id: roadmapId,
    productId,
    standardId: undefined, // Will be set by API logic if possible, but optional
    status: 'IN_PROGRESS',
    completionPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const steps = stepsFromApi.map(s => ({
    ...s,
    roadmapId, // Override roadmapId from API with our local one
  }));

  state.roadmaps.push(roadmap);
  state.roadmapSteps.push(...steps);
  saveState(state);

  return { roadmap, steps };
}

export function updateStepStatus(
  stepId: string,
  newStatus: StepStatus
): void {
  state = getInitialState();
  const step = state.roadmapSteps.find(s => s.id === stepId);
  if (!step) return;

  step.status = newStatus;

  // Recalculate completion percentage
  const roadmap = state.roadmaps.find(r => r.id === step.roadmapId);
  if (roadmap) {
    const roadmapSteps = state.roadmapSteps.filter(
      s => s.roadmapId === roadmap.id
    );
    const completed = roadmapSteps.filter(s => s.status === 'COMPLETED').length;
    roadmap.completionPercentage = Math.round(
      (completed / roadmapSteps.length) * 100
    );
    roadmap.updatedAt = new Date().toISOString();
  }

  saveState(state);
}

/**
 * Calculate completion percentage for a roadmap.
 */
export function calculateCompletion(roadmapId: string): number {
  state = getInitialState();
  const steps = state.roadmapSteps.filter(s => s.roadmapId === roadmapId);
  if (steps.length === 0) return 0;
  const completed = steps.filter(s => s.status === 'COMPLETED').length;
  return Math.round((completed / steps.length) * 100);
}
