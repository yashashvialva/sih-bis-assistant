'use client';

import React, { useState } from 'react';
import {
  Search,
  AlertTriangle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SourcedClaim } from '@/components/trust/SourcedClaim';
import { DEMO_LICENSES } from '@/lib/mock-data/seedData';
import type { LicenseRecord } from '@/lib/types';

export default function VerifyPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{
    match: LicenseRecord | null;
    searched: boolean;
  }>({ match: null, searched: false });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const match = DEMO_LICENSES.find(
      l => l.licenseNumber.toLowerCase().includes(trimmed.toLowerCase())
    );

    setResult({ match: match ?? null, searched: true });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
          style={{
            background: 'var(--color-nosource-100)',
            color: 'var(--color-nosource-600)',
          }}
        >
          <Sparkles size={12} />
          Tier 3 — Static Demo Data
        </div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {t('verify.title')}
        </h1>
        <p
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Verify a registration or licence number against the demo corpus.
        </p>
      </div>

      {/* Search */}
      <div className="card p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            className="input flex-1"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('verify.placeholder')}
            data-testid="verify-input"
          />
          <button type="submit" className="btn btn-primary" data-testid="verify-search">
            <Search size={16} />
            {t('verify.search')}
          </button>
        </form>

        {/* Demo hint */}
        <p
          className="text-xs mt-3"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Try: <strong>CM/L-1234567</strong>, <strong>CM/L-7654321</strong>, or{' '}
          <strong>R-9988776</strong> (demo records)
        </p>
      </div>

      {/* Results */}
      {result.searched && (
        <div className="animate-fade-in">
          {result.match ? (
            <div>
              <SourcedClaim
                content={`Registration/licence number "${result.match.licenseNumber}" was found in the demo corpus.`}
                confidenceLevel="VERIFIED_BIS_DATA"
                sources={[
                  {
                    standardNumber: result.match.standardNumber,
                    documentTitle: result.match.productName,
                    sectionTitle: `Manufacturer: ${result.match.manufacturer}`,
                    evidenceText: `Valid until: ${result.match.validUntil}`,
                  },
                ]}
              />

              {/* Record details */}
              <div className="card p-5 mt-4">
                <h3
                  className="font-semibold text-base mb-3"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Record Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      Licence Number
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {result.match.licenseNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      Product
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {result.match.productName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      Manufacturer
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {result.match.manufacturer}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      Standard
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {result.match.standardNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      Valid Until
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {result.match.validUntil}
                    </span>
                  </div>
                </div>

                <div
                  className="mt-4 p-3 rounded-md text-xs"
                  style={{
                    background: 'var(--color-nosource-50)',
                    color: 'var(--color-nosource-700)',
                    border: '1px solid var(--color-nosource-200)',
                  }}
                >
                  <AlertTriangle
                    size={12}
                    className="inline mr-1"
                  />
                  This is a demo record. For official verification, please
                  use the{' '}
                  <a
                    href="https://www.bis.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-0.5"
                  >
                    BIS website
                    <ExternalLink size={10} />
                  </a>
                  .
                </div>
              </div>
            </div>
          ) : (
            <div>
              <SourcedClaim
                content={t('verify.noMatch')}
                confidenceLevel="NO_MATCHING_SOURCE"
                sources={[]}
              />
              <div
                className="card p-5 mt-4 text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
                data-testid="verify-no-match-disclaimer"
              >
                <p className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Important
                </p>
                <p>{t('verify.noMatchDisclaimer')}</p>
                <p className="mt-2">
                  For official verification, please visit{' '}
                  <a
                    href="https://www.bis.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-0.5"
                    style={{ color: 'var(--color-primary-600)' }}
                  >
                    www.bis.gov.in
                    <ExternalLink size={10} />
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
