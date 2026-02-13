"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { charTargets } from "./tennis-store";

type SwingType = "forehand" | "backhand" | "smash" | "slice" | "lob";

interface TennisPlayerProps {
  charId: string;
  side: "near" | "far";
  color: string;
  initialX: number;
  initialZ: number;
  isSwinging: boolean;
  swingType?: SwingType | null;
}

export function TennisPlayer({
  charId,
  side,
  color,
  initialX,
  initialZ,
  isSwinging,
  swingType,
}: TennisPlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftShoeRef = useRef<THREE.Mesh>(null);
  const rightShoeRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);

  // Mutable refs for per-frame tracking — never triggers re-renders
  const swingProgress = useRef(0);
  const prevX = useRef(initialX);
  const prevZ = useRef(initialZ);
  const speed = useRef(0);
  const elapsed = useRef(0);
  const initialized = useRef(false);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Clamp delta to prevent huge jumps after tab switch
    const dt = Math.min(delta, 0.1);
    elapsed.current += dt;

    // Set initial position on first frame
    if (!initialized.current) {
      groupRef.current.position.x = initialX;
      groupRef.current.position.z = initialZ;
      initialized.current = true;
    }

    // Read target from mutable store (no re-render)
    const target = charTargets[charId];
    const targetX = target ? target.x : initialX;
    const targetZ = target ? target.z : initialZ;

    // Frame-rate independent lerp factor
    const lerpFactor = 1 - Math.pow(0.01, dt);

    const currentX = groupRef.current.position.x;
    const currentZ = groupRef.current.position.z;
    const newX = currentX + (targetX - currentX) * lerpFactor;
    const newZ = currentZ + (targetZ - currentZ) * lerpFactor;
    groupRef.current.position.x = newX;
    groupRef.current.position.z = newZ;

    // Detect movement speed from position delta between frames
    const dx = newX - prevX.current;
    const dz = newZ - prevZ.current;
    const frameSpeed = Math.sqrt(dx * dx + dz * dz) / Math.max(dt, 0.001);
    prevX.current = newX;
    prevZ.current = newZ;

    // Smooth the speed reading to avoid flickering between idle/running
    speed.current = THREE.MathUtils.lerp(speed.current, frameSpeed, 1 - Math.pow(0.001, dt));

    const isRunning = speed.current > 0.2;
    const t = elapsed.current;

    // ------ RUNNING ANIMATION ------
    if (isRunning) {
      const runFreq = 12; // leg cycle frequency
      const runCycle = Math.sin(t * runFreq);
      const legSwing = runCycle * 0.5;

      // Legs alternate stride
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = legSwing;
        leftLegRef.current.position.y = 0.5 + Math.abs(Math.sin(t * runFreq)) * 0.05;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = -legSwing;
        rightLegRef.current.position.y = 0.5 + Math.abs(Math.sin(t * runFreq + Math.PI)) * 0.05;
      }

      // Shoes follow legs
      if (leftShoeRef.current) {
        leftShoeRef.current.rotation.x = legSwing * 0.5;
        leftShoeRef.current.position.y = 0.15 + Math.abs(Math.sin(t * runFreq)) * 0.05;
      }
      if (rightShoeRef.current) {
        rightShoeRef.current.rotation.x = -legSwing * 0.5;
        rightShoeRef.current.position.y = 0.15 + Math.abs(Math.sin(t * runFreq + Math.PI)) * 0.05;
      }

      // Opposite arm swings while running (non-racket arm)
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -legSwing * 0.4;
      }

      // Body bobs up/down
      if (bodyRef.current) {
        bodyRef.current.position.y = 1.1 + Math.abs(Math.sin(t * runFreq * 2)) * 0.03;
        bodyRef.current.rotation.y = 0; // reset twist when not swinging
      }

      // Lean slightly in movement direction
      const leanAmount = 0.08;
      if (headRef.current) {
        headRef.current.position.y = 1.6 + Math.abs(Math.sin(t * runFreq * 2)) * 0.02;
      }
      groupRef.current.rotation.z = -dx * leanAmount * 10;
      groupRef.current.position.y = Math.abs(Math.sin(t * runFreq * 2)) * 0.02;

    // ------ IDLE ANIMATION ------
    } else {
      const breathFreq = 0.3 * Math.PI * 2; // 0.3 Hz breathing
      const breathPhase = t * breathFreq;
      const weightShiftPhase = t * 0.8; // slow weight shift

      // Legs in ready stance — knees slightly bent, subtle weight shift
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = 0.05; // slight knee bend
        leftLegRef.current.position.y = 0.5;
        leftLegRef.current.position.x = -0.12 + Math.sin(weightShiftPhase) * 0.005;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = 0.05;
        rightLegRef.current.position.y = 0.5;
        rightLegRef.current.position.x = 0.12 + Math.sin(weightShiftPhase) * 0.005;
      }

      // Shoes stay planted
      if (leftShoeRef.current) {
        leftShoeRef.current.rotation.x = 0;
        leftShoeRef.current.position.y = 0.15;
      }
      if (rightShoeRef.current) {
        rightShoeRef.current.rotation.x = 0;
        rightShoeRef.current.position.y = 0.15;
      }

      // Non-racket arm relaxed at side with subtle sway
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0.15 + Math.sin(weightShiftPhase) * 0.02;
      }

      // Breathing: body oscillates vertically
      if (bodyRef.current) {
        bodyRef.current.position.y = 1.1 + Math.sin(breathPhase) * 0.01;
        // Subtle body sway (weight shift)
        bodyRef.current.rotation.z = Math.sin(weightShiftPhase) * 0.01;
        bodyRef.current.rotation.y = 0; // reset twist when not swinging
      }

      // Head bobs with breathing
      if (headRef.current) {
        headRef.current.position.y = 1.6 + Math.sin(breathPhase) * 0.008;
      }

      // Whole group breathing sway
      groupRef.current.position.y = Math.sin(breathPhase) * 0.005;
      groupRef.current.rotation.z = 0;
    }

    // ------ SWING ANIMATION ------
    if (armRef.current) {
      if (isSwinging && swingProgress.current < 1) {
        swingProgress.current = Math.min(1, swingProgress.current + dt * 8);
      } else if (!isSwinging && swingProgress.current > 0) {
        swingProgress.current = Math.max(0, swingProgress.current - dt * 4);
      }

      const s = swingProgress.current;

      if (s > 0) {
        // Active swing — arm follows swing type
        let armRotX = 0;
        let armRotZ = 0;

        switch (swingType) {
          case "forehand":
            armRotX = -Math.PI * 0.6 * Math.sin(s * Math.PI);
            armRotZ = -0.3 * Math.sin(s * Math.PI);
            break;
          case "backhand":
            armRotX = Math.PI * 0.6 * Math.sin(s * Math.PI);
            armRotZ = 0.3 * Math.sin(s * Math.PI);
            break;
          case "smash":
            armRotX = -Math.PI * 0.9 * Math.sin(s * Math.PI);
            armRotZ = -0.1 * Math.sin(s * Math.PI);
            break;
          case "slice":
            armRotX = -Math.PI * 0.3 * Math.sin(s * Math.PI);
            armRotZ = -0.5 * Math.sin(s * Math.PI);
            break;
          case "lob":
            armRotX = -Math.PI * 0.4 * Math.sin(s * Math.PI);
            armRotZ = 0.2 * Math.sin(s * Math.PI);
            break;
          default:
            break;
        }

        armRef.current.rotation.x = armRotX;
        armRef.current.rotation.z = armRotZ;

        // Body twist during swing
        if (bodyRef.current) {
          bodyRef.current.rotation.y =
            (swingType === "backhand" ? 0.3 : -0.3) * Math.sin(s * Math.PI);
        }
      } else {
        // Ready position — racket arm held up
        const readySway = Math.sin(t * 1.2) * 0.02;
        armRef.current.rotation.x = -0.3 + readySway;
        armRef.current.rotation.z = 0.1;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[initialX, 0, initialZ]}
      rotation={[0, side === "near" ? 0 : Math.PI, 0]}
    >
      {/* Head group (for bobbing) */}
      <group ref={headRef} position={[0, 1.6, 0]}>
        {/* Head */}
        <mesh castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#FDBCB4" />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.07, 0.05, 0.17]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0.07, 0.05, 0.17]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>

        {/* Mouth */}
        <mesh position={[0, -0.05, 0.18]}>
          <boxGeometry args={[0.06, 0.015, 0.01]} />
          <meshStandardMaterial color="#b44" />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 0.15, -0.02]}>
          <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={side === "near" ? "#4a3728" : "#8B4513"} />
        </mesh>

        {/* Headband */}
        <mesh position={[0, 0.1, 0]}>
          <torusGeometry args={[0.2, 0.02, 6, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>

      {/* Body */}
      <mesh ref={bodyRef} position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.7, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Shorts */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.25, 0.22, 0.15, 12]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.12, 0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.6, 8]} />
        <meshStandardMaterial color="#FDBCB4" />
      </mesh>
      <mesh ref={rightLegRef} position={[0.12, 0.5, 0]}>
        <cylinderGeometry args={[0.08, 0.07, 0.6, 8]} />
        <meshStandardMaterial color="#FDBCB4" />
      </mesh>

      {/* Shoes */}
      <mesh ref={leftShoeRef} position={[-0.12, 0.15, 0.05]}>
        <boxGeometry args={[0.12, 0.1, 0.22]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh ref={rightShoeRef} position={[0.12, 0.15, 0.05]}>
        <boxGeometry args={[0.12, 0.1, 0.22]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Shoe soles */}
      <mesh position={[-0.12, 0.1, 0.05]}>
        <boxGeometry args={[0.13, 0.02, 0.23]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.12, 0.1, 0.05]}>
        <boxGeometry args={[0.13, 0.02, 0.23]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Non-racket arm (left) */}
      <group ref={leftArmRef} position={[-0.3, 1.3, 0]}>
        <mesh position={[0, -0.2, 0.05]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.05, 0.4, 8]} />
          <meshStandardMaterial color="#FDBCB4" />
        </mesh>
      </group>

      {/* Racket arm (right) */}
      <group ref={armRef} position={[0.3, 1.3, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0.1]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.055, 0.3, 8]} />
          <meshStandardMaterial color="#FDBCB4" />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.35, 0.22]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.04, 0.25, 8]} />
          <meshStandardMaterial color="#FDBCB4" />
        </mesh>

        {/* Racket handle (grip) */}
        <mesh position={[0, -0.5, 0.35]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.02, 0.2, 6]} />
          <meshStandardMaterial color="#2d1810" />
        </mesh>
        {/* Grip tape */}
        <mesh position={[0, -0.48, 0.33]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.08, 6]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>

        {/* Racket throat */}
        <mesh position={[0, -0.58, 0.42]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.02, 0.08, 6]} />
          <meshStandardMaterial color="#ccc" />
        </mesh>

        {/* Racket head frame */}
        <mesh position={[0, -0.65, 0.49]} rotation={[0.5, 0, 0]}>
          <torusGeometry args={[0.12, 0.012, 8, 20]} />
          <meshStandardMaterial color="#ddd" />
        </mesh>
        {/* Racket strings (face) */}
        <mesh position={[0, -0.65, 0.49]} rotation={[0.5, 0, 0]}>
          <circleGeometry args={[0.11, 16]} />
          <meshStandardMaterial color="#ffe" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Shadow blob on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.3, 12]} />
        <meshStandardMaterial color="black" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
