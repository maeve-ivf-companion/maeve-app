import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/provider";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maeve — the IVF companion that finally gets it",
  description:
    "Maeve by Maman. The first companion built ground-up for the IVF journey: hormone tracking, a partner who shows up, and space for every kind of day. Bilingual EN/FR.",
};

export const viewport: Viewport = {
  themeColor: "#2b1b3d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
