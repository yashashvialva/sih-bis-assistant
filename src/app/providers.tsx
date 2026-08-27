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
            BIS Compliance Assistant — Built for SIH Problem Statement 26107
          </p>
          <p className="mt-1">
            This application is not affiliated with or endorsed by the Bureau of Indian Standards.
          </p>
        </footer>
      </div>
    </LanguageProvider>
  );
}
