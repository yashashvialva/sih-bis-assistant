'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { t as translate, type SupportedLanguage } from './dictionaries';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  const tFn = useCallback(
    (key: string) => translate(key, language),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: tFn }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
