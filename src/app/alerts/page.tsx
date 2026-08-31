'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  AlertTriangle,
  Info,
  Package,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAlerts } from '@/hooks/useAlerts';
import type { ProductAlert } from '@/lib/types';

const SEVERITY_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; label: string; icon: React.ReactNode; riskText: string }
> = {
  REVIEW_RECOMMENDED: {
    color: 'var(--color-interpretation-700)',
    bg: 'var(--color-interpretation-50)',
    border: 'var(--color-interpretation-200)',
    label: '⚠️ Review Recommended',
    icon: <AlertTriangle size={18} />,
    riskText: 'This amendment may require re-testing or design changes',
  },
  POTENTIAL_IMPACT: {
    color: 'var(--color-nosource-700)',
    bg: 'var(--color-nosource-50)',
    border: 'var(--color-nosource-200)',
    label: '📋 Potential Impact',
    icon: <Info size={18} />,
    riskText: 'This amendment may require documentation updates',
  },
  INFORMATION_ONLY: {
    color: 'var(--color-text-secondary)',
    bg: 'var(--color-surface-elevated)',
    border: 'var(--color-border)',
    label: 'ℹ️ Information Only',
    icon: <Info size={18} />,
    riskText: 'No immediate action required',
  },
};

interface AIAnalysis {
  impactSummary: string;
  actionItems: string[];
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

function AlertCard({
  alert,
  onRead,
  onDismiss,
}: {
  alert: ProductAlert;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);

  const severity =
    SEVERITY_CONFIG[alert.amendment.severity] ?? SEVERITY_CONFIG.INFORMATION_ONLY;

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!alert.isRead) {
      onRead(alert.amendment.id);
    }
  };

  const handleAnalyze = useCallback(async (productName: string, productCategory: string) => {
    setIsAnalyzing(true);
    setAnalysisError(false);
    try {
      const res = await fetch('/api/alerts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amendment: alert.amendment,
          productName,
          productCategory,
        }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAiAnalysis(data);
    } catch {
      setAnalysisError(true);
    } finally {
      setIsAnalyzing(false);
    }
  }, [alert.amendment]);

  const riskColors: Record<string, { bg: string; text: string; border: string }> = {
    HIGH: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    MEDIUM: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    LOW: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  };

  return (
    <div
      className="card overflow-hidden transition-all duration-300"
      style={{
        borderLeft: `4px solid ${severity.border}`,
        background: alert.isRead ? 'var(--color-surface)' : 'var(--color-primary-50)',
      }}
    >
      {/* Card Header */}
      <button
        onClick={handleExpand}
        className="w-full text-left px-5 py-4 transition-colors"
        style={{ background: 'transparent' }}
      >
        <div className="flex items-start gap-4">
          {/* Severity Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: severity.bg, color: severity.color }}
          >
            {severity.icon}
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: severity.color }}
              >
                {severity.label}
              </span>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {alert.amendment.standardNumber}
              </span>
              {alert.amendment.affectedClause && (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--color-primary-50)',
                    color: 'var(--color-primary-600)',
                  }}
                >
                  {alert.amendment.affectedClause}
                </span>
              )}
              {!alert.isRead && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                  }}
                >
                  NEW
                </span>
              )}
            </div>

            {/* Title */}
            <h3
              className="font-semibold text-base mb-1 leading-snug"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {alert.amendment.title.replace('[SIMULATED] ', '')}
            </h3>

            {/* Impact summary */}
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {alert.amendment.impactSummary}
            </p>

            {/* Affected Products */}
            {alert.affectedProducts.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Package size={13} style={{ color: 'var(--color-primary-500)' }} />
                {alert.affectedProducts.map(p => (
                  <span
                    key={p.id}
                    className="text-[11px] font-medium px-2 py-1 rounded-md"
                    style={{
                      background: 'var(--color-primary-100)',
                      color: 'var(--color-primary-700)',
                    }}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            )}

            {/* Date + expand */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Published: {alert.amendment.publishedDate}
              </span>
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--color-primary-600)' }}>
                {isExpanded ? (
                  <>Hide details <ChevronUp size={14} /></>
                ) : (
                  <>View details <ChevronDown size={14} /></>
                )}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="px-5 pb-5 animate-fade-in"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {/* What Changed */}
          {alert.amendment.whatChanged && alert.amendment.whatChanged.length > 0 && (
            <div className="mt-4">
              <h4
                className="text-sm font-semibold mb-2 flex items-center gap-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <ArrowRight size={14} style={{ color: 'var(--color-interpretation-600)' }} />
                What Changed
              </h4>
              <ul className="space-y-1.5 ml-5">
                {alert.amendment.whatChanged.map((change, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed flex items-start gap-2"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ background: severity.color }}
                    />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Actions */}
          {alert.amendment.recommendedActions && alert.amendment.recommendedActions.length > 0 && (
            <div className="mt-4">
              <h4
                className="text-sm font-semibold mb-2 flex items-center gap-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <CheckCircle size={14} style={{ color: 'var(--color-verified-600)' }} />
                Recommended Actions
              </h4>
              <ol className="space-y-2 ml-5">
                {alert.amendment.recommendedActions.map((action, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed flex items-start gap-2"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                      style={{
                        background: 'var(--color-primary-100)',
                        color: 'var(--color-primary-700)',
                      }}
                    >
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* AI Impact Analysis Section */}
          {alert.affectedProducts.length > 0 && (
            <div className="mt-5">
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-interpretation-50))',
                  border: '1px solid var(--color-primary-200)',
                }}
              >
                <h4
                  className="text-sm font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <Sparkles size={14} style={{ color: 'var(--color-primary-500)' }} />
                  AI Impact Analysis
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: 'var(--color-interpretation-100)',
                      color: 'var(--color-interpretation-700)',
                    }}
                  >
                    AI Interpretation — Non-binding
                  </span>
                </h4>

                {!aiAnalysis && !isAnalyzing && !analysisError && (
                  <div className="space-y-2">
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Get a personalized AI-powered analysis of how this amendment affects your specific product(s):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {alert.affectedProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => handleAnalyze(product.name, product.category)}
                          className="btn btn-sm"
                          style={{
                            background: 'var(--color-primary-600)',
                            color: 'white',
                            fontSize: '12px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                          }}
                        >
                          <Sparkles size={12} />
                          Analyze for &quot;{product.name}&quot;
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="flex items-center gap-3 py-4">
                    <Loader2
                      size={20}
                      className="animate-spin"
                      style={{ color: 'var(--color-primary-500)' }}
                    />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        Generating personalized impact analysis...
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Analyzing amendment details against your product profile
                      </p>
                    </div>
                  </div>
                )}

                {analysisError && (
                  <div className="flex items-center gap-2 py-2">
                    <XCircle size={16} style={{ color: '#dc2626' }} />
                    <p className="text-sm" style={{ color: '#dc2626' }}>
                      Unable to generate analysis. Please try again.
                    </p>
                    <button
                      onClick={() => {
                        if (alert.affectedProducts[0]) {
                          handleAnalyze(alert.affectedProducts[0].name, alert.affectedProducts[0].category);
                        }
                      }}
                      className="text-xs font-medium underline"
                      style={{ color: 'var(--color-primary-600)' }}
                    >
                      Retry
                    </button>
                  </div>
                )}

                {aiAnalysis && (
                  <div className="space-y-3 animate-fade-in">
                    {/* Risk Level Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full"
                        style={{
                          background: riskColors[aiAnalysis.riskLevel]?.bg,
                          color: riskColors[aiAnalysis.riskLevel]?.text,
                          border: `1px solid ${riskColors[aiAnalysis.riskLevel]?.border}`,
                        }}
                      >
                        {aiAnalysis.riskLevel} Risk
                      </span>
                    </div>

                    {/* AI Summary */}
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {aiAnalysis.impactSummary}
                    </p>

                    {/* AI Action Items */}
                    {aiAnalysis.actionItems.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                          Recommended Next Steps:
                        </p>
                        <ol className="space-y-1.5">
                          {aiAnalysis.actionItems.map((item, i) => (
                            <li
                              key={i}
                              className="text-xs leading-relaxed flex items-start gap-2"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold mt-0.5"
                                style={{
                                  background: riskColors[aiAnalysis.riskLevel]?.bg,
                                  color: riskColors[aiAnalysis.riskLevel]?.text,
                                  border: `1px solid ${riskColors[aiAnalysis.riskLevel]?.border}`,
                                }}
                              >
                                {i + 1}
                              </span>
                              {item}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Trust disclaimer */}
                    <div
                      className="mt-2 p-2.5 rounded-lg text-[11px]"
                      style={{
                        background: 'var(--color-interpretation-50)',
                        color: 'var(--color-interpretation-700)',
                        border: '1px solid var(--color-interpretation-200)',
                      }}
                    >
                      <Shield size={11} className="inline mr-1" />
                      This is AI-generated guidance based on the amendment details. It does <strong>not</strong> constitute
                      official BIS advice. Consult the original gazette notification and your certifying body for
                      authoritative interpretation.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Safety disclaimer */}
          <div
            className="mt-4 p-3 rounded-lg text-xs"
            style={{
              background: severity.bg,
              color: severity.color,
              border: `1px solid ${severity.border}`,
            }}
          >
            <AlertTriangle size={12} className="inline mr-1" />
            {alert.affectedProducts.length > 0
              ? `This amendment affects ${alert.affectedProducts.length} product(s) in your workspace. Review the changes to assess potential impact on your compliance status. This alert does not declare any change to your compliance status.`
              : 'If this were a real amendment, review would be recommended to assess potential impact on your compliance status. This alert does not declare any change to your compliance status.'
            }
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => onDismiss(alert.amendment.id)}
              className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
              style={{
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
            >
              <EyeOff size={12} />
              Dismiss
            </button>
            {!alert.isRead && (
              <button
                onClick={() => onRead(alert.amendment.id)}
                className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                style={{
                  color: 'var(--color-primary-600)',
                  border: '1px solid var(--color-primary-200)',
                  background: 'var(--color-primary-50)',
                }}
              >
                <Eye size={12} />
                Mark as Read
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const { t } = useTranslation();
  const { alerts, loading, markAsRead, markAllRead, dismiss } = useAlerts();

  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [showOnlyMyProducts, setShowOnlyMyProducts] = useState(false);

  const handleRead = (id: string) => {
    markAsRead(id);
  };

  const handleDismiss = (id: string) => {
    dismiss(id);
  };

  const handleMarkAllRead = () => {
    markAllRead();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
        <p className="text-muted-foreground">Loading alerts...</p>
      </div>
    );
  }

  // Filter alerts
  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'ALL' && a.amendment.severity !== filterSeverity) return false;
    if (showOnlyMyProducts && a.affectedProducts.length === 0) return false;
    return true;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const productAlertCount = alerts.filter(a => a.affectedProducts.length > 0).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {t('alerts.title')}
        </h1>
        <p
          className="text-sm mb-4"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Stay informed about changes to BIS standards that affect your products.
          Alerts are automatically matched to products in your workspace.
        </p>

        {/* Stats bar */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <div
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{
              background: unreadCount > 0 ? '#fef2f2' : 'var(--color-surface-elevated)',
              color: unreadCount > 0 ? '#dc2626' : 'var(--color-text-muted)',
              border: `1px solid ${unreadCount > 0 ? '#fecaca' : 'var(--color-border)'}`,
            }}
          >
            <Bell size={12} />
            {unreadCount} unread
          </div>
          <div
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{
              background: productAlertCount > 0 ? 'var(--color-primary-50)' : 'var(--color-surface-elevated)',
              color: productAlertCount > 0 ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
              border: `1px solid ${productAlertCount > 0 ? 'var(--color-primary-200)' : 'var(--color-border)'}`,
            }}
          >
            <Package size={12} />
            {productAlertCount} affecting your products
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              style={{
                color: 'var(--color-primary-600)',
                border: '1px solid var(--color-primary-200)',
                background: 'var(--color-primary-50)',
              }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter size={13} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Filter:
            </span>
          </div>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-md appearance-none cursor-pointer"
            style={{
              background: 'var(--color-surface-elevated)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <option value="ALL">All Severities</option>
            <option value="REVIEW_RECOMMENDED">⚠️ Review Recommended</option>
            <option value="POTENTIAL_IMPACT">📋 Potential Impact</option>
            <option value="INFORMATION_ONLY">ℹ️ Information Only</option>
          </select>
          <label
            className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <input
              type="checkbox"
              checked={showOnlyMyProducts}
              onChange={e => setShowOnlyMyProducts(e.target.checked)}
              className="rounded"
            />
            Only show alerts for my products
          </label>
        </div>
      </div>

      {/* Demo notice */}
      <div
        className="safety-footer mb-6"
        data-testid="alerts-demo-notice"
      >
        <Info size={14} />
        <span>{t('alerts.demoNotice')}</span>
      </div>

      {/* Alert Cards */}
      {filteredAlerts.length === 0 ? (
        <div
          className="card p-12 text-center"
          style={{ background: 'var(--color-surface-elevated)' }}
        >
          <Bell
            size={40}
            className="mx-auto mb-3"
            style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}
          />
          <h3
            className="text-lg font-semibold mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            No matching alerts
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {showOnlyMyProducts
              ? 'No amendments currently affect your workspace products. Add products to get personalized alerts.'
              : 'No amendments match the current filter. Try changing the severity filter.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {filteredAlerts.map(alert => (
            <AlertCard
              key={alert.amendment.id}
              alert={alert}
              onRead={handleRead}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}
