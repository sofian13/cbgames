"use client";

/**
 * Mascot — Blob mascot component (af.games)
 * Round, animated character composed of CSS shapes (no SVG, no assets).
 *
 * Usage:
 *   <Mascot size={64} color="purple" mood="happy" />
 *   <Mascot size={120} color="yellow" arms crown cheering />
 *   <MascotAvatar color="pink" size={36} />
 */

import { CSSProperties, type ReactNode } from "react";

export type MascotColor =
  | "purple" | "pink" | "yellow" | "mint"
  | "sky" | "coral" | "lavender" | "white";

export type MascotMood =
  | "happy" | "shocked" | "wink" | "love" | "shifty"
  | "asleep" | "neutral";

export type MascotLook =
  | "center" | "left" | "right" | "up" | "down" | "shifty";

export const MASCOT_PALETTE: Record<MascotColor, { body: string; deep: string; glow: string }> = {
  purple:   { body: "#7A4EE8", deep: "#4023A0", glow: "rgba(122,78,232,0.55)" },
  pink:     { body: "#FF3EA5", deep: "#B5226E", glow: "rgba(255,62,165,0.55)" },
  yellow:   { body: "#FFD23F", deep: "#C09100", glow: "rgba(255,210,63,0.55)" },
  mint:     { body: "#3DDC97", deep: "#1E8A5C", glow: "rgba(61,220,151,0.55)" },
  sky:      { body: "#4ECDC4", deep: "#218079", glow: "rgba(78,205,196,0.55)" },
  coral:    { body: "#FF6B5B", deep: "#A82C1F", glow: "rgba(255,107,91,0.55)" },
  lavender: { body: "#B5A1FF", deep: "#624AA3", glow: "rgba(181,161,255,0.55)" },
  white:    { body: "#F5F1E8", deep: "#A89D85", glow: "rgba(245,241,232,0.55)" },
};

export const MASCOT_COLORS = Object.keys(MASCOT_PALETTE) as MascotColor[];

interface MascotProps {
  size?: number;
  color?: MascotColor;
  mood?: MascotMood;
  look?: MascotLook;
  bob?: boolean;
  blink?: boolean;
  arms?: boolean;
  crown?: boolean;
  sweat?: boolean;
  cheering?: boolean;
  shadow?: boolean;
  delay?: number;
  style?: CSSProperties;
  className?: string;
}

export function Mascot({
  size = 80,
  color = "purple",
  mood = "happy",
  look = "center",
  bob = true,
  blink = true,
  arms = false,
  crown = false,
  sweat = false,
  cheering = false,
  shadow = true,
  delay = 0,
  style,
  className,
}: MascotProps) {
  const c = MASCOT_PALETTE[color];
  const s = size;

  const lookMap: Record<MascotLook, [number, number]> = {
    center: [0, 0],
    left:   [-2, 0],
    right:  [2, 0],
    up:     [0, -2],
    down:   [0, 2],
    shifty: [3, 0],
  };
  const [px, py] = lookMap[look];

  const bodyW = s;
  const bodyH = s * 0.92;
  const eyeSize = s * 0.185;
  const eyeY = bodyH * 0.42;
  const eyeGap = bodyW * 0.26;
  const mouthY = bodyH * 0.62;

  // Mouth shape per mood
  let mouth: ReactNode = null;
  if (mood === "happy") {
    mouth = <div style={{ position: "absolute", left: "50%", top: mouthY, transform: "translateX(-50%)", width: s * 0.22, height: s * 0.12, borderRadius: "0 0 999px 999px", background: "#1A0E2E" }} />;
  } else if (mood === "shocked") {
    mouth = <div style={{ position: "absolute", left: "50%", top: mouthY - 2, transform: "translateX(-50%)", width: s * 0.14, height: s * 0.18, borderRadius: "50%", background: "#1A0E2E" }} />;
  } else if (mood === "wink") {
    mouth = <div style={{ position: "absolute", left: "50%", top: mouthY, transform: "translateX(-50%)", width: s * 0.26, height: s * 0.06, borderRadius: "999px", background: "#1A0E2E" }} />;
  } else if (mood === "love") {
    mouth = <div style={{ position: "absolute", left: "50%", top: mouthY, transform: "translateX(-50%)", width: s * 0.24, height: s * 0.14, borderRadius: "0 0 999px 999px", background: "#1A0E2E" }} />;
  } else if (mood === "neutral") {
    mouth = <div style={{ position: "absolute", left: "50%", top: mouthY + 2, transform: "translateX(-50%)", width: s * 0.18, height: s * 0.04, borderRadius: "999px", background: "#1A0E2E" }} />;
  } else if (mood === "asleep") {
    mouth = <div style={{ position: "absolute", left: "50%", top: mouthY, transform: "translateX(-50%)", width: s * 0.12, height: s * 0.08, borderRadius: "50%", background: "#1A0E2E" }} />;
  }

  const renderEye = (winked: boolean) => {
    if (winked) {
      return (
        <div style={{
          width: eyeSize * 1.1, height: eyeSize * 0.18,
          background: "#1A0E2E", borderRadius: "999px",
        }} />
      );
    }
    return (
      <div style={{
        width: eyeSize, height: eyeSize,
        background: "white", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        animation: blink ? `mascot-blink ${2.6 + delay * 0.3}s ease-in-out infinite` : "none",
        animationDelay: `${delay}s`,
        transformOrigin: "center",
      }}>
        <div style={{
          width: eyeSize * 0.62, height: eyeSize * 0.62,
          background: "#1A0E2E", borderRadius: "50%",
          transform: `translate(${px}px, ${py}px)`,
        }} />
        <div style={{
          position: "absolute",
          top: eyeSize * 0.16, left: eyeSize * 0.2,
          width: eyeSize * 0.24, height: eyeSize * 0.24,
          background: "white", borderRadius: "50%",
        }} />
      </div>
    );
  };

  const isAsleep = mood === "asleep";

  return (
    <div className={className} style={{
      position: "relative",
      width: s, height: s * 1.15,
      animation: cheering
        ? "mascot-cheer 0.9s ease-in-out infinite"
        : bob
          ? `mascot-bob ${2.4 + delay * 0.2}s ease-in-out infinite`
          : "none",
      animationDelay: `${delay}s`,
      transformOrigin: "50% 80%",
      ...style,
    }}>
      {shadow && (
        <div style={{
          position: "absolute",
          bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: s * 0.7, height: s * 0.08,
          background: "rgba(0,0,0,0.35)",
          borderRadius: "50%",
          filter: "blur(4px)",
        }} />
      )}

      {crown && (
        <div style={{
          position: "absolute",
          left: "50%", top: -s * 0.12,
          transform: "translateX(-50%)",
          width: s * 0.55, height: s * 0.32,
          background: MASCOT_PALETTE.yellow.body,
          clipPath: "polygon(0% 100%, 0% 30%, 20% 60%, 50% 0%, 80% 60%, 100% 30%, 100% 100%)",
          filter: "drop-shadow(0 2px 0 #B27800)",
          zIndex: 3,
        }} />
      )}

      {sweat && (
        <div style={{
          position: "absolute",
          left: "75%", top: s * 0.15,
          width: s * 0.14, height: s * 0.2,
          background: MASCOT_PALETTE.sky.body,
          borderRadius: "50% 50% 50% 50% / 70% 70% 30% 30%",
          transform: "rotate(180deg)",
          boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.1)",
          zIndex: 3,
        }} />
      )}

      {arms && (
        <>
          <div style={{
            position: "absolute",
            left: -s * 0.08, top: bodyH * 0.45,
            width: s * 0.22, height: s * 0.22,
            background: c.body, borderRadius: "50%",
            transform: cheering ? "rotate(-50deg) translateY(-30%)" : "rotate(-25deg)",
            zIndex: 0,
          }} />
          <div style={{
            position: "absolute",
            right: -s * 0.08, top: bodyH * 0.45,
            width: s * 0.22, height: s * 0.22,
            background: c.body, borderRadius: "50%",
            transform: cheering ? "rotate(50deg) translateY(-30%)" : "rotate(25deg)",
            zIndex: 0,
          }} />
        </>
      )}

      <div style={{
        position: "absolute",
        bottom: s * 0.04,
        left: "50%", transform: "translateX(-50%)",
        width: bodyW, height: bodyH,
        background: `radial-gradient(circle at 30% 28%, ${c.body} 0%, ${c.body} 55%, ${c.deep} 100%)`,
        borderRadius: "50% 50% 48% 48% / 55% 55% 45% 45%",
        boxShadow: `inset -4px -8px 0 ${c.deep}33, 0 0 14px ${c.glow}`,
        animation: "mascot-breathe 3s ease-in-out infinite",
        animationDelay: `${delay * 0.4}s`,
        zIndex: 1,
      }}>
        <div style={{
          position: "absolute",
          top: bodyH * 0.1, left: bodyW * 0.18,
          width: bodyW * 0.2, height: bodyH * 0.15,
          background: "rgba(255,255,255,0.45)",
          borderRadius: "50%",
          filter: "blur(2px)",
        }} />

        <div style={{
          position: "absolute",
          top: eyeY - eyeSize / 2,
          left: "50%",
          transform: `translateX(-50%)`,
          display: "flex", gap: eyeGap - eyeSize,
        }}>
          <div>{renderEye(false)}</div>
          <div>{renderEye(mood === "wink" || isAsleep)}</div>
        </div>

        {(mood === "happy" || mood === "love") && (
          <>
            <div style={{
              position: "absolute",
              left: bodyW * 0.14, top: eyeY + eyeSize * 0.5,
              width: bodyW * 0.16, height: bodyH * 0.08,
              background: "rgba(255, 62, 165, 0.35)",
              borderRadius: "50%",
              filter: "blur(2px)",
            }} />
            <div style={{
              position: "absolute",
              right: bodyW * 0.14, top: eyeY + eyeSize * 0.5,
              width: bodyW * 0.16, height: bodyH * 0.08,
              background: "rgba(255, 62, 165, 0.35)",
              borderRadius: "50%",
              filter: "blur(2px)",
            }} />
          </>
        )}

        {mouth}
      </div>
    </div>
  );
}

interface MascotAvatarProps {
  color?: MascotColor;
  size?: number;
  mood?: MascotMood;
  border?: boolean;
  look?: MascotLook;
}

export function MascotAvatar({
  color = "purple",
  size = 44,
  mood = "happy",
  border = true,
  look = "center",
}: MascotAvatarProps) {
  const c = MASCOT_PALETTE[color];
  return (
    <div style={{
      width: size, height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle at 30% 30%, ${c.body}, ${c.deep})`,
      border: border ? "2.5px solid white" : "none",
      boxShadow: `0 4px 12px ${c.glow}`,
      position: "relative",
      flexShrink: 0,
      overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        transform: `scale(${size / 80})`,
        transformOrigin: "center",
      }}>
        <Mascot
          size={60} color={color} mood={mood} look={look}
          bob={false} blink={false} shadow={false}
          style={{ height: 60 }}
        />
      </div>
    </div>
  );
}
