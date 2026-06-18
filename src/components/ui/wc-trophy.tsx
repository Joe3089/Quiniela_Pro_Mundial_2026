"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";

function TrophyGeometry() {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.6;
    if (ring1Ref.current) ring1Ref.current.rotation.z += delta * 1.2;
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.9;
  });

  const goldMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#C8960C"),
        metalness: 1.0,
        roughness: 0.12,
        envMapIntensity: 2.5,
      }),
    []
  );

  const malachiteMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0B5E2F"),
        metalness: 0.2,
        roughness: 0.6,
      }),
    []
  );

  const ringMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#FFD700"),
        metalness: 1.0,
        roughness: 0.05,
        transparent: true,
        opacity: 0.55,
        envMapIntensity: 3.0,
      }),
    []
  );

  // Trophy silhouette profile: FIFA WC trophy approximation
  const bodyPoints = useMemo(() => [
    new THREE.Vector2(0.0, -2.0),
    new THREE.Vector2(0.42, -1.94),
    new THREE.Vector2(0.52, -1.82),
    new THREE.Vector2(0.52, -1.58),
    new THREE.Vector2(0.36, -1.42),
    new THREE.Vector2(0.13, -1.05),
    new THREE.Vector2(0.10, -0.72),
    new THREE.Vector2(0.13, -0.38),
    new THREE.Vector2(0.28, 0.08),
    new THREE.Vector2(0.44, 0.56),
    new THREE.Vector2(0.50, 0.95),
    new THREE.Vector2(0.44, 1.24),
    new THREE.Vector2(0.34, 1.42),
    new THREE.Vector2(0.22, 1.52),
  ], []);

  const bodyGeo = useMemo(() => new THREE.LatheGeometry(bodyPoints, 48), [bodyPoints]);

  // Globe curve (latitude lines style)
  const globeGeo = useMemo(() => new THREE.SphereGeometry(0.34, 32, 24), []);

  // Base malachite ring
  const baseRingGeo = useMemo(() => new THREE.CylinderGeometry(0.5, 0.46, 0.16, 48), []);

  // Orbital rings (spinning around trophy)
  const orbRingGeo = useMemo(() => new THREE.TorusGeometry(0.78, 0.018, 6, 80), []);

  return (
    <group ref={groupRef}>
      {/* Main body */}
      <mesh geometry={bodyGeo} material={goldMat} castShadow />

      {/* Globe on top */}
      <mesh position={[0, 1.86, 0]} geometry={globeGeo} material={goldMat} castShadow />

      {/* Malachite base band */}
      <mesh position={[0, -1.7, 0]} geometry={baseRingGeo} material={malachiteMat} />

      {/* Orbital glow rings */}
      <mesh
        ref={ring1Ref}
        position={[0, 0.2, 0]}
        rotation={[Math.PI / 2.8, 0.3, 0]}
        geometry={orbRingGeo}
        material={ringMat}
      />
      <mesh
        ref={ring2Ref}
        position={[0, 0.5, 0]}
        rotation={[Math.PI / 2.2, -0.5, 0.4]}
        geometry={orbRingGeo}
        material={ringMat}
      />
    </group>
  );
}

interface WCTrophyProps {
  size?: number;
  className?: string;
}

export default function WCTrophy({ size = 140, className }: WCTrophyProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={className}
    >
      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [0, 0.2, 5.8], fov: 36 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[4, 6, 4]} intensity={3} color="#FFE08A" />
        <pointLight position={[-3, -2, 3]} intensity={1.5} color="#FFFFFF" />
        <spotLight position={[0, 8, 2]} angle={0.3} penumbra={0.8} intensity={2} color="#FFD700" />
        <TrophyGeometry />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}
