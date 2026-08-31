'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Plus,
  Package,
  ArrowRight,
  Trash2,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import type { Product } from '@/lib/types';
import { useAlerts, doesAmendmentAffectProduct } from '@/hooks/useAlerts';

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { alerts } = useAlerts();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
  });

  useEffect(() => {
    console.log('[DEBUG ProductsPage] alerts:', alerts);
    console.log('[DEBUG ProductsPage] products:', products);
  }, [alerts, products]);

  const DEMO_CATEGORIES = [
    'Domestic Electric Appliances',
    'Steel Products',
    'Textiles',
    'Electronics',
    'Electric Kettle',
    'Ceiling Fan',
    'LED Lamp',
    'Air Conditioner',
    'Microwave Oven'
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category) return;

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
        })
      });

      if (!res.ok) throw new Error('Failed to create product');
      
      const data = await res.json();
      setProducts(prev => [data.product, ...prev]);
      setFormData({ name: '', description: '', category: '' });
      setShowForm(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{
              background: 'var(--color-primary-50)',
              color: 'var(--color-primary-700)',
            }}
          >
            <Sparkles size={12} />
            Tier 1 — Compliance Workspace
          </div>
          <h1
            className="text-3xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('products.title')}
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          <Plus size={16} />
          {t('products.create')}
        </button>
      </div>

      {error && (
        <div className="card p-4 mb-6 bg-destructive/10 border-destructive/20 text-destructive text-sm font-medium">
          {error}
        </div>
      )}

      {/* Create Product Form */}
      {showForm && (
        <div className="card p-6 mb-6 animate-fade-in border shadow-sm">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {t('products.create')}
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t('products.name')}
              </label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., 1.5L Electric Kettle Model EK-2000"
                required
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t('products.description')}
              </label>
              <textarea
                className="input"
                rows={3}
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe your product — what it does, materials used, intended market..."
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t('products.category')}
              </label>
              <select
                className="input"
                value={formData.category}
                onChange={e =>
                  setFormData(prev => ({ ...prev, category: e.target.value }))
                }
                required
              >
                <option value="">Select a category...</option>
                {DEMO_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary">
                Create Product
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                {t('general.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product List */}
      {products.length === 0 ? (
        <div className="card p-12 text-center bg-muted/30">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'var(--color-surface-elevated)',
              color: 'var(--color-text-muted)',
            }}
          >
            <Package size={28} />
          </div>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {t('products.empty')}
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {products.map(product => (
            <div
              key={product.id}
              className="card p-5 flex items-center justify-between group hover:shadow-md transition-shadow"
            >
              <Link
                href={`/products/${product.id}`}
                className="flex-1 flex items-center gap-4 min-w-0"
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))',
                  }}
                >
                  <Package size={18} color="white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className="font-semibold text-base truncate"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {product.name}
                    </h3>
                    
                    {/* Warning Indicator if affected by unread alerts */}
                    {alerts.some(a => !a.isDismissed && doesAmendmentAffectProduct(a.amendment, product)) && (
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                        <AlertTriangle size={12} />
                        ACTION REQUIRED
                      </div>
                    )}
                  </div>
                  
                  <p
                    className="text-sm truncate"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {product.category}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100"
                  style={{
                    color: 'var(--color-text-muted)',
                    transition: 'opacity var(--transition-base)',
                  }}
                />
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(product.id);
                }}
                className="btn btn-ghost btn-sm ml-2 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive"
                style={{ transition: 'opacity var(--transition-base)' }}
                aria-label={`Delete ${product.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
