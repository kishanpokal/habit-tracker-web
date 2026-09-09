"use client";

import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const PARTICLE_COLORS = [
  "rgba(168, 85, 247, ",   // Soft violet
  "rgba(124, 58, 237, ",   // Amethyst
  "rgba(234, 179, 8, ",    // Gold
  "rgba(255, 255, 255, ",  // Star white
];

export default function CursorFx() {
  const [enabled, setEnabled] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mousePos = useRef({ x: -100, y: -100, targetX: -100, targetY: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    // Check if device supports hover / precise pointer
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.targetX = e.clientX;
      mousePos.current.targetY = e.clientY;

      // Spawn stardust particles along cursor path — reduced rate for subtlety
      if (Math.random() < 0.25) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.2 + Math.random() * 0.8;
        const colorBase = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

        particles.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed + (e.movementX || 0) * 0.03,
          vy: Math.sin(angle) * speed + (e.movementY || 0) * 0.03,
          life: 0,
          maxLife: 25 + Math.floor(Math.random() * 20),
          size: 0.8 + Math.random() * 1.5,
          color: colorBase,
        });

        // Reduced cap for performance and subtlety
        if (particles.current.length > 35) {
          particles.current.shift();
        }
      }
    };

    const onMouseDown = () => {
      setIsClicking(true);
      // Subtle click burst — 5 small sparks, no sound
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const s = 1.0 + Math.random() * 1.2;
        particles.current.push({
          x: mousePos.current.targetX,
          y: mousePos.current.targetY,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 0,
          maxLife: 30,
          size: 1.2 + Math.random() * 1.2,
          color: "rgba(168, 85, 247, ",
        });
      }
    };

    const onMouseUp = () => setIsClicking(false);

    // Magnetic detection
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest("button, a, input, [data-interactive], [role='button']");
      setIsHoveringInteractive(!!interactive);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mouseover", onMouseOver, { passive: true });

    // Resize canvas
    const canvas = canvasRef.current;
    const updateSize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    // Animation Loop
    let animId: number;
    const render = () => {
      // Smooth lerp for ring follower
      const dx = mousePos.current.targetX - ringPos.current.x;
      const dy = mousePos.current.targetY - ringPos.current.y;
      ringPos.current.x += dx * 0.14;
      ringPos.current.y += dy * 0.14;

      mousePos.current.x = mousePos.current.targetX;
      mousePos.current.y = mousePos.current.targetY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      // Draw subtle particle dust
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          for (let i = particles.current.length - 1; i >= 0; i--) {
            const p = particles.current[i];
            p.life++;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;

            const progress = p.life / p.maxLife;
            const alpha = Math.max(0, 1 - progress);

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - progress * 0.4), 0, Math.PI * 2);
            ctx.fillStyle = `${p.color}${alpha * 0.55})`;
            ctx.shadowColor = "rgba(124, 58, 237, 0.3)";
            ctx.shadowBlur = 4;
            ctx.fill();

            if (p.life >= p.maxLife) {
              particles.current.splice(i, 1);
            }
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mouseover", onMouseOver);
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(animId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Subtle Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        style={{ width: "100vw", height: "100vh" }}
      />

      {/* Outer Ring — smaller, thinner, more refined */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 transition-[width,height,background-color,border-color] duration-200 ease-out"
        style={{
          width: isClicking ? 22 : isHoveringInteractive ? 44 : 28,
          height: isClicking ? 22 : isHoveringInteractive ? 44 : 28,
          borderRadius: "9999px",
          border: isHoveringInteractive
            ? "1.5px solid rgba(168, 85, 247, 0.7)"
            : "1px solid rgba(124, 58, 237, 0.3)",
          backgroundColor: isHoveringInteractive
            ? "rgba(124, 58, 237, 0.08)"
            : "transparent",
          boxShadow: isHoveringInteractive
            ? "0 0 12px rgba(124, 58, 237, 0.25)"
            : "none",
        }}
      />

      {/* Center Dot — refined */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: isClicking ? 6 : isHoveringInteractive ? 3 : 5,
          height: isClicking ? 6 : isHoveringInteractive ? 3 : 5,
          borderRadius: "9999px",
          backgroundColor: isHoveringInteractive ? "#A855F7" : "#FFFFFF",
          boxShadow: "0 0 6px rgba(124, 58, 237, 0.4)",
          transition: "width 0.15s, height 0.15s, background-color 0.2s",
        }}
      />
    </>
  );
}
