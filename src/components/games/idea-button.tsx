"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Lightbulb, RefreshCw, Send, X } from "lucide-react";
import { IDEAS_EMAIL } from "@/lib/legal/zinzin";
import { playSfx } from "@/lib/sfx";

/**
 * Boutons partagés des jeux (style sticker) :
 * - <RerollButton> : « Pas fou ? Une autre » pour retirer une question / catégorie / carte.
 * - <IdeaButton>   : « Propose ton idée » → mini-formulaire, envoi par l'app Mail
 *   (aucun serveur : l'app reste hors-ligne, le joueur voit ce qu'il envoie).
 */

const INK = "#15082E";

// « ton idée », « ta question », « ton thème » : bon déterminant selon le mot
const FEMININE = new Set(["question", "catégorie", "carte", "paire", "phrase", "règle", "cible", "consigne", "situation"]);
function poss(kind: string) {
  const first = kind.split(" ")[0].toLowerCase();
  if (/^[aeiouyéèêàâîïôûh]/i.test(first)) return `ton ${kind}`;
  return FEMININE.has(first) ? `ta ${kind}` : `ton ${kind}`;
}

const sticker = (bg: string) => ({
  background: bg,
  color: INK,
  border: `2.5px solid ${INK}`,
  boxShadow: `0 4px 0 ${INK}`,
  borderRadius: 999,
});

export function RerollButton({ onClick, label = "Pas fou ? Une autre", bg = "#fff", className = "" }: {
  onClick: () => void; label?: string; bg?: string; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => { playSfx("whoosh", { volume: 0.5, rate: 1.2 }); onClick(); }}
      className={`inline-flex min-h-11 items-center gap-2 px-4 text-[15px] font-extrabold transition-transform active:translate-y-[3px] ${className}`}
      style={sticker(bg)}
    >
      <RefreshCw size={17} strokeWidth={3} aria-hidden /> {label}
    </button>
  );
}

export function IdeaButton({ game, kind = "idée", bg = "#FFD23F", className = "", compact = false }: {
  /** Nom du jeu (sujet du mail) */
  game: string;
  /** ce qu'on propose : « question », « catégorie », « gage », « mot »… */
  kind?: string;
  bg?: string;
  className?: string;
  /** rond icône seule (pour les barres d'outils) */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => { playSfx("open", { volume: 0.6 }); setOpen(true); }}
        aria-label={`Propose ${poss(kind)}`}
        className={`inline-flex min-h-11 items-center justify-center gap-2 text-[15px] font-extrabold transition-transform active:translate-y-[3px] ${compact ? "w-11 px-0" : "px-4"} ${className}`}
        style={sticker(bg)}
      >
        <Lightbulb size={18} strokeWidth={3} aria-hidden />
        {!compact && <>Propose {poss(kind)}</>}
      </button>
      {/* Portal sur <body> : la feuille passe au-dessus de tout (boutons collants, parents transformés…) */}
      {open && typeof document !== "undefined" && createPortal(<IdeaSheet game={game} kind={kind} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function IdeaSheet({ game, kind, onClose }: { game: string; kind: string; onClose: () => void }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const ok = text.trim().length >= 3;

  const send = () => {
    if (!ok) return;
    const subject = `Idée Zinzin · ${game}`;
    const body = `Proposition (${kind}) pour « ${game} » :\n\n${text.trim()}\n\n— envoyé depuis l'app Zinzin`;
    playSfx("success", { volume: 0.7 });
    window.location.href = `mailto:${IDEAS_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 200 }} role="dialog" aria-modal aria-label="Propose ton idée">
      <div className="absolute inset-0" style={{ background: "rgba(10,4,32,0.6)" }} onClick={onClose} />
      <div
        className="relative w-full max-w-lg p-5"
        style={{
          background: "#FFF6E5", color: INK, borderRadius: "28px 28px 0 0", border: `3px solid ${INK}`, borderBottom: 0,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
        }}
      >
        <button type="button" onClick={onClose} aria-label="Fermer"
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center" style={sticker("#fff")}>
          <X size={20} strokeWidth={3} />
        </button>
        {sent ? (
          <div className="py-6 text-center">
            <div className="text-[30px] leading-tight" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Merci !</div>
            <p className="mt-2 text-[16px] font-semibold">Ton appli mail s&apos;est ouverte : il ne reste qu&apos;à appuyer sur Envoyer. On lit tout.</p>
            <button type="button" onClick={onClose} className="mt-5 min-h-12 w-full text-[17px] font-extrabold" style={sticker("#FFD23F")}>Retour au jeu</button>
          </div>
        ) : (
          <>
            <div className="pr-14 text-[28px] leading-[1.05]" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
              Propose {poss(kind)}
            </div>
            <p className="mt-1.5 pr-12 text-[15px] font-semibold" style={{ color: "#4A3A66" }}>
              Pour « {game} ». Les meilleures idées arrivent dans une prochaine mise à jour !
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 600))}
              rows={4}
              autoFocus
              placeholder={kind === "question" ? "Ex. : As-tu déjà…" : "Écris ton idée ici…"}
              className="mt-4 w-full resize-none rounded-2xl p-3.5 text-[16px] font-semibold outline-none"
              style={{ background: "#fff", border: `2.5px solid ${INK}`, color: INK }}
            />
            <button
              type="button"
              disabled={!ok}
              onClick={send}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 text-[17px] font-extrabold disabled:opacity-50"
              style={sticker("#FF3EA5")}
            >
              <Send size={18} strokeWidth={3} aria-hidden /> Envoyer
            </button>
            <p className="mt-2 text-center text-[12px] font-semibold" style={{ color: "#6B5C88" }}>
              S&apos;envoie depuis ton appli mail. On ne garde rien d&apos;autre que ton message.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
