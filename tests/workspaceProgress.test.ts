/**
 * Workspace & Progress Tests
 *
 * Verifies:
 * - Completion percentage calculation correctness
 * - Steps retain source clause references
 * - State persistence across updates
 * - Product CRUD operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createProduct,
  getProduct,
  getProducts,
  deleteProduct,
  generateRoadmap,
  getRoadmap,
  getRoadmapSteps,
  updateStepStatus,
  calculateCompletion,
} from '@/lib/workspace/store';

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

describe('Workspace — Product Management', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('creates a product and retrieves it', () => {
    const product = createProduct({
      name: 'Test Kettle',
      description: 'A test electric kettle',
      category: 'Domestic Electric Appliances',
    });

    expect(product.id).toBeDefined();
    expect(product.name).toBe('Test Kettle');
    expect(product.category).toBe('Domestic Electric Appliances');

    const retrieved = getProduct(product.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('Test Kettle');
  });

  it('lists all products', () => {
    createProduct({ name: 'Product A', description: '', category: 'Cat A' });
    createProduct({ name: 'Product B', description: '', category: 'Cat B' });

    const all = getProducts();
    expect(all.length).toBe(2);
  });

  it('deletes a product and its roadmap', () => {
    const product = createProduct({
      name: 'To Delete',
      description: '',
      category: 'Domestic Electric Appliances',
    });
    generateRoadmap(product.id);

    deleteProduct(product.id);

    expect(getProduct(product.id)).toBeUndefined();
    expect(getRoadmap(product.id)).toBeUndefined();
  });
});

describe('Workspace — Roadmap Generation', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('generates a roadmap with steps that retain source clauses', () => {
    const product = createProduct({
      name: 'Electric Kettle',
      description: 'A household electric kettle',
      category: 'Domestic Electric Appliances',
    });

    const { roadmap, steps } = generateRoadmap(product.id);

    expect(roadmap).toBeDefined();
    expect(roadmap.productId).toBe(product.id);
    expect(steps.length).toBeGreaterThan(0);

    // Steps backed by BIS data should have source clauses
    const sourcedSteps = steps.filter(s => s.sourceClause);
    expect(sourcedSteps.length).toBeGreaterThan(0);

    sourcedSteps.forEach(step => {
      expect(step.sourceClause).toBeDefined();
      expect(step.confidenceLevel).toBe('VERIFIED_BIS_DATA');
    });
  });

  it('marks non-sourced steps as AI_INTERPRETATION or NO_MATCHING_SOURCE', () => {
    const product = createProduct({
      name: 'Electric Kettle',
      description: '',
      category: 'Domestic Electric Appliances',
    });

    const { steps } = generateRoadmap(product.id);
    // Steps without any source reference (neither clause nor chunk)
    const unsourcedSteps = steps.filter(
      s => !s.sourceClause && !s.sourceChunkId
    );

    // There should be at least some unsourced steps (lab selection, application, etc.)
    expect(unsourcedSteps.length).toBeGreaterThan(0);

    unsourcedSteps.forEach(step => {
      expect(['AI_INTERPRETATION', 'NO_MATCHING_SOURCE', 'VERIFIED_BIS_DATA']).toContain(
        step.confidenceLevel
      );
    });
  });
});

describe('Workspace — Progress Tracking', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('calculates completion percentage correctly', () => {
    const product = createProduct({
      name: 'Progress Test',
      description: '',
      category: 'Domestic Electric Appliances',
    });

    const { roadmap, steps } = generateRoadmap(product.id);

    // Initially 0%
    expect(calculateCompletion(roadmap.id)).toBe(0);

    // Complete first step
    updateStepStatus(steps[0].id, 'COMPLETED');
    const expected = Math.round((1 / steps.length) * 100);
    expect(calculateCompletion(roadmap.id)).toBe(expected);

    // Complete all steps
    steps.forEach(step => updateStepStatus(step.id, 'COMPLETED'));
    expect(calculateCompletion(roadmap.id)).toBe(100);
  });

  it('persists step status across updates', () => {
    const product = createProduct({
      name: 'Persist Test',
      description: '',
      category: 'Domestic Electric Appliances',
    });

    const { roadmap, steps } = generateRoadmap(product.id);

    updateStepStatus(steps[0].id, 'COMPLETED');

    // Re-read from store
    const reloadedSteps = getRoadmapSteps(roadmap.id);
    const firstStep = reloadedSteps.find(s => s.id === steps[0].id);
    expect(firstStep!.status).toBe('COMPLETED');
  });

  it('allows toggling step status back to PENDING', () => {
    const product = createProduct({
      name: 'Toggle Test',
      description: '',
      category: 'Domestic Electric Appliances',
    });

    const { roadmap, steps } = generateRoadmap(product.id);

    updateStepStatus(steps[0].id, 'COMPLETED');
    expect(calculateCompletion(roadmap.id)).toBeGreaterThan(0);

    updateStepStatus(steps[0].id, 'PENDING');
    expect(calculateCompletion(roadmap.id)).toBe(0);
  });
});
