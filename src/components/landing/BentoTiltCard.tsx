"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

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
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setRotation({ x: rotateX, y: rotateY });
    setSpotlight({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.18,
    });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: "transform 0.15s ease-out",
      }}
      className={`relative rounded-3xl border border-[#272732] bg-[#121218]/80 backdrop-blur-xl p-6 sm:p-7 overflow-hidden flex flex-col justify-between group hover:border-[#7C3AED]/40 shadow-xl ${className}`}
    >
      {/* Mouse-following Radial Spotlight */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(400px circle at ${spotlight.x}% ${spotlight.y}%, ${accentColor}, transparent 70%)`,
          opacity: spotlight.opacity,
        }}
      />

      {/* Top Meta Info */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl bg-[#0B0B0F] border border-[#272732] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:border-[#EAB308]/40 shadow-md"
          >
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
    </motion.div>
  );
}
