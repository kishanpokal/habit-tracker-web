import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ThemeProvider from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HabitFlow — Build Better Habits",
  description:
    "A powerful, beautiful habit tracking app to help you build consistency, track streaks, and achieve your goals. Built with Next.js, Firebase, and modern web technologies.",
  keywords: [
    "habit tracker",
    "productivity",
    "habits",
    "streak tracking",
    "goal setting",
  ],
  authors: [{ name: "Kishan Pokal" }],
  openGraph: {
    title: "HabitFlow — Build Better Habits",
    description: "Track habits, build streaks, and become your best self.",
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
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4169484162979613"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={`${inter.variable} font-sans antialiased overflow-x-hidden`}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
