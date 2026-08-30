'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Brain,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import type { ConfidenceLevel, SourceReference } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════
   <SourcedClaim /> — The Trust Layer Component
   
   This is the SINGLE shared reusable component for every sourced
   claim in the entire application. It is an architectural layer,
   NOT visual decoration.
   
   Every screen displaying an AI-derived compliance-related claim
   MUST use this component.
   
   Three states:
   1. VERIFIED_BIS_DATA    — Backed by exact retrieved BIS source
   2. AI_INTERPRETATION    — Reasoning/synthesis, non-authoritative
   3. NO_MATCHING_SOURCE   — Explicit uncertainty, zero hallucination
   ═══════════════════════════════════════════════════════════════ */

interface SourcedClaimProps {
  content: string;
  confidenceLevel: ConfidenceLevel;
  sources?: SourceReference[];
  reasoning?: string;
  compact?: boolean;
  className?: string;
}

const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  {
    label: string;
    labelHi: string;
    icon: React.ReactNode;
    badgeClass: string;
    cardClass: string;
    description: string;
  }
> = {
  VERIFIED_BIS_DATA: {
    label: 'Verified against BIS data',
    labelHi: 'BIS डेटा से सत्यापित',
    icon: <ShieldCheck size={14} />,
    badgeClass: 'badge-verified',
    cardClass: 'trust-card-verified',
    description:
      'This information was retrieved directly from the curated BIS corpus.',
  },
  AI_INTERPRETATION: {
    label: 'AI Interpretation — Non-binding guidance',
    labelHi: 'AI व्याख्या — गैर-बाध्यकारी मार्गदर्शन',
    icon: <Brain size={14} />,
    badgeClass: 'badge-interpretation',
    cardClass: 'trust-card-interpretation',
    description:
      'This is an AI-generated explanation based on available sources. It is NOT an official BIS determination.',
  },
  NO_MATCHING_SOURCE: {
    label: 'No Authoritative Source Found',
    labelHi: 'कोई आधिकारिक स्रोत नहीं मिला',
    icon: <AlertTriangle size={14} />,
    badgeClass: 'badge-nosource',
    cardClass: 'trust-card-nosource',
    description:
      'Sufficient authoritative BIS evidence was not found in the curated corpus. Please verify directly with BIS.',
  },
};

export function SourcedClaim({
  content,
  confidenceLevel,
  sources = [],
  reasoning,
  compact = false,
  className = '',
}: SourcedClaimProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = CONFIDENCE_CONFIG[confidenceLevel] || CONFIDENCE_CONFIG['VERIFIED_BIS_DATA'];

  return (
    <div
      className={`trust-card ${config.cardClass} animate-fade-in ${className}`}
      role="region"
      aria-label={`Claim: ${config.label}`}
      data-testid="sourced-claim"
      data-confidence={confidenceLevel}
    >
      {/* Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`badge ${config.badgeClass}`}
          data-testid="confidence-badge"
        >
          {config.icon}
          <span>{config.label}</span>
        </span>

        {(sources.length > 0 || reasoning) && !compact && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-ghost btn-sm"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            data-testid="expand-toggle"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="text-xs">
              {isExpanded ? 'Less' : 'Details'}
            </span>
          </button>
        )}
      </div>

      {/* Claim content */}
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--color-text-primary)' }}
        data-testid="claim-content"
      >
        {content}
      </p>

      {/* Expanded details */}
      {isExpanded && !compact && (
        <div className="mt-3 pt-3 border-t animate-fade-in" style={{ borderColor: 'inherit' }}>
          {/* Sources */}
          {sources.length > 0 && (
            <div className="mb-3">
              <h4
                className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <BookOpen size={12} />
                Source References
              </h4>
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <SourceReferenceCard key={index} source={source} />
                ))}
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {reasoning && confidenceLevel === 'AI_INTERPRETATION' && (
            <div>
              <h4
                className="text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Brain size={12} />
                AI Reasoning
              </h4>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {reasoning}
              </p>
            </div>
          )}

          {/* Uncertainty guidance */}
          {confidenceLevel === 'NO_MATCHING_SOURCE' && (
            <div
              className="text-xs leading-relaxed p-2 rounded-md"
              style={{
                background: 'var(--color-nosource-100)',
                color: 'var(--color-nosource-700)',
              }}
            >
              <p className="font-medium mb-1">What does this mean?</p>
              <p>
                The curated BIS corpus does not contain a direct match for this
                query. This does NOT mean the requirement doesn&apos;t exist — it may
                be covered under a different standard or clause not yet in the
                corpus.
              </p>
              <p className="mt-1">
                Please consult{' '}
                <a
                  href="https://www.bis.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-0.5"
                >
                  BIS directly
                  <ExternalLink size={10} />
                </a>{' '}
                for authoritative information.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Source Reference Sub-card ──────────────────────── */

function SourceReferenceCard({ source }: { source: SourceReference }) {
  return (
    <div
      className="p-2.5 rounded-md text-xs"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
      data-testid="source-reference"
    >
      <div className="flex items-start gap-2">
        <ShieldCheck
          size={14}
          className="mt-0.5 flex-shrink-0"
          style={{ color: 'var(--color-verified-600)' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-1">
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {source.standardNumber}
            </span>
            {source.clause && (
              <span style={{ color: 'var(--color-primary-600)' }}>
                {source.clause}
              </span>
            )}
          </div>
          {source.sectionTitle && (
            <p className="font-medium mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {source.sectionTitle}
            </p>
          )}
          {source.documentTitle && (
            <p style={{ color: 'var(--color-text-muted)' }}>
              {source.documentTitle}
            </p>
          )}
          {source.evidenceText && (
            <blockquote
              className="mt-1.5 pl-2 italic"
              style={{
                borderLeft: '2px solid var(--color-verified-400)',
                color: 'var(--color-text-secondary)',
              }}
            >
              &ldquo;{source.evidenceText}&rdquo;
            </blockquote>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── ConfidenceTag — Inline badge variant ────────────── */

interface ConfidenceTagProps {
  level: ConfidenceLevel;
  className?: string;
}

export function ConfidenceTag({ level, className = '' }: ConfidenceTagProps) {
  const config = CONFIDENCE_CONFIG[level] || CONFIDENCE_CONFIG['VERIFIED_BIS_DATA'];
  return (
    <span
      className={`badge ${config.badgeClass} ${className}`}
      data-testid="confidence-tag"
      data-confidence={level}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}

export { CONFIDENCE_CONFIG };
