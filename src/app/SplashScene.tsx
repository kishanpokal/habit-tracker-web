"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   DOUBLE HELIX RINGS — DNA-style spinning
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function HelixRings() {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const mat1Ref = useRef<THREE.MeshStandardMaterial>(null);
  const mat2Ref = useRef<THREE.MeshStandardMaterial>(null);
  const mat3Ref = useRef<THREE.MeshStandardMaterial>(null);
  const scaleRef = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Smooth scale-in
    scaleRef.current = Math.min(scaleRef.current + 0.008, 1);
    const ease = 1 - Math.pow(1 - scaleRef.current, 3); // cubic easeOut

    if (groupRef.current) {
      groupRef.current.scale.set(ease, ease, ease);
      groupRef.current.rotation.y = t * 0.15;
    }

    // Ring 1 — main hero ring
    if (ring1Ref.current && mat1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.4;
      ring1Ref.current.rotation.z = Math.sin(t * 0.3) * 0.2;
      mat1Ref.current.emissiveIntensity = 1.2 + Math.sin(t * 2) * 0.6;
    }

    // Ring 2 — counter-rotating
    if (ring2Ref.current && mat2Ref.current) {
      ring2Ref.current.rotation.x = -t * 0.3;
      ring2Ref.current.rotation.y = t * 0.5;
      ring2Ref.current.rotation.z = Math.cos(t * 0.4) * 0.3;
      mat2Ref.current.emissiveIntensity = 1.0 + Math.sin(t * 2.5 + 1) * 0.5;
    }

    // Ring 3 — slow outer
    if (ring3Ref.current && mat3Ref.current) {
      ring3Ref.current.rotation.y = t * 0.2;
      ring3Ref.current.rotation.z = t * 0.15;
      ring3Ref.current.rotation.x = Math.sin(t * 0.2) * 0.4;
      mat3Ref.current.emissiveIntensity = 0.6 + Math.sin(t * 1.8 + 2) * 0.4;
    }
  });

  return (
    <group ref={groupRef} scale={0}>
      {/* Primary ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2, 0.05, 32, 256]} />
        <meshStandardMaterial
          ref={mat1Ref}
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Secondary ring — tilted, counter-rotating */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, Math.PI / 6]}>
        <torusGeometry args={[1.7, 0.035, 32, 256]} />
        <meshStandardMaterial
          ref={mat2Ref}
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={1.2}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Tertiary ring — large outer */}
      <mesh ref={ring3Ref} rotation={[Math.PI / 4, Math.PI / 5, 0]}>
        <torusGeometry args={[2.8, 0.02, 32, 256]} />
        <meshStandardMaterial
          ref={mat3Ref}
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={0.8}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PROGRESS ARC — sweeping energy ring
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ProgressArc({
  progressRef,
}: {
  progressRef: React.RefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const matInnerRef = useRef<THREE.MeshStandardMaterial>(null);
  const matOuterRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = (progressRef.current ?? 0) / 100;

    if (groupRef.current) {
      groupRef.current.rotation.z = -p * Math.PI * 2;
      groupRef.current.rotation.y = t * 0.1;
    }

    // Inner progress ring
    if (innerRef.current && matInnerRef.current) {
      innerRef.current.rotation.x = t * 0.3;
      matInnerRef.current.emissiveIntensity = 2 + Math.sin(t * 4) * 1.5;
      matInnerRef.current.opacity = 0.3 + p * 0.7;
    }

    // Outer energy ring
    if (outerRef.current && matOuterRef.current) {
      outerRef.current.rotation.x = -t * 0.2;
      outerRef.current.rotation.z = t * 0.15;
      const pulse = Math.sin(t * 3 + p * 10) * 0.5 + 0.5;
      matOuterRef.current.emissiveIntensity = 1 + pulse * 2 * p;
      matOuterRef.current.opacity = 0.2 + p * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={innerRef}>
        <torusGeometry args={[2.4, 0.025, 16, 200]} />
        <meshStandardMaterial
          ref={matInnerRef}
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={3}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={outerRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.6, 0.015, 16, 200]} />
        <meshStandardMaterial
          ref={matOuterRef}
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={1}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ORBITING NODES — with trail ribbons
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function OrbitingNodes({
  stepRef,
}: {
  stepRef: React.RefObject<number>;
}) {
  const nodesData = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        radius: 1.6 + (i % 4) * 0.4,
        speed: 0.25 + (i % 3) * 0.15,
        offset: (i / 8) * Math.PI * 2,
        yFactor: 0.3 + (i % 2) * 0.25,
        tilt: (i * Math.PI) / 7,
      })),
    []
  );

  return (
    <>
      {nodesData.map((node, i) => (
        <OrbitNode key={i} index={i} {...node} stepRef={stepRef} />
      ))}
    </>
  );
}

function OrbitNode({
  index,
  radius,
  speed,
  offset,
  yFactor,
  tilt,
  stepRef,
}: {
  index: number;
  radius: number;
  speed: number;
  offset: number;
  yFactor: number;
  tilt: number;
  stepRef: React.RefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const trailMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const flashRef = useRef(0);
  const lastLitRef = useRef(false);

  useFrame(({ clock }) => {
    if (!meshRef.current || !matRef.current) return;
    const t = clock.elapsedTime;

    // 3D orbital path (not just flat circle)
    const angle = t * speed + offset;
    meshRef.current.position.x = radius * Math.cos(angle);
    meshRef.current.position.y = radius * Math.sin(angle) * yFactor + Math.sin(t * 0.5 + offset) * 0.3;
    meshRef.current.position.z = radius * Math.sin(angle + tilt) * 0.6;

    // Determine if lit
    const step = stepRef.current ?? 0;
    const nodeStep = Math.floor(index / 2);
    const isLit = nodeStep < step;

    // Flash effect on state change
    if (isLit && !lastLitRef.current) {
      flashRef.current = 1;
    }
    lastLitRef.current = isLit;
    flashRef.current *= 0.96;

    // Scale pulse on activation
    const baseScale = isLit ? 1.4 : 1;
    const flashScale = 1 + flashRef.current * 2;
    const s = baseScale * flashScale;
    meshRef.current.scale.set(s, s, s);

    // Color transition
    const targetIntensity = isLit ? 5 + Math.sin(t * 4) * 1.5 : 0.5 + Math.sin(t * 2 + index) * 0.3;
    matRef.current.emissiveIntensity += (targetIntensity - matRef.current.emissiveIntensity) * 0.08;

    if (isLit) {
      matRef.current.emissive.lerp(new THREE.Color("#10b981"), 0.08);
      matRef.current.color.lerp(new THREE.Color("#10b981"), 0.08);
    } else {
      matRef.current.emissive.lerp(new THREE.Color("#6366f1"), 0.05);
      matRef.current.color.lerp(new THREE.Color("#6366f1"), 0.05);
    }

    // Light follows node
    if (lightRef.current) {
      lightRef.current.position.copy(meshRef.current.position);
      lightRef.current.intensity = isLit ? 3 + flashRef.current * 8 : 0.3;
      if (isLit) lightRef.current.color.set("#10b981");
      else lightRef.current.color.set("#6366f1");
    }

    // Trail ring following node
    if (trailRef.current && trailMatRef.current) {
      trailRef.current.position.copy(meshRef.current.position);
      trailRef.current.rotation.x = t * 2;
      trailRef.current.rotation.y = t * 3;
      const trailScale = isLit ? 1.5 + Math.sin(t * 5) * 0.3 : 0.8;
      trailRef.current.scale.set(trailScale, trailScale, trailScale);
      trailMatRef.current.opacity = isLit ? 0.4 + flashRef.current * 0.6 : 0.1;
      if (isLit) trailMatRef.current.emissive.set("#10b981");
      else trailMatRef.current.emissive.set("#6366f1");
    }
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          ref={matRef}
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Tiny halo ring around each node */}
      <mesh ref={trailRef}>
        <torusGeometry args={[0.15, 0.008, 8, 32]} />
        <meshStandardMaterial
          ref={trailMatRef}
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={2}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight ref={lightRef} color="#6366f1" intensity={0.3} distance={3} />
    </>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   VORTEX PARTICLE FIELD — spiral galaxy
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function VortexParticles({
  count,
  stepRef,
}: {
  count: number;
  stepRef: React.RefObject<number>;
}) {
  const ref = useRef<THREE.Points>(null);
  const lastStepRef = useRef(0);
  const pulseRef = useRef(1);
  const colorsRef = useRef<Float32Array>(null);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      [0.39, 0.4, 0.95],   // indigo
      [0.66, 0.33, 0.97],  // purple
      [0.13, 0.83, 0.93],  // cyan
      [1, 1, 1],           // white
    ];

    for (let i = 0; i < count; i++) {
      // Spiral arm distribution
      const arm = i % 3;
      const armAngle = (arm / 3) * Math.PI * 2;
      const dist = 1.5 + Math.random() * 6;
      const spiralAngle = armAngle + dist * 0.4 + Math.random() * 0.5;
      const height = (Math.random() - 0.5) * 2 * (1 / (1 + dist * 0.3));

      pos[i * 3] = dist * Math.cos(spiralAngle);
      pos[i * 3 + 1] = height;
      pos[i * 3 + 2] = dist * Math.sin(spiralAngle);

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }

    colorsRef.current = col;
    return { positions: pos, colors: col };
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;

    // Spiral rotation
    ref.current.rotation.y = t * 0.08;
    ref.current.rotation.x = Math.sin(t * 0.1) * 0.1;

    // Pulse on step change
    const step = stepRef.current ?? 0;
    if (step !== lastStepRef.current) {
      lastStepRef.current = step;
      pulseRef.current = 1.2;
    }
    pulseRef.current += (1 - pulseRef.current) * 0.02;
    const s = pulseRef.current;
    ref.current.scale.set(s, s, s);
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
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        transparent
        opacity={0.5}
        sizeAttenuation
        vertexColors
      />
    </points>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ENERGY BEAMS — connecting lines between nodes
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function EnergyBeams({
  stepRef,
}: {
  stepRef: React.RefObject<number>;
}) {
  const beamsData = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        startRadius: 1.2 + Math.random() * 1.5,
        endRadius: 1.5 + Math.random() * 2,
        speedA: 0.2 + Math.random() * 0.4,
        speedB: 0.3 + Math.random() * 0.3,
        offsetA: Math.random() * Math.PI * 2,
        offsetB: Math.random() * Math.PI * 2,
        yA: (Math.random() - 0.5) * 2,
        yB: (Math.random() - 0.5) * 2,
      })),
    []
  );

  return (
    <group>
      {beamsData.map((beam, i) => (
        <EnergyBeam key={i} index={i} {...beam} stepRef={stepRef} />
      ))}
    </group>
  );
}

function EnergyBeam({
  index,
  startRadius,
  endRadius,
  speedA,
  speedB,
  offsetA,
  offsetB,
  yA,
  yB,
  stepRef,
}: {
  index: number;
  startRadius: number;
  endRadius: number;
  speedA: number;
  speedB: number;
  offsetA: number;
  offsetB: number;
  yA: number;
  yB: number;
  stepRef: React.RefObject<number>;
}) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);

  useFrame(({ clock }) => {
    if (!geoRef.current || !lineRef.current) return;
    const t = clock.elapsedTime;
    const step = stepRef.current ?? 0;

    const angleA = t * speedA + offsetA;
    const angleB = t * speedB + offsetB;

    const positions = new Float32Array([
      startRadius * Math.cos(angleA), yA * Math.sin(t * 0.5), startRadius * Math.sin(angleA),
      endRadius * Math.cos(angleB), yB * Math.cos(t * 0.3), endRadius * Math.sin(angleB),
    ]);

    geoRef.current.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geoRef.current.attributes.position.needsUpdate = true;

    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    const baseOpacity = 0.06 + step * 0.04;
    mat.opacity = baseOpacity + Math.sin(t * 2 + index) * 0.03;
  });

  const colors = ["#6366f1", "#a855f7", "#22d3ee", "#10b981"];

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(6), 3]}
          count={2}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={colors[index % colors.length]}
        transparent
        opacity={0.08}
      />
    </lineSegments>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SHOCKWAVE RINGS — pulse outward on step change
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ShockwaveRings({
  stepRef,
}: {
  stepRef: React.RefObject<number>;
}) {
  const rings = useRef<THREE.Mesh[]>([]);
  const matRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  const lastStepRef = useRef(0);
  const wavesRef = useRef<{ active: boolean; time: number; ring: number }[]>([
    { active: false, time: 0, ring: 0 },
    { active: false, time: 0, ring: 1 },
    { active: false, time: 0, ring: 2 },
    { active: false, time: 0, ring: 3 },
  ]);

  useFrame(({ clock }) => {
    const step = stepRef.current ?? 0;
    const t = clock.elapsedTime;

    // Trigger wave on step change
    if (step !== lastStepRef.current && step > 0 && step <= 4) {
      const wave = wavesRef.current[step - 1];
      wave.active = true;
      wave.time = t;
      lastStepRef.current = step;
    }

    // Animate waves
    wavesRef.current.forEach((wave, i) => {
      const mesh = rings.current[i];
      const mat = matRefs.current[i];
      if (!mesh || !mat) return;

      if (wave.active) {
        const elapsed = t - wave.time;
        const duration = 2;
        const progress = elapsed / duration;

        if (progress < 1) {
          const scale = 1 + progress * 4;
          mesh.scale.set(scale, scale, scale);
          mat.opacity = 0.6 * (1 - progress);
          mat.emissiveIntensity = 3 * (1 - progress);
        } else {
          wave.active = false;
          mesh.scale.set(0, 0, 0);
          mat.opacity = 0;
        }
      } else {
        mesh.scale.set(0, 0, 0);
      }
    });
  });

  const shockColors = ["#6366f1", "#a855f7", "#22d3ee", "#10b981"];

  return (
    <>
      {shockColors.map((color, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) rings.current[i] = el;
          }}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0}
        >
          <torusGeometry args={[0.5, 0.015, 8, 64]} />
          <meshStandardMaterial
            ref={(el) => {
              if (el) matRefs.current[i] = el;
            }}
            color={color}
            emissive={color}
            emissiveIntensity={3}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FLOATING ENERGY ORBS — Lissajous paths with glow
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function EnergyOrbs() {
  const orbsData = useMemo(
    () => [
      { color: "#6366f1", fX: 0.7, fY: 1.1, fZ: 0.9, aX: 3.2, aY: 2.0, aZ: 1.8, ph: 0, size: 0.06 },
      { color: "#a855f7", fX: 1.0, fY: 0.6, fZ: 1.3, aX: 2.5, aY: 2.8, aZ: 1.2, ph: 1.2, size: 0.05 },
      { color: "#22d3ee", fX: 0.5, fY: 1.3, fZ: 0.7, aX: 3.5, aY: 1.8, aZ: 2.5, ph: 2.4, size: 0.07 },
      { color: "#6366f1", fX: 1.2, fY: 0.8, fZ: 1.1, aX: 2.8, aY: 3.0, aZ: 1.5, ph: 3.6, size: 0.04 },
      { color: "#a855f7", fX: 0.8, fY: 1.0, fZ: 0.5, aX: 3.0, aY: 1.5, aZ: 2.2, ph: 4.8, size: 0.055 },
      { color: "#22d3ee", fX: 1.1, fY: 0.5, fZ: 0.8, aX: 2.2, aY: 3.2, aZ: 2.8, ph: 0.8, size: 0.045 },
      { color: "#f59e0b", fX: 0.6, fY: 0.9, fZ: 1.2, aX: 2.6, aY: 2.4, aZ: 1.6, ph: 5.2, size: 0.05 },
      { color: "#10b981", fX: 0.9, fY: 1.2, fZ: 0.6, aX: 3.3, aY: 1.6, aZ: 2.0, ph: 1.8, size: 0.04 },
    ],
    []
  );

  return (
    <>
      {orbsData.map((orb, i) => (
        <EnergyOrb key={i} {...orb} />
      ))}
    </>
  );
}

function EnergyOrb({
  color,
  fX, fY, fZ,
  aX, aY, aZ,
  ph, size,
}: {
  color: string;
  fX: number; fY: number; fZ: number;
  aX: number; aY: number; aZ: number;
  ph: number; size: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !matRef.current) return;
    const t = clock.elapsedTime + ph;
    ref.current.position.x = Math.sin(t * fX) * aX;
    ref.current.position.y = Math.cos(t * fY) * aY;
    ref.current.position.z = Math.sin(t * fZ) * aZ;

    // Breathing glow
    matRef.current.emissiveIntensity = 2.5 + Math.sin(t * 3) * 1.5;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshStandardMaterial
        ref={matRef}
        emissive={color}
        emissiveIntensity={3}
        color={color}
        transparent
        opacity={0.9}
      />
      <pointLight color={color} intensity={2} distance={3} />
    </mesh>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   INNER CORE — pulsing sphere at center
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function InnerCore({ progressRef }: { progressRef: React.RefObject<number> }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !matRef.current) return;
    const t = clock.elapsedTime;
    const p = (progressRef.current ?? 0) / 100;

    // Breathe
    const breathe = 1 + Math.sin(t * 2) * 0.15;
    const s = (0.15 + p * 0.25) * breathe;
    ref.current.scale.set(s, s, s);

    // Rotate
    ref.current.rotation.y = t * 0.5;
    ref.current.rotation.x = t * 0.3;

    // Color shifts from indigo to cyan as progress increases
    const color = new THREE.Color("#6366f1").lerp(new THREE.Color("#22d3ee"), p);
    matRef.current.emissive.copy(color);
    matRef.current.color.copy(color);
    matRef.current.emissiveIntensity = 3 + Math.sin(t * 4) * 1.5 + p * 2;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial
        ref={matRef}
        color="#6366f1"
        emissive="#6366f1"
        emissiveIntensity={3}
        transparent
        opacity={0.6}
        wireframe
      />
    </mesh>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CAMERA SWAY — cinematic drift
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function CameraSway() {
  const { camera } = useThree();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.25) * 0.8;
    camera.position.y = Math.cos(t * 0.18) * 0.5;
    camera.position.z = 7 + Math.sin(t * 0.15) * 0.5;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SCENE COMPOSITION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function SplashSceneInner({
  progressRef,
  stepRef,
  isMobile,
}: {
  progressRef: React.RefObject<number>;
  stepRef: React.RefObject<number>;
  isMobile: boolean;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 4]} color="#6366f1" intensity={6} />
      <pointLight position={[4, -3, 2]} color="#a855f7" intensity={4} />
      <pointLight position={[-4, 3, -2]} color="#22d3ee" intensity={3} />
      <pointLight position={[0, 4, 0]} color="#f59e0b" intensity={1.5} />
      <pointLight position={[0, -4, 2]} color="#10b981" intensity={2} />

      {/* Core elements */}
      <InnerCore progressRef={progressRef} />
      <HelixRings />
      <ProgressArc progressRef={progressRef} />
      <OrbitingNodes stepRef={stepRef} />
      <ShockwaveRings stepRef={stepRef} />

      {/* Atmospheric elements */}
      <VortexParticles count={isMobile ? 800 : 2000} stepRef={stepRef} />
      <EnergyBeams stepRef={stepRef} />
      <EnergyOrbs />

      {/* Camera */}
      <CameraSway />
    </>
  );
}

/* ━━━━━ EXPORTED CANVAS ━━━━━ */
export function SplashCanvas({
  progressRef,
  stepRef,
  isMobile,
}: {
  progressRef: React.RefObject<number>;
  stepRef: React.RefObject<number>;
  isMobile: boolean;
}) {
  return (
    <Canvas
      camera={{ fov: 55, position: [0, 0, 7] }}
      style={{ position: "fixed", inset: 0, zIndex: 0 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <SplashSceneInner
        progressRef={progressRef}
        stepRef={stepRef}
        isMobile={isMobile}
      />
    </Canvas>
  );
}
