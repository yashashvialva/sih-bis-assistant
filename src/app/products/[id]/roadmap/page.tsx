'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SourcedClaim } from '@/components/trust/SourcedClaim';
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

  const [product, setProduct] = useState<Product | null>(null);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── 1. FETCH PRODUCT & ROADMAP ON LOAD ──────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch Product
        const prodRes = await fetch(`/api/products/${productId}`);
        if (!prodRes.ok) throw new Error('Failed to load product');
        const prodData = await prodRes.json();
        setProduct(prodData.product);

        // 2. Fetch Roadmap
        const rmRes = await fetch(`/api/products/${productId}/roadmap`);
        if (rmRes.ok) {
          const rmData = await rmRes.json();
          if (rmData.steps && rmData.steps.length > 0) {
            setSteps(rmData.steps);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  // ─── 2. GENERATE ROADMAP ─────────────────────────────────────
  const generateRoadmap = async () => {
    if (!product) return;
    try {
      setIsGenerating(true);
      setError(null);
      const res = await fetch(`/api/products/${productId}/roadmap`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate roadmap');
      
      setSteps(data.steps || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── 3. TOGGLE STEP COMPLETION (PATCH) ───────────────────────
  const toggleStepCompletion = async (stepId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding the accordion
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    
    // Optimistic UI Update
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: newStatus } : s));
    
    try {
      await fetch(`/api/roadmap/step/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      // Revert on failure
      console.error("Failed to save step status");
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: currentStatus } : s));
    }
  };

  // ─── UI HELPERS ──────────────────────────────────────────────
  const toggleStepAccordion = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading workspace...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-muted-foreground">Product not found.</p>
        <Link href="/products" className="btn btn-secondary mt-4">
          <ArrowLeft size={14} /> Back to Products
        </Link>
      </div>
    );
  }

  // Derived Progress metrics
  const totalSteps = steps.length;
  const completedSteps = steps.filter(s => s.status === 'COMPLETED').length;
  const progressPercentage = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <Link href={`/products/${productId}`} className="inline-flex items-center gap-1.5 text-sm mb-6 text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} />
        {t('general.back')} to {product.name}
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            {t('roadmap.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('roadmap.pathway')} <strong>{product.name}</strong> ({product.category})
          </p>
        </div>
        
        {totalSteps > 0 && (
          <div className="flex flex-col items-end min-w-[200px]">
            <span className="text-sm font-semibold mb-2">{progressPercentage}% {t('roadmap.complete')}</span>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground mt-2">{completedSteps} of {totalSteps} {t('roadmap.tasksCompleted')}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-sm font-medium flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {steps.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            📋
          </div>
          <h2 className="text-xl font-semibold mb-2">No Roadmap Generated</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Click the button below to analyze authoritative BIS standards and dynamically generate a compliance roadmap for this product.
          </p>
          <button 
            onClick={generateRoadmap}
            disabled={isGenerating}
            className="btn btn-primary px-8 py-3 font-medium shadow-sm"
          >
            {isGenerating ? (
              <><Loader2 size={18} className="animate-spin mr-2" /> Generating Roadmap...</>
            ) : (
              'Generate Strict Compliance Roadmap'
            )}
          </button>
        </div>
      ) : (
        /* Roadmap Steps — Vertical Timeline */
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {steps.map((step, idx) => {
              const typeInfo = STEP_TYPE_LABELS[step.stepType] ?? { label: step.stepType, emoji: '📌' };
              const isExpanded = expandedSteps.has(step.id);
              const isCompleted = step.status === 'COMPLETED';

              return (
                <div key={step.id} className="relative pl-14">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-4 w-5 h-5 rounded-full flex items-center justify-center text-xs z-10 font-bold ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white border-none' 
                        : 'bg-background border-2 border-primary/50 text-primary'
                    }`}
                    style={{ top: '1.25rem' }}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>

                  <div className={`card p-5 transition-colors ${isCompleted ? 'bg-muted/30 border-muted' : ''}`}>
                    <button
                      onClick={() => toggleStepAccordion(step.id)}
                      className="w-full text-left flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 flex gap-4">
                        {/* Interactive Checkbox */}
                        <div 
                          className="mt-1 cursor-pointer"
                          onClick={(e) => toggleStepCompletion(step.id, step.status, e)}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={24} className="text-emerald-500 hover:text-emerald-600" />
                          ) : (
                            <Circle size={24} className="text-muted-foreground hover:text-primary transition-colors" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-base">{typeInfo.emoji}</span>
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {t('roadmap.step')} {step.orderIndex} — {typeInfo.label}
                            </span>
                          </div>
                          <h3 className={`text-base font-semibold ${isCompleted ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground'}`}>
                            {step.title}
                          </h3>
                        </div>
                      </div>
                      
                      {isExpanded ? (
                        <ChevronUp size={16} className="flex-shrink-0 mt-1 text-muted-foreground" />
                      ) : (
                        <ChevronDown size={16} className="flex-shrink-0 mt-1 text-muted-foreground" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pl-10 animate-fade-in">
                        <SourcedClaim
                          content={step.description}
                          confidenceLevel={(step.confidenceLevel === 'HIGH' ? 'VERIFIED_BIS_DATA' : step.confidenceLevel) as any}
                          sources={
                            step.sourceClause
                              ? [
                                  {
                                    standardNumber: step.sourceClause.includes('IS') ? '' : 'Authoritative Standard', // Simplified for UI
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
      )}
    </div>
  );
}
