"use client";

import { soundFX } from "./soundEffects";

interface ConfettiParticle {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rotation: number;
  vRotation: number;
  color: string;
  opacity: number;
  shape: "rect" | "circle" | "diamond";
}

const RITUALIS_CONFETTI_COLORS = [
  "#7C3AED", // Royal Amethyst
  "#A855F7", // Vivid Purple
  "#C084FC", // Soft Amethyst
  "#EAB308", // Gilded Gold
  "#FACC15", // Brilliant Aurum
  "#FEF08A", // Luminous Gold Spark
  "#EC4899", // Rose Radiance
  "#10B981", // Emerald Victory
  "#FFFFFF", // Pure Light
];

/**
 * Triggers a vibrant, physics-driven confetti burst across the viewport.
 * Automatically cleans up DOM and canvas once the animation finishes.
 */
export function triggerConfetti(options?: {
  particleCount?: number;
  playSound?: boolean;
  origin?: { x: number; y: number };
}) {
  if (typeof window === "undefined") return;

  const count = options?.particleCount || 120;
  if (options?.playSound !== false) {
    soundFX.playConfettiPop();
  }

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const startX = options?.origin?.x ?? width / 2;
  const startY = options?.origin?.y ?? height * 0.45;

  const particles: ConfettiParticle[] = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 12;
    const shapes: ("rect" | "circle" | "diamond")[] = ["rect", "circle", "diamond"];

    particles.push({
      x: startX + (Math.random() - 0.5) * 60,
      y: startY + (Math.random() - 0.5) * 40,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
      color: RITUALIS_CONFETTI_COLORS[Math.floor(Math.random() * RITUALIS_CONFETTI_COLORS.length)],
      opacity: 1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    });
  }

  let animationFrameId: number;
  const startTime = performance.now();
  const duration = 2800; // 2.8 seconds total

  function render(time: number) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);

    ctx?.clearRect(0, 0, width, height);

    let activeParticles = 0;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28; // Gravity
      p.vx *= 0.985; // Air drag
      p.rotation += p.vRotation;

      if (progress > 0.6) {
        p.opacity = Math.max(0, 1 - (progress - 0.6) / 0.4);
      }

      if (p.opacity > 0 && p.y < height + 50) {
        activeParticles++;

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else if (p.shape === "circle") {
          ctx!.beginPath();
          ctx!.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx!.fill();
        } else if (p.shape === "diamond") {
          ctx!.beginPath();
          ctx!.moveTo(0, -p.h);
          ctx!.lineTo(p.w / 2, 0);
          ctx!.lineTo(0, p.h);
          ctx!.lineTo(-p.w / 2, 0);
          ctx!.closePath();
          ctx!.fill();
        }

        ctx!.restore();
      }
    });

    if (activeParticles > 0 && progress < 1) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  }

  animationFrameId = requestAnimationFrame(render);
}
