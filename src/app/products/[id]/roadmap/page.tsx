'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SourcedClaim } from '@/components/trust/SourcedClaim';
import {
  getProduct,
  getRoadmap,
  getRoadmapSteps,
  generateRoadmap,
} from '@/lib/workspace/store';
import type { Product, RoadmapStep } from '@/lib/types';

const STEP_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  STANDARD_IDENTIFICATION: { label: 'Standard Identification', emoji: '📋' },
  CERTIFICATION_REQUIREMENT: { label: 'Certification Requirement', emoji: '🏅' },
  TESTING: { label: 'Testing Requirement', emoji: '🔬' },
  DOCUMENTATION: { label: 'Required Documents', emoji: '📄' },
  LAB_SELECTION: { label: 'Laboratory Selection', emoji: '🏭' },
  APPLICATION: { label: 'BIS Application', emoji: '📝' },
  FINAL_REVIEW: { label: 'Final Review & Grant', emoji: '✅' },
};

export default function RoadmapPage() {
  const params = useParams();
  const productId = params.id as string;
  const { t } = useTranslation();

  const [product] = useState<Product | null>(() => getProduct(productId) ?? null);
  const [steps] = useState<RoadmapStep[]>(() => {
    const p = getProduct(productId);
    const rm = getRoadmap(productId);
    if (!rm && p) {
      const result = generateRoadmap(productId);
      return result.steps;
    } else if (rm) {
      return getRoadmapSteps(rm.id);
    }
    return [];
  });
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p style={{ color: 'var(--color-text-muted)' }}>Product not found.</p>
        <Link href="/products" className="btn btn-secondary mt-4">
          <ArrowLeft size={14} />
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <Link
        href={`/products/${productId}`}
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <ArrowLeft size={14} />
        {t('general.back')} to {product.name}
      </Link>

      <h1
        className="text-3xl font-bold mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {t('roadmap.title')}
      </h1>
      <p
        className="text-sm mb-8"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Structured compliance pathway for{' '}
        <strong>{product.name}</strong> ({product.category})
      </p>

      {/* Roadmap Steps — Vertical Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-6 top-0 bottom-0 w-0.5"
          style={{ background: 'var(--color-border)' }}
        />

        <div className="space-y-4 stagger-children">
          {steps.map((step, idx) => {
            const typeInfo = STEP_TYPE_LABELS[step.stepType] ?? {
              label: step.stepType,
              emoji: '📌',
            };
            const isExpanded = expandedSteps.has(step.id);

            return (
              <div key={step.id} className="relative pl-14">
                {/* Timeline dot */}
                <div
                  className="absolute left-4 w-5 h-5 rounded-full flex items-center justify-center text-xs z-10"
                  style={{
                    background: 'var(--color-surface)',
                    border: '2px solid var(--color-primary-400)',
                    color: 'var(--color-primary-600)',
                    top: '1.25rem',
                  }}
                >
                  {idx + 1}
                </div>

                <div className="card p-5">
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="w-full text-left flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-base">{typeInfo.emoji}</span>
                        <span
                          className="text-xs font-medium uppercase tracking-wide"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          Step {step.orderIndex} — {typeInfo.label}
                        </span>
                      </div>
                      <h3
                        className="text-base font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {step.title}
                      </h3>
                    </div>
                    {isExpanded ? (
                      <ChevronUp
                        size={16}
                        className="flex-shrink-0 mt-1"
                        style={{ color: 'var(--color-text-muted)' }}
                      />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="flex-shrink-0 mt-1"
                        style={{ color: 'var(--color-text-muted)' }}
                      />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 animate-fade-in">
                      <SourcedClaim
                        content={step.description}
                        confidenceLevel={step.confidenceLevel}
                        sources={
                          step.sourceClause
                            ? [
                                {
                                  standardNumber:
                                    steps[0]?.description.match(
                                      /IS \S+/
                                    )?.[0] ?? 'Unknown',
                                  clause: step.sourceClause,
                                  evidenceText: step.description,
                                },
                              ]
                            : []
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
