"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, Share2, Flame, Sparkles, Check } from "lucide-react";
import { soundFX } from "@/lib/soundEffects";

interface StreakShareModalProps {
  habitName: string;
  streakCount: number;
  userName: string;
  completionRate?: number;
  onClose: () => void;
}

export default function StreakShareModal({
  habitName,
  streakCount,
  userName,
  completionRate = 100,
  onClose,
}: StreakShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Draw card on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Card dimensions (Sleek social aspect ratio: 800 x 950)
    const w = 800;
    const h = 950;
    canvas.width = w;
    canvas.height = h;

    // 1. Background gradient (Deep Obsidian Void)
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, "#0B0B0F");
    bgGrad.addColorStop(0.5, "#12121A");
    bgGrad.addColorStop(1, "#07070A");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Ambient glows
    const radGlow1 = ctx.createRadialGradient(200, 250, 10, 200, 250, 350);
    radGlow1.addColorStop(0, "rgba(124, 58, 237, 0.25)");
    radGlow1.addColorStop(1, "rgba(124, 58, 237, 0)");
    ctx.fillStyle = radGlow1;
    ctx.fillRect(0, 0, w, h);

    const radGlow2 = ctx.createRadialGradient(650, 600, 10, 650, 600, 400);
    radGlow2.addColorStop(0, "rgba(234, 179, 8, 0.18)");
    radGlow2.addColorStop(1, "rgba(234, 179, 8, 0)");
    ctx.fillStyle = radGlow2;
    ctx.fillRect(0, 0, w, h);

    // 3. Elegant border
    ctx.strokeStyle = "rgba(124, 58, 237, 0.35)";
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    ctx.strokeStyle = "rgba(234, 179, 8, 0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(38, 38, w - 76, h - 76);

    // 4. Header Brand: RITUALIS
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("R I T U A L I S", w / 2, 110);

    ctx.fillStyle = "#EAB308";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("E L E V A T E   E V E R Y   D A Y", w / 2, 138);

    // Divider Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.moveTo(180, 165);
    ctx.lineTo(620, 165);
    ctx.stroke();

    // 5. Central Flame Icon & Ring
    const centerX = w / 2;
    const centerY = 340;

    // Glowing circle behind flame
    const circleGrad = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, 120);
    circleGrad.addColorStop(0, "rgba(234, 179, 8, 0.25)");
    circleGrad.addColorStop(1, "rgba(124, 58, 237, 0.05)");
    ctx.fillStyle = circleGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
    ctx.fill();

    // Golden streak circle border
    ctx.strokeStyle = "#EAB308";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 90, 0, Math.PI * 2);
    ctx.stroke();

    // Flame graphic
    ctx.fillStyle = "#EAB308";
    ctx.font = "72px sans-serif";
    ctx.fillText("🔥", centerX, centerY + 24);

    // 6. Streak Count
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 64px sans-serif";
    ctx.fillText(`${streakCount} DAYS`, centerX, 520);

    ctx.fillStyle = "#A855F7";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("UNBROKEN DAILY STREAK", centerX, 555);

    // 7. Habit Name Card
    ctx.fillStyle = "rgba(18, 18, 24, 0.9)";
    ctx.strokeStyle = "rgba(124, 58, 237, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(100, 600, 600, 110, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#EAB308";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("SACRED RITUAL", centerX, 638);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(`"${habitName}"`, centerX, 680);

    // 8. Stats summary row
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Practiced by ${userName || "Ritualist"} • ${completionRate}% Consistency Score`, centerX, 760);

    // 9. Footer
    ctx.fillStyle = "#9090A0";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Recorded on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, centerX, 860);
  }, [habitName, streakCount, userName, completionRate]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    soundFX.playClick();

    const link = document.createElement("a");
    link.download = `ritualis-streak-${habitName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    setTimeout(() => setDownloading(false), 800);
  };

  const handleCopy = async () => {
    try {
      soundFX.playClick();
      await navigator.clipboard.writeText(
        `🔥 I'm on a ${streakCount}-day unbroken streak with my ritual "${habitName}" on Ritualis! Elevate every day.`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#121218] border border-stone-200 dark:border-[#272732] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#EAB308] p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black font-heading leading-tight">Share Your Streak</h3>
              <p className="text-white/80 text-[11px] font-medium">Inspire your circle with your daily discipline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview Canvas Card */}
        <div className="p-4 sm:p-6 flex flex-col items-center justify-center space-y-4 overflow-y-auto">
          <div className="w-full max-w-[340px] sm:max-w-[380px] rounded-2xl overflow-hidden shadow-2xl border border-stone-200 dark:border-[#272732]">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full max-w-[380px]">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-stone-200 dark:border-[#272732] bg-stone-50 dark:bg-[#1A1A22] hover:bg-stone-100 dark:hover:bg-[#272732] text-stone-700 dark:text-stone-200 text-xs font-bold transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-[#EAB308]" /> : <Sparkles className="w-4 h-4 text-[#7C3AED]" />}
              <span>{copied ? "Copied Text!" : "Copy Text"}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white text-xs font-bold shadow-md shadow-violet-500/25 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? "Saving..." : "Download PNG"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
