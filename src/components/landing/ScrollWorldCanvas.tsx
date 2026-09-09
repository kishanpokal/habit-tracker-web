"use client";

import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

// Global burst trigger event for interactive UI triggers (LiveHabitLab)
export const triggerCanvasBurst = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habitflow:burst"));
  }
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. THE KINETIC HABIT LOOP (Infinite Mobius Ribbon)
   A bespoke 3D Torus Knot embodying unbroken habit momentum
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function HabitFlowRibbon({
  scrollProgress,
  mousePos,
  burstTime,
}: {
  scrollProgress: React.RefObject<number>;
  mousePos: React.RefObject<{ x: number; y: number }>;
  burstTime: React.RefObject<number>;
}) {
  const knotGroupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const goldMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  const radius = 1.65;
  const tubeRadius = 0.36;
  const p = 2;
  const q = 3;

  // 1. Procedural Golden Spiral Coil wrapped tightly around the purple ribbon
  const { goldSpiralGeo, milestoneClasps } = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const totalTurns = 42; // Number of tight spiral wraps around the knot
    const segments = 1000;
    const P1 = new THREE.Vector3();
    const P2 = new THREE.Vector3();
    const T = new THREE.Vector3();
    const N = new THREE.Vector3();
    const B = new THREE.Vector3();

    const calculatePosition = (u: number, pos: THREE.Vector3) => {
      const cu = Math.cos(u);
      const su = Math.sin(u);
      const quOverP = (q / p) * u;
      const cs = Math.cos(quOverP);
      pos.x = radius * (2 + cs) * 0.5 * cu;
      pos.y = radius * (2 + cs) * su * 0.5;
      pos.z = radius * Math.sin(quOverP) * 0.5;
    };

    for (let i = 0; i <= segments; i++) {
      const u = (i / segments) * p * Math.PI * 2;
      calculatePosition(u, P1);
      calculatePosition(u + 0.005, P2);

      T.subVectors(P2, P1);
      N.addVectors(P2, P1);
      B.crossVectors(T, N);
      N.crossVectors(B, T);
      B.normalize();
      N.normalize();

      // Spiral angle around the purple tube
      const theta = (i / segments) * totalTurns * Math.PI * 2;
      // Hugs precisely 0.02 units outside the purple tube surface
      const rWrap = tubeRadius + 0.022;
      const cx = -rWrap * Math.cos(theta);
      const cy = rWrap * Math.sin(theta);

      points.push(
        new THREE.Vector3(
          P1.x + (cx * N.x + cy * B.x),
          P1.y + (cx * N.y + cy * B.y),
          P1.z + (cx * N.z + cy * B.z)
        )
      );
    }

    const curve = new THREE.CatmullRomCurve3(points, true);
    const spiral = new THREE.TubeGeometry(curve, 550, 0.042, 8, true);

    // 7 Golden Milestone Rings along the knot
    const clasps: { pos: [number, number, number]; rot: [number, number, number] }[] = [];
    const nodeCount = 7;
    for (let k = 0; k < nodeCount; k++) {
      const u = (k / nodeCount) * p * Math.PI * 2;
      calculatePosition(u, P1);
      calculatePosition(u + 0.01, P2);
      T.subVectors(P2, P1).normalize();

      // Rotation matrix aligning Z-axis with tangent T
      const rotMatrix = new THREE.Matrix4();
      const up = new THREE.Vector3(0, 1, 0);
      if (Math.abs(T.dot(up)) > 0.99) up.set(1, 0, 0);
      rotMatrix.lookAt(new THREE.Vector3(0, 0, 0), T, up);
      const euler = new THREE.Euler().setFromRotationMatrix(rotMatrix);

      clasps.push({
        pos: [P1.x, P1.y, P1.z],
        rot: [euler.x, euler.y, euler.z],
      });
    }

    return { goldSpiralGeo: spiral, milestoneClasps: clasps };
  }, [radius, tubeRadius, p, q]);

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

    // Both purple & gold are in knotGroupRef, moving as ONE unified luxury sculpture
    if (knotGroupRef.current) {
      knotGroupRef.current.rotation.x = t * 0.22 + sp * Math.PI * 1.5 + my * 0.35;
      knotGroupRef.current.rotation.y = t * 0.3 + sp * Math.PI * 2.0 + mx * 0.45;
      knotGroupRef.current.rotation.z = Math.sin(t * 0.15) * 0.15;

      const baseScale = 1.0 + Math.sin(t * 0.8) * 0.02 + burstStrength * 0.15;
      knotGroupRef.current.scale.set(baseScale, baseScale, baseScale);
    }

    // Gold material glow reacts to habit completion bursts
    if (goldMaterialRef.current) {
      goldMaterialRef.current.emissiveIntensity = 2.2 + Math.sin(t * 2.5) * 0.4 + burstStrength * 4.0;
    }

    // Central Radiant Streak Core
    if (coreRef.current) {
      coreRef.current.rotation.x = -t * 0.5;
      coreRef.current.rotation.y = t * 0.7;
      const corePulse = 1.0 + Math.sin(t * 3.0) * 0.12 + burstStrength * 0.6;
      coreRef.current.scale.set(corePulse, corePulse, corePulse);
    }

    // Light intensity surges during habit completion
    if (pointLightRef.current) {
      pointLightRef.current.intensity = 3.5 + Math.sin(t * 2.0) * 0.8 + burstStrength * 8.0;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ━━━━━ UNIFIED KNOT GROUP: PURPLE BODY + WRAPPED GOLD COIL ━━━━━ */}
      <group ref={knotGroupRef}>
        {/* 1. Main Solid Royal Amethyst Ribbon */}
        <mesh>
          <torusKnotGeometry args={[radius, tubeRadius, 180, 36, p, q]} />
          <meshPhysicalMaterial
            color="#2E1065"
            emissive="#7C3AED"
            emissiveIntensity={0.85}
            roughness={0.18}
            metalness={0.85}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            reflectivity={0.95}
          />
        </mesh>

        {/* 2. Physical Luminous Gold Filament WRAPPED ON the purple tube */}
        <mesh geometry={goldSpiralGeo}>
          <meshStandardMaterial
            ref={goldMaterialRef}
            color="#FEF08A"
            emissive="#EAB308"
            emissiveIntensity={2.2}
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>

        {/* 3. 7 Golden Milestone Rings Clasping the Purple Tube */}
        {milestoneClasps.map((clasp, idx) => (
          <group key={idx} position={clasp.pos} rotation={clasp.rot}>
            {/* Gold Ring Clasp */}
            <mesh>
              <torusGeometry args={[tubeRadius + 0.026, 0.038, 16, 32]} />
              <meshStandardMaterial
                color="#FEF08A"
                emissive="#F59E0B"
                emissiveIntensity={2.0}
                roughness={0.15}
                metalness={0.9}
              />
            </mesh>
            {/* Embedded Milestone Gem */}
            <mesh position={[0, tubeRadius + 0.05, 0]}>
              <octahedronGeometry args={[0.09, 0]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#EAB308"
                emissiveIntensity={3.5}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. Central Ascending Flame Core (The Habit Ignition Point) */}
      <group ref={coreRef}>
        <mesh>
          <octahedronGeometry args={[0.52, 0]} />
          <meshStandardMaterial
            color="#EAB308"
            emissive="#F59E0B"
            emissiveIntensity={2.8}
            roughness={0.2}
            metalness={0.9}
            wireframe
          />
        </mesh>
        <mesh>
          <dodecahedronGeometry args={[0.26, 0]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#EAB308"
            emissiveIntensity={4.5}
          />
        </mesh>
      </group>

      {/* Core Dynamic Radiance Lights */}
      <pointLight ref={pointLightRef} color="#EAB308" intensity={3.5} distance={10} />
      <pointLight color="#7C3AED" intensity={4.0} distance={12} position={[-2, 1, 1]} />
    </group>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   2. STREAK CONSTELLATION & FLOATING MOMENTUM DUST
   Subtle glowing particles forming a cosmic orbit
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function StardustField({ count = 550 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors, scales, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const scs = new Float32Array(count);
    const spd = new Float32Array(count);

    const gold = new THREE.Color("#EAB308");
    const amethyst = new THREE.Color("#A855F7");
    const white = new THREE.Color("#FFFFFF");
    const lavender = new THREE.Color("#C084FC");

    for (let i = 0; i < count; i++) {
      // Cylindrical/spherical distribution around the central loop
      const radius = 2.2 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 6.5;

      pos[i * 3] = Math.cos(theta) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * radius;

      // Color distribution: gold, amethyst, white
      const c =
        i % 4 === 0 ? gold : i % 3 === 0 ? lavender : i % 2 === 0 ? amethyst : white;
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;

      scs[i] = 0.5 + Math.random() * 1.5;
      spd[i] = 0.15 + Math.random() * 0.45;
    }

    return [pos, cols, scs, spd];
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.elapsedTime;

    // Slow orbital rotation
    pointsRef.current.rotation.y = t * 0.04;
    pointsRef.current.rotation.x = Math.sin(t * 0.03) * 0.08;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      arr[idx + 1] += Math.sin(t * speeds[i] + i) * 0.003;
    }
    posAttr.needsUpdate = true;
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
        size={0.042}
        transparent
        opacity={0.75}
        sizeAttenuation
        vertexColors
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   3. HABIT COMPLETION SHOCKWAVE RING
   Expands dynamically in 3D when a habit is ticked off
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ShockwaveRing({ burstTime }: { burstTime: React.RefObject<number> }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const bt = burstTime.current ?? 99.0;
    if (ringRef.current && ring2Ref.current) {
      if (bt < 2.2 && bt >= 0) {
        const p = bt / 2.2;
        const scale = 1.0 + p * 8.5;
        const alpha = Math.sin((1 - p) * Math.PI) * 0.85;

        ringRef.current.visible = true;
        ringRef.current.scale.set(scale, scale, scale);
        (ringRef.current.material as THREE.MeshBasicMaterial).opacity = alpha;

        const scale2 = 1.0 + p * 6.5;
        ring2Ref.current.visible = true;
        ring2Ref.current.scale.set(scale2, scale2, scale2);
        (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = alpha * 0.7;
      } else {
        ringRef.current.visible = false;
        ring2Ref.current.visible = false;
      }
    }
  });

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh ref={ringRef} visible={false}>
        <ringGeometry args={[0.95, 1.05, 64]} />
        <meshBasicMaterial
          color="#EAB308"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ring2Ref} visible={false}>
        <ringGeometry args={[0.96, 1.04, 64]} />
        <meshBasicMaterial
          color="#A855F7"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   4. CINEMATIC SCROLL-WORLD CAMERA CHOREOGRAPHY
   Flies smoothly through sections with responsive cursor parallax
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function CinematicCameraRig({
  scrollProgress,
  mousePos,
}: {
  scrollProgress: React.RefObject<number>;
  mousePos: React.RefObject<{ x: number; y: number }>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const sp = scrollProgress.current ?? 0;
    const mx = mousePos.current?.x ?? 0;
    const my = mousePos.current?.y ?? 0;

    // Camera flight choreographed across landing zones:
    // Zone 0 (Hero, sp ~ 0.0): Centered, slightly elevated, looking at loop
    // Zone 1 (Live Lab, sp ~ 0.3): Floats slightly right and closer
    // Zone 2 (Bento Grid, sp ~ 0.65): Pulls back, tilts to top-angle perspective
    // Zone 3 (CTA, sp ~ 0.95): Zooms in dramatically toward the golden core

    let targetX = 0;
    let targetY = 0;
    let targetZ = 6.2;
    let lookTargetY = 0;

    if (sp < 0.3) {
      // Hero
      const localP = sp / 0.3;
      targetX = mx * 0.8 + localP * 1.2;
      targetY = 0.2 + my * 0.5 - localP * 0.5;
      targetZ = 6.2 - localP * 0.8;
      lookTargetY = -0.1;
    } else if (sp < 0.7) {
      // Live Lab & Bento
      const localP = (sp - 0.3) / 0.4;
      targetX = 1.2 - localP * 2.4 + mx * 0.6;
      targetY = -0.3 + localP * 0.9 + my * 0.4;
      targetZ = 5.4 + localP * 0.8;
      lookTargetY = 0.1;
    } else {
      // Final CTA
      const localP = (sp - 0.7) / 0.3;
      targetX = -1.2 + localP * 1.2 + mx * 0.5;
      targetY = 0.6 - localP * 0.4 + my * 0.3;
      targetZ = 6.2 - localP * 1.8; // Dramatic zoom-in
      lookTargetY = 0.0;
    }

    // Smooth lerp
    camera.position.x += (targetX - camera.position.x) * 0.045;
    camera.position.y += (targetY - camera.position.y) * 0.045;
    camera.position.z += (targetZ - camera.position.z) * 0.045;

    camera.lookAt(mx * 0.25, lookTargetY, 0);
  });

  return null;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   5. EXPORTED 3D SCROLL-WORLD CANVAS
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
      <Canvas
        camera={{ fov: 45, position: [0, 0.2, 6.2] }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Studio Lighting */}
        <ambientLight intensity={0.65} />
        <directionalLight position={[6, 8, 5]} intensity={2.6} color="#FFFFFF" />
        <directionalLight position={[-6, -4, 3]} intensity={2.0} color="#A855F7" />
        <directionalLight position={[4, -3, 2]} intensity={1.8} color="#EAB308" />
        <pointLight position={[0, 4, 3]} intensity={2.5} color="#EAB308" />

        {/* 1. Kinetic Habit Flow Ribbon & 7-Day Orbit Nodes */}
        <HabitFlowRibbon
          scrollProgress={scrollProgress}
          mousePos={mousePos}
          burstTime={burstTime}
        />

        {/* 2. Quantum Stardust Momentum Constellation */}
        <StardustField count={600} />

        {/* 3. Habit Completion Shockwave Ring */}
        <ShockwaveRing burstTime={burstTime} />

        {/* 4. Cinematic Camera Choreography & Cursor Tilt */}
        <CinematicCameraRig
          scrollProgress={scrollProgress}
          mousePos={mousePos}
        />
      </Canvas>
    </div>
  );
}
