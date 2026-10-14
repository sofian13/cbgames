import type { I18n } from "@/lib/i18n";

/** Règles en jeu (bouton livre) + libellé des scores de Tu me connais ? */
export const CQ_RULES: I18n<{ rules: string[]; scoreLabel: string }> = {
  fr: {
    rules: [
      "Vous jouez à deux, sur un seul tél. À chaque question, il y a toujours 2 choix (ex. « Plage ou montagne ? »).",
      "L'un répond en secret pour lui-même, puis passe le tél à l'autre sans montrer l'écran.",
      "L'autre devine ce que son partenaire a choisi. Bonne devinette = 1 point pour celui qui devine.",
      "Les rôles s'échangent à chaque question. Pas fan d'une question ? « Pas fou ? Une autre » en tire une nouvelle avant la réponse.",
      "À la fin, le % de bonnes devinettes dit à quel point vous vous connaissez.",
    ],
    scoreLabel: "Points (1 par bonne devinette)",
  },
  en: {
    rules: [
      "You play as a pair, on one phone. Every question always has 2 options (e.g. \"Beach or mountains?\").",
      "One of you answers in secret for themselves, then passes the phone without showing the screen.",
      "The other guesses what their partner picked. Right guess = 1 point for the guesser.",
      "Roles swap every question. Don't like a question? \"Meh? Another one\" draws a new one before answering.",
      "At the end, your % of right guesses shows how well you know each other.",
    ],
    scoreLabel: "Points (1 per right guess)",
  },
  es: {
    rules: [
      "Jugáis los dos, con un solo móvil. Cada pregunta tiene siempre 2 opciones (p. ej. «¿Playa o montaña?»).",
      "Uno responde en secreto por sí mismo y pasa el móvil sin enseñar la pantalla.",
      "El otro adivina lo que eligió su pareja. Acierto = 1 punto para quien adivina.",
      "Los papeles cambian en cada pregunta. ¿No te gusta una? «¿No mola? Otra» saca una nueva antes de responder.",
      "Al final, el % de aciertos dice cuánto os conocéis.",
    ],
    scoreLabel: "Puntos (1 por acierto)",
  },
};
