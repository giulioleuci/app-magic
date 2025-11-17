
import type { Metadata } from 'next';
import './globals.css';
import { CardProvider } from '@/context/CardContext';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { LanguageProvider } from '@/context/LanguageContext';
import { SearchProvider } from '@/context/SearchContext';
import { MultiSelectProvider } from '@/context/MultiSelectContext';
import { PrintOptionsProvider } from '@/context/PrintOptionsContext';

export const metadata: Metadata = {
  title: 'ProxyForge Web',
  description: 'Create and print card proxies.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background font-sans')}>
        <LanguageProvider>
          <SearchProvider>
            <CardProvider>
              <MultiSelectProvider>
                <PrintOptionsProvider>
                  {children}
                </PrintOptionsProvider>
              </MultiSelectProvider>
            </CardProvider>
          </SearchProvider>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
