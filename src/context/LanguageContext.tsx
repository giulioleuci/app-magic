
"use client";

import React, { createContext, useState, useContext, type ReactNode } from 'react';
import { en } from '@/lib/i18n/en';
import { it } from '@/lib/i18n/it';

type Language = 'en' | 'it';

const translations = { en, it };

// Function to perform translations with placeholders
const translate = (lang: Language, key: string, placeholders: { [key: string]: string } = {}): string => {
    const keys = key.split('.');
    let a: any = translations[lang];
    for (const k of keys) {
        if (a && typeof a === 'object' && k in a) {
            a = a[k];
        } else {
            return key; // Return key if not found
        }
    }
    
    if (typeof a === 'string') {
        return Object.entries(placeholders).reduce(
            (acc, [placeholder, value]) => acc.replace(`{${placeholder}}`, value),
            a
        );
    }
    
    return key;
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, placeholders?: { [key: string]: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string, placeholders?: { [key: string]: string }) => {
    return translate(language, key, placeholders);
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
