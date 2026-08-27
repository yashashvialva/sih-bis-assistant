'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquareText,
  Package,
  FlaskConical,
  ShieldCheck,
  Bell,
  Menu,
  X,
  Globe,
  Home,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const NAV_ITEMS = [
  { href: '/', icon: Home, labelKey: 'nav.home' },
  { href: '/assistant', icon: MessageSquareText, labelKey: 'nav.assistant' },
  { href: '/products', icon: Package, labelKey: 'nav.products' },
  { href: '/labs', icon: FlaskConical, labelKey: 'nav.labs' },
  { href: '/verify', icon: ShieldCheck, labelKey: 'nav.verify' },
  { href: '/alerts', icon: Bell, labelKey: 'nav.alerts' },
];

export function Header() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: `blur(var(--glass-blur))`,
        WebkitBackdropFilter: `blur(var(--glass-blur))`,
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <ShieldCheck size={18} color="white" />
            </div>
            <span
              className="font-bold text-lg tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              BIS
              <span style={{ color: 'var(--color-primary-500)' }}>
                {' '}
                Assist
              </span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="btn btn-ghost btn-sm"
                  style={{
                    color: isActive
                      ? 'var(--color-primary-600)'
                      : 'var(--color-text-secondary)',
                    background: isActive
                      ? 'var(--color-primary-50)'
                      : undefined,
                  }}
                >
                  <item.icon size={16} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          {/* Language Toggle + Mobile Menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="btn btn-ghost btn-sm"
              aria-label="Toggle language"
              data-testid="language-toggle"
            >
              <Globe size={16} />
              <span className="text-xs font-semibold">
                {language === 'en' ? 'HI' : 'EN'}
              </span>
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="btn btn-ghost btn-sm md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav
          className="md:hidden py-3 px-4 animate-fade-in"
          style={{
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map(item => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-ghost"
                  style={{
                    justifyContent: 'flex-start',
                    color: isActive
                      ? 'var(--color-primary-600)'
                      : 'var(--color-text-secondary)',
                    background: isActive
                      ? 'var(--color-primary-50)'
                      : undefined,
                  }}
                >
                  <item.icon size={18} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
