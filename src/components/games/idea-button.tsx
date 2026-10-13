"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Lightbulb, RefreshCw, Send, X } from "lucide-react";
import { IDEAS_EMAIL } from "@/lib/legal/zinzin";
import { playSfx } from "@/lib/sfx";
import { type I18n, type Lang, useLang, useT } from "@/lib/i18n";
import { localizeGameName } from "@/lib/games/game-names-i18n";

/**
 * Boutons partagés des jeux (style sticker) :
 * - <RerollButton> : « Pas fou ? Une autre » pour retirer une question / catégorie / carte.
 * Textes en FR / EN / ES (src/lib/i18n.ts) ; sur le site, toujours en français.
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

/**
 * Les jeux passent le `kind` en français : traduction (avec l'article) en anglais / espagnol.
 * Kind inconnu → formule générique « an idea » / « una idea ».
 */
const KINDS: Record<string, { en: string; es: string }> = {
  "idée": { en: "an idea", es: "una idea" },
  "idée de jeu": { en: "a game idea", es: "una idea de juego" },
  "idée de carte": { en: "a card idea", es: "una idea de carta" },
  "idée de catégorie": { en: "a category idea", es: "una idea de categoría" },
  "idée de question": { en: "a question idea", es: "una idea de pregunta" },
  "idée de rôle": { en: "a role idea", es: "una idea de rol" },
  question: { en: "a question", es: "una pregunta" },
  "catégorie": { en: "a category", es: "una categoría" },
  carte: { en: "a card", es: "una carta" },
  paire: { en: "a pair", es: "una pareja de extremos" },
  phrase: { en: "a sentence", es: "una frase" },
  "règle": { en: "a rule", es: "una regla" },
  cible: { en: "a target", es: "un objetivo" },
  consigne: { en: "an instruction", es: "una consigna" },
  situation: { en: "a situation", es: "una situación" },
  gage: { en: "a dare", es: "un reto" },
  "défi": { en: "a challenge", es: "un desafío" },
  dilemme: { en: "a dilemma", es: "un dilema" },
  mot: { en: "a word", es: "una palabra" },
  "thème": { en: "a theme", es: "un tema" },
};

/** « Propose ta question » / « Suggest a question » / « Propón una pregunta » */
function suggestLabel(kind: string, lang: Lang): string {
  if (lang === "fr") return `Propose ${poss(kind)}`;
  const k = KINDS[kind.toLowerCase()];
  return lang === "en" ? `Suggest ${k?.en ?? "an idea"}` : `Propón ${k?.es ?? "una idea"}`;
}

const STR: I18n<{
  reroll: string;
  close: string;
  sheetAria: string;
  thanks: string;
  mailOpened: string;
  back: string;
  backToGame: string;
  forGame: (g: string) => string;
  bestIdeas: string;
  phQuestion: string;
  phIdea: string;
  send: string;
  privacy: string;
  subject: (g: string) => string;
  body: (kind: string, g: string, text: string) => string;
}> = {
  fr: {
    reroll: "Pas fou ? Une autre",
    close: "Fermer",
    sheetAria: "Propose ton idée",
    thanks: "Merci !",
    mailOpened: "Ton appli mail s'est ouverte : il ne reste qu'à appuyer sur Envoyer. On lit tout.",
    back: "Retour",
    backToGame: "Retour au jeu",
    forGame: (g) => `Pour « ${g} ». `,
    bestIdeas: "Les meilleures idées arrivent dans une prochaine mise à jour !",
    phQuestion: "Ex. : As-tu déjà…",
    phIdea: "Écris ton idée ici…",
    send: "Envoyer",
    privacy: "S'envoie depuis ton appli mail. On ne garde rien d'autre que ton message.",
    subject: (g) => `Idée Zinzin · ${g}`,
    body: (kind, g, text) => `Proposition (${kind}) pour « ${g} » :

${text}

— envoyé depuis l'app Zinzin`,
  },
  en: {
    reroll: "Meh? Another one",
    close: "Close",
    sheetAria: "Suggest an idea",
    thanks: "Thanks!",
    mailOpened: "Your mail app just opened: all that's left is to hit Send. We read everything.",
    back: "Back",
    backToGame: "Back to the game",
    forGame: (g) => `For "${g}". `,
    bestIdeas: "The best ideas make it into a future update!",
    phQuestion: "E.g. Have you ever…",
    phIdea: "Write your idea here…",
    send: "Send",
    privacy: "Sent from your mail app. We keep nothing but your message.",
    subject: (g) => `Zinzin idea · ${g}`,
    body: (kind, g, text) => `Suggestion (${kind}) for "${g}":

${text}

— sent from the Zinzin app`,
  },
  es: {
    reroll: "¿No mola? Otra",
    close: "Cerrar",
    sheetAria: "Propón una idea",
    thanks: "¡Gracias!",
    mailOpened: "Se ha abierto tu app de correo: solo falta pulsar Enviar. Lo leemos todo.",
    back: "Volver",
    backToGame: "Volver al juego",
    forGame: (g) => `Para «${g}». `,
    bestIdeas: "¡Las mejores ideas llegarán en una próxima actualización!",
    phQuestion: "Ej.: ¿Alguna vez has…",
    phIdea: "Escribe tu idea aquí…",
    send: "Enviar",
    privacy: "Se envía desde tu app de correo. Solo guardamos tu mensaje.",
    subject: (g) => `Idea para Zinzin · ${g}`,
    body: (kind, g, text) => `Propuesta (${kind}) para «${g}»:

${text}

— enviado desde la app Zinzin`,
  },
};

const sticker = (bg: string) => ({
  background: bg,
  color: INK,
  border: `2.5px solid ${INK}`,
  boxShadow: `0 4px 0 ${INK}`,
  borderRadius: 999,
});

export function RerollButton({ onClick, label, bg = "#fff", className = "" }: {
  onClick: () => void; label?: string; bg?: string; className?: string;
}) {
  const t = useT(STR);
  return (
    <button
      type="button"
      onClick={() => { playSfx("whoosh", { volume: 0.5, rate: 1.2 }); onClick(); }}
      className={`inline-flex min-h-11 items-center gap-2 px-4 text-[15px] font-extrabold transition-transform active:translate-y-[3px] ${className}`}
      style={sticker(bg)}
    >
      <RefreshCw size={17} strokeWidth={3} aria-hidden /> {label ?? t.reroll}
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
  const lang = useLang();
  const title = suggestLabel(kind, lang);
  return (
    <>
      <button
        type="button"
        onClick={() => { playSfx("open", { volume: 0.6 }); setOpen(true); }}
        aria-label={title}
        className={`inline-flex min-h-11 items-center justify-center gap-2 text-[15px] font-extrabold transition-transform active:translate-y-[3px] ${compact ? "w-11 px-0" : "px-4"} ${className}`}
        style={sticker(bg)}
      >
        <Lightbulb size={18} strokeWidth={3} aria-hidden />
        {!compact && title}
      </button>
      {/* Portal sur <body> : la feuille passe au-dessus de tout (boutons collants, parents transformés…) */}
      {open && typeof document !== "undefined" && createPortal(<IdeaSheet game={game} kind={kind} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function IdeaSheet({ game, kind, onClose }: { game: string; kind: string; onClose: () => void }) {
  /** Idée générale (réglages de l'app), pas liée à un jeu précis */
  const general = game.startsWith("Zinzin");
  const lang = useLang();
  const t = useT(STR);
  // Nom du jeu dans la langue de l'app (les jeux passent souvent leur nom français)
  const gameName = general ? "Zinzin" : localizeGameName(game, lang);
  const kindLabel = lang === "fr" ? kind : (KINDS[kind.toLowerCase()]?.[lang] ?? kind);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const ok = text.trim().length >= 3;

  const send = () => {
    if (!ok) return;
    const subject = t.subject(gameName);
    const body = t.body(kindLabel, gameName, text.trim());
    playSfx("success", { volume: 0.7 });
    window.location.href = `mailto:${IDEAS_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 200 }} role="dialog" aria-modal aria-label={t.sheetAria}>
      <div className="absolute inset-0" style={{ background: "rgba(10,4,32,0.6)" }} onClick={onClose} />
      <div
        className="relative w-full max-w-lg p-5"
        style={{
          background: "#FFF6E5", color: INK, borderRadius: "28px 28px 0 0", border: `3px solid ${INK}`, borderBottom: 0,
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
        }}
      >
        <button type="button" onClick={onClose} aria-label={t.close}
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center" style={sticker("#fff")}>
          <X size={20} strokeWidth={3} />
        </button>
        {sent ? (
          <div className="py-6 text-center">
            <div className="text-[30px] leading-tight" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{t.thanks}</div>
            <p className="mt-2 text-[16px] font-semibold">{t.mailOpened}</p>
            <button type="button" onClick={onClose} className="mt-5 min-h-12 w-full text-[17px] font-extrabold" style={sticker("#FFD23F")}>{general ? t.back : t.backToGame}</button>
          </div>
        ) : (
          <>
            <div className="pr-14 text-[28px] leading-[1.05]" style={{ fontFamily: "var(--font-display)", fontWeight: 700, textWrap: "balance" }}>
              {suggestLabel(kind, lang)}
            </div>
            <p className="mt-1.5 pr-12 text-[15px] font-semibold" style={{ color: "#4A3A66" }}>
              {/* Depuis les réglages (« Zinzin (nouveau jeu) ») : pas de « Pour … » qui sonne faux */}
              {general ? "" : t.forGame(gameName)}{t.bestIdeas}
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 600))}
              rows={4}
              autoFocus
              placeholder={kind === "question" ? t.phQuestion : t.phIdea}
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
              <Send size={18} strokeWidth={3} aria-hidden /> {t.send}
            </button>
            <p className="mt-2 text-center text-[13px] font-semibold" style={{ color: "#6B5C88" }}>
              {t.privacy}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
