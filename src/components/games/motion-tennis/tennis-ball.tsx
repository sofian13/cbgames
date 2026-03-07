"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ballStore } from "./tennis-store";

const BALL_RADIUS = 0.18;
const TRAIL_LENGTH = 20;
const TRAIL_COLOR = new THREE.Color("#ccff00");
const TRAIL_SIZE = 0.08;

export function TennisBall() {
  const meshRef = useRef<THREE.Mesh>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const shadowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const trailRef = useRef<THREE.Points>(null);
  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(TRAIL_LENGTH * 3), 3)
    );
    return geometry;
  }, []);
  const trailIndex = useRef(0);
  const currentPos = useRef(new THREE.Vector3(0, 0, 0));
  const visibleRef = useRef(false);

  useFrame((_, delta) => {
    const target = ballStore.current;
    const mesh = meshRef.current;
    const shadow = shadowRef.current;
    const shadowMat = shadowMatRef.current;
    const trail = trailRef.current;

    if (!target) {
      // Hide everything when no ball data
      if (mesh && visibleRef.current) {
        mesh.visible = false;
        if (shadow) shadow.visible = false;
        if (trail) trail.visible = false;
        visibleRef.current = false;
      }
      return;
    }

    // Show everything when ball data arrives
    if (!visibleRef.current) {
      if (mesh) mesh.visible = true;
      if (shadow) shadow.visible = true;
      if (trail) trail.visible = true;
      visibleRef.current = true;
      // Snap to initial position on first frame
      currentPos.current.set(target.x, target.y, target.z);
    }

    // Very fast lerp — nearly instant tracking, frame-rate independent
    const lerpFactor = 1 - Math.pow(0.0001, delta);
    currentPos.current.x = THREE.MathUtils.lerp(currentPos.current.x, target.x, lerpFactor);
    currentPos.current.y = THREE.MathUtils.lerp(currentPos.current.y, target.y, lerpFactor);
    currentPos.current.z = THREE.MathUtils.lerp(currentPos.current.z, target.z, lerpFactor);

    // Update ball mesh position
    if (mesh) {
      mesh.position.copy(currentPos.current);
    }

    // Shadow on ground follows ball XZ, scales/fades with height
    if (shadow && shadowMat) {
      shadow.position.x = currentPos.current.x;
      shadow.position.z = currentPos.current.z;
      const heightScale = Math.max(0.1, 1 - currentPos.current.y * 0.1);
      shadow.scale.setScalar(heightScale);
      shadowMat.opacity = 0.25 * heightScale;
    }

    // Update trail ring buffer
    const positionAttribute = trailGeometry.getAttribute("position") as THREE.BufferAttribute;
    const trailPositions = positionAttribute.array as Float32Array;
    const idx = (trailIndex.current % TRAIL_LENGTH) * 3;
    trailPositions[idx] = currentPos.current.x;
    trailPositions[idx + 1] = currentPos.current.y;
    trailPositions[idx + 2] = currentPos.current.z;
    trailIndex.current++;
    positionAttribute.needsUpdate = true;
  });

  return (
    <>
      {/* Ball mesh — always rendered, visibility toggled via useFrame */}
      <mesh ref={meshRef} visible={false} castShadow>
        <sphereGeometry args={[BALL_RADIUS, 16, 16]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Ball shadow on ground */}
      <mesh
        ref={shadowRef}
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
      >
        <circleGeometry args={[0.3, 12]} />
        <meshStandardMaterial
          ref={shadowMatRef}
          color="black"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>

      {/* Trail effect */}
      <points ref={trailRef} visible={false} geometry={trailGeometry}>
        <pointsMaterial
          color={TRAIL_COLOR}
          size={TRAIL_SIZE}
          transparent
          opacity={0.5}
        />
      </points>
    </>
  );
}
