import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

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
    <html lang="en" className="font-sans" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="bg-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
