import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Coolhat – Your Virtual Shop Assistant",
  description:
    "Coolhat helps SMEs build AI-powered storefronts with Telegram integration and a virtual assistant that knows every product.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" data-theme="light">
      <body className={`${poppins.variable} antialiased bg-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

