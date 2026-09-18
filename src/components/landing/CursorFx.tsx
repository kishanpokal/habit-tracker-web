"use client";

import { useEffect, useRef, useState } from "react";

export default function CursorFx() {
  const [enabled, setEnabled] = useState(false);
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: -100, y: -100, targetX: -100, targetY: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Disable on touch devices
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.targetX = e.clientX;
      mousePos.current.targetY = e.clientY;
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

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

    let animId: number;
    const render = () => {
      // Fast, lightweight lerp for ring follower
      const dx = mousePos.current.targetX - ringPos.current.x;
      const dy = mousePos.current.targetY - ringPos.current.y;
      ringPos.current.x += dx * 0.2;
      ringPos.current.y += dy * 0.2;

      mousePos.current.x = mousePos.current.targetX;
      mousePos.current.y = mousePos.current.targetY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(animId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Outer Magnetic Ring (Lightweight CSS transforms, zero canvas lag) */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 transition-[width,height,background-color,border-color] duration-150 ease-out will-change-transform"
        style={{
          width: isClicking ? 20 : isHoveringInteractive ? 40 : 26,
          height: isClicking ? 20 : isHoveringInteractive ? 40 : 26,
          borderRadius: "9999px",
          border: isHoveringInteractive
            ? "1.5px solid rgba(168, 85, 247, 0.75)"
            : "1px solid rgba(124, 58, 237, 0.35)",
          backgroundColor: isHoveringInteractive
            ? "rgba(124, 58, 237, 0.08)"
            : "transparent",
        }}
      />

      {/* Center Precise Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{
          width: isClicking ? 5 : isHoveringInteractive ? 3 : 4,
          height: isClicking ? 5 : isHoveringInteractive ? 3 : 4,
          borderRadius: "9999px",
          backgroundColor: isHoveringInteractive ? "#EAB308" : "#FFFFFF",
          boxShadow: "0 0 6px rgba(124, 58, 237, 0.4)",
        }}
      />
    </>
  );
}
