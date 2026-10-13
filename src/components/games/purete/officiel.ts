/**
 * LE TEST OFFICIEL ZINZIN — liste FIXE de 50 questions « As-tu déjà… ? » (contenu original).
 * Ordre progressif, mêmes paliers dans les 3 langues :
 *  1-8 amour & bisous · 9-16 bêtises & mensonges · 17-25 soirée & alcool ·
 *  26-33 illégal léger & drogue · 34-41 méchanceté & morale · 42-50 sexe (suggestif, jamais explicite).
 */

import type { I18n, Lang } from "@/lib/i18n";
import type { PackId } from "./questions";

export const OFFICIEL_COUNT = 50;

const FR: string[] = [
  // 1 — Amour & bisous
  "As-tu déjà eu un crush secret pendant plus d'un an sans jamais rien dire ?",
  "As-tu déjà réécrit dix fois un message avant d'oser l'envoyer à ton crush ?",
  "As-tu déjà fait le premier pas avec quelqu'un qui te plaisait ?",
  "As-tu déjà embrassé quelqu'un dont tu ne connaissais pas encore le prénom ?",
  "As-tu déjà embrassé deux personnes différentes dans la même soirée ?",
  "As-tu déjà dit « je t'aime » sans vraiment le penser ?",
  "As-tu déjà largué quelqu'un par message ?",
  "As-tu déjà fait une déclaration qui s'est terminée en gros râteau ?",
  // 2 — Bêtises & mensonges
  "As-tu déjà fait semblant d'être malade pour sécher les cours ou le boulot ?",
  "As-tu déjà imité la signature de quelqu'un ?",
  "As-tu déjà fouillé dans le téléphone de quelqu'un sans son accord ?",
  "As-tu déjà laissé quelqu'un se faire gronder à ta place ?",
  "As-tu déjà fait le mur pour sortir en douce ?",
  "As-tu déjà inventé une fausse urgence pour annuler un plan à la dernière minute ?",
  "As-tu déjà triché à un examen ?",
  "As-tu déjà répété un secret que tu avais juré de garder ?",
  // 3 — Soirée & alcool
  "As-tu déjà été pompette au point de rire de tout et de rien ?",
  "As-tu déjà eu un trou noir sur une partie de ta soirée ?",
  "As-tu déjà été malade à cause de l'alcool ?",
  "As-tu déjà appelé ton ex après quelques verres, et regretté au réveil ?",
  "As-tu déjà dansé debout sur une table ?",
  "As-tu déjà été refoulé(e) à l'entrée d'une boîte ?",
  "T'es-tu déjà réveillé(e) tout habillé(e) sur un canapé qui n'était pas le tien ?",
  "As-tu déjà enchaîné une nuit blanche et une journée de cours ou de boulot ?",
  "As-tu déjà menti à tes parents sur l'endroit où tu passais la nuit ?",
  // 4 — Illégal léger & drogue
  "As-tu déjà voyagé sans ticket dans les transports ?",
  "As-tu déjà piqué quelque chose dans un magasin ?",
  "As-tu déjà conduit sans permis ?",
  "As-tu déjà fumé, ne serait-ce qu'une taffe ?",
  "As-tu déjà consommé une drogue ?",
  "As-tu déjà détalé en courant devant un contrôleur ou un vigile ?",
  "As-tu déjà tagué ou abîmé quelque chose dans un lieu public ?",
  "As-tu déjà eu affaire à la police pour une bêtise que tu avais vraiment faite ?",
  // 5 — Méchanceté & morale
  "T'es-tu déjà moqué(e) d'une personne handicapée ?",
  "As-tu déjà fait pleurer quelqu'un exprès ?",
  "As-tu déjà gardé de l'argent trouvé alors que tu savais à qui il était ?",
  "As-tu déjà ghosté quelqu'un du jour au lendemain ?",
  "As-tu déjà critiqué quelqu'un juste après lui avoir fait la bise ?",
  "As-tu déjà dragué le ou la partenaire d'un(e) ami(e) ?",
  "As-tu déjà trompé quelqu'un ?",
  "As-tu déjà été l'amant(e) caché(e) de quelqu'un en couple ?",
  // 6 — Sexe (suggestif)
  "As-tu déjà couché le premier soir ?",
  "As-tu déjà envoyé un nude ?",
  "As-tu déjà eu un coup d'un soir avec quelqu'un rencontré sur une appli ?",
  "As-tu déjà couché avec un(e) ex « juste une dernière fois » ?",
  "As-tu déjà couché avec un(e) ami(e) proche ?",
  "As-tu déjà été surpris(e) en pleine action ?",
  "As-tu déjà fait l'amour dans un lieu public ?",
  "As-tu déjà eu deux partenaires différents le même week-end ?",
  "As-tu déjà fait un plan à trois ?",
];

const EN: string[] = [
  // 1 — Love & kisses
  "Have you ever had a secret crush for over a year and never said a word?",
  "Have you ever rewritten a text ten times before daring to send it to your crush?",
  "Have you ever made the first move on someone you liked?",
  "Have you ever kissed someone before you even knew their name?",
  "Have you ever kissed two different people on the same night?",
  "Have you ever said “I love you” without really meaning it?",
  "Have you ever dumped someone over text?",
  "Have you ever confessed your feelings and been flat-out rejected?",
  // 2 — Mischief & lies
  "Have you ever faked being sick to skip school or work?",
  "Have you ever forged someone's signature?",
  "Have you ever gone through someone's phone without asking?",
  "Have you ever let someone else take the blame for something you did?",
  "Have you ever snuck out of the house at night?",
  "Have you ever made up a fake emergency to bail on plans last minute?",
  "Have you ever cheated on an exam?",
  "Have you ever spilled a secret you swore you'd keep?",
  // 3 — Nights out & drinks
  "Have you ever been tipsy enough to laugh at absolutely everything?",
  "Have you ever blanked on part of a night out?",
  "Have you ever been sick because of alcohol?",
  "Have you ever called your ex after a few drinks and regretted it the next morning?",
  "Have you ever danced on top of a table?",
  "Have you ever been turned away at the door of a club?",
  "Have you ever woken up fully dressed on a sofa that wasn't yours?",
  "Have you ever pulled an all-nighter and gone straight to class or work?",
  "Have you ever lied to your parents about where you were spending the night?",
  // 4 — Minor crimes & drugs
  "Have you ever ridden public transport without a ticket?",
  "Have you ever stolen something from a shop?",
  "Have you ever driven without a licence?",
  "Have you ever smoked, even just one puff?",
  "Have you ever taken drugs?",
  "Have you ever run off to escape a ticket inspector or a security guard?",
  "Have you ever tagged or damaged something in a public place?",
  "Have you ever been in trouble with the police for something you actually did?",
  // 5 — Mean & morally grey
  "Have you ever made fun of a disabled person?",
  "Have you ever made someone cry on purpose?",
  "Have you ever kept money you found when you knew whose it was?",
  "Have you ever ghosted someone out of nowhere?",
  "Have you ever trash-talked someone right after hugging them hello?",
  "Have you ever flirted with a friend's partner?",
  "Have you ever cheated on someone?",
  "Have you ever been someone's secret affair while they were in a relationship?",
  // 6 — Sex (suggestive)
  "Have you ever slept with someone on the first date?",
  "Have you ever sent a nude?",
  "Have you ever had a one-night stand with someone from a dating app?",
  "Have you ever slept with an ex “just one last time”?",
  "Have you ever slept with a close friend?",
  "Have you ever been caught in the act?",
  "Have you ever hooked up in a public place?",
  "Have you ever had two different partners in the same weekend?",
  "Have you ever had a threesome?",
];

const ES: string[] = [
  // 1 — Amor y besos
  "¿Alguna vez has tenido un crush secreto durante más de un año sin decir nada?",
  "¿Alguna vez has reescrito diez veces un mensaje antes de atreverte a mandárselo a tu crush?",
  "¿Alguna vez has dado el primer paso con alguien que te gustaba?",
  "¿Alguna vez has besado a alguien sin saber todavía cómo se llamaba?",
  "¿Alguna vez has besado a dos personas distintas en la misma noche?",
  "¿Alguna vez has dicho «te quiero» sin sentirlo de verdad?",
  "¿Alguna vez has dejado a alguien por mensaje?",
  "¿Alguna vez te has declarado y te han dado calabazas?",
  // 2 — Travesuras y mentiras
  "¿Alguna vez has fingido una enfermedad para faltar a clase o al trabajo?",
  "¿Alguna vez has falsificado la firma de alguien?",
  "¿Alguna vez has cotilleado el móvil de alguien sin su permiso?",
  "¿Alguna vez has dejado que otra persona cargara con la culpa de algo que hiciste tú?",
  "¿Alguna vez te has escapado de casa de noche a escondidas?",
  "¿Alguna vez te has inventado una emergencia para cancelar un plan en el último momento?",
  "¿Alguna vez has copiado en un examen?",
  "¿Alguna vez has contado un secreto que juraste guardar?",
  // 3 — Fiesta y alcohol
  "¿Alguna vez has ido tan alegre que te reías de absolutamente todo?",
  "¿Alguna vez has tenido una laguna y no recuerdas parte de la noche?",
  "¿Alguna vez te has encontrado mal por culpa del alcohol?",
  "¿Alguna vez has llamado a tu ex después de unas copas y te has arrepentido al despertar?",
  "¿Alguna vez has bailado encima de una mesa?",
  "¿Alguna vez no te han dejado entrar en una discoteca?",
  "¿Alguna vez te has despertado con la ropa puesta en un sofá que no era el tuyo?",
  "¿Alguna vez has pasado la noche en vela y luego has ido directo a clase o al trabajo?",
  "¿Alguna vez has mentido a tus padres sobre dónde pasabas la noche?",
  // 4 — Ilegal leve y drogas
  "¿Alguna vez has viajado en transporte público sin pagar?",
  "¿Alguna vez has robado algo en una tienda?",
  "¿Alguna vez has conducido sin carné ni licencia?",
  "¿Alguna vez has fumado, aunque sea una calada?",
  "¿Alguna vez has consumido alguna droga?",
  "¿Alguna vez has salido corriendo para escapar de un revisor o de un guardia de seguridad?",
  "¿Alguna vez has hecho una pintada o has roto algo en un lugar público?",
  "¿Alguna vez has tenido problemas con la policía por algo que sí habías hecho?",
  // 5 — Maldad y moral
  "¿Alguna vez te has burlado de una persona con discapacidad?",
  "¿Alguna vez has hecho llorar a alguien a propósito?",
  "¿Alguna vez te has quedado dinero que encontraste sabiendo de quién era?",
  "¿Alguna vez le has hecho ghosting a alguien de un día para otro?",
  "¿Alguna vez has criticado a alguien justo después de saludarle con un abrazo?",
  "¿Alguna vez has ligado con la pareja de un amigo o una amiga?",
  "¿Alguna vez has puesto los cuernos?",
  "¿Alguna vez has sido el amante secreto o la amante secreta de alguien con pareja?",
  // 6 — Sexo (sugerente)
  "¿Alguna vez te has acostado con alguien en la primera cita?",
  "¿Alguna vez has mandado un nude?",
  "¿Alguna vez has tenido un rollo de una noche con alguien de una app de citas?",
  "¿Alguna vez te has acostado con tu ex «solo una última vez»?",
  "¿Alguna vez te has acostado con un amigo o una amiga cercana?",
  "¿Alguna vez te han pillado en plena faena?",
  "¿Alguna vez lo has hecho en un lugar público?",
  "¿Alguna vez has estado con dos personas distintas el mismo fin de semana?",
  "¿Alguna vez has hecho un trío?",
];

const OFFICIEL: I18n<string[]> = { fr: FR, en: EN, es: ES };

/**
 * Pack « équivalent » d'une question du Test Officiel (sert seulement à pondérer
 * les révélations croustillantes) : paliers 1-2 = soft, 3-4 = soirée, 5-6 = coquin.
 */
function packFor(i: number): PackId {
  if (i < 16) return "soft";
  if (i < 33) return "soiree";
  return "coquin";
}

/** Les 50 questions du Test Officiel, dans l'ordre, dans la langue voulue. */
export function officielQuestions(lang: Lang): { text: string; pack: PackId }[] {
  return (OFFICIEL[lang] ?? FR).map((text, i) => ({ text, pack: packFor(i) }));
}
