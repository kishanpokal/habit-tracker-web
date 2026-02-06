"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState, useEffect } from "react";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll to add background blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const navItems = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      enabled: true, 
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      )
    },
    { 
      name: "Analytics", 
      href: "/analytics", 
      enabled: true, 
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      )
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Navigation - Top */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg" 
            : "bg-white/60 dark:bg-gray-900/60 backdrop-blur-md"
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-200">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="hidden sm:block text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HabitFlow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navItems.map((item) =>
                item.enabled ? (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative px-4 lg:px-5 py-2 rounded-xl text-sm lg:text-base font-semibold transition-all duration-200 flex items-center gap-2 ${
                      pathname === item.href
                        ? "text-white"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    {pathname === item.href && (
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg" />
                    )}
                    <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                ) : null
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* User Avatar - Desktop Only */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                  U
                </div>
              </div>

              {/* Logout Button - Desktop/Tablet */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-4 lg:px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Slide-in */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[280px] bg-white dark:bg-gray-900 shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                HabitFlow
              </span>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navItems.map((item) =>
                item.enabled ? (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold transition-all ${
                      pathname === item.href
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-[1.02]"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                    {item.name}
                  </Link>
                ) : null
              )}
            </div>
          </nav>

          {/* Mobile Menu Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            {/* User Info */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">View Profile</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm font-semibold shadow-lg active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="max-w-md mx-auto px-2 py-2 safe-bottom">
          <div className="flex items-center justify-around gap-1">
            {navItems.map((item) =>
              item.enabled ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    pathname === item.href
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.icon}
                  </svg>
                  <span className="text-xs font-semibold">{item.name}</span>
                </Link>
              ) : null
            )}
            
            {/* Mobile Logout in Bottom Nav */}
            <button
              onClick={handleLogout}
              className="flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-xs font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for fixed navigation */}
      <style jsx global>{`
        /* Add safe area for iOS devices */
        .safe-bottom {
          padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
        }

        /* Prevent layout shift from fixed nav */
        body {
          padding-top: 0;
          padding-bottom: 0;
        }

        @media (max-width: 768px) {
          body {
            padding-bottom: calc(4rem + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </>
  );
}