import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { defaultOgImages, siteUrl } from "@/modules/landing/seo";
import { defaultLocale, isLocale } from "@/i18n/routing";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Solo Speaker",
  description: "AI preparation and speaking studio for talks.",
  openGraph: {
    siteName: "Solo Speaker Studio",
    type: "website",
    images: defaultOgImages
  },
  twitter: {
    card: "summary_large_image",
    images: defaultOgImages
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  }
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const headerLocale = (await headers()).get("x-locale") ?? defaultLocale;
  const locale = isLocale(headerLocale) ? headerLocale : defaultLocale;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
