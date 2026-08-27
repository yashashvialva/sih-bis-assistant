'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Map,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  Package,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ConfidenceTag } from '@/components/trust/SourcedClaim';
import {
  getProduct,
  getRoadmap,
  getRoadmapSteps,
  generateRoadmap,
  updateStepStatus,
  calculateCompletion,
} from '@/lib/workspace/store';
import type { Product, Roadmap, RoadmapStep, StepStatus } from '@/lib/types';

export default function ProductWorkspacePage() {
  const params = useParams();
  const productId = params.id as string;
  const { t } = useTranslation();

  const [product, setProduct] = useState<Product | null>(() => getProduct(productId) ?? null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(() => getRoadmap(productId) ?? null);
  const [steps, setSteps] = useState<RoadmapStep[]>(() => {
    const rm = getRoadmap(productId);
    return rm ? getRoadmapSteps(rm.id) : [];
  });
  const [completion, setCompletion] = useState(() => {
    const rm = getRoadmap(productId);
    return rm ? calculateCompletion(rm.id) : 0;
  });

  const loadData = () => {
    const p = getProduct(productId);
    setProduct(p ?? null);

    const rm = getRoadmap(productId);
    if (rm) {
      setRoadmap(rm);
      const rmSteps = getRoadmapSteps(rm.id);
      setSteps(rmSteps);
      setCompletion(calculateCompletion(rm.id));
    }
  };

  const handleGenerateRoadmap = () => {
    try {
      const result = generateRoadmap(productId);
      setRoadmap(result.roadmap);
      setSteps(result.steps);
      setCompletion(0);
    } catch (err) {
      console.error('Failed to generate roadmap:', err);
    }
  };

  const handleStepToggle = (stepId: string, currentStatus: StepStatus) => {
    const newStatus: StepStatus =
      currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    updateStepStatus(stepId, newStatus);
    loadData();
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

  const STATUS_ICON: Record<StepStatus, React.ReactNode> = {
    COMPLETED: (
      <CheckCircle2
        size={20}
        style={{ color: 'var(--color-verified-500)' }}
      />
    ),
    IN_PROGRESS: (
      <Clock
        size={20}
        style={{ color: 'var(--color-interpretation-500)' }}
      />
    ),
    PENDING: (
      <Circle
        size={20}
        style={{ color: 'var(--color-text-muted)' }}
      />
    ),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <ArrowLeft size={14} />
        {t('general.back')} to Products
      </Link>

      {/* Product Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))',
            }}
          >
            <Package size={22} color="white" />
          </div>
          <div className="flex-1">
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {product.name}
            </h1>
            <p
              className="text-sm mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {product.description || product.category}
            </p>
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{
                background: 'var(--color-primary-50)',
                color: 'var(--color-primary-700)',
              }}
            >
              {product.category}
            </span>
          </div>
        </div>

        {/* Progress */}
        {roadmap && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t('workspace.progress')}
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: 'var(--color-primary-600)' }}
                data-testid="completion-percentage"
              >
                {completion}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${completion}%` }}
                data-testid="progress-bar"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          {!roadmap ? (
            <button
              onClick={handleGenerateRoadmap}
              className="btn btn-primary"
              data-testid="generate-roadmap-btn"
            >
              <Map size={16} />
              {t('roadmap.generate')}
            </button>
          ) : (
            <>
              <Link
                href={`/products/${productId}/roadmap`}
                className="btn btn-secondary"
              >
                <Map size={16} />
                {t('workspace.roadmap')}
              </Link>
              <Link
                href={`/products/${productId}/documents`}
                className="btn btn-secondary"
              >
                <FileText size={16} />
                {t('workspace.documents')}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Checklist */}
      {roadmap && steps.length > 0 && (
        <div className="card p-6">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Compliance Checklist
          </h2>
          <div className="space-y-2 stagger-children">
            {steps.map(step => (
              <div
                key={step.id}
                className="flex items-start gap-3 p-3 rounded-lg cursor-pointer group"
                style={{
                  background:
                    step.status === 'COMPLETED'
                      ? 'var(--color-verified-50)'
                      : 'transparent',
                  transition: 'background var(--transition-fast)',
                }}
                onClick={() => handleStepToggle(step.id, step.status)}
                role="checkbox"
                aria-checked={step.status === 'COMPLETED'}
                data-testid={`step-${step.orderIndex}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {STATUS_ICON[step.status]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: 'var(--color-text-primary)',
                        textDecoration:
                          step.status === 'COMPLETED'
                            ? 'line-through'
                            : 'none',
                        opacity: step.status === 'COMPLETED' ? 0.7 : 1,
                      }}
                    >
                      {step.title}
                    </span>
                    <ConfidenceTag level={step.confidenceLevel} />
                  </div>
                  {step.sourceClause && (
                    <span
                      className="text-xs mt-0.5 block"
                      style={{ color: 'var(--color-primary-600)' }}
                    >
                      {step.sourceClause}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
