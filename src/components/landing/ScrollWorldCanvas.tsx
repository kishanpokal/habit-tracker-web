"use client";

import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

// Global burst trigger event for interactive UI triggers (LiveHabitLab)
export const triggerCanvasBurst = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habitflow:burst"));
  }
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COMPACT & CLEAN 3D HABIT RING ACCENT (Small, Clean & Fast)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function SimpleCleanHalo({
  scrollProgress,
  mousePos,
  burstTime,
}: {
  scrollProgress: React.RefObject<number>;
  mousePos: React.RefObject<{ x: number; y: number }>;
  burstTime: React.RefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const goldAccentRef = useRef<THREE.Mesh>(null);
  const sparkRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const sp = scrollProgress.current ?? 0;
    const mx = mousePos.current?.x ?? 0;
    const my = mousePos.current?.y ?? 0;

    if (burstTime.current !== undefined && burstTime.current < 2.0) {
      burstTime.current += delta;
    }

    const isBursting = burstTime.current !== undefined && burstTime.current < 1.5;
    const burstPulse = isBursting ? Math.sin((burstTime.current / 1.5) * Math.PI) : 0;

    if (groupRef.current) {
      // Gentle, subtle floating with soft cursor parallax
      groupRef.current.rotation.x = 0.25 + my * 0.12;
      groupRef.current.rotation.y = t * 0.15 + mx * 0.15;
      groupRef.current.position.y = 0.2 - sp * 1.2;

      const s = 1.0 + burstPulse * 0.1;
      groupRef.current.scale.set(s, s, s);
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.2;
    }

    if (goldAccentRef.current) {
      goldAccentRef.current.rotation.z = -t * 0.25;
    }

    if (sparkRef.current) {
      sparkRef.current.rotation.y = t * 0.6;
      const spScale = 1.0 + Math.sin(t * 3.0) * 0.12 + burstPulse * 0.5;
      sparkRef.current.scale.set(spScale, spScale, spScale);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Primary Slender Amethyst Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.78, 0.028, 16, 64]} />
        <meshStandardMaterial
          color="#A855F7"
          emissive="#7C3AED"
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Interlocking Delicate Gold Ring */}
      <mesh ref={goldAccentRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.88, 0.022, 16, 64]} />
        <meshStandardMaterial
          color="#FEF08A"
          emissive="#EAB308"
          emissiveIntensity={1.8}
          roughness={0.15}
          metalness={0.9}
        />
      </mesh>

      {/* Gentle Center Spark */}
      <mesh ref={sparkRef}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#EAB308"
          emissiveIntensity={3.0}
        />
      </mesh>

      {/* Soft Ambient Center Light */}
      <pointLight color="#EAB308" intensity={1.8} distance={5} />
      <pointLight color="#7C3AED" intensity={1.4} distance={6} position={[0, 1, 1]} />
    </group>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DELICATE SPARKLING PARTICLES (Just 40 Motes for Zero Lag)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function GentleMotes({ count = 40 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    const gold = new THREE.Color("#EAB308");
    const lavender = new THREE.Color("#C084FC");

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;

      const c = i % 2 === 0 ? gold : lavender;
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }

    return [pos, cols];
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = clock.elapsedTime * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        transparent
        opacity={0.5}
        sizeAttenuation
        vertexColors
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   EXPORTED LEAN CANVAS (Neat, clean, attractive, 0% scroll lag)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function ScrollWorldCanvas() {
  const scrollProgress = useRef(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const burstTime = useRef(99.0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      scrollProgress.current = Math.min(Math.max(scrollY / maxScroll, 0), 1);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      };
    };

    const handleBurst = () => {
      burstTime.current = 0.0;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("habitflow:burst", handleBurst);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("habitflow:burst", handleBurst);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Neat ambient radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-gradient-to-tr from-[#7C3AED]/15 via-[#EAB308]/10 to-transparent rounded-full blur-[130px] pointer-events-none" />

      <Canvas
        camera={{ fov: 40, position: [0, 0.2, 4.8] }}
        dpr={1}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 5, 4]} intensity={1.5} color="#FFFFFF" />

        {/* Small, clean, elegant 3D halo */}
        <SimpleCleanHalo
          scrollProgress={scrollProgress}
          mousePos={mousePos}
          burstTime={burstTime}
        />

        {/* Just 40 light motes for zero GPU overhead */}
        <GentleMotes count={40} />
      </Canvas>
    </div>
  );
}
