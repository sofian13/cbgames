/**
 * LE TEST OFFICIEL ZINZIN — liste FIXE de 50 questions « As-tu déjà… ? » (contenu original, 18+).
 * Ordre progressif, mêmes paliers dans les 3 langues :
 *  1-6 échauffement osé · 7-14 soirée & alcool · 15-21 illégal & drogue ·
 *  22-28 méchanceté & morale · 29-50 sexe & coquin, de plus en plus chaud.
 * Règle App Store : suggestif et direct, jamais cru ni descriptif (aucun acte, partie du corps
 * ou position décrits) ; illégal / drogue formulés au passé, comme un constat, sans incitation.
 */

import type { I18n, Lang } from "@/lib/i18n";
import type { PackId } from "./questions";

export const OFFICIEL_COUNT = 50;

const FR: string[] = [
  // 1 — Échauffement osé
  "As-tu déjà embrassé quelqu'un juste pour gagner un pari ?",
  "As-tu déjà menti sur ton nombre de partenaires (dans un sens ou dans l'autre) ?",
  "As-tu déjà envoyé un message très chaud à la mauvaise personne ?",
  "As-tu déjà dragué quelqu'un uniquement pour te faire payer des verres ?",
  "As-tu déjà eu un crush sur la mère ou le père d'un(e) pote ?",
  "As-tu déjà embrassé deux personnes différentes dans la même soirée ?",
  // 2 — Soirée & alcool (version trash)
  "As-tu déjà vomi en soirée… ailleurs que dans des toilettes ?",
  "As-tu déjà fait un black-out complet sur une soirée entière ?",
  "T'es-tu déjà réveillé(e) sans avoir la moindre idée d'où tu étais ?",
  "As-tu déjà embrassé un(e) parfait(e) inconnu(e) en boîte ?",
  "As-tu déjà dormi chez quelqu'un dont tu ne connaissais même pas le prénom ?",
  "As-tu déjà appelé ou écrit à ton ex, bourré(e), en pleine nuit ?",
  "As-tu déjà fait pipi dans la rue en rentrant de soirée ?",
  "T'es-tu déjà fait virer d'un bar ou d'une boîte ?",
  // 3 — Illégal & drogue
  "As-tu déjà conduit sans permis ?",
  "As-tu déjà volé quelque chose dans un magasin ?",
  "As-tu déjà utilisé une fausse carte d'identité, ou celle de quelqu'un d'autre ?",
  "As-tu déjà fraudé (transports, assurance, impôts… ici on ne juge pas) ?",
  "As-tu déjà consommé une drogue illégale ?",
  "T'es-tu déjà battu(e) pour de vrai ?",
  "As-tu déjà fini en garde à vue ?",
  // 4 — Méchanceté & morale
  "T'es-tu déjà moqué(e) d'une personne handicapée ?",
  "As-tu déjà fouillé le téléphone de ton ou ta partenaire en cachette ?",
  "As-tu déjà menti à ton ou ta partenaire sur l'endroit où tu étais vraiment ?",
  "As-tu déjà dragué quelqu'un alors que tu étais en couple ?",
  "As-tu déjà trompé quelqu'un ?",
  "As-tu déjà couché avec l'ex d'un(e) pote ?",
  "As-tu déjà balancé le secret le plus intime d'un(e) ami(e) pour te venger ?",
  // 5 — Sexe & coquin (de plus en plus chaud)
  "As-tu déjà envoyé un nude ?",
  "As-tu déjà passé une nuit entière à t'échanger des sextos ?",
  "As-tu déjà couché le premier soir ?",
  "As-tu déjà eu un coup d'un soir ?",
  "As-tu déjà couché avec quelqu'un rencontré sur une appli… le jour même du match ?",
  "As-tu déjà eu un(e) sex friend ?",
  "As-tu déjà simulé ?",
  "As-tu déjà couché avec un(e) ex « une toute dernière fois » ?",
  "As-tu déjà couché avec un(e) ami(e) proche ?",
  "As-tu déjà couché avec un(e) collègue ?",
  "As-tu déjà regardé un film X avec quelqu'un ?",
  "As-tu déjà couché avec quelqu'un de beaucoup plus âgé que toi ?",
  "As-tu déjà fait l'amour dans une voiture ?",
  "As-tu déjà fait l'amour sur une plage ?",
  "As-tu déjà fait un jeu de rôle ou sorti les menottes ?",
  "As-tu déjà fait l'amour dans les toilettes d'une boîte ou d'un bar ?",
  "As-tu déjà fait l'amour dans un lieu public ?",
  "As-tu déjà couché avec quelqu'un qui était en couple ?",
  "As-tu déjà été surpris(e) en pleine action ?",
  "As-tu déjà eu un « sugar daddy » ou une « sugar mommy » ?",
  "As-tu déjà couché avec deux personnes différentes dans la même soirée ?",
  "As-tu déjà fait un plan à trois ?",
];

const EN: string[] = [
  // 1 — Spicy warm-up
  "Have you ever kissed someone just to win a bet?",
  "Have you ever lied about your body count, either way?",
  "Have you ever sent a very spicy text to the wrong person?",
  "Have you ever flirted with someone purely so they'd buy you drinks?",
  "Have you ever had a crush on a friend's mum or dad?",
  "Have you ever kissed two different people on the same night?",
  // 2 — Nights out (the messy version)
  "Have you ever thrown up on a night out… somewhere that wasn't a toilet?",
  "Have you ever blacked out and lost an entire night?",
  "Have you ever woken up with absolutely no idea where you were?",
  "Have you ever made out with a total stranger in a club?",
  "Have you ever spent the night at someone's place without even knowing their name?",
  "Have you ever drunk-called or drunk-texted your ex in the middle of the night?",
  "Have you ever peed in the street on the way home from a night out?",
  "Have you ever been kicked out of a bar or a club?",
  // 3 — Crimes & drugs
  "Have you ever driven without a licence?",
  "Have you ever shoplifted?",
  "Have you ever used a fake ID, or someone else's?",
  "Have you ever committed a bit of fraud (fares, insurance, taxes… no judgement here)?",
  "Have you ever taken an illegal drug?",
  "Have you ever been in a real fight?",
  "Have you ever been arrested?",
  // 4 — Mean & morally grey
  "Have you ever made fun of a disabled person?",
  "Have you ever secretly gone through your partner's phone?",
  "Have you ever lied to your partner about where you really were?",
  "Have you ever flirted with someone while you were in a relationship?",
  "Have you ever cheated on someone?",
  "Have you ever slept with a friend's ex?",
  "Have you ever spilled a friend's most intimate secret to get back at them?",
  // 5 — Sex & spice (hotter and hotter)
  "Have you ever sent a nude?",
  "Have you ever spent an entire night sexting?",
  "Have you ever slept with someone on the first date?",
  "Have you ever had a one-night stand?",
  "Have you ever slept with someone from a dating app… the same day you matched?",
  "Have you ever had a friend with benefits?",
  "Have you ever faked it?",
  "Have you ever slept with an ex “one very last time”?",
  "Have you ever slept with a close friend?",
  "Have you ever slept with a coworker?",
  "Have you ever watched an adult film with someone?",
  "Have you ever slept with someone much older than you?",
  "Have you ever done it in a car?",
  "Have you ever done it on a beach?",
  "Have you ever tried role-play or brought out the handcuffs?",
  "Have you ever done it in a club or bar toilet?",
  "Have you ever done it in a public place?",
  "Have you ever slept with someone who was in a relationship?",
  "Have you ever been caught in the act?",
  "Have you ever had a sugar daddy or a sugar mommy?",
  "Have you ever slept with two different people on the same night?",
  "Have you ever had a threesome?",
];

const ES: string[] = [
  // 1 — Calentamiento atrevido
  "¿Alguna vez has besado a alguien solo para ganar una apuesta?",
  "¿Alguna vez has mentido sobre con cuántas personas te has acostado (por arriba o por abajo)?",
  "¿Alguna vez le has mandado un mensaje muy subido de tono a la persona equivocada?",
  "¿Alguna vez has ligado con alguien solo para que te invitara a copas?",
  "¿Alguna vez te ha gustado la madre o el padre de un amigo?",
  "¿Alguna vez has besado a dos personas distintas la misma noche?",
  // 2 — Fiesta (versión desastre)
  "¿Alguna vez has vomitado de fiesta… en un sitio que no era el baño?",
  "¿Alguna vez has tenido una laguna total y has perdido una noche entera?",
  "¿Alguna vez te has despertado sin tener ni idea de dónde estabas?",
  "¿Alguna vez te has besado con un completo desconocido en la discoteca?",
  "¿Alguna vez has pasado la noche en casa de alguien sin saber ni cómo se llamaba?",
  "¿Alguna vez has llamado o escrito a tu ex con copas de más en plena madrugada?",
  "¿Alguna vez has hecho pis en la calle volviendo de fiesta?",
  "¿Alguna vez te han echado de un bar o de una discoteca?",
  // 3 — Ilegal y drogas
  "¿Alguna vez has conducido sin carné ni licencia?",
  "¿Alguna vez has robado algo en una tienda?",
  "¿Alguna vez has usado un documento de identidad falso o el de otra persona?",
  "¿Alguna vez has hecho algún fraude (transporte, seguro, impuestos…)? Aquí no se juzga.",
  "¿Alguna vez has consumido alguna droga ilegal?",
  "¿Alguna vez te has pegado con alguien de verdad?",
  "¿Alguna vez te ha detenido la policía?",
  // 4 — Maldad y moral
  "¿Alguna vez te has burlado de una persona con discapacidad?",
  "¿Alguna vez has revisado el móvil de tu pareja a escondidas?",
  "¿Alguna vez le has mentido a tu pareja sobre dónde estabas de verdad?",
  "¿Alguna vez has ligado con alguien teniendo pareja?",
  "¿Alguna vez has puesto los cuernos?",
  "¿Alguna vez te has acostado con el ex o la ex de un amigo?",
  "¿Alguna vez has contado el secreto más íntimo de un amigo para vengarte?",
  // 5 — Sexo y picante (cada vez más fuerte)
  "¿Alguna vez has mandado un nude?",
  "¿Alguna vez te has pasado una noche entera haciendo sexting?",
  "¿Alguna vez te has acostado con alguien en la primera cita?",
  "¿Alguna vez has tenido un rollo de una noche?",
  "¿Alguna vez te has acostado con alguien de una app de citas… el mismo día del match?",
  "¿Alguna vez has tenido un amigo o una amiga con derecho a roce?",
  "¿Alguna vez has fingido en la cama?",
  "¿Alguna vez te has acostado con tu ex «una última vez, de verdad»?",
  "¿Alguna vez te has acostado con un amigo o una amiga cercana?",
  "¿Alguna vez te has acostado con alguien del trabajo?",
  "¿Alguna vez has visto una película para adultos con alguien?",
  "¿Alguna vez te has acostado con alguien mucho mayor que tú?",
  "¿Alguna vez lo has hecho en un coche?",
  "¿Alguna vez lo has hecho en la playa?",
  "¿Alguna vez has hecho un juego de rol o has sacado las esposas?",
  "¿Alguna vez lo has hecho en el baño de una discoteca o de un bar?",
  "¿Alguna vez lo has hecho en un lugar público?",
  "¿Alguna vez te has acostado con alguien que tenía pareja?",
  "¿Alguna vez te han pillado en plena faena?",
  "¿Alguna vez has tenido un sugar daddy o una sugar mommy?",
  "¿Alguna vez te has acostado con dos personas distintas la misma noche?",
  "¿Alguna vez has hecho un trío?",
];

const OFFICIEL: I18n<string[]> = { fr: FR, en: EN, es: ES };

/**
 * Pack « équivalent » d'une question du Test Officiel (sert seulement à pondérer
 * les révélations croustillantes) : échauffement = soft, soirée + illégal = soirée,
 * morale + sexe = coquin.
 */
function packFor(i: number): PackId {
  if (i < 6) return "soft";
  if (i < 21) return "soiree";
  return "coquin";
}

/** Les 50 questions du Test Officiel, dans l'ordre, dans la langue voulue. */
export function officielQuestions(lang: Lang): { text: string; pack: PackId }[] {
  return (OFFICIEL[lang] ?? FR).map((text, i) => ({ text, pack: packFor(i) }));
}
