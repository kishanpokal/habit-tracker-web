"use client";

import React from "react";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  showText?: boolean;
  animated?: boolean;
  className?: string;
  textClassName?: string;
}

const sizeMap = {
  xs: { icon: 20, box: "w-6 h-6", text: "text-sm" },
  sm: { icon: 26, box: "w-8 h-8", text: "text-base" },
  md: { icon: 34, box: "w-10 h-10", text: "text-lg" },
  lg: { icon: 44, box: "w-12 h-12", text: "text-2xl" },
  xl: { icon: 56, box: "w-16 h-16", text: "text-3xl" },
  hero: { icon: 72, box: "w-20 h-20 sm:w-24 sm:h-24", text: "text-4xl sm:text-5xl" },
};

/**
 * HabitFlow Iconic Logo
 * Features an intertwined Infinity Flow Loop with an Ascending Streak Flame,
 * crafted with Royal Amethyst (#7C3AED) and Gilded Gold (#EAB308) gradients.
 */
export default function HabitFlowLogo({
  size = "md",
  showText = true,
  animated = false,
  className = "",
  textClassName = "",
}: LogoProps) {
  const cfg = sizeMap[size];
  const uniqueId = React.useId();
  const gradAmethyst = `logo-amethyst-${uniqueId}`;
  const gradGold = `logo-gold-${uniqueId}`;
  const gradGlow = `logo-glow-${uniqueId}`;

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      {/* ━━━━━ ICONIC EMBLEM ━━━━━ */}
      <div className={`relative ${cfg.box} flex-shrink-0 flex items-center justify-center`}>
        {/* Ambient Backlight Glow */}
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#7C3AED]/40 to-[#EAB308]/30 blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500 ${
            animated ? "animate-pulse" : ""
          }`}
        />

        {/* Crisp Surface Box */}
        <div className="relative w-full h-full rounded-xl sm:rounded-2xl bg-[#0B0B0F] border border-[#272732] group-hover:border-[#7C3AED]/50 p-1.5 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              {/* Royal Amethyst Gradient */}
              <linearGradient id={gradAmethyst} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="50%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#4C1D95" />
              </linearGradient>

              {/* Luminous Gold Gradient */}
              <linearGradient id={gradGold} x1="24" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="40%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>

              {/* Radial Energy Glow */}
              <radialGradient id={gradGlow} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#EAB308" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Left Infinity Arc (Discipline & Habit Loop) */}
            <path
              d="M17 14C11.4772 14 7 18.4772 7 24C7 29.5228 11.4772 34 17 34C22.2 34 25 29 27.5 24C25 19 22.2 14 17 14Z"
              stroke={`url(#${gradAmethyst})`}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 group-hover:stroke-[#C084FC]"
            />

            {/* Right Ascending Flame Loop (Momentum & Flow) */}
            <path
              d="M31 34C36.5228 34 41 29.5228 41 24C41 18.4772 36.5228 14 31 14C27.5 14 24.5 16.8 23 20"
              stroke={`url(#${gradGold})`}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 group-hover:stroke-[#FDE047]"
            />

            {/* Central Flame Spark (The Ignition Point) */}
            <path
              d="M24 10C24 10 27.5 15.5 27.5 19.5C27.5 22.2 25.5 24.5 24 24.5C22.5 24.5 20.5 22.2 20.5 19.5C20.5 15.5 24 10 24 10Z"
              fill={`url(#${gradGold})`}
            />

            {/* Inner Core Pulsing Sparkle */}
            <circle cx="24" cy="20" r="1.8" fill="#FFFFFF" opacity="0.9" />
          </svg>
        </div>
      </div>

      {/* ━━━━━ WORDMARK ━━━━━ */}
      {showText && (
        <span className={`font-black font-heading tracking-tight text-white ${cfg.text} ${textClassName}`}>
          Habit
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C084FC] via-[#A855F7] to-[#EAB308]">
            Flow
          </span>
        </span>
      )}
    </div>
  );
}
