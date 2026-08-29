'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SourcedClaim } from '@/components/trust/SourcedClaim';
import { PersistentSafetyFooter } from '@/components/trust/PersistentSafetyFooter';
import { getProduct, getRoadmapSteps, getRoadmap } from '@/lib/workspace/store';
import type { ConfidenceLevel, SourceReference } from '@/lib/types';

interface ComplianceResult {
  id: string;
  requirement: string;
  clause: string;
  assessment: 'LIKELY_ADDRESSED' | 'POTENTIALLY_INCOMPLETE' | 'NO_MATCHING_EVIDENCE';
  evidence?: string;
  confidenceLevel: ConfidenceLevel;
}

export default function DocumentsPage() {
  const params = useParams();
  const productId = params.id as string;
  const { t } = useTranslation();

  const product = getProduct(productId);
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<ComplianceResult[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setResults([]);

    // Extract text from file
    const text = await f.text();
    setFileText(text);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleAnalyze = async () => {
    if (!fileText || !product) return;
    setIsAnalyzing(true);

    try {
      const roadmap = getRoadmap(productId);
      const steps = roadmap ? getRoadmapSteps(roadmap.id) : [];

      const response = await fetch('/api/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: fileText,
          roadmapRequirements: steps.map(s => s.title),
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Failed to analyze document:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ASSESSMENT_LABELS: Record<
    ComplianceResult['assessment'],
    { label: string; color: string }
  > = {
    LIKELY_ADDRESSED: {
      label: 'Likely Addressed',
      color: 'var(--color-verified-600)',
    },
    POTENTIALLY_INCOMPLETE: {
      label: 'Potentially Incomplete',
      color: 'var(--color-interpretation-600)',
    },
    NO_MATCHING_EVIDENCE: {
      label: 'No Matching Evidence Found',
      color: 'var(--color-nosource-600)',
    },
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
        {t('doccheck.title')}
      </h1>
      <p
        className="text-sm mb-6"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Upload compliance documents for AI-assisted review against the
        requirements for <strong>{product.name}</strong>.
      </p>

      {/* ⚠️ PERSISTENT SAFETY FOOTER — Always visible */}
      <PersistentSafetyFooter className="mb-6" />

      {/* Upload Area */}
      <div
        className={`card p-8 text-center mb-6 cursor-pointer ${
          dragOver ? 'ring-2' : ''
        }`}
        style={{
          borderStyle: 'dashed',
          borderColor: dragOver
            ? 'var(--color-primary-400)'
            : 'var(--color-border)',
          background: dragOver
            ? 'var(--color-primary-50)'
            : 'var(--color-surface)',
          transition: 'all var(--transition-fast)',
        }}
        onDragOver={e => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() =>
          document.getElementById('file-upload')?.click()
        }
      >
        <input
          id="file-upload"
          type="file"
          accept=".pdf,.txt,.text,.doc"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
        />
        <Upload
          size={32}
          className="mx-auto mb-3"
          style={{ color: 'var(--color-text-muted)' }}
        />
        <p
          className="text-sm font-medium mb-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {t('doccheck.upload')}
        </p>
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('doccheck.dragdrop')}
        </p>
      </div>

      {/* File Selected */}
      {file && (
        <div className="card p-4 mb-6 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <FileText
              size={18}
              style={{ color: 'var(--color-primary-500)' }}
            />
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {file.name}
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            className="btn btn-primary"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Document'
            )}
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {results.length > 0 && (
        <div className="space-y-4 stagger-children">
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Analysis Results
          </h2>
          {results.map(result => {
            const assessmentInfo = ASSESSMENT_LABELS[result.assessment];
            const sources: SourceReference[] = [
              {
                standardNumber: product.category,
                clause: result.clause,
                evidenceText: result.evidence,
              },
            ];

            return (
              <div key={result.id}>
                <div
                  className="flex items-center gap-2 mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <span
                    className="text-xs font-bold uppercase"
                    style={{ color: assessmentInfo.color }}
                  >
                    {assessmentInfo.label}
                  </span>
                  <span className="text-xs">— {result.requirement}</span>
                </div>
                <SourcedClaim
                  content={
                    result.assessment === 'LIKELY_ADDRESSED'
                      ? `The uploaded document appears to address ${result.clause}. ${result.evidence ?? ''}`
                      : result.assessment === 'POTENTIALLY_INCOMPLETE'
                      ? `The document may partially address ${result.clause}, but some required information could be missing. Please verify with your certifying laboratory.`
                      : `No matching document content found for ${result.clause}. The requirement may be missing or may be filed under a different document name. Please verify with your certifying laboratory.`
                  }
                  confidenceLevel="AI_INTERPRETATION"
                  sources={sources}
                  reasoning="This assessment is based on automated text analysis of the uploaded document against the requirement keywords. It is not a compliance determination."
                />
              </div>
            );
          })}

          {/* Final safety reminder */}
          <div className="mt-6">
            <PersistentSafetyFooter
              additionalMessage="The above assessments are AI-generated comparisons, not compliance verdicts. Requirements may have dependencies or nuances not captured by automated analysis."
            />
          </div>
        </div>
      )}
    </div>
  );
}
