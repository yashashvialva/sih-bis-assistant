'use client';

import Link from 'next/link';
import {
  MessageSquareText,
  Package,
  FileCheck2,
  FlaskConical,
  ShieldCheck,
  Bell,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const FEATURES = [
  {
    icon: MessageSquareText,
    titleKey: 'BIS Assistant Q&A',
    description: 'Ask natural-language questions about Indian Standards, certification, and testing requirements. Every answer includes source references.',
    href: '/assistant',
    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
    tier: 'Tier 1',
  },
  {
    icon: Package,
    titleKey: 'Compliance Roadmap',
    description: 'Describe your product, get a structured certification roadmap with required standards, tests, documents, and laboratories.',
    href: '/products',
    gradient: 'linear-gradient(135deg, #059669, #34d399)',
    tier: 'Tier 1',
  },
  {
    icon: FileCheck2,
    titleKey: 'Document Checker',
    description: 'Upload compliance documents for AI-assisted review against applicable BIS requirements. Evidence-based, not binary verdicts.',
    href: '/products',
    gradient: 'linear-gradient(135deg, #d97706, #fbbf24)',
    tier: 'Tier 2',
  },
  {
    icon: FlaskConical,
    titleKey: 'Lab Directory',
    description: 'Browse testing laboratories filtered by location and product category. Demo dataset for prototype.',
    href: '/labs',
    gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    tier: 'Tier 3',
  },
  {
    icon: ShieldCheck,
    titleKey: 'Consumer Verification',
    description: 'Verify registration or licence numbers against the demo corpus. Clearly distinguishes matched vs. unmatched records.',
    href: '/verify',
    gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)',
    tier: 'Tier 3',
  },
  {
    icon: Bell,
    titleKey: 'Amendment Monitor',
    description: 'Simulated standard amendment alerts tied to workspace products. Uses safe non-declarative wording.',
    href: '/alerts',
    gradient: 'linear-gradient(135deg, #dc2626, #f87171)',
    tier: 'Tier 3',
  },
];

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'Source-First',
    description: 'No authoritative claim without retrieved evidence from the curated BIS corpus.',
  },
  {
    icon: BookOpen,
    title: 'Transparent AI',
    description: 'Every response clearly distinguishes verified BIS data from AI interpretation.',
  },
  {
    icon: CheckCircle2,
    title: 'No Fake Certainty',
    description: 'The system never declares compliance status — that authority belongs to BIS-recognized bodies.',
  },
];

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero-gradient py-20 sm:py-28 px-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div
          className="absolute top-10 right-10 w-72 h-72 rounded-full opacity-10 animate-float"
          style={{ background: 'var(--color-primary-300)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute bottom-10 left-10 w-48 h-48 rounded-full opacity-10 animate-float"
          style={{ background: 'var(--color-verified-400)', filter: 'blur(40px)', animationDelay: '1.5s' }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">


          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
            style={{ color: 'white' }}
          >
            {t('landing.title')}
          </h1>

          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'rgba(255, 255, 255, 0.8)' }}
          >
            {t('landing.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/assistant" className="btn btn-lg" style={{
              background: 'white',
              color: 'var(--color-primary-700)',
              fontWeight: 600,
            }}>
              <MessageSquareText size={18} />
              {t('landing.assistantCta')}
              <ArrowRight size={16} />
            </Link>
            <Link href="/products" className="btn btn-lg" style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}>
              <Package size={18} />
              {t('landing.cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Principles */}
      <section className="py-16 px-4" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl font-bold text-center mb-10"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Built on Trust & Transparency
          </h2>
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {PRINCIPLES.map(principle => (
              <div key={principle.title} className="glass-card p-6 text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: 'var(--color-primary-50)',
                    color: 'var(--color-primary-600)',
                  }}
                >
                  <principle.icon size={24} />
                </div>
                <h3
                  className="font-semibold text-lg mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {principle.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-2xl font-bold text-center mb-3"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Compliance Workflow Features
          </h2>
          <p
            className="text-center mb-10 max-w-2xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            An intelligent compliance workflow layer — not just a search engine.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {FEATURES.map(feature => (
              <Link
                key={feature.titleKey}
                href={feature.href}
                className="card p-6 group cursor-pointer"
                style={{ textDecoration: 'none' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: feature.gradient }}
                  >
                    <feature.icon size={20} color="white" />
                  </div>

                </div>
                <h3
                  className="font-semibold text-base mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {feature.titleKey}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {feature.description}
                </p>
                <div
                  className="flex items-center gap-1 mt-4 text-sm font-medium opacity-0 group-hover:opacity-100"
                  style={{
                    color: 'var(--color-primary-600)',
                    transition: 'opacity var(--transition-base)',
                  }}
                >
                  <span>Explore</span>
                  <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
