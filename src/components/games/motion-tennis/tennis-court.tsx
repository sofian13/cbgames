"use client";

import { useMemo } from "react";
import { Sky } from "@react-three/drei";
import * as THREE from "three";

const COURT_LENGTH = 36;
const COURT_WIDTH = 20;
const LINE_WIDTH = 0.05;
const NET_HEIGHT = 1.07;

function CourtLine({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

/** Bleacher section with colorful dot spectators */
function Bleacher({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const spectators = useMemo(() => {
    const seats: { x: number; y: number; z: number; color: string }[] = [];
    const colors = ["#e74c3c", "#3498db", "#f39c12", "#2ecc71", "#9b59b6", "#1abc9c", "#e67e22", "#ecf0f1"];
    const rows = 4;
    const cols = 18;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.15) { // some empty seats
          seats.push({
            x: (c - cols / 2) * 0.5 + (Math.random() - 0.5) * 0.1,
            y: r * 0.6 + 0.3,
            z: r * 0.4,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }
    }
    return seats;
  }, []);

  return (
    <group position={position} rotation={rotation}>
      {/* Concrete steps */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, i * 0.3 + 0.15, i * 0.4]}>
          <boxGeometry args={[10, 0.3, 0.5]} />
          <meshStandardMaterial color="#8e8e8e" />
        </mesh>
      ))}

      {/* Spectators (head + body) */}
      {spectators.map((s, i) => (
        <group key={i} position={[s.x, s.y, s.z]}>
          {/* Head */}
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color={s.color} />
          </mesh>
          {/* Body */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.16, 0.2, 0.12]} />
            <meshStandardMaterial color={s.color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function TennisCourt() {
  const halfL = COURT_LENGTH / 2;
  const halfW = COURT_WIDTH / 2;

  return (
    <group>
      {/* Wide ground plane (grass surround) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#4a7c59" />
      </mesh>

      {/* Court outer area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[COURT_WIDTH + 6, COURT_LENGTH + 8]} />
        <meshStandardMaterial color="#2D6A4F" />
      </mesh>

      {/* Court surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[COURT_WIDTH, COURT_LENGTH]} />
        <meshStandardMaterial color="#1B5E20" />
      </mesh>

      {/* Baselines */}
      <CourtLine position={[0, 0.01, halfL]} size={[COURT_WIDTH, LINE_WIDTH, LINE_WIDTH]} />
      <CourtLine position={[0, 0.01, -halfL]} size={[COURT_WIDTH, LINE_WIDTH, LINE_WIDTH]} />

      {/* Sidelines */}
      <CourtLine position={[halfW, 0.01, 0]} size={[LINE_WIDTH, LINE_WIDTH, COURT_LENGTH]} />
      <CourtLine position={[-halfW, 0.01, 0]} size={[LINE_WIDTH, LINE_WIDTH, COURT_LENGTH]} />

      {/* Singles sidelines */}
      <CourtLine position={[halfW - 1.37, 0.01, 0]} size={[LINE_WIDTH, LINE_WIDTH, COURT_LENGTH]} />
      <CourtLine position={[-halfW + 1.37, 0.01, 0]} size={[LINE_WIDTH, LINE_WIDTH, COURT_LENGTH]} />

      {/* Center service line */}
      <CourtLine position={[0, 0.01, halfL / 4]} size={[LINE_WIDTH, LINE_WIDTH, halfL / 2]} />
      <CourtLine position={[0, 0.01, -halfL / 4]} size={[LINE_WIDTH, LINE_WIDTH, halfL / 2]} />

      {/* Service lines */}
      <CourtLine position={[0, 0.01, halfL / 2]} size={[COURT_WIDTH - 2.74, LINE_WIDTH, LINE_WIDTH]} />
      <CourtLine position={[0, 0.01, -halfL / 2]} size={[COURT_WIDTH - 2.74, LINE_WIDTH, LINE_WIDTH]} />

      {/* Center mark */}
      <CourtLine position={[0, 0.01, halfL + 0.1]} size={[LINE_WIDTH, LINE_WIDTH, 0.2]} />
      <CourtLine position={[0, 0.01, -halfL - 0.1]} size={[LINE_WIDTH, LINE_WIDTH, 0.2]} />

      {/* Net */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, NET_HEIGHT / 2, 0]}>
          <boxGeometry args={[COURT_WIDTH + 1, NET_HEIGHT, 0.05]} />
          <meshStandardMaterial color="white" transparent opacity={0.85} />
        </mesh>
        {/* Net top tape */}
        <mesh position={[0, NET_HEIGHT, 0]}>
          <boxGeometry args={[COURT_WIDTH + 1, 0.05, 0.06]} />
          <meshStandardMaterial color="white" />
        </mesh>
        {/* Net posts */}
        <mesh position={[halfW + 0.5, NET_HEIGHT / 2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, NET_HEIGHT, 8]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[-halfW - 0.5, NET_HEIGHT / 2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, NET_HEIGHT, 8]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>

      {/* Bleachers — both sides */}
      <Bleacher position={[-halfW - 6, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Bleacher position={[halfW + 6, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      {/* Bleacher behind far end */}
      <Bleacher position={[0, 0, halfL + 6]} rotation={[0, Math.PI, 0]} />

      {/* Umpire chair */}
      <group position={[halfW + 1.5, 0, 0]}>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.5, 0.05, 0.5]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        <mesh position={[-0.15, 0.6, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
        <mesh position={[0.15, 0.6, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
      </group>

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      {/* Fill light from opposite side */}
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />

      {/* Sky */}
      <Sky sunPosition={[100, 50, 100]} turbidity={3} rayleigh={0.5} />
    </group>
  );
}
