"use client";

import React, { useRef, useState } from "react";

interface BentoTiltCardProps {
  title: string;
  desc: string;
  badge?: string;
  icon: React.ReactNode;
  stat?: string;
  className?: string;
  accentColor?: string;
}

export default function BentoTiltCard({
  title,
  desc,
  badge,
  icon,
  stat,
  className = "",
  accentColor = "#7C3AED",
}: BentoTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSpotlight({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.16,
    });
  };

  const handleMouseLeave = () => {
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-3xl border border-[#272732] bg-[#121218] p-6 sm:p-7 overflow-hidden flex flex-col justify-between group hover:border-[#7C3AED]/50 hover:-translate-y-1 transition-all duration-200 shadow-lg ${className}`}
    >
      {/* Mouse-following Radial Spotlight */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(350px circle at ${spotlight.x}% ${spotlight.y}%, ${accentColor}, transparent 70%)`,
          opacity: spotlight.opacity,
        }}
      />

      {/* Top Meta Info */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#0B0B0F] border border-[#272732] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 group-hover:border-[#EAB308]/40 shadow-sm">
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 text-[#9090A0] border border-[#272732]">
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 font-heading tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#9090A0] leading-relaxed font-normal">
          {desc}
        </p>
      </div>

      {/* Bottom Stat Callout */}
      {stat && (
        <div className="mt-6 pt-4 border-t border-[#272732]/60 flex items-center justify-between relative z-10">
          <span className="text-xs font-bold text-[#EAB308] tracking-wide">{stat}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#EAB308] animate-ping" />
        </div>
      )}
    </div>
  );
}
