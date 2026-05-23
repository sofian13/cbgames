"use client";

/**
 * Customizer — Blob personalization controls.
 * Reusable on signup, profile edit, etc. Renders the live preview blob
 * + 3 sections (color / face / accessory).
 */

import { Mascot, MascotAvatar, MASCOT_PALETTE } from "@/components/Mascot";
import {
  ACCESSORY_CHOICES,
  COLOR_CHOICES,
  MOOD_CHOICES,
  type Me,
} from "@/lib/hooks/useMe";

interface CustomizerProps {
  me: Me;
  update: (patch: Partial<Me>) => void;
  layout?: "grid" | "row";
  showAccessory?: boolean;
  blobSize?: number;
  showPreview?: boolean;
}

export function Customizer({
  me, update,
  layout = "row",
  showAccessory = true,
  blobSize = 110,
  showPreview = true,
}: CustomizerProps) {
  const moodLabel = MOOD_CHOICES.find((m) => m.id === me.mood)?.label;

  return (
    <div className={layout === "grid" ? "flex flex-col gap-5" : "flex flex-col gap-5 sm:flex-row"}>
      {showPreview && (
        <div
          className="flex shrink-0 flex-col items-center gap-2 rounded-3xl border border-white/10 p-6"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${MASCOT_PALETTE[me.color].glow}, transparent 70%), rgba(255,255,255,0.04)`,
            minWidth: 200,
          }}
        >
          <p className="af-eyebrow">Aperçu live</p>
          <Mascot
            size={blobSize + 60}
            color={me.color}
            mood={me.mood}
            arms={me.accessory === "arms"}
            crown={me.accessory === "crown"}
          />
          <div className="cb-display-sm mt-2 text-white">{me.name}</div>
          {moodLabel && (
            <p className="af-eyebrow" style={{ color: "var(--text-muted)" }}>{moodLabel}</p>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-5">
        {/* Color */}
        <div>
          <p className="af-eyebrow mb-2">Couleur du blob</p>
          <div className="grid grid-cols-8 gap-2">
            {COLOR_CHOICES.map((c) => {
              const active = c === me.color;
              return (
                <button
                  key={c}
                  data-af-variant="pill"
                  onClick={() => update({ color: c })}
                  aria-pressed={active}
                  aria-label={`Couleur ${c}`}
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: 14,
                    border: active ? `2px solid ${MASCOT_PALETTE[c].body}` : "1.5px solid rgba(255,255,255,0.10)",
                    background: `radial-gradient(circle at 35% 30%, ${MASCOT_PALETTE[c].body}, ${MASCOT_PALETTE[c].deep})`,
                    cursor: "pointer", padding: 0, position: "relative",
                    transform: active ? "scale(1.08)" : "scale(1)",
                    boxShadow: active
                      ? `0 6px 20px ${MASCOT_PALETTE[c].glow}, 0 0 0 4px ${MASCOT_PALETTE[c].body}33`
                      : "0 2px 4px rgba(0,0,0,0.2)",
                    transition: "transform .15s, box-shadow .2s",
                  }}
                >
                  {active && (
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white"
                          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mood */}
        <div>
          <p className="af-eyebrow mb-2">Visage</p>
          <div className="grid grid-cols-3 gap-2">
            {MOOD_CHOICES.map((m) => {
              const active = m.id === me.mood;
              return (
                <button
                  key={m.id}
                  data-af-variant="pill"
                  onClick={() => update({ mood: m.id })}
                  aria-pressed={active}
                  className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5"
                  style={{
                    border: active ? `2px solid ${MASCOT_PALETTE[me.color].body}` : "1.5px solid rgba(255,255,255,0.10)",
                    background: active
                      ? `linear-gradient(160deg, ${MASCOT_PALETTE[me.color].body}28, rgba(255,255,255,0.05))`
                      : "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="pointer-events-none">
                    <MascotAvatar color={me.color} size={42} mood={m.id} border={false} />
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: active ? "#fff" : "var(--text-muted)" }}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accessory */}
        {showAccessory && (
          <div>
            <p className="af-eyebrow mb-2">Accessoire</p>
            <div className="grid grid-cols-3 gap-2">
              {ACCESSORY_CHOICES.map((a) => {
                const active = a.id === me.accessory;
                return (
                  <button
                    key={a.id}
                    data-af-variant="pill"
                    onClick={() => update({ accessory: a.id })}
                    aria-pressed={active}
                    className="flex flex-col items-center gap-1 rounded-2xl px-2 py-3"
                    style={{
                      border: active ? "2px solid var(--af-yellow)" : "1.5px solid rgba(255,255,255,0.10)",
                      background: active
                        ? "linear-gradient(160deg, rgba(255,210,63,0.18), rgba(255,255,255,0.05))"
                        : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <span className="text-xl">{a.icon}</span>
                    <span className="text-[11px] font-bold" style={{ color: active ? "#fff" : "var(--text-muted)" }}>
                      {a.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
