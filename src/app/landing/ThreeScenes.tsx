"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

/* ━━━━━ HABIT RINGS ━━━━━ */
function HabitRing({
  args,
  position,
  rotSpeed,
  color,
}: {
  args: [number, number, number, number];
  position: [number, number, number];
  rotSpeed: [number, number];
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.x += rotSpeed[0];
    ref.current.rotation.y += rotSpeed[1];
  });
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={args} />
      <meshStandardMaterial
        emissive={color}
        emissiveIntensity={1.2}
        color={color}
        transparent
        opacity={0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ━━━━━ PARTICLE FIELD ━━━━━ */
function ParticleField({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0005;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.015}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

/* ━━━━━ STREAK LINES ━━━━━ */
function StreakLines() {
  const groupRef = useRef<THREE.Group>(null);
  const lines = useMemo(() => {
    const result: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    for (let i = 0; i < 12; i++) {
      result.push({
        start: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4
        ),
        end: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4
        ),
      });
    }
    return result;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child) => {
      const mat = (child as THREE.LineSegments).material as THREE.LineBasicMaterial;
      if (mat) mat.opacity = 0.15 + 0.15 * Math.sin(clock.elapsedTime * 0.8 + Math.random());
    });
  });

  return (
    <group ref={groupRef}>
      {lines.map((l, i) => {
        const geo = new THREE.BufferGeometry().setFromPoints([l.start, l.end]);
        return (
          <lineSegments key={i} geometry={geo}>
            <lineBasicMaterial color="#22d3ee" transparent opacity={0.3} />
          </lineSegments>
        );
      })}
    </group>
  );
}

/* ━━━━━ FLOATING CHECK ORBS ━━━━━ */
function FloatingOrbs() {
  const orbData = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        offset: i * 1.3,
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 3,
        z: (Math.random() - 0.5) * 3,
      })),
    []
  );

  return (
    <>
      {orbData.map((orb, i) => (
        <FloatingOrb key={i} {...orb} />
      ))}
    </>
  );
}

function FloatingOrb({
  offset,
  x,
  y,
  z,
}: {
  offset: number;
  x: number;
  y: number;
  z: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime + offset;
    ref.current.position.x = x + Math.sin(t * 0.5) * 0.4;
    ref.current.position.y = y + Math.cos(t * 0.7) * 0.3;
    ref.current.position.z = z + Math.sin(t * 0.3) * 0.2;
  });

  return (
    <mesh ref={ref} position={[x, y, z]}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        emissive="#22d3ee"
        emissiveIntensity={3}
        color="#22d3ee"
      />
      <pointLight color="#22d3ee" intensity={2} distance={3} />
    </mesh>
  );
}

/* ━━━━━ MOUSE PARALLAX ━━━━━ */
function CameraRig() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useMemo(() => {
    if (typeof window !== "undefined") {
      const handler = (e: MouseEvent) => {
        mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 0.3;
        mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 0.3;
      };
      window.addEventListener("mousemove", handler);
      return () => window.removeEventListener("mousemove", handler);
    }
  }, []);

  useFrame(() => {
    camera.position.x += (mouse.current.x - camera.position.x) * 0.02;
    camera.position.y += (-mouse.current.y - camera.position.y) * 0.02;
  });

  return null;
}

/* ━━━━━ HERO SCENE ━━━━━ */
function HeroSceneInner({ isMobile }: { isMobile: boolean }) {
  const ringsData: {
    args: [number, number, number, number];
    position: [number, number, number];
    rotSpeed: [number, number];
    color: string;
  }[] = useMemo(
    () => [
      { args: [1.5, 0.04, 16, 100], position: [-1.5, 0.8, -1], rotSpeed: [0.003, 0.005], color: "#6366f1" },
      { args: [2.2, 0.03, 16, 100], position: [1.8, -0.5, 0.5], rotSpeed: [0.004, 0.003], color: "#a855f7" },
      { args: [1.0, 0.035, 16, 100], position: [0.5, 1.5, -2], rotSpeed: [0.005, 0.002], color: "#6366f1" },
      { args: [1.8, 0.025, 16, 100], position: [-2.0, -1.2, 1], rotSpeed: [0.002, 0.006], color: "#22d3ee" },
      { args: [0.8, 0.04, 16, 100], position: [2.5, 0.3, -1.5], rotSpeed: [0.006, 0.004], color: "#a855f7" },
      { args: [2.5, 0.02, 16, 100], position: [0, 0, 0], rotSpeed: [0.001, 0.003], color: "#6366f1" },
      { args: [1.3, 0.03, 16, 100], position: [-0.8, -1.8, 2], rotSpeed: [0.004, 0.005], color: "#22d3ee" },
    ],
    []
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} color="#6366f1" intensity={4} />
      <pointLight position={[-5, -3, -5]} color="#a855f7" intensity={3} />
      <spotLight position={[0, 10, 0]} intensity={2} angle={0.3} penumbra={0.5} />

      {ringsData.map((r, i) => (
        <HabitRing key={i} {...r} />
      ))}

      <ParticleField count={isMobile ? 800 : 3000} />
      <StreakLines />
      <FloatingOrbs />
      <CameraRig />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.3}
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2 + Math.PI / 6}
        minPolarAngle={Math.PI / 2 - Math.PI / 6}
      />
    </>
  );
}

export function HeroCanvas({ isMobile }: { isMobile: boolean }) {
  return (
    <Canvas
      camera={{ fov: 60, position: [0, 0, 6] }}
      style={{ position: "absolute", inset: 0 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <HeroSceneInner isMobile={isMobile} />
    </Canvas>
  );
}

/* ━━━━━ MINI FEATURE SHAPES ━━━━━ */
function RotatingShape({
  geometry,
  color,
  wireframe,
}: {
  geometry: React.ReactNode;
  color: string;
  wireframe?: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.8;
    ref.current.rotation.y += delta * 1.2;
  });

  return (
    <mesh ref={ref}>
      {geometry}
      <meshStandardMaterial
        emissive={color}
        emissiveIntensity={1.5}
        color={color}
        wireframe={wireframe}
      />
    </mesh>
  );
}

export function MiniCanvas({ shapeKey }: { shapeKey: string }) {
  const shapeMap: Record<string, { geometry: React.ReactNode; color: string; wireframe?: boolean }> = {
    analytics: { geometry: <torusKnotGeometry args={[0.4, 0.15, 100, 16]} />, color: "#6366f1" },
    streak: { geometry: <icosahedronGeometry args={[0.5, 0]} />, color: "#f59e0b" },
    categories: { geometry: <octahedronGeometry args={[0.5, 0]} />, color: "#10b981" },
    pwa: { geometry: <sphereGeometry args={[0.45, 16, 16]} />, color: "#22d3ee", wireframe: true },
    darkmode: { geometry: <boxGeometry args={[0.6, 0.6, 0.6]} />, color: "#a855f7" },
    export: { geometry: <tetrahedronGeometry args={[0.55, 0]} />, color: "#ec4899" },
  };

  const config = shapeMap[shapeKey] || shapeMap.analytics;

  return (
    <Canvas
      camera={{ position: [0, 0, 2], fov: 50 }}
      style={{ width: "100%", height: "80px" }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 2, 2]} intensity={3} color={config.color} />
      <RotatingShape
        geometry={config.geometry}
        color={config.color}
        wireframe={config.wireframe}
      />
    </Canvas>
  );
}

/* ━━━━━ CTA BACKGROUND SCENE ━━━━━ */
function CtaTorusKnot() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.15;
    ref.current.rotation.y += delta * 0.2;
  });

  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[1, 0.3, 200, 20]} />
      <meshStandardMaterial
        color="#6366f1"
        emissive="#a855f7"
        emissiveIntensity={0.5}
        roughness={0.3}
        metalness={0.7}
      />
    </mesh>
  );
}

export function CtaCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ position: "absolute", inset: 0, borderRadius: "1.5rem" }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[3, 3, 3]} color="#6366f1" intensity={4} />
      <pointLight position={[-3, -2, -3]} color="#a855f7" intensity={2} />
      <CtaTorusKnot />
    </Canvas>
  );
}
