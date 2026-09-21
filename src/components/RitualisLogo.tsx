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
  xs: { icon: 20, box: "w-6 h-6", text: "text-sm", subText: "hidden" },
  sm: { icon: 26, box: "w-8 h-8", text: "text-base", subText: "hidden" },
  md: { icon: 34, box: "w-10 h-10", text: "text-lg", subText: "text-[9px]" },
  lg: { icon: 44, box: "w-12 h-12", text: "text-2xl", subText: "text-[10px]" },
  xl: { icon: 56, box: "w-16 h-16", text: "text-3xl", subText: "text-xs" },
  hero: { icon: 72, box: "w-20 h-20 sm:w-24 sm:h-24", text: "text-4xl sm:text-5xl", subText: "text-xs sm:text-sm" },
};

/**
 * Ritualis Iconic Brand Logo
 * 
 * Philosophy & Symbolism:
 * - The Celestial Orbit Arc (Latin 'Ritualis'): An eternal cycle representing recurring, sacred daily practice.
 * - The Inner Sacred Flame: The spark of human will, burning consistency, and daily momentum.
 * - The Keystone Diamond at Zenith: The pinnacle of character and mastery forged through discipline.
 * - Colors: Royal Amethyst (#7C3AED / #A855F7) interwoven with Gilded Aurum Gold (#EAB308 / #F59E0B).
 */
export default function RitualisLogo({
  size = "md",
  showText = true,
  animated = false,
  className = "",
  textClassName = "",
}: LogoProps) {
  const cfg = sizeMap[size];
  const uniqueId = React.useId();
  const gradAmethyst = `ritualis-amethyst-${uniqueId}`;
  const gradGold = `ritualis-gold-${uniqueId}`;
  const gradAura = `ritualis-aura-${uniqueId}`;
  const gradDiamond = `ritualis-diamond-${uniqueId}`;

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      {/* ━━━━━ ICONIC SACRED EMBLEM ━━━━━ */}
      <div className={`relative ${cfg.box} flex-shrink-0 flex items-center justify-center`}>
        {/* Ambient Backlight Glow */}
        <div
          className={`absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-[#7C3AED]/40 via-[#A855F7]/25 to-[#EAB308]/30 blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500 ${
            animated ? "animate-pulse" : ""
          }`}
        />

        {/* Crisp Surface Vessel */}
        <div className="relative w-full h-full rounded-xl sm:rounded-2xl bg-[#0B0B0F] border border-[#272732] group-hover:border-[#7C3AED]/60 p-1.5 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              {/* Royal Amethyst Gradient */}
              <linearGradient id={gradAmethyst} x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C084FC" />
                <stop offset="45%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#4C1D95" />
              </linearGradient>

              {/* Luminous Gilded Gold Gradient */}
              <linearGradient id={gradGold} x1="20" y1="8" x2="38" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="40%" stopColor="#FACC15" />
                <stop offset="75%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>

              {/* Diamond Apex Gradient */}
              <linearGradient id={gradDiamond} x1="20" y1="4" x2="28" y2="12" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#EAB308" />
              </linearGradient>

              {/* Radial Energy Glow */}
              <radialGradient id={gradAura} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#EAB308" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#7C3AED" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* 1. The Celestial Orbit (Sacred Enso - Recurring Daily Discipline) */}
            <path
              d="M24 6C13.5066 6 5 14.5066 5 25C5 35.4934 13.5066 44 24 44C32.85 44 40.3 37.95 42.4 29.5"
              stroke={`url(#${gradAmethyst})`}
              strokeWidth="3.4"
              strokeLinecap="round"
              className="transition-all duration-500 group-hover:stroke-[#C084FC]"
            />

            {/* Subtle orbital tracker tick marks */}
            <circle cx="24" cy="44" r="1.5" fill="#EAB308" opacity="0.85" />
            <circle cx="5" cy="25" r="1.5" fill="#A855F7" opacity="0.85" />

            {/* 2. The Inner Sacred Flame (The Will & Daily Momentum) */}
            {/* Outer Flame Contour */}
            <path
              d="M24 16C24 16 29 22 29 27C29 31 26.5 34 24 34C21.5 34 19 31 19 27C19 22 24 16 24 16Z"
              fill={`url(#${gradGold})`}
              className="transition-all duration-500 group-hover:opacity-95"
            />

            {/* Inner Core Sacred Glow */}
            <path
              d="M24 22C24 22 26.5 25.5 26.5 28C26.5 30 25.2 31.5 24 31.5C22.8 31.5 21.5 30 21.5 28C21.5 25.5 24 22 24 22Z"
              fill="#FFFFFF"
              opacity="0.9"
            />

            {/* 3. The Keystone Diamond at Zenith (Consciousness & Mastery) */}
            <polygon
              points="24,4 28.5,9.5 24,15 19.5,9.5"
              fill={`url(#${gradDiamond})`}
              stroke="#FFFFFF"
              strokeWidth="0.8"
              className="transition-transform duration-500 group-hover:scale-110"
              style={{ transformOrigin: "24px 9.5px" }}
            />

            {/* Dynamic Sparkle Center */}
            <circle cx="24" cy="9.5" r="1.2" fill="#7C3AED" />
          </svg>
        </div>
      </div>

      {/* ━━━━━ WORDMARK & MEANINGFUL TAGLINE ━━━━━ */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black font-heading tracking-tight text-white leading-none ${cfg.text} ${textClassName}`}>
            Ritual
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C084FC] via-[#A855F7] to-[#EAB308]">
              is
            </span>
          </span>
          <span className={`font-bold tracking-widest text-[#EAB308]/90 uppercase mt-0.5 ${cfg.subText}`}>
            Elevate Every Day
          </span>
        </div>
      )}
    </div>
  );
}
