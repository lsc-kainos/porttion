'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { SWRConfig } from 'swr';
import { TooltipProvider } from '@/components/atoms/ui/tooltip';
import { Toaster } from '@/components/atoms/ui/sonner';
import { swrFetcher } from '@/lib/swr-fetcher';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <SWRConfig
        value={{
          fetcher: swrFetcher,
          revalidateOnFocus: false,
          shouldRetryOnError: (err: { statusCode?: number }) =>
            !err.statusCode || err.statusCode >= 500,
        }}
      >
        <TooltipProvider delayDuration={150}>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </SWRConfig>
    </NextThemesProvider>
  );
}
