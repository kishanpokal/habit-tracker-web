"use client";

import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   STAGE THEME PALETTE (5 Distinct Phases)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const STAGE_COLORS = [
  { primary: "#22d3ee", emissive: "#06b6d4", name: "CYAN_SPARK" },
  { primary: "#10b981", emissive: "#059669", name: "EMERALD_MOMENTUM" },
  { primary: "#f59e0b", emissive: "#d97706", name: "AMBER_CONSISTENCY" },
  { primary: "#a855f7", emissive: "#7c3aed", name: "VIOLET_MASTERY" },
  { primary: "#ec4899", emissive: "#db2777", name: "ROSE_LAUNCH" },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. 5 ORBITAL RESONATOR RINGS (Prominent, High-Energy)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ResonatorRings({
  stepRef,
  progressRef,
}: {
  stepRef: React.RefObject<number>;
  progressRef: React.RefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const ringMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const ringsConfig = useMemo(
    () => [
      { radius: 1.8, tube: 0.042, tiltX: Math.PI / 6, tiltY: 0, tiltZ: 0, speed: 0.55, color: STAGE_COLORS[0].primary },
      { radius: 2.3, tube: 0.038, tiltX: -Math.PI / 4, tiltY: Math.PI / 5, tiltZ: Math.PI / 6, speed: -0.45, color: STAGE_COLORS[1].primary },
      { radius: 2.8, tube: 0.032, tiltX: Math.PI / 3, tiltY: -Math.PI / 4, tiltZ: 0, speed: 0.38, color: STAGE_COLORS[2].primary },
      { radius: 3.3, tube: 0.026, tiltX: -Math.PI / 5, tiltY: Math.PI / 3, tiltZ: -Math.PI / 4, speed: -0.32, color: STAGE_COLORS[3].primary },
      { radius: 3.8, tube: 0.022, tiltX: Math.PI / 8, tiltY: -Math.PI / 6, tiltZ: Math.PI / 3, speed: 0.25, color: STAGE_COLORS[4].primary },
    ],
    []
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const currentStep = stepRef.current ?? 0;
    const progress = (progressRef.current ?? 0) / 100;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.12;
      groupRef.current.rotation.z = Math.sin(t * 0.25) * 0.1;
    }

    ringsConfig.forEach((cfg, idx) => {
      const mesh = ringMeshes.current[idx];
      const mat = ringMats.current[idx];
      if (!mesh || !mat) return;

      const isUnlocked = currentStep >= idx + 1;
      const isCurrent = currentStep === idx + 1;

      // Dynamic rotation speed
      const currentSpeed = isCurrent ? cfg.speed * 2.5 : isUnlocked ? cfg.speed * 1.4 : cfg.speed * 0.6;
      mesh.rotation.x += currentSpeed * 0.02;
      mesh.rotation.y += currentSpeed * 0.015;

      // Glow & Opacity transitions based on 5-step state
      const targetOpacity = isCurrent ? 0.98 : isUnlocked ? 0.8 : 0.28;
      const targetEmissive = isCurrent
        ? 3.8 + Math.sin(t * 6) * 1.8
        : isUnlocked
        ? 2.2 + Math.sin(t * 2.5 + idx) * 0.6
        : 0.5;

      mat.opacity += (targetOpacity - mat.opacity) * 0.08;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.08;

      // Scale pulse on warp approach
      const warpScale = 1 + progress * 0.2 * Math.sin(t * 4 + idx);
      mesh.scale.set(warpScale, warpScale, warpScale);
    });
  });

  return (
    <group ref={groupRef}>
      {ringsConfig.map((cfg, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            ringMeshes.current[idx] = el;
          }}
          rotation={[cfg.tiltX, cfg.tiltY, cfg.tiltZ]}
        >
          <torusGeometry args={[cfg.radius, cfg.tube, 28, 200]} />
          <meshStandardMaterial
            ref={(el) => {
              ringMats.current[idx] = el;
            }}
            color={cfg.color}
            emissive={cfg.color}
            emissiveIntensity={0.6}
            transparent
            opacity={0.35}
            roughness={0.15}
            metalness={0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   2. QUANTUM TESSERACT CORE (Rich Crystalline Multi-Lattice)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function QuantumCore({
  progressRef,
  stepRef,
}: {
  progressRef: React.RefObject<number>;
  stepRef: React.RefObject<number>;
}) {
  const outerRef = useRef<THREE.Mesh>(null);
  const midRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const singularityRef = useRef<THREE.Mesh>(null);
  const outerMat = useRef<THREE.MeshStandardMaterial>(null);
  const midMat = useRef<THREE.MeshStandardMaterial>(null);
  const innerMat = useRef<THREE.MeshStandardMaterial>(null);
  const singMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = (progressRef.current ?? 0) / 100;
    const step = stepRef.current ?? 0;

    const currentPalette = STAGE_COLORS[Math.min(Math.max(step - 1, 0), 4)];
    const targetColor = new THREE.Color(currentPalette.primary);

    // Outer Dodecahedron Wireframe
    if (outerRef.current && outerMat.current) {
      outerRef.current.rotation.x = t * 0.4 + p * 0.9;
      outerRef.current.rotation.y = t * 0.6 + p * 1.3;
      const baseScale = 1.25 + Math.sin(t * 2.5) * 0.1 + p * 0.4;
      outerRef.current.scale.set(baseScale, baseScale, baseScale);

      outerMat.current.color.lerp(targetColor, 0.08);
      outerMat.current.emissive.lerp(targetColor, 0.08);
      outerMat.current.emissiveIntensity = 2.8 + Math.sin(t * 4) * 1.4 + p * 3.5;
    }

    // Mid Icosahedron Lattice
    if (midRef.current && midMat.current) {
      midRef.current.rotation.x = -t * 0.5;
      midRef.current.rotation.z = t * 0.4;
      const midScale = 0.9 + Math.cos(t * 3) * 0.07 + p * 0.25;
      midRef.current.scale.set(midScale, midScale, midScale);

      midMat.current.color.lerp(targetColor, 0.08);
      midMat.current.emissive.lerp(targetColor, 0.08);
      midMat.current.emissiveIntensity = 3.5 + Math.sin(t * 5) * 1.5 + p * 4.0;
    }

    // Inner Octahedron
    if (innerRef.current && innerMat.current) {
      innerRef.current.rotation.y = t * 0.8;
      innerRef.current.rotation.z = -t * 0.6;
      const innerScale = 0.6 + Math.cos(t * 3.5) * 0.05 + p * 0.2;
      innerRef.current.scale.set(innerScale, innerScale, innerScale);

      innerMat.current.color.lerp(targetColor, 0.08);
      innerMat.current.emissive.lerp(targetColor, 0.08);
      innerMat.current.emissiveIntensity = 4.0 + Math.sin(t * 6 + 1) * 1.8 + p * 4.5;
    }

    // Core Singularity (Spherical energetic plasma)
    if (singularityRef.current && singMat.current) {
      const singScale = 0.28 + p * 0.45 + Math.sin(t * 8) * (0.05 + p * 0.08);
      singularityRef.current.scale.set(singScale, singScale, singScale);

      singMat.current.emissiveIntensity = 5.0 + p * 7.0 + Math.sin(t * 10) * 2.5;
      singMat.current.color.lerp(targetColor, 0.1);
      singMat.current.emissive.lerp(targetColor, 0.1);
    }
  });

  return (
    <group>
      {/* Outer Dodecahedron */}
      <mesh ref={outerRef}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          ref={outerMat}
          color={STAGE_COLORS[0].primary}
          emissive={STAGE_COLORS[0].primary}
          emissiveIntensity={2.5}
          wireframe
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Mid Icosahedron */}
      <mesh ref={midRef}>
        <icosahedronGeometry args={[0.85, 0]} />
        <meshStandardMaterial
          ref={midMat}
          color={STAGE_COLORS[0].primary}
          emissive={STAGE_COLORS[0].primary}
          emissiveIntensity={3}
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Inner Octahedron */}
      <mesh ref={innerRef}>
        <octahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial
          ref={innerMat}
          color={STAGE_COLORS[0].primary}
          emissive={STAGE_COLORS[0].primary}
          emissiveIntensity={3.5}
          wireframe
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Center Singularity Sphere */}
      <mesh ref={singularityRef}>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshStandardMaterial
          ref={singMat}
          color="#ffffff"
          emissive={STAGE_COLORS[0].primary}
          emissiveIntensity={6}
          roughness={0.1}
          metalness={0.95}
        />
      </mesh>
    </group>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   3. HYPERSPACE WARP STARFIELD (Accelerating Velocity Streaks)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function HyperdriveWarpStarfield({ count, progressRef }: { count: number; progressRef: React.RefObject<number> }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, initialPositions, speeds, colorArray] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const initPos = new Float32Array(count * 3);
    const spds = new Float32Array(count);
    const cols = new Float32Array(count * 3);

    const palette = [
      new THREE.Color("#22d3ee"),
      new THREE.Color("#6366f1"),
      new THREE.Color("#a855f7"),
      new THREE.Color("#ec4899"),
      new THREE.Color("#ffffff"),
      new THREE.Color("#10b981"),
    ];

    for (let i = 0; i < count; i++) {
      const radius = 1.0 + Math.random() * 9.0;
      const angle = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 32;

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      initPos[i * 3] = x;
      initPos[i * 3 + 1] = y;
      initPos[i * 3 + 2] = z;

      spds[i] = 0.6 + Math.random() * 2.2;

      const c = palette[Math.floor(Math.random() * palette.length)];
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }

    return [pos, initPos, spds, cols];
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const progress = (progressRef.current ?? 0) / 100;
    const t = clock.elapsedTime;

    const warpMultiplier = 1 + Math.pow(progress, 3) * 28;
    const baseSpeed = 0.09 * warpMultiplier;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const zIdx = i * 3 + 2;
      array[zIdx] += speeds[i] * baseSpeed;

      if (array[zIdx] > 12) {
        array[zIdx] = -18;
      }
    }

    posAttr.needsUpdate = true;
    pointsRef.current.rotation.z = t * (0.05 + progress * 0.25);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color" args={[colorArray, 3]} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        transparent
        opacity={0.8}
        sizeAttenuation
        vertexColors
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   4. 5-STEP SHOCKWAVE EXPANSION PULSES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function VolumetricShockwaves({ stepRef }: { stepRef: React.RefObject<number> }) {
  const waveMesh = useRef<THREE.Mesh>(null);
  const waveMat = useRef<THREE.MeshStandardMaterial>(null);
  const lastStep = useRef(0);
  const animTime = useRef(999);
  const activeColor = useRef(new THREE.Color(STAGE_COLORS[0].primary));

  useFrame(({ clock }) => {
    const step = stepRef.current ?? 0;
    const t = clock.elapsedTime;

    if (step !== lastStep.current && step >= 1 && step <= 5) {
      lastStep.current = step;
      animTime.current = t;
      activeColor.current.set(STAGE_COLORS[step - 1].primary);
    }

    if (!waveMesh.current || !waveMat.current) return;

    const elapsed = t - animTime.current;
    const duration = 1.4;

    if (elapsed < duration && elapsed >= 0) {
      const p = elapsed / duration;
      const scale = 0.5 + p * 9.0;
      waveMesh.current.scale.set(scale, scale, scale);

      waveMat.current.opacity = (1 - p) * 0.85;
      waveMat.current.emissiveIntensity = (1 - p) * 7.0;
      waveMat.current.color.copy(activeColor.current);
      waveMat.current.emissive.copy(activeColor.current);
    } else {
      waveMesh.current.scale.set(0.001, 0.001, 0.001);
      waveMat.current.opacity = 0;
    }
  });

  return (
    <mesh ref={waveMesh} scale={0}>
      <torusGeometry args={[1, 0.045, 16, 120]} />
      <meshStandardMaterial
        ref={waveMat}
        color="#22d3ee"
        emissive="#22d3ee"
        emissiveIntensity={4}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   5. ORBITING TELEMETRY BEACONS & ENERGY HALOS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function TelemetryBeacons({ stepRef }: { stepRef: React.RefObject<number> }) {
  const count = 6;
  const nodes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        orbitRadius: 2.6 + (i % 3) * 0.6,
        speed: 0.4 + (i % 2) * 0.3,
        phase: (i / count) * Math.PI * 2,
        inclination: ((i * 35) * Math.PI) / 180,
      })),
    []
  );

  return (
    <group>
      {nodes.map((node, i) => (
        <SingleBeacon key={i} index={i} {...node} stepRef={stepRef} />
      ))}
    </group>
  );
}

function SingleBeacon({
  index,
  orbitRadius,
  speed,
  phase,
  inclination,
  stepRef,
}: {
  index: number;
  orbitRadius: number;
  speed: number;
  phase: number;
  inclination: number;
  stepRef: React.RefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const angle = t * speed + phase;

    const x = Math.cos(angle) * orbitRadius;
    const y = Math.sin(angle) * orbitRadius * Math.sin(inclination) + Math.sin(t * 1.5 + index) * 0.25;
    const z = Math.sin(angle) * orbitRadius * Math.cos(inclination);

    meshRef.current.position.set(x, y, z);
    if (haloRef.current) haloRef.current.position.set(x, y, z);

    const step = stepRef.current ?? 0;
    const isLit = index < step + 1;

    if (matRef.current) {
      const palette = STAGE_COLORS[index % STAGE_COLORS.length];
      const targetIntensity = isLit ? 6.0 + Math.sin(t * 5) * 2.5 : 1.0;
      matRef.current.emissiveIntensity += (targetIntensity - matRef.current.emissiveIntensity) * 0.1;
      matRef.current.color.set(palette.primary);
      matRef.current.emissive.set(palette.emissive);
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial ref={matRef} color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.5} />
      </mesh>
      <mesh ref={haloRef}>
        <torusGeometry args={[0.16, 0.01, 8, 32]} />
        <meshStandardMaterial
          color={STAGE_COLORS[index % STAGE_COLORS.length].primary}
          emissive={STAGE_COLORS[index % STAGE_COLORS.length].primary}
          emissiveIntensity={3.5}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   6. CINEMATIC CAMERA CONTROLLER (Parallax & Hyperspace Zoom)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function CameraController({
  progressRef,
  mousePos,
}: {
  progressRef: React.RefObject<number>;
  mousePos: React.RefObject<{ x: number; y: number }>;
}) {
  const { camera } = useThree();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = (progressRef.current ?? 0) / 100;
    const mx = mousePos.current?.x ?? 0;
    const my = mousePos.current?.y ?? 0;

    // Smooth mouse tilt parallax
    const targetX = mx * 1.6 + Math.sin(t * 0.3) * 0.4;
    const targetY = my * 1.1 + Math.cos(t * 0.25) * 0.3;

    // Final hyperspace zoom surge when approaching 100%
    const plungeZ = p > 0.9 ? 6.5 - Math.pow((p - 0.9) / 0.1, 2) * 5.0 : 6.5;

    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.position.z += (plungeZ - camera.position.z) * 0.06;

    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   7. MAIN THREE.JS SCENE ASSEMBLY
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function SplashSceneInner({
  progressRef,
  stepRef,
  isMobile,
  mousePos,
}: {
  progressRef: React.RefObject<number>;
  stepRef: React.RefObject<number>;
  isMobile: boolean;
  mousePos: React.RefObject<{ x: number; y: number }>;
}) {
  return (
    <>
      {/* Cinematic Studio Lights */}
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 4]} color="#22d3ee" intensity={6} distance={15} />
      <pointLight position={[5, 4, 3]} color="#ec4899" intensity={5} distance={15} />
      <pointLight position={[-5, -4, 3]} color="#a855f7" intensity={5} distance={15} />
      <pointLight position={[0, -5, -2]} color="#10b981" intensity={4} distance={12} />
      <pointLight position={[0, 6, 0]} color="#f59e0b" intensity={4} distance={12} />

      {/* Core Quantum & Resonance Geometry */}
      <QuantumCore progressRef={progressRef} stepRef={stepRef} />
      <ResonatorRings stepRef={stepRef} progressRef={progressRef} />
      <TelemetryBeacons stepRef={stepRef} />
      <VolumetricShockwaves stepRef={stepRef} />

      {/* Starfield Particles */}
      <HyperdriveWarpStarfield count={isMobile ? 1000 : 2800} progressRef={progressRef} />

      {/* Reactive Cinematic Camera */}
      <CameraController progressRef={progressRef} mousePos={mousePos} />
    </>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   EXPORTED THREE.JS CANVAS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function SplashCanvas({
  progressRef,
  stepRef,
  isMobile,
}: {
  progressRef: React.RefObject<number>;
  stepRef: React.RefObject<number>;
  isMobile: boolean;
}) {
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <Canvas
      camera={{ fov: 50, position: [0, 0, 6.5] }}
      style={{ position: "fixed", inset: 0, zIndex: 0 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <SplashSceneInner
        progressRef={progressRef}
        stepRef={stepRef}
        isMobile={isMobile}
        mousePos={mousePos}
      />
    </Canvas>
  );
}
