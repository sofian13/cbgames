import type { GameMeta } from "@/lib/games/types";

/** Bloc "C'est quoi ? / Exemple / Règles" partagé par les modales de règles. */
export function GameExplainer({ game, accent }: { game: GameMeta; accent: string }) {
  return (
    <div className="space-y-4">
      {game.pitch && (
        <p className="text-base font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
          {game.pitch}
        </p>
      )}

      {game.example && (
        <div className="rounded-2xl px-4 py-3 text-sm leading-6"
             style={{
               background: `color-mix(in srgb, ${accent} 12%, transparent)`,
               border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
               color: "var(--foreground)",
             }}>
          <div className="cb-mono mb-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>
            Exemple
          </div>
          {game.example}
        </div>
      )}

      <div>
        {(game.pitch || game.example) && (
          <div className="cb-mono mb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-dim)" }}>
            Règles
          </div>
        )}
        <div className="space-y-2">
          {game.rules.map((rule, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-xl border px-4 py-2.5 text-sm leading-6"
              style={{ background: "var(--surface-2)", borderColor: "var(--line-soft)", color: "var(--foreground)" }}
            >
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
              {rule}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
