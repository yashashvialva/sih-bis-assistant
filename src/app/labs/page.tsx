'use client';

import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  MapPin,
  Search,
  AlertTriangle,
  Beaker,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { DEMO_LABS } from '@/lib/mock-data/seedData';

export default function LabsPage() {
  const { t } = useTranslation();
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const states = useMemo(
    () => [...new Set(DEMO_LABS.map(l => l.state))].sort(),
    []
  );

  const categories = useMemo(
    () => [
      ...new Set(DEMO_LABS.flatMap(l => l.productCategories)),
    ].sort(),
    []
  );

  const filteredLabs = useMemo(() => {
    return DEMO_LABS.filter(lab => {
      if (locationFilter && lab.state !== locationFilter) return false;
      if (
        categoryFilter &&
        !lab.productCategories.includes(categoryFilter)
      )
        return false;
      return true;
    });
  }, [locationFilter, categoryFilter]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
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
          Tier 3 — Static Demo Data
        </div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {t('labs.title')}
        </h1>

        {/* Demo notice */}
        <div
          className="safety-footer mb-6"
          data-testid="labs-demo-notice"
        >
          <AlertTriangle size={14} />
          <span>{t('labs.demoNotice')}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <MapPin size={14} className="inline mr-1" />
            {t('labs.filterLocation')}
          </label>
          <select
            className="input"
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
          >
            <option value="">All Locations</option>
            {states.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Search size={14} className="inline mr-1" />
            Product Category
          </label>
          <select
            className="input"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lab Cards */}
      <div className="space-y-4 stagger-children">
        {filteredLabs.length === 0 ? (
          <div className="card p-8 text-center">
            <FlaskConical
              size={32}
              className="mx-auto mb-3"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <p style={{ color: 'var(--color-text-muted)' }}>
              No laboratories match your filters.
            </p>
          </div>
        ) : (
          filteredLabs.map(lab => (
            <div key={lab.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  }}
                >
                  <FlaskConical size={18} color="white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3
                      className="font-semibold text-base mb-1"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {lab.name}
                    </h3>
                    <span
                      className="badge badge-nosource"
                      style={{ flexShrink: 0 }}
                    >
                      {t('general.demoData')}
                    </span>
                  </div>

                  <p
                    className="text-sm flex items-center gap-1 mb-3"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <MapPin size={12} />
                    {lab.location}, {lab.city}, {lab.state}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {lab.productCategories.map(cat => (
                      <span
                        key={cat}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: 'var(--color-primary-50)',
                          color: 'var(--color-primary-700)',
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lab.testingCapabilities.map(cap => (
                      <span
                        key={cap}
                        className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{
                          background: 'var(--color-surface-elevated)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        <Beaker size={10} />
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
