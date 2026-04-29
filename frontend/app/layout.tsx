import type { Metadata } from 'next';
import { Kantumruy_Pro } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import './globals.css';
import { Providers } from './providers';

const kantumruyPro = Kantumruy_Pro({
  weight: ['400', '500', '600', '700'],
  subsets: ['khmer'],
  variable: '--font-khmer',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');

  return {
    title: t('appTitle'),
    description: t('appDescription'),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${kantumruyPro.variable} font-sans ${locale === 'km' ? 'locale-km' : ''}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="bg-white antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
