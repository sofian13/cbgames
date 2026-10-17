import type { I18n } from "@/lib/i18n";
import type { SecretId } from "@/lib/secrets-found";

/**
 * Les secrets comptés dans « Secrets trouvés » (Réglages) : nom une fois trouvé, petit indice sinon.
 * Le bonus Halloween est compté à part (on ne peut le trouver qu'en saison, ou avec l'icône Halloween).
 * Le déclenchement de chacun appelle foundSecret(id) (src/lib/secrets-found.ts).
 */
export interface SecretInfo { id: SecretId; name: I18n<string>; hint: I18n<string> }

const S = (id: SecretId, fr: [string, string], en: [string, string], es: [string, string]): SecretInfo => ({
  id, name: { fr: fr[0], en: en[0], es: es[0] }, hint: { fr: fr[1], en: en[1], es: es[1] },
});

export const SECRETS: SecretInfo[] = [
  S("golden", ["Le blob doré", "Très rare… et il brille."], ["The golden blob", "Very rare… and shiny."], ["El blob dorado", "Muy raro… y brilla."]),
  S("shake", ["La pluie de blobs", "Secoue-moi !"], ["Blob rain", "Shake me!"], ["Lluvia de blobs", "¡Agítame!"]),
  S("themes", ["Les fonds secrets", "Le logo aime qu'on le touche… beaucoup."], ["Secret backgrounds", "The logo loves being tapped… a lot."], ["Fondos secretos", "Al logo le encanta que lo toquen… mucho."]),
  S("disco", ["La boîte de nuit", "Ça brille au-dessus de la Soirée."], ["Nightclub", "Something shiny above the Party card."], ["La discoteca", "Algo brilla encima de la Fiesta."]),
  S("dizzy", ["Le tournis", "Fais défiler l'accueil… très vite."], ["Dizzy", "Scroll the home screen… really fast."], ["Mareo", "Desliza la pantalla de inicio… muy rápido."]),
  S("screenshot", ["La photo", "Immortalise l'accueil."], ["Say cheese", "Capture the home screen."], ["La foto", "Inmortaliza la pantalla de inicio."]),
  S("facedown", ["Face cachée", "Pose le tél sur la table, écran dessous."], ["Face down", "Put the phone on the table, screen down."], ["Boca abajo", "Deja el móvil en la mesa, pantalla abajo."]),
  S("sleepy", ["La sieste", "Laisse l'accueil tranquille un bon moment."], ["Nap time", "Leave the home screen alone for a while."], ["La siesta", "Deja la pantalla de inicio tranquila un rato."]),
  S("pull", ["L'élastique", "Tire l'accueil vers le bas."], ["The bungee", "Pull the home screen down."], ["La goma elástica", "Tira de la pantalla de inicio hacia abajo."]),
  S("sulk", ["Le boudeur", "Embête un blob de carte de jeu."], ["The sulker", "Pester a blob on a game card."], ["El enfurruñado", "Molesta a un blob de una tarjeta de juego."]),
  S("battery", ["À plat", "Quand la batterie est presque vide…"], ["Running on empty", "When the battery is almost dead…"], ["Sin pilas", "Cuando la batería está casi vacía…"]),
  S("threeam", ["3 h du mat'", "Il est tard… très tard."], ["3 a.m.", "It's late… very late."], ["Las 3 de la mañana", "Es tarde… muy tarde."]),
  S("crown", ["La couronne arc-en-ciel", "Donne à un perso le nom de l'app."], ["Rainbow crown", "Give a character the app's name."], ["La corona arcoíris", "Ponle a un personaje el nombre de la app."]),
  S("kiss", ["Le bisou", "Dans Ma bande, rapproche deux persos."], ["The kiss", "In My crew, bring two characters together."], ["El beso", "En Mi grupo, junta a dos personajes."]),
  S("eject", ["L'éjecté", "Remplis ta bande à ras bord."], ["Ejected", "Fill your crew to the brim."], ["El expulsado", "Llena tu grupo hasta arriba."]),
  S("slap", ["La baffe", "Dans l'éditeur, tape le perso… plusieurs fois."], ["The slap", "In the editor, tap the character… a few times."], ["La bofetada", "En el editor, toca al personaje… varias veces."]),
  S("credits", ["Le générique", "Le numéro de version cache quelque chose."], ["The credits", "The version number hides something."], ["Los créditos", "El número de versión esconde algo."]),
  S("addicts", ["Les accros", "Rejoue au même jeu… encore et encore."], ["Addicts", "Replay the same game… again and again."], ["Enganchados", "Vuelve a jugar al mismo juego… una y otra vez."]),
];

export const HALLOWEEN_SECRETS: SecretInfo[] = [
  S("ghost", ["Le fantôme", "Il passe parfois… attrape-le."], ["The ghost", "It floats by sometimes… catch it."], ["El fantasma", "A veces pasa… atrápalo."]),
  S("trick", ["Bonbon ou un sort", "Une citrouille dépasse du bord."], ["Trick or treat", "A pumpkin peeks from the edge."], ["Truco o trato", "Una calabaza asoma por el borde."]),
  S("lights", ["Lumière éteinte", "Garde le doigt sur le logo."], ["Lights out", "Keep your finger on the logo."], ["Apagón", "Mantén el dedo sobre el logo."]),
  S("midnight", ["Minuit", "Reste là jusqu'à minuit pile."], ["Midnight", "Stay until midnight sharp."], ["Medianoche", "Quédate hasta la medianoche en punto."]),
];

export const SECRETS_UI: I18n<{ title: string; found: (n: number, total: number) => string; bonus: (n: number, total: number) => string; toast: (n: number, total: number) => string; bonusToast: string; rainbowToast: string; reward: string; rewardDone: string }> = {
  fr: {
    title: "Secrets trouvés",
    found: (n, total) => `${n} / ${total}`,
    bonus: (n, total) => `Bonus Halloween : ${n} / ${total}`,
    toast: (n, total) => `🔓 Secret trouvé ! (${n}/${total})`,
    bonusToast: "🎃 Secret d'Halloween trouvé !",
    rainbowToast: "🌈 18/18 ! Couleur Arc-en-ciel débloquée pour tes persos",
    reward: "🌈 Trouve-les tous : une couleur secrète t'attend.",
    rewardDone: "🌈 Couleur Arc-en-ciel débloquée (Ma bande → Couleur)",
  },
  en: {
    title: "Secrets found",
    found: (n, total) => `${n} / ${total}`,
    bonus: (n, total) => `Halloween bonus: ${n} / ${total}`,
    toast: (n, total) => `🔓 Secret found! (${n}/${total})`,
    bonusToast: "🎃 Halloween secret found!",
    rainbowToast: "🌈 18/18! Rainbow color unlocked for your characters",
    reward: "🌈 Find them all: a secret color awaits.",
    rewardDone: "🌈 Rainbow color unlocked (My crew → Color)",
  },
  es: {
    title: "Secretos encontrados",
    found: (n, total) => `${n} / ${total}`,
    bonus: (n, total) => `Bonus Halloween: ${n} / ${total}`,
    toast: (n, total) => `🔓 ¡Secreto encontrado! (${n}/${total})`,
    bonusToast: "🎃 ¡Secreto de Halloween encontrado!",
    rainbowToast: "🌈 ¡18/18! Color Arcoíris desbloqueado para tus personajes",
    reward: "🌈 Encuéntralos todos: te espera un color secreto.",
    rewardDone: "🌈 Color Arcoíris desbloqueado (Mi grupo → Color)",
  },
};
