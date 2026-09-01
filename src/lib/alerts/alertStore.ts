/**
 * BIS Compliance Assistant — Smart Alert Store
 * 
 * Manages alert state (read/dismissed) in localStorage and provides
 * logic to cross-reference amendments with the user's workspace products.
 * 
 * Since we have no user auth, this operates as an open demo system
 * where all products belong to a single anonymous workspace.
 */

import type { SimulatedAmendment, Product, ProductAlert } from '@/lib/types';
import { DEMO_AMENDMENTS, DEMO_STANDARDS } from '@/lib/mock-data/seedData';
import { getProducts } from '@/lib/workspace/store';

const ALERT_STATE_KEY = 'bis-alert-state';

interface AlertState {
  /** Amendment IDs the user has read */
  readIds: string[];
  /** Amendment IDs the user has dismissed */
  dismissedIds: string[];
  /** Timestamp of the last time the user checked alerts */
  lastCheckedAt: string;
}

export function getAlertState(): AlertState {
  if (typeof window === 'undefined') {
    return { readIds: [], dismissedIds: [], lastCheckedAt: '' };
  }
  try {
    const saved = localStorage.getItem(ALERT_STATE_KEY);
    if (saved) return JSON.parse(saved) as AlertState;
  } catch {
    // Ignore parse errors
  }
  return { readIds: [], dismissedIds: [], lastCheckedAt: '' };
}

function saveAlertState(state: AlertState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ALERT_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

// ─── Standard ↔ Product Category Mapping ─────────────────────

/**
 * Maps a product's category to the standard numbers that apply to it.
 * Uses both the DEMO_STANDARDS lookup AND the amendment's own
 * `affectedProductCategories` field for cross-referencing.
 */
function getStandardsForCategory(category: string): string[] {
  const standards = DEMO_STANDARDS
    .filter(s => s.productCategory.toLowerCase() === category.toLowerCase())
    .map(s => s.standardNumber);
  return standards;
}

/**
 * Check if an amendment affects a given product based on:
 * 1. Standard number match (product's standard matches amendment's standard)
 * 2. Category match (amendment's affectedProductCategories includes the product's category)
 */
function doesAmendmentAffectProduct(amendment: SimulatedAmendment, product: Product): boolean {
  // Check category match via affectedProductCategories
  if (amendment.affectedProductCategories?.length) {
    const matches = amendment.affectedProductCategories.some(
      cat => cat.toLowerCase() === product.category.toLowerCase()
    );
    if (matches) return true;
  }

  // Check standard number match
  const productStandards = getStandardsForCategory(product.category);
  return productStandards.some(std => std === amendment.standardNumber);
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Get all amendments (static demo).
 * In production, this would query Supabase.
 */
export function getAllAmendments(): SimulatedAmendment[] {
  return DEMO_AMENDMENTS;
}

/**
 * Cross-reference all amendments against the user's workspace products
 * and return personalized ProductAlert objects.
 */
export function getPersonalizedAlerts(): ProductAlert[] {
  const products = getProducts();
  const amendments = getAllAmendments();
  const alertState = getAlertState();

  const alerts: ProductAlert[] = [];

  for (const amendment of amendments) {
    // Skip dismissed amendments
    if (alertState.dismissedIds.includes(amendment.id)) continue;

    // Find which of the user's products are affected
    const affectedProducts = products.filter(p =>
      doesAmendmentAffectProduct(amendment, p)
    );

    // Only show alerts that are relevant to at least one product,
    // OR show all alerts if the user has no products (so the demo is still useful)
    if (affectedProducts.length > 0 || products.length === 0) {
      alerts.push({
        amendment,
        affectedProducts,
        isRead: alertState.readIds.includes(amendment.id),
        isDismissed: false,
      });
    }
  }

  // Sort by date (newest first), then by severity
  const severityOrder: Record<string, number> = {
    'REVIEW_RECOMMENDED': 0,
    'POTENTIAL_IMPACT': 1,
    'INFORMATION_ONLY': 2,
  };

  alerts.sort((a, b) => {
    const dateA = new Date(a.amendment.publishedDate).getTime();
    const dateB = new Date(b.amendment.publishedDate).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return (severityOrder[a.amendment.severity] ?? 2) - (severityOrder[b.amendment.severity] ?? 2);
  });

  return alerts;
}

/**
 * Get the count of unread alerts relevant to the user's products.
 */
export function getUnreadAlertCount(): number {
  const alerts = getPersonalizedAlerts();
  return alerts.filter(a => !a.isRead).length;
}

/**
 * Mark an amendment as read.
 */
export function markAlertAsRead(amendmentId: string): void {
  const state = getAlertState();
  if (!state.readIds.includes(amendmentId)) {
    state.readIds.push(amendmentId);
    saveAlertState(state);
  }
}

/**
 * Mark all alerts as read.
 */
export function markAllAlertsAsRead(): void {
  const state = getAlertState();
  const amendments = getAllAmendments();
  state.readIds = amendments.map(a => a.id);
  state.lastCheckedAt = new Date().toISOString();
  saveAlertState(state);
}

/**
 * Dismiss an amendment (hide it permanently).
 */
export function dismissAlert(amendmentId: string): void {
  const state = getAlertState();
  if (!state.dismissedIds.includes(amendmentId)) {
    state.dismissedIds.push(amendmentId);
    saveAlertState(state);
  }
}
