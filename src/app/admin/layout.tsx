'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Database, FileText, Activity } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/sources', label: 'Trusted Sources', icon: Database },
    { href: '/admin/documents', label: 'Document Verification', icon: ShieldCheck },
    { href: '/admin/ingestion', label: 'Ingestion Pipeline', icon: Activity },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-64 shrink-0 space-y-2">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--color-primary-700)' }}>
          <ShieldCheck /> Admin Console
        </h2>
        
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: isActive ? 'var(--color-primary-50)' : 'transparent',
                  color: isActive ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
                  borderLeft: isActive ? '3px solid var(--color-primary-600)' : '3px solid transparent',
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 p-4 rounded-lg bg-red-50 text-red-800 text-xs border border-red-100">
          <strong>Security Notice:</strong> In a production environment, this area must be protected by authentication.
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
