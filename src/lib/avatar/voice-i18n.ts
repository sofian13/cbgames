import type { I18n } from "@/lib/i18n";

/** Textes des voix des persos (FR / EN / ES). */
export const VOICE_STR: I18n<{
  voiceOf: (n: string) => string;
  voiceLabel: string;
  voiceHint: string;
  hold: string;
  holdRedo: string;
  redoShort: string;
  holdAria: (n: string) => string;
  recording: (s: number) => string;
  play: string;
  playAria: (n: string) => string;
  del: string;
  delConfirm: string;
  saved: string;
  deleted: string;
  short: string;
  big: string;
  denied: string;
  unavailable: string;
  failed: string;
  unreadable: string;
  micAskTitle: string;
  micAskText: string;
  micAskOk: string;
  micAskLater: string;
  lockedVoice: string;
  hasVoice: string;
  micAria: (n: string) => string;
  inGame: string;
  inGameSub: string;
}> = {
  fr: {
    voiceOf: (n) => `La voix de ${n}`,
    voiceLabel: "Son",
    voiceHint: "Un cri, un rire, une phrase culte : 5 secondes max.",
    hold: "Maintiens pour enregistrer",
    holdRedo: "Maintiens pour refaire",
    redoShort: "Refaire",
    holdAria: (n) => `Maintenir pour enregistrer le son de ${n}`,
    recording: (s) => `J'écoute… ${s} s`,
    play: "Écouter",
    playAria: (n) => `Écouter ${n}`,
    del: "Supprimer",
    delConfirm: "Supprimer le son ?",
    saved: "Son enregistré !",
    deleted: "Son supprimé",
    short: "Trop court : garde le doigt appuyé pendant que tu parles.",
    big: "Son trop lourd : refais-le un peu plus court.",
    denied: "Micro refusé : autorise-le dans Réglages > Zinzin > Micro.",
    unavailable: "Micro indisponible sur cet appareil.",
    failed: "L'enregistrement a raté, réessaie.",
    unreadable: "Ce son ne peut pas être lu sur cet appareil.",
    micAskTitle: "Le micro, pour le cri de ton perso",
    micAskText: "Zinzin va te demander l'accès au micro, seulement pour enregistrer ce son. Il reste sur ton téléphone, il n'est jamais envoyé.",
    micAskOk: "Autoriser le micro",
    micAskLater: "Plus tard",
    lockedVoice: "Les sons des autres persos sont dans Zinzin+ (le tien est gratuit).",
    hasVoice: "a un son",
    micAria: (n) => `Son de ${n}`,
    inGame: "Voix des persos en jeu",
    inGameSub: "Le perso dit son son à son tour et quand il gagne.",
  },
  en: {
    voiceOf: (n) => `${n}'s voice`,
    voiceLabel: "Sound",
    voiceHint: "A shout, a laugh, a catchphrase: 5 seconds max.",
    hold: "Hold to record",
    holdRedo: "Hold to redo",
    redoShort: "Redo",
    holdAria: (n) => `Hold to record ${n}'s sound`,
    recording: (s) => `Listening… ${s}s`,
    play: "Play",
    playAria: (n) => `Play ${n}`,
    del: "Delete",
    delConfirm: "Delete the sound?",
    saved: "Sound saved!",
    deleted: "Sound deleted",
    short: "Too short: keep your finger down while you talk.",
    big: "Sound too heavy: make it a bit shorter.",
    denied: "Microphone blocked: allow it in Settings > Zinzin > Microphone.",
    unavailable: "No microphone available on this device.",
    failed: "Recording failed, try again.",
    unreadable: "This sound can't be played on this device.",
    micAskTitle: "The mic, for your character's sound",
    micAskText: "Zinzin will ask for microphone access, only to record this sound. It stays on your phone and is never sent.",
    micAskOk: "Allow the microphone",
    micAskLater: "Later",
    lockedVoice: "Sounds for the other characters are part of Zinzin+ (yours is free).",
    hasVoice: "has a sound",
    micAria: (n) => `${n}'s sound`,
    inGame: "Character voices in games",
    inGameSub: "Characters play their sound on their turn and when they win.",
  },
  es: {
    voiceOf: (n) => `La voz de ${n}`,
    voiceLabel: "Sonido",
    voiceHint: "Un grito, una risa, una frase mítica: 5 segundos como máximo.",
    hold: "Mantén para grabar",
    holdRedo: "Mantén para repetir",
    redoShort: "Repetir",
    holdAria: (n) => `Mantener para grabar el sonido de ${n}`,
    recording: (s) => `Escuchando… ${s} s`,
    play: "Escuchar",
    playAria: (n) => `Escuchar a ${n}`,
    del: "Borrar",
    delConfirm: "¿Borrar el sonido?",
    saved: "¡Sonido guardado!",
    deleted: "Sonido borrado",
    short: "Demasiado corto: mantén el dedo pulsado mientras hablas.",
    big: "Sonido demasiado pesado: hazlo un poco más corto.",
    denied: "Micrófono bloqueado: permítelo en Ajustes > Zinzin > Micrófono.",
    unavailable: "No hay micrófono disponible en este dispositivo.",
    failed: "La grabación ha fallado, inténtalo otra vez.",
    unreadable: "Este sonido no se puede reproducir en este dispositivo.",
    micAskTitle: "El micro, para el sonido de tu personaje",
    micAskText: "Zinzin te pedirá acceso al micrófono, solo para grabar este sonido. Se queda en tu móvil y nunca se envía.",
    micAskOk: "Permitir el micrófono",
    micAskLater: "Más tarde",
    lockedVoice: "Los sonidos de los demás personajes son de Zinzin+ (el tuyo es gratis).",
    hasVoice: "tiene sonido",
    micAria: (n) => `Sonido de ${n}`,
    inGame: "Voces de los personajes en el juego",
    inGameSub: "Cada personaje suena en su turno y cuando gana.",
  },
};
