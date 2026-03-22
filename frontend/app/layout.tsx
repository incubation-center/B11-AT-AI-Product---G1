import type { Metadata } from 'next';
import { Fraunces, Manrope, Geist } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const fraunces = Fraunces({
  variable: '--font-dashboard-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const manrope = Manrope({
  variable: '--font-dashboard-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Coolhat - Your Virtual Shop Assistant',
  description:
    'Coolhat helps SMEs build AI-powered storefronts with Telegram integration and a virtual assistant that knows every product.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn('font-sans', geist.variable)}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body
        className={`${fraunces.variable} ${manrope.variable} bg-white font-[family:var(--font-dashboard-sans)] antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
