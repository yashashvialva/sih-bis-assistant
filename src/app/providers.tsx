'use client';

import { LanguageProvider } from '@/lib/i18n/useTranslation';
import { Header } from '@/components/layout/Header';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer
          className="py-6 text-center text-xs"
          style={{
            color: 'var(--color-text-muted)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <p>
            BIS Compliance Assistant
          </p>
        </footer>
      </div>
    </LanguageProvider>
  );
}
