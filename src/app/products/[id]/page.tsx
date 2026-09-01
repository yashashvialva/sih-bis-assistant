'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Map,
  FileText,
  CheckCircle2,
  Package,
  AlertTriangle,
  Info,
  ShieldCheck
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAlerts, doesAmendmentAffectProduct } from '@/hooks/useAlerts';

export default function ProductWorkspacePage() {
  const params = useParams();
  const productId = params.id as string;
  const { t } = useTranslation();
  const { alerts } = useAlerts();

  const [product, setProduct] = useState<any>(null);
  const [mappedStandards, setMappedStandards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roadmap, setRoadmap] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error('Failed to fetch product details');
      const data = await res.json();
      setProduct(data.product);
      setMappedStandards(data.mappedStandards || []);

      // Check if a roadmap already exists in the database
      const rmRes = await fetch(`/api/products/${productId}/roadmap`);
      if (rmRes.ok) {
        const rmData = await rmRes.json();
        if (rmData.roadmap) {
          setRoadmap(rmData.roadmap);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!product) return;
    setIsGenerating(true);
    setRoadmapError(null);
    try {
      const response = await fetch(`/api/products/${productId}/roadmap`, {
        method: 'POST'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate roadmap');
      }
      
      setRoadmap(data.roadmap);
      // Redirect to the interactive roadmap page
      window.location.href = `/products/${productId}/roadmap`;
    } catch (err: any) {
      console.error('Failed to generate roadmap:', err);
      setRoadmapError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center animate-fade-in">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading workspace...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="card p-8 text-center bg-destructive/10 border-destructive/20">
          <AlertTriangle size={32} className="mx-auto mb-3 text-destructive" />
          <p className="text-destructive font-medium">{error || 'Product not found.'}</p>
        </div>
        <Link href="/products" className="btn btn-secondary mt-6">
          <ArrowLeft size={14} />
          Back to Products
        </Link>
      </div>
    );
  }

  const renderRoadmapSection = (title: string, items: any[]) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3 border-b pb-2">{title}</h3>
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-muted/40 border">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-foreground">{item.requirement}</span>
                {item.source_standard && (
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                    {item.source_standard} {item.clause ? `| ${item.clause}` : ''}
                  </span>
                )}
              </div>
              {item.evidence && (
                <div className="text-sm text-muted-foreground bg-background p-3 rounded border border-dashed mt-2">
                  <span className="font-semibold block mb-1">Source Evidence:</span>
                  {item.evidence}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        {t('general.back')} to Products
      </Link>

      {/* Product Header */}
      <div className="card p-6 mb-8 border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
            <Package size={28} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-foreground">
              {product.name}
            </h1>
            <p className="text-muted-foreground mb-3 max-w-2xl">
              {product.description || 'No description provided.'}
            </p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground">
              Category: {product.category}
            </div>
          </div>
        </div>
      </div>

      {/* Applicable Standards Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText size={20} className="text-primary" />
          {t('products.applicableStandards')}
        </h2>
        {mappedStandards.length > 0 ? (
          <div className="grid gap-3">
            {mappedStandards.map(mapping => (
              <div key={mapping.id} className="card p-5 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{mapping.standard_number}</h3>
                  <p className="text-sm text-muted-foreground">{mapping.description}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold whitespace-nowrap">
                  <ShieldCheck size={14} />
                  AUTHORITATIVE BIS DATA
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-6 bg-muted/30 text-center border-dashed">
            <Info size={24} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">No authoritative BIS standard is currently available for this product in the knowledge base.</p>
          </div>
        )}
      </div>

      {/* Banner for Pending Amendments */}
      {(() => {
        if (!product) return null;
        const relevantAlerts = alerts.filter(a => !a.isDismissed && doesAmendmentAffectProduct(a.amendment, product));
        if (relevantAlerts.length === 0) return null;
        
        const hasPotentialImpact = relevantAlerts.some(a => a.amendment.severity === 'POTENTIAL_IMPACT');
        const hasReviewRecommended = relevantAlerts.some(a => a.amendment.severity === 'REVIEW_RECOMMENDED');
        
        let colorClasses = "border-sky-500/30 bg-sky-50";
        let textClasses = "text-sky-800";
        let subTextClasses = "text-sky-700/80";
        let icon = <Info size={20} />;
        let title = "INFORMATION: New Standard Updates Available";
        
        if (hasPotentialImpact) {
          colorClasses = "border-rose-500/30 bg-rose-50";
          textClasses = "text-rose-800";
          subTextClasses = "text-rose-700/80";
          icon = <AlertTriangle size={20} />;
          title = "ACTION REQUIRED: New Standard Updates Available";
        } else if (hasReviewRecommended) {
          colorClasses = "border-amber-500/30 bg-amber-50";
          textClasses = "text-amber-800";
          subTextClasses = "text-amber-700/80";
          icon = <AlertTriangle size={20} />;
          title = "REVIEW RECOMMENDED: New Standard Updates Available";
        }

        return (
          <div className={`mb-8 p-6 rounded-xl border-2 animate-fade-in shadow-sm ${colorClasses}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${textClasses}`}>
                  {icon}
                  {title}
                </h3>
                <p className={`text-sm mt-1 max-w-xl ${subTextClasses}`}>
                  There are new standard amendments that directly affect this product. 
                  Please open your compliance roadmap to generate the new mandatory compliance tasks based on these changes.
                </p>
              </div>
              <Link
                href={`/products/${product.id}/roadmap`}
                className="btn flex-shrink-0 text-white font-bold px-4 py-2 rounded-lg"
                style={{ background: 'var(--color-primary-600)' }}
              >
                Open Roadmap
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Roadmap Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Map size={20} className="text-primary" />
            {t('roadmap.title')}
          </h2>
          {!roadmap && mappedStandards.length > 0 && (
            <button
              onClick={handleGenerateRoadmap}
              disabled={isGenerating}
              className="btn btn-primary"
            >
              {isGenerating ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
              ) : (
                <><Map size={16} /> Generate Roadmap</>
              )}
            </button>
          )}
        </div>

        {roadmapError && (
          <div className="card p-5 bg-destructive/10 border-destructive/20 text-destructive flex items-start gap-3">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Roadmap Generation Failed</p>
              <p className="text-sm mt-1">{roadmapError}</p>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="card p-12 text-center border-dashed">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="font-medium">Extracting verified compliance evidence...</p>
            <p className="text-sm text-muted-foreground mt-2">This is powered by the existing RAG engine and may take up to 20 seconds.</p>
          </div>
        )}

        {roadmap && !isGenerating && (
          <div className="card p-6 border shadow-sm text-center">
            <div className="bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 p-4 rounded-lg mb-6 flex items-center justify-center gap-3 border border-emerald-100 dark:border-emerald-800/30">
              <CheckCircle2 size={24} />
              <h4 className="font-bold text-lg">{t('roadmap.ready')}</h4>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Your compliance roadmap has been generated and securely saved to the database.
            </p>

            <Link 
              href={`/products/${productId}/roadmap`}
              className="btn btn-primary px-8 py-3 shadow-sm text-base inline-flex items-center gap-2"
            >
              <Map size={18} />
              {t('roadmap.openInteractive')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
