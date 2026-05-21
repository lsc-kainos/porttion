import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Inter, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { Providers } from '@/components/layout/providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const instrument = localFont({
  src: '../fonts/InstrumentSerif-Italic.woff2',
  variable: '--font-serif',
  style: 'italic',
  weight: '400',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kainos Template',
  description: 'Template Kainos: auth, admin, storage, fila e ai-runtime.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrains.variable} ${instrument.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages} locale="pt-BR">
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
