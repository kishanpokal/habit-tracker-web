"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close "more" on route change
  useEffect(() => setShowMore(false), [pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  const userInitial = (user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();

  // All nav items
  const allItems = [
    { name: "Dashboard", short: "Home", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { name: "Analytics", short: "Stats", href: "/analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { name: "Badges", short: "Badges", href: "/badges", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
    { name: "Focus Timer", short: "Focus", href: "/focus", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { name: "Journal", short: "Journal", href: "/journal", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
    { name: "Goals", short: "Goals", href: "/goals", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
    { name: "Profile", short: "Profile", href: "/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { name: "Settings", short: "Settings", href: "/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  ];

  // Bottom bar: first 4 + "More"
  const bottomBarItems = allItems.slice(0, 4);
  const moreItems = allItems.slice(4);

  const NavIcon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );

  return (
    <>
      {/* ═══════════════ TOP BAR (all screens) ═══════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled
          ? "bg-white/80 dark:bg-[#030712]/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-sm"
          : "bg-white/50 dark:bg-[#030712]/50 backdrop-blur-lg border-transparent"
          }`}
      >
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 group flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-300">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-base sm:text-lg lg:text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent tracking-tight">
                HabitFlow
              </span>
            </Link>

            {/* Desktop Navigation (hidden on mobile/tablet) */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {allItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href}
                    className={`px-3 xl:px-4 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 ${isActive
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                  >
                    <NavIcon d={item.icon} className="w-4 h-4" />
                    <span className="hidden xl:inline">{item.name}</span>
                    <span className="xl:hidden">{item.short}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Theme Toggle */}
              {mounted && (
                <button onClick={toggleTheme}
                  className="p-2 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
                  aria-label="Toggle theme"
                >
                  {resolvedTheme === "dark" ? (
                    <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              )}

              {/* User Avatar (desktop & tablet) */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800 ml-1">
                <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white dark:ring-gray-900 hover:scale-105 transition-transform">
                  {userInitial}
                </Link>
              </div>

              {/* Logout - Desktop only */}
              <button onClick={handleLogout}
                className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                Logout
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════ MOBILE BOTTOM TAB BAR (< lg) ═══════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-800/60 safe-bottom">
        <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
          {bottomBarItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-2xl transition-all active:scale-90 ${isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-400 dark:text-gray-500"
                  }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-indigo-50 dark:bg-indigo-500/10" : ""}`}>
                  <NavIcon d={item.icon} className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold leading-none">{item.short}</span>
              </Link>
            );
          })}

          {/* More Button */}
          <button onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-2xl transition-all active:scale-90 ${showMore || moreItems.some(i => pathname === i.href)
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-400 dark:text-gray-500"
              }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${showMore ? "bg-indigo-50 dark:bg-indigo-500/10" : ""}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <span className="text-[9px] font-bold leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* ═══════════════ MORE MENU POPUP ═══════════════ */}
      {showMore && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setShowMore(false)} />
          <div className="lg:hidden fixed bottom-20 left-3 right-3 z-50 bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
            style={{ animation: "moreSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            <div className="p-2 space-y-0.5">
              {moreItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href} onClick={() => setShowMore(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${isActive
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                  >
                    <NavIcon d={item.icon} className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2 my-1" />

              {/* Logout in More */}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes moreSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>
    </>
  );
}