"use client";

/**
 * Mascot — Blob mascot system (v2: crown fixed, expressive moods).
 * CSS-rendered round characters (no SVG, no assets).
 */

import { CSSProperties, type ReactNode } from "react";

export type MascotColor =
  | "purple" | "pink" | "yellow" | "mint"
  | "sky" | "coral" | "lavender" | "white";

export type MascotMood =
  | "happy" | "shocked" | "wink" | "love" | "shifty" | "asleep" | "neutral"
  | "laughing" | "rofl" | "mindblown" | "sad" | "thinking" | "cool"
  | "fire" | "dead" | "angry" | "kiss" | "sus";

export type MascotLook = "center" | "left" | "right" | "up" | "down" | "shifty";

export const MASCOT_PALETTE: Record<MascotColor, { body: string; deep: string; hi: string; glow: string }> = {
  purple:   { body: "#7A4EE8", deep: "#3F1F9C", hi: "#B59CFF", glow: "rgba(122,78,232,0.55)" },
  pink:     { body: "#FF3EA5", deep: "#A8195F", hi: "#FFA5CD", glow: "rgba(255,62,165,0.55)" },
  yellow:   { body: "#FFD23F", deep: "#B27800", hi: "#FFE891", glow: "rgba(255,210,63,0.55)" },
  mint:     { body: "#3DDC97", deep: "#1A7B4F", hi: "#A4F2CC", glow: "rgba(61,220,151,0.55)" },
  sky:      { body: "#4ECDC4", deep: "#1E7370", hi: "#ABEEEA", glow: "rgba(78,205,196,0.55)" },
  coral:    { body: "#FF6B5B", deep: "#A0291B", hi: "#FFB4AB", glow: "rgba(255,107,91,0.55)" },
  lavender: { body: "#B5A1FF", deep: "#5A45A8", hi: "#DFD4FF", glow: "rgba(181,161,255,0.55)" },
  white:    { body: "#F5F1E8", deep: "#A89D85", hi: "#FFFFFF", glow: "rgba(245,241,232,0.55)" },
};

export const MASCOT_COLORS = Object.keys(MASCOT_PALETTE) as MascotColor[];

const INK = "#15082E";
type EyeShape = "round" | "heart" | "star" | "x" | "spiral";

function BlobEye({
  size, look = [0, 0], closed = false, shape = "round", delay = 0, blink = true,
}: {
  size: number; look?: [number, number]; closed?: boolean; shape?: EyeShape; delay?: number; blink?: boolean;
}) {
  if (closed) {
    return <div style={{ width: size * 1.05, height: Math.max(2, size * 0.16), background: INK, borderRadius: "999px" }} />;
  }
  if (shape === "heart") {
    return (
      <div style={{ position: "relative", width: size, height: size }}>
        <div style={{ position: "absolute", left: 0, top: size * 0.1, width: size * 0.55, height: size * 0.55, background: "#FF3EA5", borderRadius: "50%" }} />
        <div style={{ position: "absolute", right: 0, top: size * 0.1, width: size * 0.55, height: size * 0.55, background: "#FF3EA5", borderRadius: "50%" }} />
        <div style={{ position: "absolute", left: "50%", top: size * 0.34, width: size * 0.7, height: size * 0.7, background: "#FF3EA5", transform: "translateX(-50%) rotate(45deg)", borderRadius: "0 0 12% 0" }} />
        <div style={{ position: "absolute", left: size * 0.15, top: size * 0.18, width: size * 0.18, height: size * 0.18, background: "#fff", borderRadius: "50%" }} />
      </div>
    );
  }
  if (shape === "star") {
    return <div style={{ width: size * 1.1, height: size * 1.1, background: "#FFD23F", clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)", filter: "drop-shadow(0 0 4px rgba(255,210,63,0.6))" }} />;
  }
  if (shape === "x") {
    return (
      <div style={{ position: "relative", width: size, height: size }}>
        <div style={{ position: "absolute", left: 0, top: "50%", width: "100%", height: Math.max(2, size * 0.16), background: INK, transform: "translateY(-50%) rotate(45deg)", borderRadius: 999 }} />
        <div style={{ position: "absolute", left: 0, top: "50%", width: "100%", height: Math.max(2, size * 0.16), background: INK, transform: "translateY(-50%) rotate(-45deg)", borderRadius: 999 }} />
      </div>
    );
  }
  if (shape === "spiral") {
    return <div style={{ width: size, height: size, borderRadius: "50%", background: "conic-gradient(from 0deg, #15082E 0%, #15082E 30%, #fff 30%, #fff 50%, #15082E 50%, #15082E 80%, #fff 80%)", animation: "mascot-spin 1.6s linear infinite" }} />;
  }
  return (
    <div style={{
      width: size, height: size, background: "white", borderRadius: "50%", position: "relative",
      animation: blink ? `mascot-blink ${2.6 + delay * 0.3}s ease-in-out infinite` : "none",
      animationDelay: `${delay}s`, overflow: "hidden",
    }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: size * 0.55, height: size * 0.55, background: INK, borderRadius: "50%", transform: `translate(calc(-50% + ${look[0]}px), calc(-50% + ${look[1]}px))` }} />
      <div style={{ position: "absolute", top: size * 0.13, left: size * 0.55, width: size * 0.22, height: size * 0.22, background: "white", borderRadius: "50%", boxShadow: "0 0 0 1px rgba(255,255,255,0.4)" }} />
    </div>
  );
}

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
  tongue?: boolean;
  tear?: boolean;
  sparkle?: boolean;
  delay?: number;
  style?: CSSProperties;
  className?: string;
}

export function Mascot({
  size = 80, color = "purple", mood = "happy", look = "center",
  bob = true, blink = true, arms = false, crown = false, sweat = false,
  cheering = false, shadow = true, tongue = false, tear = false, sparkle = false,
  delay = 0, style, className,
}: MascotProps) {
  const c = MASCOT_PALETTE[color] ?? MASCOT_PALETTE.purple;
  const s = size;

  const bodyW = s;
  const bodyH = s * 0.94;
  const bodyBottom = s * 0.06;

  const eyeSize = s * 0.20;
  const eyeY = bodyH * 0.40;
  const eyeGap = s * 0.10;

  const lookMap: Record<MascotLook, [number, number]> = {
    center: [0, 0],
    left:   [-eyeSize * 0.1, 0],
    right:  [eyeSize * 0.1, 0],
    up:     [0, -eyeSize * 0.1],
    down:   [0, eyeSize * 0.1],
    shifty: [eyeSize * 0.18, eyeSize * 0.04],
  };
  const lookOff = lookMap[look] ?? [0, 0];

  let leftShape: EyeShape = "round", rightShape: EyeShape = "round";
  let leftClosed = false, rightClosed = false;
  if (mood === "wink") rightClosed = true;
  if (mood === "asleep") { leftClosed = true; rightClosed = true; }
  if (mood === "love" || mood === "kiss") { leftShape = "heart"; rightShape = "heart"; }
  if (mood === "mindblown") { leftShape = "star"; rightShape = "star"; }
  if (mood === "dead") { leftShape = "x"; rightShape = "x"; }
  if (mood === "sus") leftClosed = true;

  const mouthY = bodyH * 0.65;
  const renderMouth = (): ReactNode => {
    const m = mood;
    if (m === "happy" || m === "wink") {
      return (
        <div style={{ position: "absolute", left: "50%", top: mouthY, transform: "translateX(-50%)", width: s * 0.26, height: s * 0.14, borderRadius: "0 0 999px 999px", background: INK, overflow: "hidden" }}>
          {tongue && <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", width: s * 0.16, height: s * 0.1, background: "#FF6B8E", borderRadius: "0 0 999px 999px" }} />}
        </div>
      );
    }
    if (m === "laughing" || m === "rofl") {
      return (
        <div style={{ position: "absolute", left: "50%", top: mouthY - s * 0.01, transform: "translateX(-50%)", width: s * 0.42, height: s * 0.2, borderRadius: "0 0 999px 999px", background: INK, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", width: s * 0.28, height: s * 0.12, background: "#FF6B8E", borderRadius: "0 0 999px 999px" }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: s * 0.04, background: "white" }} />
        </div>
      );
    }
    if (m === "shocked" || m === "mindblown") {
      return <div style={{ position: "absolute", left: "50%", top: mouthY - 2, transform: "translateX(-50%)", width: s * 0.16, height: s * 0.22, borderRadius: "50%", background: INK }} />;
    }
    if (m === "love" || m === "kiss") {
      return <div style={{ position: "absolute", left: "50%", top: mouthY, transform: "translateX(-50%)", width: m === "kiss" ? s * 0.12 : s * 0.22, height: m === "kiss" ? s * 0.1 : s * 0.16, borderRadius: m === "kiss" ? "50% 50% 30% 30%" : "0 0 999px 999px", background: m === "kiss" ? "#FF3EA5" : INK }} />;
    }
    if (m === "neutral" || m === "thinking" || m === "cool" || m === "sus") {
      return <div style={{ position: "absolute", left: "50%", top: mouthY + 4, width: s * (m === "sus" ? 0.14 : 0.2), height: s * 0.05, borderRadius: "999px", background: INK, transform: `translateX(-50%) ${m === "sus" ? "rotate(-12deg)" : ""}` }} />;
    }
    if (m === "sad") {
      return <div style={{ position: "absolute", left: "50%", top: mouthY + s * 0.04, transform: "translateX(-50%)", width: s * 0.24, height: s * 0.1, borderTop: `${Math.max(2, s * 0.04)}px solid ${INK}`, borderRadius: "999px 999px 0 0" }} />;
    }
    if (m === "angry") {
      return <div style={{ position: "absolute", left: "50%", top: mouthY + s * 0.04, transform: "translateX(-50%)", width: s * 0.28, height: s * 0.08, borderTop: `${Math.max(2, s * 0.04)}px solid ${INK}`, borderRadius: "999px 999px 0 0" }} />;
    }
    if (m === "asleep") {
      return <div style={{ position: "absolute", left: "50%", top: mouthY, transform: "translateX(-50%)", width: s * 0.12, height: s * 0.08, borderRadius: "50%", background: INK }} />;
    }
    if (m === "dead") {
      return <div style={{ position: "absolute", left: "50%", top: mouthY + s * 0.02, transform: "translateX(-50%)", width: s * 0.2, height: s * 0.1, background: INK, clipPath: "polygon(0% 50%, 15% 0%, 30% 100%, 50% 0%, 70% 100%, 85% 0%, 100% 50%)" }} />;
    }
    return null;
  };

  const isAsleep = mood === "asleep";
  const crownH = crown ? s * 0.3 : 0;
  const hasBrows = mood === "angry" || mood === "sus" || mood === "thinking" || mood === "cool";

  return (
    <div className={className} style={{
      position: "relative", width: s, height: s * 1.15 + crownH,
      animation: cheering
        ? "mascot-cheer 0.9s ease-in-out infinite"
        : mood === "rofl"
          ? "mascot-rofl 0.8s ease-in-out infinite"
          : bob
            ? `mascot-bob ${2.4 + delay * 0.2}s ease-in-out infinite`
            : "none",
      animationDelay: `${delay}s`, transformOrigin: "50% 80%", ...style,
    }}>
      {shadow && <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: s * 0.7, height: s * 0.08, background: "rgba(0,0,0,0.35)", borderRadius: "50%", filter: "blur(4px)" }} />}

      {sparkle && [
        { l: -8, t: 6, sz: 10, d: 0 }, { l: s + 2, t: 10, sz: 8, d: 0.3 },
        { l: s * 0.2, t: -6, sz: 12, d: 0.6 }, { l: s * 0.8, t: 2, sz: 9, d: 0.9 },
      ].map((sp, i) => (
        <div key={i} style={{ position: "absolute", left: sp.l, top: crownH + sp.t, width: sp.sz, height: sp.sz, background: "#FFD23F", clipPath: "polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)", animation: "mascot-twinkle 1.8s ease-in-out infinite", animationDelay: `${sp.d}s`, zIndex: 4 }} />
      ))}

      {crown && (
        <div style={{ position: "absolute", left: "50%", bottom: bodyBottom + bodyH * 0.86, transform: "translateX(-50%) rotate(-4deg)", width: s * 0.62, height: s * 0.3, zIndex: 3, filter: "drop-shadow(0 3px 0 rgba(0,0,0,0.25))" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #FFE36B 0%, #FFD23F 50%, #C48800 100%)", clipPath: "polygon(2% 100%, 0% 35%, 22% 60%, 50% 5%, 78% 60%, 100% 35%, 98% 100%)" }} />
          <div style={{ position: "absolute", left: "10%", top: "30%", width: "80%", height: "20%", background: "rgba(255,255,255,0.4)", clipPath: "polygon(0% 100%, 6% 30%, 25% 50%, 50% 5%, 75% 50%, 94% 30%, 100% 100%)", filter: "blur(1px)" }} />
          <div style={{ position: "absolute", left: "50%", top: "55%", transform: "translate(-50%, -50%)", width: s * 0.08, height: s * 0.08, background: "radial-gradient(circle at 35% 30%, #FF8FC8 0%, #FF3EA5 70%)", borderRadius: "50%", boxShadow: "0 0 6px rgba(255,62,165,0.6)" }} />
        </div>
      )}

      {sweat && <div style={{ position: "absolute", left: bodyW * 0.78, top: crownH + bodyH * 0.18, width: s * 0.14, height: s * 0.2, background: "linear-gradient(180deg, #87DEFF 0%, #4ECDC4 100%)", borderRadius: "50% 50% 50% 50% / 80% 80% 30% 30%", transform: "rotate(180deg)", boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.1)", zIndex: 3, animation: "mascot-drift-up 1.8s ease-in infinite" }} />}

      {(tear || mood === "sad") && <div style={{ position: "absolute", left: bodyW * 0.3, top: crownH + bodyH * 0.55, width: s * 0.1, height: s * 0.16, background: "linear-gradient(180deg, #87DEFF 0%, #4ECDC4 100%)", borderRadius: "50% 50% 50% 50% / 80% 80% 30% 30%", transform: "rotate(180deg)", zIndex: 4, animation: "mascot-drift-down 2.4s ease-in infinite" }} />}

      {mood === "fire" && (
        <div style={{ position: "absolute", left: "50%", bottom: bodyBottom + bodyH * 0.84, transform: "translateX(-50%)", zIndex: 3, filter: "drop-shadow(0 0 8px rgba(255,107,91,0.7))", animation: "mascot-flicker 0.4s ease-in-out infinite alternate" }}>
          <div style={{ width: s * 0.32, height: s * 0.38, background: "linear-gradient(180deg, #FFD23F 0%, #FF6B5B 60%, #FF3EA5 100%)", clipPath: "polygon(50% 0%, 70% 30%, 100% 55%, 75% 70%, 90% 100%, 50% 85%, 10% 100%, 25% 70%, 0% 55%, 30% 30%)" }} />
        </div>
      )}

      {arms && (
        <>
          <div style={{ position: "absolute", left: -s * 0.08, bottom: bodyBottom + bodyH * 0.3, width: s * 0.24, height: s * 0.22, background: `radial-gradient(circle at 35% 30%, ${c.body}, ${c.deep})`, borderRadius: "50%", transform: cheering ? "rotate(-55deg) translateY(-40%)" : "rotate(-22deg)", zIndex: 0, boxShadow: `inset -2px -2px 0 ${c.deep}55` }} />
          <div style={{ position: "absolute", right: -s * 0.08, bottom: bodyBottom + bodyH * 0.3, width: s * 0.24, height: s * 0.22, background: `radial-gradient(circle at 35% 30%, ${c.body}, ${c.deep})`, borderRadius: "50%", transform: cheering ? "rotate(55deg) translateY(-40%)" : "rotate(22deg)", zIndex: 0, boxShadow: `inset -2px -2px 0 ${c.deep}55` }} />
        </>
      )}

      {/* Body */}
      <div style={{
        position: "absolute", bottom: bodyBottom, left: "50%", transform: "translateX(-50%)",
        width: bodyW, height: bodyH,
        background: `radial-gradient(circle at 32% 28%, ${c.hi} 0%, ${c.body} 40%, ${c.deep} 100%)`,
        borderRadius: "50% 50% 48% 48% / 55% 55% 45% 45%",
        boxShadow: `inset -6px -10px 0 rgba(0,0,0,0.18), inset 4px 6px 0 rgba(255,255,255,0.12), 0 0 18px ${c.glow}`,
        animation: "mascot-breathe 3s ease-in-out infinite", animationDelay: `${delay * 0.4}s`,
        zIndex: 1, overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: bodyH * 0.08, left: bodyW * 0.18, width: bodyW * 0.28, height: bodyH * 0.2, background: "rgba(255,255,255,0.55)", borderRadius: "50%", filter: "blur(3px)" }} />
        <div style={{ position: "absolute", top: bodyH * 0.18, left: bodyW * 0.34, width: bodyW * 0.1, height: bodyH * 0.08, background: "rgba(255,255,255,0.65)", borderRadius: "50%", filter: "blur(1.5px)" }} />

        {hasBrows && (
          <>
            <div style={{ position: "absolute", top: eyeY - eyeSize * 0.95, left: bodyW * 0.5 - eyeGap / 2 - eyeSize, width: eyeSize * 0.95, height: s * 0.05, background: INK, borderRadius: "999px", transform: mood === "angry" ? "rotate(18deg)" : mood === "sus" ? "rotate(-14deg)" : mood === "thinking" ? "rotate(-8deg)" : "rotate(0deg)", zIndex: 3 }} />
            <div style={{ position: "absolute", top: eyeY - eyeSize * 0.95, right: bodyW * 0.5 - eyeGap / 2 - eyeSize, width: eyeSize * 0.95, height: s * 0.05, background: INK, borderRadius: "999px", transform: mood === "angry" ? "rotate(-18deg)" : mood === "sus" ? "rotate(8deg)" : mood === "thinking" ? "rotate(8deg)" : "rotate(0deg)", zIndex: 3 }} />
          </>
        )}

        {mood === "cool" && (
          <div style={{ position: "absolute", top: eyeY - eyeSize * 0.2, left: "50%", transform: "translateX(-50%)", display: "flex", gap: s * 0.04, alignItems: "center", zIndex: 4 }}>
            <div style={{ position: "relative", overflow: "hidden", width: eyeSize * 1.4, height: eyeSize * 1.1, background: "linear-gradient(135deg, #1A0E2E 60%, #5B36D6 100%)", borderRadius: "30% 60% 30% 30%", border: `1.5px solid ${INK}` }}>
              <div style={{ position: "absolute", top: "-30%", left: "-60%", width: "55%", height: "180%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)", transform: "rotate(20deg)", animation: `mascot-shine ${2.6 + delay}s ease-in-out infinite`, animationDelay: `${delay}s` }} />
            </div>
            <div style={{ width: s * 0.06, height: 2, background: INK }} />
            <div style={{ position: "relative", overflow: "hidden", width: eyeSize * 1.4, height: eyeSize * 1.1, background: "linear-gradient(135deg, #1A0E2E 60%, #5B36D6 100%)", borderRadius: "60% 30% 30% 30%", border: `1.5px solid ${INK}` }}>
              <div style={{ position: "absolute", top: "-30%", left: "-60%", width: "55%", height: "180%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)", transform: "rotate(20deg)", animation: `mascot-shine ${2.6 + delay}s ease-in-out infinite`, animationDelay: `${delay + 0.25}s` }} />
            </div>
          </div>
        )}

        {mood !== "cool" && (
          <div style={{ position: "absolute", top: eyeY - eyeSize / 2, left: "50%", transform: "translateX(-50%)", display: "flex", gap: eyeGap, zIndex: 2 }}>
            <BlobEye size={eyeSize} look={lookOff} closed={leftClosed} shape={leftShape} delay={delay} blink={blink && !leftClosed && leftShape === "round"} />
            <BlobEye size={eyeSize} look={lookOff} closed={rightClosed} shape={rightShape} delay={delay + 0.05} blink={blink && !rightClosed && rightShape === "round"} />
          </div>
        )}

        {(mood === "happy" || mood === "love" || mood === "wink" || mood === "kiss" || mood === "laughing") && (
          <>
            <div style={{ position: "absolute", left: bodyW * 0.1, top: eyeY + eyeSize * 0.5, width: bodyW * 0.18, height: bodyH * 0.1, background: "rgba(255, 62, 165, 0.45)", borderRadius: "50%", filter: "blur(2px)" }} />
            <div style={{ position: "absolute", right: bodyW * 0.1, top: eyeY + eyeSize * 0.5, width: bodyW * 0.18, height: bodyH * 0.1, background: "rgba(255, 62, 165, 0.45)", borderRadius: "50%", filter: "blur(2px)" }} />
          </>
        )}

        {renderMouth()}

        {mood === "thinking" && (
          <div style={{ position: "absolute", right: -s * 0.18, top: -s * 0.08, display: "flex", alignItems: "center", gap: 2, zIndex: 5 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "white", opacity: 0.7 }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white", opacity: 0.85 }} />
            <div style={{ padding: "4px 7px", borderRadius: 10, background: "white", color: INK, fontSize: s * 0.14, fontWeight: 800, fontFamily: "var(--font-display)" }}>?</div>
          </div>
        )}

        {isAsleep && (
          <div style={{ position: "absolute", right: -s * 0.15, top: -s * 0.05, fontFamily: "var(--font-display)", fontSize: s * 0.3, fontWeight: 700, color: "rgba(255,255,255,0.85)", transform: "rotate(15deg)", animation: "mascot-drift-up 2.4s ease-in infinite" }}>z</div>
        )}
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

export function MascotAvatar({ color = "purple", size = 44, mood = "happy", border = true, look = "center" }: MascotAvatarProps) {
  const c = MASCOT_PALETTE[color];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle at 30% 30%, ${c.hi}, ${c.body} 45%, ${c.deep})`,
      border: border ? `${Math.max(2, size * 0.06)}px solid white` : "none",
      boxShadow: `0 4px 12px ${c.glow}`, position: "relative", flexShrink: 0, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ transform: `scale(${size / 80})`, transformOrigin: "center" }}>
        <Mascot size={60} color={color} mood={mood} look={look} bob={false} blink={false} shadow={false} style={{ height: 60 }} />
      </div>
    </div>
  );
}
