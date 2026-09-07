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
};

export const metadata: Metadata = {
  title: "HabitFlow — Build Better Habits",
  description:
    "A modern, high-performance habit tracker web app with daily consistency scoring, advanced analytics, interactive journal, and achievement rewards.",
  keywords: [
    "habit tracker",
    "productivity",
    "habits",
    "streak tracking",
    "goal setting",
    "journal",
  ],
  authors: [{ name: "Kishan Pokal" }],
  openGraph: {
    title: "HabitFlow — Build Better Habits",
    description: "Track habits, build streaks, write in your journal, and become your best self.",
    type: "website",
  },
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
