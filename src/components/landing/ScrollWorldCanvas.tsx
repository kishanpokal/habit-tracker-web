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
   1. REFINED MINIMALIST 3D HABIT GYRO-RING (Small & Clean)
   A delicate, compact dual-ring compass in amethyst & gold
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function MinimalHabitHalo({
  scrollProgress,
  mousePos,
  burstTime,
}: {
  scrollProgress: React.RefObject<number>;
  mousePos: React.RefObject<{ x: number; y: number }>;
  burstTime: React.RefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const coreSparkRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const sp = scrollProgress.current ?? 0;
    const mx = mousePos.current?.x ?? 0;
    const my = mousePos.current?.y ?? 0;

    // Advance burst timer
    if (burstTime.current !== undefined && burstTime.current < 2.5) {
      burstTime.current += delta;
    }

    const isBursting = burstTime.current !== undefined && burstTime.current < 2.0;
    const burstStrength = isBursting ? Math.sin((burstTime.current / 2.0) * Math.PI) : 0;

    // Smooth, subtle tilting based on mouse and scroll
    if (groupRef.current) {
      const targetRotX = 0.2 + my * 0.18 + sp * 0.5;
      const targetRotY = mx * 0.22 + t * 0.12;
      const targetY = 0.3 - sp * 1.5; // Glides subtly upward as user scrolls

      groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.y = targetRotY;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.05;

      // Small scale pulse on burst
      const s = (1.0 + burstStrength * 0.12);
      groupRef.current.scale.set(s, s, s);
    }

    // Inner Amethyst Ring rotation
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.3;
      ring1Ref.current.rotation.z = Math.sin(t * 0.2) * 0.15;
    }

    // Outer Gold Ring counter-rotation
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.25;
      ring2Ref.current.rotation.x = 0.78; // 45 degree tilt
    }

    // Central pulsing spark
    if (coreSparkRef.current) {
      const pulse = 1.0 + Math.sin(t * 2.5) * 0.15 + burstStrength * 0.8;
      coreSparkRef.current.scale.set(pulse, pulse, pulse);
      coreSparkRef.current.rotation.y = t * 0.8;
    }

    // Subtle light boost during habit completion
    if (lightRef.current) {
      lightRef.current.intensity = 2.0 + Math.sin(t * 2.0) * 0.4 + burstStrength * 5.0;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      {/* 1. Slender Royal Amethyst Orbit Ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.92, 0.038, 24, 80]} />
        <meshPhysicalMaterial
          color="#3B1D70"
          emissive="#7C3AED"
          emissiveIntensity={0.85}
          roughness={0.15}
          metalness={0.9}
          clearcoat={1.0}
        />
      </mesh>

      {/* 2. Slender Gilded Gold Interlocking Ring */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.05, 0.032, 24, 80]} />
        <meshStandardMaterial
          color="#FEF08A"
          emissive="#EAB308"
          emissiveIntensity={1.8}
          roughness={0.12}
          metalness={0.95}
        />
      </mesh>

      {/* 3. Small Radiant Central Spark */}
      <mesh ref={coreSparkRef}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#EAB308"
          emissiveIntensity={3.5}
        />
      </mesh>

      {/* Subtle Warm Amber & Violet Point Lights */}
      <pointLight ref={lightRef} color="#EAB308" intensity={2.0} distance={6} />
      <pointLight color="#7C3AED" intensity={1.8} distance={8} position={[0, 1, 1]} />
    </group>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   2. CLEAN & SPARSE AMBIENT STARDUST
   Just 120 subtle, slow-floating motes for clean depth
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function NeatStardust({ count = 120 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    const gold = new THREE.Color("#EAB308");
    const amethyst = new THREE.Color("#A855F7");
    const white = new THREE.Color("#FFFFFF");

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;

      const c = i % 3 === 0 ? gold : i % 2 === 0 ? amethyst : white;
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }

    return [pos, cols];
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.elapsedTime * 0.03;
    pointsRef.current.rotation.y = t;
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
        size={0.032}
        transparent
        opacity={0.6}
        sizeAttenuation
        vertexColors
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   3. EXPORTED NEAT & CLEAN SCROLL-WORLD CANVAS
   Simple, clean, attractive, low-overhead 3D backdrop
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
      {/* Neat ambient gradient backlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-gradient-to-tr from-[#7C3AED]/12 via-[#EAB308]/8 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <Canvas
        camera={{ fov: 42, position: [0, 0.2, 5.0] }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Soft, Neat Studio Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 5, 4]} intensity={1.8} color="#FFFFFF" />
        <directionalLight position={[-4, -3, 2]} intensity={1.2} color="#A855F7" />

        {/* Small, refined 3D Habit Gyro-Ring */}
        <MinimalHabitHalo
          scrollProgress={scrollProgress}
          mousePos={mousePos}
          burstTime={burstTime}
        />

        {/* Delicate, clean stardust motes */}
        <NeatStardust count={120} />
      </Canvas>
    </div>
  );
}
