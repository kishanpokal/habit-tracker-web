"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  BarChart3,
  Award,
  BookOpen,
  Timer,
  Target,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Flame,
  ListChecks,
} from "lucide-react";

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
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setShowMore(false), [pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  const userInitial = (user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();

  const navItems = [
    { name: "Dashboard", short: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Habits", short: "Habits", href: "/habits", icon: ListChecks },
    { name: "Analytics", short: "Stats", href: "/analytics", icon: BarChart3 },
    { name: "Journal", short: "Journal", href: "/journal", icon: BookOpen },
    { name: "Badges", short: "Badges", href: "/badges", icon: Award },
    { name: "Focus Timer", short: "Focus", href: "/focus", icon: Timer },
    { name: "Goals", short: "Goals", href: "/goals", icon: Target },
    { name: "Profile", short: "Profile", href: "/profile", icon: User },
    { name: "Settings", short: "Settings", href: "/settings", icon: Settings },
  ];

  // Primary items for mobile bottom bar
  const bottomBarItems = [
    navItems[0], // Dashboard
    navItems[1], // Habits
    navItems[2], // Analytics
    navItems[3], // Journal
  ];

  const moreItems = navItems.slice(4);

  return (
    <>
      {/* ━━━━━ TOP HEADER ━━━━━ */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-250 ${
          scrolled
            ? "bg-white/90 dark:bg-[#0B0B0F]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#272732] shadow-xs"
            : "bg-white/60 dark:bg-[#0B0B0F]/60 backdrop-blur-md border-b border-transparent"
        }`}
      >
        <div className="max-w-[1520px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18">
            {/* Brand Emblem */}
            <Link href="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#EAB308] p-[1.5px] shadow-sm shadow-violet-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white dark:bg-[#121218] rounded-[10px] flex items-center justify-center">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-[#7C3AED] fill-[#EAB308]" />
                </div>
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight font-heading">
                Habit<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#EAB308]">Flow</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-[#121218]/90 p-1 rounded-2xl border border-slate-200/60 dark:border-[#272732]">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                      isActive
                        ? "bg-white dark:bg-[#1A1A22] text-[#7C3AED] dark:text-[#EAB308] shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:text-[#9090A0] dark:hover:text-white hover:bg-white/50 dark:hover:bg-[#1A1A22]/50"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#7C3AED] dark:text-[#EAB308]" : ""}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="p-2 rounded-xl bg-slate-100 dark:bg-[#121218] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1A1A22] border border-transparent dark:border-[#272732] transition-colors active:scale-95"
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="w-4 h-4 text-[#EAB308]" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-700" />
                  )}
                </button>
              )}

              {/* User Avatar */}
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-[#121218] hover:bg-slate-200 dark:hover:bg-[#1A1A22] transition-colors border border-slate-200/60 dark:border-[#272732]"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#EAB308] flex items-center justify-center text-white text-xs font-bold shadow-xs">
                  {userInitial}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[90px] truncate">
                  {user?.displayName || user?.email?.split("@")[0] || "Account"}
                </span>
              </Link>

              {/* Desktop Logout Button */}
              <button
                onClick={handleLogout}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all active:scale-95 shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ━━━━━ MOBILE BOTTOM NAVIGATION BAR (< lg) ━━━━━ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/94 dark:bg-[#0B0B0F]/94 backdrop-blur-2xl border-t border-slate-200/80 dark:border-[#272732] safe-bottom">
        <div className="flex items-center justify-around h-15 px-2 max-w-md mx-auto">
          {bottomBarItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl transition-all active:scale-90 ${
                  isActive
                    ? "text-[#7C3AED] dark:text-[#EAB308] font-bold"
                    : "text-slate-400 dark:text-[#9090A0] font-medium"
                }`}
              >
                <div
                  className={`p-1 rounded-lg transition-all ${
                    isActive ? "bg-violet-500/15 dark:bg-violet-500/20" : ""
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] tracking-tight leading-none">{item.short}</span>
              </Link>
            );
          })}

          {/* More Trigger */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl transition-all active:scale-90 ${
              showMore || moreItems.some((i) => pathname === i.href)
                ? "text-[#7C3AED] dark:text-[#EAB308] font-bold"
                : "text-slate-400 dark:text-[#9090A0] font-medium"
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-all ${
                showMore ? "bg-violet-500/15 dark:bg-violet-500/20" : ""
              }`}
            >
              <Menu className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* ━━━━━ MOBILE MORE POPUP SHEET ━━━━━ */}
      {showMore && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMore(false)}
          />
          <div className="lg:hidden fixed bottom-18 left-3 right-3 z-50 bg-white dark:bg-[#121218] rounded-2xl border border-slate-200 dark:border-[#272732] shadow-2xl p-2 space-y-1">
            <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-[#272732] mb-1">
              <span className="text-xs font-bold text-slate-400 dark:text-[#9090A0] uppercase tracking-wider">Features</span>
              <button
                onClick={() => setShowMore(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {moreItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-violet-500/15 text-[#7C3AED] dark:text-[#EAB308]"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A1A22]"
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#7C3AED] dark:text-[#EAB308]" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="h-px bg-slate-100 dark:bg-[#272732] my-1" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#EAB308] hover:bg-slate-50 dark:hover:bg-[#1A1A22] transition-colors"
            >
              <LogOut className="w-4 h-4 text-[#7C3AED] dark:text-[#EAB308]" />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}