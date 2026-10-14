import type { I18n } from "@/lib/i18n";
import type { BandFileError } from "./band-file";

const s = (n: number, one: string, many: string) => (n > 1 ? many : one);

/** Textes des voix des persos et de l'envoi de bande en fichier (FR / EN / ES). */
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
  sendVoices: string;
  sendVoicesSub: string;
  sendLocked: string;
  sendText: string;
  fileName: (n: string) => string;
  fileSaved: string;
  sendFail: string;
  tooHeavy: string;
  importFile: string;
  importFileSub: string;
  recvTitle: (n: string) => string;
  recvFrom: (n: string) => string;
  recvHint: string;
  recvVoices: (n: number) => string;
  recvAdd: string;
  recvReplace: string;
  recvCancel: string;
  recvAdded: (n: number) => string;
  recvFull: string;
  recvErr: Record<BandFileError, string>;
  recvErrTitle: string;
  ok: string;
  fromShort: (n: string) => string;
  mute: (n: string) => string;
  unmute: (n: string) => string;
  muted: string;
  muteShort: string;
  muteAll: string;
  muteAllSub: string;
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
    micAskText: "Zinzin va te demander l'accès au micro, seulement pour enregistrer ce son. Il reste sur ton téléphone et ne part que si tu envoies toi-même ta bande.",
    micAskOk: "Autoriser le micro",
    micAskLater: "Plus tard",
    lockedVoice: "Les sons des autres persos sont dans Zinzin+ (le tien est gratuit).",
    hasVoice: "a un son",
    micAria: (n) => `Son de ${n}`,
    sendVoices: "Envoyer ma bande (avec les voix)",
    sendVoicesSub: "Un fichier à envoyer par WhatsApp, iMessage, AirDrop…",
    sendLocked: "Envoi avec les voix : Zinzin+",
    sendText: "Ouvre ma bande dans Zinzin ! Pas encore l'app ? zinzin-app.com",
    fileName: (n) => `Bande de ${n}`,
    fileSaved: "Fichier téléchargé : envoie-le à tes potes !",
    sendFail: "Envoi impossible, réessaie.",
    tooHeavy: "Bande trop lourde : supprime quelques sons.",
    importFile: "Importer un fichier de bande",
    importFileSub: "Un fichier .zinzin reçu",
    recvTitle: (n) => `La bande de ${n}`,
    recvFrom: (n) => `De la part de ${n}`,
    recvHint: "Touche un perso pour l'entendre.",
    recvVoices: (n) => `${n} ${s(n, "perso parle", "persos parlent")}`,
    recvAdd: "Ajouter à ma bande",
    recvReplace: "Remplacer ma bande",
    recvCancel: "Annuler",
    recvAdded: (n) => `${n} ${s(n, "perso ajouté", "persos ajoutés")} !`,
    recvFull: "Ta bande est complète (16 persos) : retires-en avant d'ajouter.",
    recvErr: {
      size: "Fichier trop lourd : ce n'est pas une bande Zinzin.",
      format: "Ce fichier n'est pas une bande Zinzin valide.",
      version: "Cette bande vient d'une version plus récente de Zinzin : mets l'app à jour.",
      empty: "Cette bande est vide.",
      read: "Impossible d'ouvrir ce fichier.",
    },
    recvErrTitle: "Bande illisible",
    ok: "OK",
    fromShort: (n) => `De ${n}`,
    mute: (n) => `Couper la voix de ${n}`,
    unmute: (n) => `Remettre la voix de ${n}`,
    muted: "Voix coupée",
    muteShort: "Couper sa voix",
    muteAll: "Couper toutes les voix reçues",
    muteAllSub: "Les persos reçus restent, sans leur son.",
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
    micAskText: "Zinzin will ask for microphone access, only to record this sound. It stays on your phone and only leaves if you send your crew yourself.",
    micAskOk: "Allow the microphone",
    micAskLater: "Later",
    lockedVoice: "Sounds for the other characters are part of Zinzin+ (yours is free).",
    hasVoice: "has a sound",
    micAria: (n) => `${n}'s sound`,
    sendVoices: "Send my crew (with the voices)",
    sendVoicesSub: "A file to send via WhatsApp, iMessage, AirDrop…",
    sendLocked: "Sending with voices: Zinzin+",
    sendText: "Open my crew in Zinzin! Don't have the app yet? zinzin-app.com",
    fileName: (n) => `${n}'s crew`,
    fileSaved: "File downloaded: send it to your friends!",
    sendFail: "Couldn't send it, try again.",
    tooHeavy: "Crew too heavy: delete a few sounds.",
    importFile: "Import a crew file",
    importFileSub: "A .zinzin file you received",
    recvTitle: (n) => `${n}'s crew`,
    recvFrom: (n) => `From ${n}`,
    recvHint: "Tap a character to hear them.",
    recvVoices: (n) => `${n} ${s(n, "character talks", "characters talk")}`,
    recvAdd: "Add to my crew",
    recvReplace: "Replace my crew",
    recvCancel: "Cancel",
    recvAdded: (n) => `${n} ${s(n, "character", "characters")} added!`,
    recvFull: "Your crew is full (16 characters): remove some before adding.",
    recvErr: {
      size: "File too heavy: this isn't a Zinzin crew.",
      format: "This file isn't a valid Zinzin crew.",
      version: "This crew comes from a newer version of Zinzin: update the app.",
      empty: "This crew is empty.",
      read: "Couldn't open this file.",
    },
    recvErrTitle: "Can't read this crew",
    ok: "OK",
    fromShort: (n) => `From ${n}`,
    mute: (n) => `Mute ${n}'s voice`,
    unmute: (n) => `Unmute ${n}'s voice`,
    muted: "Voice muted",
    muteShort: "Mute voice",
    muteAll: "Mute all received voices",
    muteAllSub: "Received characters stay, without their sound.",
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
    micAskText: "Zinzin te pedirá acceso al micrófono, solo para grabar este sonido. Se queda en tu móvil y solo sale si tú mismo envías tu grupo.",
    micAskOk: "Permitir el micrófono",
    micAskLater: "Más tarde",
    lockedVoice: "Los sonidos de los demás personajes son de Zinzin+ (el tuyo es gratis).",
    hasVoice: "tiene sonido",
    micAria: (n) => `Sonido de ${n}`,
    sendVoices: "Enviar mi grupo (con las voces)",
    sendVoicesSub: "Un archivo para mandar por WhatsApp, iMessage, AirDrop…",
    sendLocked: "Envío con voces: Zinzin+",
    sendText: "¡Abre mi grupo en Zinzin! ¿Aún no tienes la app? zinzin-app.com",
    fileName: (n) => `Grupo de ${n}`,
    fileSaved: "Archivo descargado: ¡mándaselo a tus amigos!",
    sendFail: "No se pudo enviar, inténtalo otra vez.",
    tooHeavy: "Grupo demasiado pesado: borra algunos sonidos.",
    importFile: "Importar un archivo de grupo",
    importFileSub: "Un archivo .zinzin que te han pasado",
    recvTitle: (n) => `El grupo de ${n}`,
    recvFrom: (n) => `De parte de ${n}`,
    recvHint: "Toca un personaje para oírlo.",
    recvVoices: (n) => `${n} ${s(n, "personaje habla", "personajes hablan")}`,
    recvAdd: "Añadir a mi grupo",
    recvReplace: "Sustituir mi grupo",
    recvCancel: "Cancelar",
    recvAdded: (n) => `¡${n} ${s(n, "personaje añadido", "personajes añadidos")}!`,
    recvFull: "Tu grupo está completo (16 personajes): quita alguno antes de añadir.",
    recvErr: {
      size: "Archivo demasiado pesado: no es un grupo de Zinzin.",
      format: "Este archivo no es un grupo de Zinzin válido.",
      version: "Este grupo viene de una versión más reciente de Zinzin: actualiza la app.",
      empty: "Este grupo está vacío.",
      read: "No se pudo abrir este archivo.",
    },
    recvErrTitle: "Grupo ilegible",
    ok: "OK",
    fromShort: (n) => `De ${n}`,
    mute: (n) => `Silenciar la voz de ${n}`,
    unmute: (n) => `Activar la voz de ${n}`,
    muted: "Voz silenciada",
    muteShort: "Silenciar voz",
    muteAll: "Silenciar todas las voces recibidas",
    muteAllSub: "Los personajes recibidos se quedan, sin su sonido.",
    inGame: "Voces de los personajes en el juego",
    inGameSub: "Cada personaje suena en su turno y cuando gana.",
  },
};
