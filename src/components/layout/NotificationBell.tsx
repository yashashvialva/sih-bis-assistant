'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, X, AlertTriangle, ChevronRight, Package } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import type { ProductAlert } from '@/lib/types';

const SEVERITY_COLORS: Record<string, { dot: string; text: string }> = {
  REVIEW_RECOMMENDED: { dot: '#ef4444', text: '#dc2626' },
  POTENTIAL_IMPACT: { dot: '#f59e0b', text: '#d97706' },
  INFORMATION_ONLY: { dot: '#6b7280', text: '#6b7280' },
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { alerts, loading, markAllRead } = useAlerts();
  const unreadCount = alerts.filter(a => !a.isRead).length;
  const displayAlerts = alerts.slice(0, 5);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleMarkAllRead = () => {
    markAllRead();
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-all duration-200 hover:scale-105"
        style={{
          color: isOpen ? 'var(--color-primary-600)' : 'var(--color-text-secondary)',
          background: isOpen ? 'var(--color-primary-50)' : 'transparent',
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        data-testid="notification-bell"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full px-1"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
              animation: 'pulse-soft 2s ease-in-out infinite',
            }}
            data-testid="notification-badge"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-96 max-h-[480px] overflow-hidden rounded-xl animate-fade-in"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
            zIndex: 100,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: 'var(--color-interpretation-600)' }} />
              <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Standard Amendments
              </span>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'var(--color-interpretation-100)',
                    color: 'var(--color-interpretation-700)',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium px-2 py-1 rounded-md transition-colors"
                  style={{
                    color: 'var(--color-primary-600)',
                    background: 'transparent',
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Alert Items */}
          <div className="overflow-y-auto max-h-[340px]">
            {displayAlerts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No relevant alerts
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
                  Add products to your workspace to receive personalized alerts
                </p>
              </div>
            ) : (
              displayAlerts.map(alert => {
                const severity = SEVERITY_COLORS[alert.amendment.severity] ?? SEVERITY_COLORS.INFORMATION_ONLY;
                return (
                  <Link
                    key={alert.amendment.id}
                    href="/alerts"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 transition-colors"
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      background: alert.isRead ? 'transparent' : 'var(--color-primary-50)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread dot */}
                      <div className="mt-1.5 flex-shrink-0">
                        {!alert.isRead ? (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: severity.dot }}
                          />
                        ) : (
                          <div className="w-2 h-2" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: severity.text }}
                          >
                            {alert.amendment.severity.replace(/_/g, ' ')}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              background: 'var(--color-surface-elevated)',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            {alert.amendment.standardNumber}
                          </span>
                        </div>
                        <p
                          className="text-xs font-medium leading-tight mb-1 truncate"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {alert.amendment.title.replace('[SIMULATED] ', '')}
                        </p>

                        {/* Affected Products */}
                        {alert.affectedProducts.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Package size={10} style={{ color: 'var(--color-primary-500)' }} />
                            <span
                              className="text-[10px]"
                              style={{ color: 'var(--color-primary-600)' }}
                            >
                              Affects: {alert.affectedProducts.map(p => p.name).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <ChevronRight
                        size={14}
                        className="flex-shrink-0 mt-1"
                        style={{ color: 'var(--color-text-muted)' }}
                      />
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <Link
            href="/alerts"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-center text-xs font-semibold transition-colors"
            style={{
              color: 'var(--color-primary-600)',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-surface-elevated)',
            }}
          >
            View All Alerts →
          </Link>
        </div>
      )}
    </div>
  );
}
