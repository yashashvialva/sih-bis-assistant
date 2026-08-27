'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Plus,
  Package,
  ArrowRight,
  Trash2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  getProducts,
  createProduct,
  deleteProduct,
} from '@/lib/workspace/store';
import { PRODUCT_CATEGORIES } from '@/lib/mock-data/seedData';
import type { Product } from '@/lib/types';

export default function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>(() => {
    return getProducts();
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category) return;

    const product = createProduct({
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
    });

    setProducts(prev => [...prev, product]);
    setFormData({ name: '', description: '', category: '' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

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

      {/* Create Product Form */}
      {showForm && (
        <div className="card p-6 mb-6 animate-fade-in">
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
                placeholder="e.g., Electric Kettle Model EK-2000"
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
                {PRODUCT_CATEGORIES.map(cat => (
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
        <div className="card p-12 text-center">
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
              className="card p-5 flex items-center justify-between group"
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
                  <h3
                    className="font-semibold text-sm truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {product.name}
                  </h3>
                  <p
                    className="text-xs truncate"
                    style={{ color: 'var(--color-text-muted)' }}
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
                onClick={() => handleDelete(product.id)}
                className="btn btn-ghost btn-sm ml-2 opacity-0 group-hover:opacity-100"
                style={{
                  color: 'var(--color-text-muted)',
                  transition: 'opacity var(--transition-base)',
                }}
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
