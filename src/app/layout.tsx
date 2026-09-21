import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ThemeProvider from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9F9FB" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0F" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ritualis.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ritualis — Elevate Every Day | Sacred Habit & Routine Tracker",
    template: "%s | Ritualis",
  },
  description:
    "The precision habit tracking and daily routine architecture. Elevate habits into sacred daily rituals with habit stacking, streak freeze protection, numeric steppers, and personal growth analytics.",
  keywords: [
    "Ritualis",
    "habit tracker",
    "best habit tracking app",
    "daily routines",
    "atomic habits app",
    "habit stacking",
    "streak freeze",
    "streak tracker",
    "routine planner",
    "daily discipline",
    "productivity tracker",
    "mindfulness routines",
    "personal growth",
    "pomodoro timer",
    "habit journal",
  ],
  authors: [{ name: "Kishan Pokal" }],
  creator: "Ritualis",
  publisher: "Ritualis",
  applicationName: "Ritualis",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Ritualis — Elevate Every Day | Sacred Habit & Routine Tracker",
    description:
      "Transform daily habits into sacred rituals. Features habit stacking, streak freeze protection, numeric counters, and daily reflection for unstoppable consistency.",
    url: siteUrl,
    siteName: "Ritualis",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ritualis — Elevate Every Day",
    description:
      "Transform daily habits into sacred rituals with streak shields, habit stacking, and deep reflections.",
    creator: "@ritualis",
  },
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

// Google Search Engine Structured Data (JSON-LD)
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      "name": "Ritualis",
      "url": siteUrl,
      "applicationCategory": "ProductivityApplication, LifestyleApplication",
      "operatingSystem": "Web, iOS, Android, macOS, Windows",
      "description":
        "An elevated habit and daily practice tracker with habit stacking, numeric counters, streak freeze shields, and daily reflection journaling.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "1480",
        "bestRating": "5",
        "worstRating": "1",
      },
      "featureList": [
        "Numeric & Counter habits (+/- steppers)",
        "Time-of-day Habit Stacking (Morning, Afternoon, Evening)",
        "Streak Freeze Safeguards ('Never Miss Twice')",
        "Daily micro-reflections & habit notes",
        "Bad habit breaker and savings calculator",
        "50+ Tiered achievement badges",
        "Pomodoro focus timer",
        "Advanced analytics with PDF & CSV performance exports",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      "url": siteUrl,
      "name": "Ritualis",
      "description": "Elevate daily habits into sacred rituals.",
      "publisher": {
        "@type": "Organization",
        "name": "Ritualis",
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/icon.svg`,
        },
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data for Google Ranking */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased overflow-x-hidden`}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
