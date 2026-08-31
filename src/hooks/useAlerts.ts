'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ProductAlert, SimulatedAmendment } from '@/lib/types';
import { 
  getAlertState, 
  markAlertAsRead, 
  markAllAlertsAsRead, 
  dismissAlert 
} from '@/lib/alerts/alertStore';

export function doesAmendmentAffectProduct(amendment: SimulatedAmendment, product: any): boolean {
  if (!amendment.affectedProductCategories || amendment.affectedProductCategories.length === 0) {
    return false;
  }
  return amendment.affectedProductCategories.some(
    cat => cat.toLowerCase() === product.category.toLowerCase()
  );
}

export function useAlerts() {
  const [amendments, setAmendments] = useState<SimulatedAmendment[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Local state to force re-render when a user marks as read
  const [localUpdateState, setLocalUpdateState] = useState(0);

  const refreshLocalState = () => setLocalUpdateState(prev => prev + 1);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch both alerts and products in parallel, ensuring no cache is used
        const [alertsRes, productsRes] = await Promise.all([
          fetch('/api/alerts', { cache: 'no-store' }),
          fetch('/api/products', { cache: 'no-store' })
        ]);
        
        if (!alertsRes.ok) throw new Error('Failed to fetch alerts');
        
        const data = await alertsRes.json();
        
        let fetchedProducts = [];
        if (productsRes.ok) {
          const prodData = await productsRes.json();
          fetchedProducts = prodData.products || [];
        }
        setProducts(fetchedProducts);
        
        // Map DB snake_case to camelCase
        const mappedAmendments = (data.amendments || []).map((db: any) => ({
          id: db.id,
          standardNumber: db.standard_number,
          title: db.title,
          impactSummary: db.impact_summary,
          affectedClause: db.affected_clause,
          severity: db.severity,
          publishedDate: db.published_date,
          whatChanged: db.what_changed || [],
          recommendedActions: db.recommended_actions || [],
          affectedProductCategories: db.affected_product_categories || []
        }));
        
        setAmendments(mappedAmendments);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Compute personalized alerts and memoize them to prevent infinite re-renders
  const personalizedAlerts = useMemo(() => {
    if (loading) return [];
    
    const alertState = getAlertState();
    const alertsMap = new Map<string, ProductAlert>();

    for (const amendment of amendments) {
      if (alertState.dismissedIds.includes(amendment.id)) continue;

      const affectedProducts = products.filter(p => doesAmendmentAffectProduct(amendment, p));

      if (affectedProducts.length > 0 || products.length === 0) {
        alertsMap.set(amendment.id, {
          id: amendment.id,
          amendment,
          affectedProducts,
          isRead: alertState.readIds.includes(amendment.id),
          isDismissed: false
        });
      }
    }

    return Array.from(alertsMap.values());
  }, [amendments, products, loading, localUpdateState]);

  return {
    alerts: personalizedAlerts,
    loading,
    error,
    markAsRead: (id: string) => {
      markAlertAsRead(id);
      refreshLocalState();
    },
    markAllRead: () => {
      markAllAlertsAsRead();
      refreshLocalState();
    },
    dismiss: (id: string) => {
      dismissAlert(id);
      refreshLocalState();
    }
  };
}
