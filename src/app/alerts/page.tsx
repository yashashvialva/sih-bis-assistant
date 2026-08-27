'use client';

import React from 'react';
import {
  Bell,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { DEMO_AMENDMENTS } from '@/lib/mock-data/seedData';

const SEVERITY_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; label: string }
> = {
  REVIEW_RECOMMENDED: {
    color: 'var(--color-interpretation-700)',
    bg: 'var(--color-interpretation-50)',
    border: 'var(--color-interpretation-200)',
    label: '⚠️ Review Recommended',
  },
  POTENTIAL_IMPACT: {
    color: 'var(--color-nosource-700)',
    bg: 'var(--color-nosource-50)',
    border: 'var(--color-nosource-200)',
    label: '📋 Potential Impact',
  },
  INFORMATION_ONLY: {
    color: 'var(--color-text-secondary)',
    bg: 'var(--color-surface-elevated)',
    border: 'var(--color-border)',
    label: 'ℹ️ Information Only',
  },
};

export default function AlertsPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
          style={{
            background: 'var(--color-nosource-100)',
            color: 'var(--color-nosource-600)',
          }}
        >
          <Sparkles size={12} />
          Tier 3 — Simulated Demo Alerts
        </div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {t('alerts.title')}
        </h1>

        {/* Demo notice */}
        <div
          className="safety-footer mb-6"
          data-testid="alerts-demo-notice"
        >
          <Info size={14} />
          <span>{t('alerts.demoNotice')}</span>
        </div>
      </div>

      {/* Amendment Cards */}
      <div className="space-y-4 stagger-children">
        {DEMO_AMENDMENTS.map(amendment => {
          const severity =
            SEVERITY_CONFIG[amendment.severity] ??
            SEVERITY_CONFIG.INFORMATION_ONLY;

          return (
            <div
              key={amendment.id}
              className="card p-5"
              style={{
                borderLeft: `4px solid ${severity.border}`,
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: severity.bg }}
                >
                  <Bell size={18} style={{ color: severity.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: severity.color }}
                    >
                      {severity.label}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'var(--color-surface-elevated)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {amendment.standardNumber}
                    </span>
                  </div>

                  <h3
                    className="font-semibold text-base mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {amendment.title}
                  </h3>

                  <p
                    className="text-sm leading-relaxed mb-3"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {amendment.impactSummary}
                  </p>

                  <div className="flex items-center gap-4 text-xs">
                    {amendment.affectedClause && (
                      <span
                        className="font-medium"
                        style={{ color: 'var(--color-primary-600)' }}
                      >
                        {amendment.affectedClause}
                      </span>
                    )}
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      Published: {amendment.publishedDate}
                    </span>
                  </div>

                  {/* Safe non-declarative wording */}
                  <div
                    className="mt-3 p-3 rounded-md text-xs"
                    style={{
                      background: severity.bg,
                      color: severity.color,
                      border: `1px solid ${severity.border}`,
                    }}
                  >
                    <AlertTriangle size={12} className="inline mr-1" />
                    This is a simulated alert for demonstration purposes. If
                    this were a real amendment, review would be recommended
                    to assess potential impact on your compliance status.
                    This alert does <strong>not</strong> declare any change
                    to your compliance status.
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
